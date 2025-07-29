<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

// Start timing
$startTime = microtime(true);

if (!isset($_GET['username'])) {
    echo "data: " . json_encode(['error' => 'No username provided']) . "\n\n";
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']); // sanitize
$baseUrl = "https://letterboxd.com/$username/films/by/entry-rating/";

// First, get the total number of movies with ratings
$countUrl = "https://letterboxd.com/$username/";
$ch = curl_init($countUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MovieCounter/1.0)');
curl_setopt($ch, CURLOPT_ENCODING, '');
$countHtml = curl_exec($ch);
curl_close($ch);

// Extract total movies from the count page
$totalMovies = 0;
if (preg_match('/(\d+)\s+films?\s+watched/i', $countHtml, $matches)) {
    $totalMovies = (int)$matches[1];
}

$movies = [];
$page = 1;
$totalPages = 0;
$currentProgress = 0;

// Calculate total pages based on 72 movies per page
$estimatedMoviesPerPage = 72;

// Calculate total pages based on the total movies we expect
$totalPages = ceil($totalMovies / $estimatedMoviesPerPage);

// Send initial progress
echo "data: " . json_encode([
    'type' => 'progress',
    'progress' => 5,
    'page' => 0,
    'total_pages' => $totalPages,
    'total_movies' => $totalMovies,
    'message' => 'Starting to scrape movies...'
]) . "\n\n";

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
    
    // Calculate progress based on current page
    $progress = min(90, 5 + (($page / $totalPages) * 85));
    
    // Send progress update
    echo "data: " . json_encode([
        'type' => 'progress',
        'progress' => round($progress, 1),
        'page' => $page,
        'total_pages' => $totalPages,
        'movies_found' => count($movies),
        'message' => "Scraped page $page of $totalPages"
    ]) . "\n\n";
    
    if ($liNodes->length === 0) {
        break;
    }
    $page++;
}

if (empty($movies)) {
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => 'No rated movies found for this user'
    ]) . "\n\n";
    exit;
}

$simple = isset($_GET['simple']) && $_GET['simple'] == '1';

if ($simple) {
    $simpleMovies = array_map(function($movie) {
        return [
            'title' => $movie['title'],
            'rating' => $movie['rating']
        ];
    }, $movies);
    
    // Calculate execution time
    $endTime = microtime(true);
    $executionTime = round(($endTime - $startTime) * 1000, 2);

    // Send final result
    echo "data: " . json_encode([
        'type' => 'complete',
        'count' => count($simpleMovies),
        'total_movies' => $totalMovies,
        'total_pages' => $totalPages,
        'execution_time_ms' => $executionTime,
        'movies' => $simpleMovies
    ]) . "\n\n";
    exit;
}

// Calculate execution time
$endTime = microtime(true);
$executionTime = round(($endTime - $startTime) * 1000, 2);

// Send final result
echo "data: " . json_encode([
    'type' => 'complete',
    'count' => count($movies),
    'total_movies' => $totalMovies,
    'total_pages' => $totalPages,
    'execution_time_ms' => $executionTime,
    'movies' => array_values($movies)
]) . "\n\n";
?> 