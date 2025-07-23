<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Get the username from the query string
if (!isset($_GET['username'])) {
    echo json_encode(['exists' => false, 'error' => 'No username provided']);
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']); // sanitize
$url = "https://letterboxd.com/$username/";

// Use cURL to make a HEAD request
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200) {
    echo json_encode(['exists' => true, 'url' => $url]);
} else {
    echo json_encode(['exists' => false]);
} 