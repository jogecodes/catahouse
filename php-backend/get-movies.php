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
$lastPage = 1;

// First, fetch the first page and determine the last page number
$ch = curl_init($baseUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$html = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 404 || !$html) {
    echo json_encode(['error' => 'User not found or no films page.']);
    exit;
}

libxml_use_internal_errors(true);
$dom = new DOMDocument();
$dom->loadHTML($html);
$xpath = new DOMXPath($dom);

// Find the last page number in the pagination section
$lastPageNodes = $xpath->query('//div[contains(@class, "paginate-pages")]/a');
foreach ($lastPageNodes as $node) {
    $pageNum = intval($node->textContent);
    if ($pageNum > $lastPage) {
        $lastPage = $pageNum;
    }
}

// Now, loop through all pages from 1 to $lastPage
for ($page = 1; $page <= $lastPage; $page++) {
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
    }
}

if (empty($movies)) {
    echo json_encode(['error' => 'No rated movies found for this user']);
    exit;
}

echo json_encode(['movies' => array_values($movies)]); 