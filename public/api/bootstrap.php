<?php
declare(strict_types=1);
session_start();

$localConfig = dirname(__DIR__) . '/config.local.php';
$config = require is_file($localConfig) ? $localConfig : dirname(__DIR__) . '/config.php';

function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function request_data(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}
function db(): mysqli {
    global $config;
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = $config['db'];
    $connection = new mysqli($db['host'], $db['user'], $db['password'], $db['name'], $db['port']);
    $connection->set_charset('utf8mb4');
    return $connection;
}
function require_admin(): void {
    if (empty($_SESSION['opl_admin'])) json_response(['message' => '请先登录。'], 401);
}
