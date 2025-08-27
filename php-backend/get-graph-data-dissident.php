<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Example function to get graph data
function getGraphData($username) {
    // TODO: Implement your graph data logic here
    // This is just a placeholder response
    
    return [
        'type' => 'complete',
        'success' => true,
        'username' => $username,
        'total_movies' => 0,
        'all_movies' => [],
        'execution_time_ms' => 0,
        'total_pages' => 0,
        'message' => 'Graph data not yet implemented'
    ];
}

// Get username from request
$username = $_GET['username'] ?? '';

if (empty($username)) {
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => 'Username is required'
    ]) . "\n\n";
    exit;
}

// Send initial progress
echo "data: " . json_encode([
    'type' => 'progress',
    'progress' => 10,
    'message' => 'Starting data collection...',
    'page' => 1,
    'total_pages' => 1
]) . "\n\n";

// Simulate progress
sleep(1);
echo "data: " . json_encode([
    'type' => 'progress',
    'progress' => 50,
    'message' => 'Processing data...',
    'page' => 1,
    'total_pages' => 1
]) . "\n\n";

sleep(1);
echo "data: " . json_encode([
    'type' => 'progress',
    'progress' => 90,
    'message' => 'Finalizing...',
    'page' => 1,
    'total_pages' => 1
]) . "\n\n";

// Send complete data
$result = getGraphData($username);
echo "data: " . json_encode($result) . "\n\n";

// Close the stream
echo "data: " . json_encode(['type' => 'end']) . "\n\n";
?> 