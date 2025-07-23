<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if (!isset($_GET['username'])) {
    echo json_encode(['error' => 'No username provided']);
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']); // sanitize
$baseUrl = "https://letterboxd.com/$username/films/";

$movies = [];
$page = 1;
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
    $foundAny = false;
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
        $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
        if ($ratingSpan) {
            $rating = trim($ratingSpan->textContent);
        }
        if ($title && $url && $rating) {
            $movies[] = [
                'title' => $title,
                'url' => $url,
                'rating' => $rating
            ];
        }
        $foundAny = true;
    }
    if (!$foundAny || $liNodes->length === 0) {
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
    $response = [
        'count' => count($simpleMovies),
        'movies' => $simpleMovies
    ];
    echo json_encode($response);
    exit;
}

$response = [
    'count' => count($movies),
    'movies' => array_values($movies)
];
echo json_encode($response); 