<?php
// Database configuration (if needed)
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');

// API configuration
define('API_VERSION', '1.0.0');
define('API_NAME', 'IONOS Hello World API');

// CORS configuration
define('ALLOWED_ORIGINS', ['*']); // In production, specify your domain
define('ALLOWED_METHODS', ['GET', 'POST', 'OPTIONS']);
define('ALLOWED_HEADERS', ['Content-Type', 'Authorization']);

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('UTC');

// Helper function to check if origin is allowed
function isOriginAllowed($origin) {
    if (in_array('*', ALLOWED_ORIGINS)) {
        return true;
    }
    return in_array($origin, ALLOWED_ORIGINS);
}

// Helper function to set CORS headers
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    
    if (isOriginAllowed($origin)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: ' . implode(', ', ALLOWED_METHODS));
    header('Access-Control-Allow-Headers: ' . implode(', ', ALLOWED_HEADERS));
    header('Access-Control-Allow-Credentials: true');
}

// Helper function to handle preflight requests
function handlePreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        setCorsHeaders();
        http_response_code(200);
        exit(0);
    }
}

// Helper function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

// Helper function to send error response
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $statusCode);
}
 