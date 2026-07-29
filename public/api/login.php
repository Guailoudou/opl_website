<?php
require __DIR__ . '/bootstrap.php';
$data = request_data();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['message' => '仅支持 POST。'], 405);
if (($data['username'] ?? '') !== $config['admin']['username'] || !password_verify($data['password'] ?? '', $config['admin']['password_hash'])) {
    json_response(['message' => '账号或密码错误。'], 401);
}
session_regenerate_id(true);
$_SESSION['opl_admin'] = true;
json_response(['message' => '登录成功。']);
