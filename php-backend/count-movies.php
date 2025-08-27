<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Example function to count movies
function countMovies($username) {
    // TODO: Implement your movie counting logic here
    // This is just a placeholder response
    
    return [
        'success' => true,
        'total_movies' => 0,
        'username' => $username,
        'message' => 'Movie counting not yet implemented'
    ];
}

// Get username from request
$username = $_GET['username'] ?? '';

if (empty($username)) {
    echo json_encode([
        'success' => false,
        'error' => 'Username is required'
    ]);
    exit;
}

// Get movie count
$result = countMovies($username);

echo json_encode($result);
?> 