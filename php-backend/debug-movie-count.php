<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$username = $_GET['username'] ?? 'crishufer';

echo "=== DEBUG MOVIE COUNT EXTRACTION FOR USER: $username ===\n\n";

// Get the profile page
$profileUrl = "https://letterboxd.com/$username/";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $profileUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
$countHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $http_code\n";
echo "Content Length: " . strlen($countHtml) . " bytes\n\n";

if ($http_code !== 404 && $countHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($countHtml);
    $xpath = new DOMXPath($dom);
    
    echo "1. LOOKING FOR RATINGS LINKS:\n";
    $ratingLinks = $xpath->query('//a[contains(@href, "/films/by/entry-rating/")]');
    echo "Found " . $ratingLinks->length . " rating links\n";
    
    foreach ($ratingLinks as $i => $link) {
        $text = trim($link->textContent);
        $href = $link->getAttribute('href');
        echo "Link " . ($i + 1) . ": text='$text', href='$href'\n";
        
        if (preg_match('/(\d+)/', $text, $matches)) {
            echo "  -> Matched number: " . $matches[1] . "\n";
        }
    }
    
    echo "\n2. LOOKING FOR RATINGS HISTOGRAM SECTION:\n";
    $ratingsSection = $xpath->query('//section[contains(@class, "ratings-histogram-chart")]');
    echo "Found " . $ratingsSection->length . " ratings histogram sections\n";
    
    if ($ratingsSection->length > 0) {
        $sectionText = $ratingsSection->item(0)->textContent;
        echo "Section text: " . substr($sectionText, 0, 200) . "...\n";
        
        if (preg_match('/(\d+)\s+films?\s+rated/i', $sectionText, $matches)) {
            echo "  -> Matched 'films rated': " . $matches[1] . "\n";
        }
    }
    
    echo "\n3. LOOKING FOR META DESCRIPTION:\n";
    $metaDescription = $xpath->query('//meta[@name="description"]/@content');
    if ($metaDescription->length > 0) {
        $content = $metaDescription->item(0)->value;
        echo "Meta description: $content\n";
        
        if (preg_match('/(\d+)\s+films?\s+watched/i', $content, $matches)) {
            echo "  -> Matched 'films watched': " . $matches[1] . "\n";
        }
    }
    
    echo "\n4. REGEX PATTERNS TEST:\n";
    $patterns = [
        '/(\d+)\s+films?\s+watched/i',
        '/(\d+)\s+films?/i',
        '/(\d+)\s+movies?\s+watched/i',
        '/(\d+)\s+movies?/i'
    ];
    
    foreach ($patterns as $i => $pattern) {
        if (preg_match($pattern, $countHtml, $matches)) {
            echo "Pattern " . ($i + 1) . " matched: " . $matches[1] . "\n";
        } else {
            echo "Pattern " . ($i + 1) . " did not match\n";
        }
    }
    
    echo "\n5. LOOKING FOR SPECIFIC TEXT PATTERNS:\n";
    $textToSearch = [
        'films watched',
        'films rated',
        'movies watched',
        'movies rated'
    ];
    
    foreach ($textToSearch as $text) {
        $count = substr_count(strtolower($countHtml), strtolower($text));
        echo "'$text' appears $count times\n";
    }
    
} else {
    echo "ERROR: Could not fetch profile page (HTTP $http_code)\n";
}

echo "\n=== DEBUG COMPLETE ===\n";
?> 