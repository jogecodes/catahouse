<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$username = $_GET['username'] ?? 'aricover';

echo "=== DEBUG SCRAPING FOR USER: $username ===\n\n";

// Test 1: Get user profile page
echo "1. TESTING USER PROFILE PAGE:\n";
$profileUrl = "https://letterboxd.com/$username/";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $profileUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Error: " . ($error ?: 'None') . "\n";
echo "Content Length: " . strlen($html) . " bytes\n";
echo "First 500 chars: " . substr($html, 0, 500) . "\n\n";

// Test 2: Get first page of movies
echo "2. TESTING FIRST MOVIES PAGE:\n";
$moviesUrl = "https://letterboxd.com/$username/films/by/rating/";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $moviesUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Error: " . ($error ?: 'None') . "\n";
echo "Content Length: " . strlen($html) . " bytes\n";
echo "First 500 chars: " . substr($html, 0, 500) . "\n\n";

// Test 3: Check if we can find movie containers
if ($html) {
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    $xpath = new DOMXPath($dom);
    
    // Look for movie containers
    $movieContainers = $xpath->query('//li[@class="poster-container"]');
    echo "3. MOVIE CONTAINERS FOUND:\n";
    echo "Count: " . $movieContainers->length . "\n";
    
    if ($movieContainers->length > 0) {
        echo "First movie container HTML:\n";
        echo $dom->saveHTML($movieContainers->item(0)) . "\n\n";
    }
    
    // Look for pagination
    $pagination = $xpath->query('//div[@class="paginate-pages"]//a');
    echo "4. PAGINATION FOUND:\n";
    echo "Count: " . $pagination->length . "\n";
    
    if ($pagination->length > 0) {
        echo "Last pagination link: " . $pagination->item($pagination->length - 1)->getAttribute('href') . "\n\n";
    }
}

// Test 4: Try to get total movies count
echo "5. EXTRACTING TOTAL MOVIES:\n";
if ($html) {
    // Try different patterns
    $patterns = [
        '/content="[^"]*?(\d+) films watched[^"]*?"/',
        '/content="[^"]*?(\d+) films? watched[^"]*?"/',
        '/content="[^"]*?(\d+) movies watched[^"]*?"/',
        '/content="[^"]*?(\d+) movies? watched[^"]*?"/'
    ];
    
    foreach ($patterns as $i => $pattern) {
        if (preg_match($pattern, $html, $matches)) {
            echo "Pattern " . ($i + 1) . " matched: " . $matches[1] . "\n";
            break;
        }
    }
    
    // Also try to find ratings histogram
    if (preg_match('/<section[^>]*class="[^"]*ratings-histogram-chart[^"]*"[^>]*>/', $html)) {
        echo "Ratings histogram section found\n";
    } else {
        echo "Ratings histogram section NOT found\n";
    }
}

echo "\n=== DEBUG COMPLETE ===\n";
?> 