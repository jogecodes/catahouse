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

// Find the ratings count in the user's main page
libxml_use_internal_errors(true);
$dom = new DOMDocument();
$dom->loadHTML($html);
$xpath = new DOMXPath($dom);

$totalMovies = 0;

// Look for the ratings section and extract the count
// Try to find the link to "films by entry-rating" which contains the total count
$ratingLinks = $xpath->query('//a[contains(@href, "/films/by/entry-rating/")]');
if ($ratingLinks->length > 0) {
    foreach ($ratingLinks as $link) {
        $href = $link->getAttribute('href');
        // Look for text that contains a number followed by "films" or similar
        $text = trim($link->textContent);
        if (preg_match('/(\d+)/', $text, $matches)) {
            $totalMovies = (int)$matches[1];
            break;
        }
    }
}

// If we didn't find it in the link text, try to find it in the ratings histogram section
if ($totalMovies === 0) {
    $ratingsSection = $xpath->query('//section[contains(@class, "ratings-histogram-chart")]');
    if ($ratingsSection->length > 0) {
        $sectionText = $ratingsSection->item(0)->textContent;
        if (preg_match('/(\d+)\s+films?\s+rated/i', $sectionText, $matches)) {
            $totalMovies = (int)$matches[1];
        }
    }
}

// If still not found, try to find any number near "ratings" or "films"
if ($totalMovies === 0) {
    if (preg_match('/(\d+)\s+films?\s+watched/i', $html, $matches)) {
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
    'source' => 'ratings_section'
];

if ($totalMovies === 0) {
    $response = [
        'username' => $username,
        'total_movies' => 0,
        'count' => 0,
        'execution_time_ms' => $executionTime,
        'success' => false,
        'error' => 'No rated movies found for this user',
        'source' => 'ratings_section'
    ];
}

echo json_encode($response);
?> 