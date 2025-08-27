<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Example API endpoint
function getExampleData() {
    return [
        'success' => true,
        'message' => 'Hello from PHP Backend!',
        'timestamp' => date('Y-m-d H:i:s'),
        'data' => [
            'example' => 'This is example data from your PHP backend',
            'ready' => true
        ]
    ];
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $result = getExampleData();
        break;
    
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $result = [
            'success' => true,
            'message' => 'POST request received',
            'received_data' => $input,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        break;
    
    default:
        $result = [
            'success' => false,
            'error' => 'Method not allowed',
            'allowed_methods' => ['GET', 'POST']
        ];
        http_response_code(405);
        break;
}

echo json_encode($result, JSON_PRETTY_PRINT);
?> 