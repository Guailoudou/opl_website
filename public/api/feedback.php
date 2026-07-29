<?php
require __DIR__ . '/bootstrap.php';
$connection = db();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_admin();
    $rows = $connection->query('SELECT id, email, title, body, reply_body, replied_at, created_at FROM feedback ORDER BY id DESC')->fetch_all(MYSQLI_ASSOC);
    json_response(['feedback' => $rows]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['message' => '仅支持 POST。'], 405);
$data = request_data();
$email = trim((string) ($data['email'] ?? ''));
$title = trim((string) ($data['title'] ?? ''));
$body = trim((string) ($data['body'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $title === '' || $body === '' || mb_strlen($title) > 120 || mb_strlen($body) > 5000) json_response(['message' => '请检查邮箱和反馈内容。'], 422);
$statement = $connection->prepare('INSERT INTO feedback (email, title, body) VALUES (?, ?, ?)');
$statement->bind_param('sss', $email, $title, $body);
$statement->execute();
json_response(['message' => '已收到，感谢反馈。']);
