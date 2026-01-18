<?php
// index.php - simple router
require __DIR__ . '/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '';
$method = $_SERVER['REQUEST_METHOD'];

// Normalize base path: expecting /api/*
if (strpos($path, '/api/') === 0) {
    $path = substr($path, 4); // remove /api prefix -> paths like /auth/login
}

function find_user_by_username($pdo, string $storageMode, string $usersFile, string $username) {
    if ($storageMode === 'sqlite' && $pdo) {
        $stmt = $pdo->prepare('SELECT id, username, password_hash, is_admin, created_at FROM users WHERE username = ?');
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    $users = file_users_all($usersFile);
    foreach ($users as $u) {
        if (isset($u['username']) && strcasecmp($u['username'], $username) === 0) {
            return $u;
        }
    }
    return null;
}

function insert_user($pdo, string $storageMode, string $usersFile, string $username, string $passwordHash) {
    if ($storageMode === 'sqlite' && $pdo) {
        $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)');
        $stmt->execute([$username, $passwordHash]);
        return (int)$pdo->lastInsertId();
    }
    $users = file_users_all($usersFile);
    $id = 1 + max(array_column($users, 'id') ?: [0]);
    $users[] = [
        'id' => $id,
        'username' => $username,
        'password_hash' => $passwordHash,
        'is_admin' => 0,
        'created_at' => date('c')
    ];
    file_users_save($usersFile, $users);
    return $id;
}

switch (true) {
    case $path === '/auth/register' && $method === 'POST':
        $data = json_input();
        $username = trim((string)($data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');
        if (strlen($username) < 3 || strlen($username) > 30 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            respond(400, ['message' => 'El nombre de usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números y guiones bajos']);
        }
        if (strlen($password) < 6) {
            respond(400, ['message' => 'La contraseña debe tener al menos 6 caracteres']);
        }
        if (find_user_by_username($pdo, $STORAGE_MODE, $usersFile, $username)) {
            respond(400, ['message' => 'El nombre de usuario ya está en uso']);
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $userId = insert_user($pdo, $STORAGE_MODE, $usersFile, $username, $hash);
        $token = jwt_encode(['userId' => $userId, 'exp' => time() + 7*24*3600], $JWT_SECRET);
        respond(201, ['message' => 'Usuario creado exitosamente', 'token' => $token, 'user' => ['id' => $userId, 'username' => $username, 'isAdmin' => false]]);
        break;

    case $path === '/auth/login' && $method === 'POST':
        $data = json_input();
        $username = trim((string)($data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $row = find_user_by_username($pdo, $STORAGE_MODE, $usersFile, $username);
        if (!$row || !password_verify($password, $row['password_hash'])) {
            respond(401, ['message' => 'Credenciales inválidas']);
        }
        $token = jwt_encode(['userId' => (int)$row['id'], 'exp' => time() + 7*24*3600], $JWT_SECRET);
        respond(200, ['message' => 'Login exitoso', 'token' => $token, 'user' => ['id' => (int)$row['id'], 'username' => $row['username'], 'isAdmin' => (bool)$row['is_admin']]]);
        break;

    case $path === '/auth/me' && $method === 'GET':
        $token = bearer_token();
        if (!$token) respond(401, ['message' => 'Token requerido']);
        $payload = jwt_decode($token, $JWT_SECRET);
        if (!$payload || ($payload['exp'] ?? 0) < time()) respond(401, ['message' => 'Token no válido']);
        $id = (int)($payload['userId'] ?? 0);
        if ($STORAGE_MODE === 'sqlite' && $pdo) {
            $stmt = $pdo->prepare('SELECT id, username, is_admin, created_at FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } else {
            $all = file_users_all($usersFile);
            $row = null;
            foreach ($all as $u) if ((int)$u['id'] === $id) { $row = $u; break; }
        }
        if (!$row) respond(404, ['message' => 'Usuario no encontrado']);
        respond(200, ['user' => ['id' => (int)$row['id'], 'username' => $row['username'], 'isAdmin' => (bool)($row['is_admin'] ?? 0), 'createdAt' => $row['created_at'] ?? date('c')]]);
        break;

    default:
        respond(404, ['message' => 'Endpoint no encontrado']);
} 