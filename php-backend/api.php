<?php
require_once __DIR__ . '/config.php';

// Emit JSON on fatal errors to aid debugging in production hosts
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Fatal error',
            'details' => $err['message'] ?? 'unknown',
            'file' => $err['file'] ?? null,
            'line' => $err['line'] ?? null,
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT);
    }
});

setCorsHeaders();
handlePreflight();

header('Content-Type: application/json');

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}

function readJsonFile($path) {
    if (!file_exists($path)) {
        return null;
    }
    $content = file_get_contents($path);
    if ($content === false || $content === '') {
        return null;
    }
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : null;
}

function writeJsonFile($path, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if (file_put_contents($path, $json) === false) {
        sendErrorResponse('Failed to write data');
    }
}

$usersPath = $dataDir . '/users.json';
$itemsPath = $dataDir . '/items.json';
$categoriesPath = $dataDir . '/categories.json';
$ratingsPath = $dataDir . '/ratings.json';

$action = $_GET['action'] ?? 'ping';

switch ($action) {
    case 'ping':
        sendJsonResponse(['success' => true, 'api' => API_NAME, 'version' => API_VERSION, 'time' => date('c')]);
        break;

    case 'config':
        $users = readJsonFile($usersPath) ?? [];
        $items = readJsonFile($itemsPath) ?? [];
        $categories = readJsonFile($categoriesPath) ?? [];
        sendJsonResponse([
            'success' => true,
            'users' => $users,
            'items' => $items,
            'categories' => $categories,
        ]);
        break;

    case 'getUserRatings':
        $user = $_GET['user'] ?? '';
        if ($user === '') {
            sendErrorResponse('Missing user');
        }
        $ratings = readJsonFile($ratingsPath) ?? [];
        $userRatings = $ratings[$user] ?? [];
        sendJsonResponse(['success' => true, 'user' => $user, 'ratings' => $userRatings]);
        break;

    case 'setUserRatings':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            sendErrorResponse('Method not allowed', 405);
        }
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $user = $input['user'] ?? '';
        $ratingsUpdate = $input['ratings'] ?? null; // { itemId: { categoryId: 1-5|null } }
        if ($user === '' || !is_array($ratingsUpdate)) {
            sendErrorResponse('Invalid payload');
        }
        $ratings = readJsonFile($ratingsPath) ?? [];
        if (!isset($ratings[$user])) {
            $ratings[$user] = [];
        }
        // Merge updates per item/category
        foreach ($ratingsUpdate as $itemId => $categoryMap) {
            if (!isset($ratings[$user][$itemId])) {
                $ratings[$user][$itemId] = [];
            }
            if (is_array($categoryMap)) {
                foreach ($categoryMap as $categoryId => $score) {
                    if ($score === null || $score === '') {
                        unset($ratings[$user][$itemId][$categoryId]);
                    } else {
                        $intScore = intval($score);
                        if ($intScore < 1 || $intScore > 5) {
                            sendErrorResponse('Score must be 1..5');
                        }
                        $ratings[$user][$itemId][$categoryId] = $intScore;
                    }
                }
            }
        }
        writeJsonFile($ratingsPath, $ratings);
        sendJsonResponse(['success' => true, 'user' => $user, 'saved' => true]);
        break;

    case 'synthesis':
        $items = readJsonFile($itemsPath) ?? [];
        $categories = readJsonFile($categoriesPath) ?? [];
        $ratings = readJsonFile($ratingsPath) ?? [];

        // Compute per item/category averages and overall ranking
        $categoryIds = array_column($categories, 'id');
        $itemStats = [];
        foreach ($items as $item) {
            $itemId = $item['id'];
            $perCategory = [];
            $overallSum = 0;
            $overallCount = 0;
            foreach ($categoryIds as $catId) {
                $sum = 0;
                $count = 0;
                foreach ($ratings as $userId => $userRatings) {
                    if (isset($userRatings[$itemId][$catId])) {
                        $sum += $userRatings[$itemId][$catId];
                        $count++;
                    }
                }
                $avg = $count > 0 ? $sum / $count : null;
                $perCategory[$catId] = $avg;
                if ($avg !== null) {
                    $overallSum += $avg;
                    $overallCount++;
                }
            }
            $overall = $overallCount > 0 ? $overallSum / $overallCount : null;
            $itemStats[] = [
                'itemId' => $itemId,
                'name' => $item['name'] ?? $itemId,
                'averages' => $perCategory,
                'overall' => $overall,
            ];
        }

        usort($itemStats, function($a, $b) {
            $aVal = isset($a['overall']) ? $a['overall'] : -1000000000;
            $bVal = isset($b['overall']) ? $b['overall'] : -1000000000;
            if ($aVal == $bVal) return 0;
            return ($aVal < $bVal) ? 1 : -1; // desc
        });

        sendJsonResponse(['success' => true, 'items' => $itemStats, 'categories' => $categories]);
        break;

    default:
        sendErrorResponse('Unknown action: ' . $action, 404);
} 