<?php
// bootstrap.php

declare(strict_types=1);

// Enable strict error reporting in development
if (isset($_GET['debug'])) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

// Basic CORS (adjust origin if needed)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// App secret
$JWT_SECRET = getenv('CATAHOUSE_JWT_SECRET') ?: 'your-secret-key';

// Storage path
$storageDir = __DIR__ . '/storage';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0775, true);
}

$pdo = null;
$STORAGE_MODE = 'sqlite'; // sqlite | file
$dbPath = $storageDir . '/data.sqlite';

// Try PDO SQLite, fallback to file storage if unavailable
try {
    if (in_array('sqlite', PDO::getAvailableDrivers(), true)) {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA foreign_keys = ON');
        // Migrations (minimal for auth)
        $pdo->exec('CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_admin INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime("now"))
        )');
        $STORAGE_MODE = 'sqlite';
    } else {
        $STORAGE_MODE = 'file';
    }
} catch (Throwable $e) {
    $STORAGE_MODE = 'file';
}

// File storage helpers
$usersFile = $storageDir . '/users.json';
if (!file_exists($usersFile)) {
    @file_put_contents($usersFile, json_encode([]));
}

function file_users_all(string $path): array {
    $raw = @file_get_contents($path);
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function file_users_save(string $path, array $users): void {
    @file_put_contents($path, json_encode($users, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

// Common helpers
function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function bearer_token(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (stripos($h, 'Bearer ') === 0) {
        return substr($h, 7);
    }
    return null;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

function jwt_encode(array $payload, string $secret, string $alg = 'HS256'): string {
    $header = ['typ' => 'JWT', 'alg' => $alg];
    $segments = [
        base64url_encode(json_encode($header)),
        base64url_encode(json_encode($payload))
    ];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, $secret, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $signingInput = $h . '.' . $p;
    $signature = base64url_decode($s);
    $expected = hash_hmac('sha256', $signingInput, $secret, true);
    if (!hash_equals($expected, $signature)) return null;
    $payload = json_decode(base64url_decode($p), true);
    return is_array($payload) ? $payload : null;
} 