<?php
require __DIR__ . '/bootstrap.php';
$connection = db();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $connection->query('SELECT link_key, url FROM site_links')->fetch_all(MYSQLI_ASSOC);
    $links = [];
    foreach ($rows as $row) $links[$row['link_key']] = $row['url'];
    json_response(['links' => $links]);
}
require_admin();
$data = request_data();
if (!is_array($data['links'] ?? null)) json_response(['message' => '链接数据不正确。'], 422);
$allowed = ['download', 'changelog', 'docs', 'faq', 'source', 'community'];
$statement = $connection->prepare('INSERT INTO site_links (link_key, url) VALUES (?, ?) ON DUPLICATE KEY UPDATE url = VALUES(url)');
foreach ($allowed as $key) {
    $url = trim((string) ($data['links'][$key] ?? ''));
    if ($url !== '' && !filter_var($url, FILTER_VALIDATE_URL)) json_response(['message' => "$key 不是有效网址。"], 422);
    $statement->bind_param('ss', $key, $url);
    $statement->execute();
}
json_response(['message' => '链接已保存。']);
