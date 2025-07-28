<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Start timing
$startTime = microtime(true);

if (!isset($_GET['username'])) {
    echo json_encode(['error' => 'No username provided']);
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']); // sanitize
$userUrl = "https://letterboxd.com/$username/";

$ch = curl_init($userUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Reduced timeout
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2); // Fast connection timeout
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MovieCounter/1.0)'); // Custom user agent
curl_setopt($ch, CURLOPT_ENCODING, ''); // Accept any encoding
$html = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 404 || !$html) {
    echo json_encode([
        'username' => $username,
        'total_movies' => 0,
        'success' => false,
        'error' => 'User not found or no access',
        'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2)
    ]);
    exit;
}

libxml_use_internal_errors(true);
$dom = new DOMDocument();
$dom->loadHTML($html);
$xpath = new DOMXPath($dom);

// Ultra-fast regex search for the ratings count
// Look for patterns like "all (150)" or "150" in the ratings section
if (preg_match('/class="all-link"[^>]*>.*?(\d+)/s', $html, $matches)) {
    $totalMovies = (int)$matches[1];
} else {
    // Fallback: try to find any number near "all" or "ratings"
    if (preg_match('/(?:all|ratings).*?(\d+)/i', $html, $matches)) {
        $totalMovies = (int)$matches[1];
    }
}

// Calculate execution time
$endTime = microtime(true);
$executionTime = round(($endTime - $startTime) * 1000, 2);

$response = [
    'username' => $username,
    'total_movies' => $totalMovies,
    'count' => $totalMovies,
    'execution_time_ms' => $executionTime,
    'success' => true,
    'source' => 'ratings_histogram'
];

if ($totalMovies === 0) {
    $response = [
        'username' => $username,
        'total_movies' => 0,
        'count' => 0,
        'execution_time_ms' => $executionTime,
        'success' => false,
        'error' => 'No rated movies found for this user',
        'source' => 'ratings_histogram'
    ];
}

echo json_encode($response);
?> 