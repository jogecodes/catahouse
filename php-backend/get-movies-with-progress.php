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
$baseUrl = "https://letterboxd.com/$username/films/by/entry-rating/";

// First, get the total count to calculate progress
$userUrl = "https://letterboxd.com/$username/";
$ch = curl_init($userUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MovieCounter/1.0)');
curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$html = curl_exec($ch);
curl_close($ch);

$totalMovies = 0;
if (preg_match('/class="all-link"[^>]*>.*?(\d+)/s', $html, $matches)) {
    $totalMovies = (int)$matches[1];
}

$movies = [];
$page = 1;
$moviesPerPage = 72;
$totalPages = ceil($totalMovies / $moviesPerPage);

while (true) {
    $url = $baseUrl;
    if ($page > 1) {
        $url .= 'page/' . $page . '/';
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 404 || !$html) {
        break;
    }

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($html);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if (!$ul) {
        break;
    }

    $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
    foreach ($liNodes as $li) {
        $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
        $title = null;
        $url = null;
        $rating = null;
        
        if ($posterDiv) {
            $url = $posterDiv->getAttribute('data-target-link');
            if ($url && strpos($url, 'http') !== 0) {
                $url = 'https://letterboxd.com' . $url;
            }
            $img = $xpath->query('.//img', $posterDiv)->item(0);
            if ($img) {
                $title = $img->getAttribute('alt');
            }
        }
        
        // Get rating (all movies on this page are rated)
        $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
        $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
        
        // Include movie if we have title and url (rating is guaranteed)
        if ($title && $url) {
            $movies[] = [
                'title' => $title,
                'url' => $url,
                'rating' => $rating
            ];
        }
    }
    
    if ($liNodes->length === 0) {
        break;
    }
    $page++;
}

if (empty($movies)) {
    echo json_encode(['error' => 'No rated movies found for this user']);
    exit;
}

$simple = isset($_GET['simple']) && $_GET['simple'] == '1';

if ($simple) {
    $simpleMovies = array_map(function($movie) {
        // Convert rating string (e.g., '★★½') to float
        $stars = mb_substr_count($movie['rating'], '★');
        $half = mb_strpos($movie['rating'], '½') !== false ? 0.5 : 0.0;
        $numericRating = $stars + $half;
        return [
            'name' => $movie['title'],
            'rating' => $numericRating
        ];
    }, $movies);
    
    // Calculate execution time
    $endTime = microtime(true);
    $executionTime = round(($endTime - $startTime) * 1000, 2);

    $response = [
        'count' => count($simpleMovies),
        'execution_time_ms' => $executionTime,
        'total_movies' => $totalMovies,
        'pages_scraped' => $page - 1,
        'total_pages' => $totalPages,
        'progress_percentage' => round(($page - 1) / $totalPages * 100, 1),
        'movies' => $simpleMovies
    ];
    echo json_encode($response);
    exit;
}

// Calculate execution time
$endTime = microtime(true);
$executionTime = round(($endTime - $startTime) * 1000, 2);

$response = [
    'count' => count($movies),
    'execution_time_ms' => $executionTime,
    'total_movies' => $totalMovies,
    'pages_scraped' => $page - 1,
    'total_pages' => $totalPages,
    'progress_percentage' => round(($page - 1) / $totalPages * 100, 1),
    'movies' => array_values($movies)
];
echo json_encode($response);
?> 