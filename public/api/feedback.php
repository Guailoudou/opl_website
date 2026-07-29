<?php
require __DIR__ . '/bootstrap.php';
$connection = db();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_admin();
    $rows = $connection->query('SELECT id, email, title, body, reply_body, replied_at, created_at FROM feedback ORDER BY id DESC')->fetch_all(MYSQLI_ASSOC);
    json_response(['feedback' => $rows]);
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_admin();
    $data = request_data();
    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) json_response(['message' => '无效的反馈 ID。'], 422);
    $statement = $connection->prepare('DELETE FROM feedback WHERE id = ?');
    $statement->bind_param('i', $id);
    $statement->execute();
    if ($statement->affected_rows === 0) json_response(['message' => '反馈不存在。'], 404);
    json_response(['message' => '已删除。']);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['message' => '仅支持 POST。'], 405);
$data = request_data();

// 验证码验证
$captchaKey = trim((string) ($data['captcha_key'] ?? ''));
$captchaAnswer = trim((string) ($data['captcha_answer'] ?? ''));
if ($captchaKey === '' || $captchaAnswer === '') {
    json_response(['message' => '请完成验证码验证。'], 422);
}

// 连接数据库验证验证码
try {
    $authConfigFile = __DIR__ . '/auth_config.php';
    if (!file_exists($authConfigFile)) {
        json_response(['message' => '配置缺失。'], 500);
    }
    $authConfig = require $authConfigFile;
    $dbConfig = $authConfig['database'];
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // 查询验证码
    $stmt = $pdo->prepare("SELECT answer, expires_at, used FROM captcha_answers WHERE captcha_key = ? LIMIT 1");
    $stmt->execute([$captchaKey]);
    $captcha = $stmt->fetch();
    
    if (!$captcha) {
        json_response(['message' => '验证码无效，请刷新重试。'], 422);
    }
    if ($captcha['used']) {
        json_response(['message' => '验证码已使用，请刷新重试。'], 422);
    }
    if (strtotime($captcha['expires_at']) < time()) {
        json_response(['message' => '验证码已过期，请刷新重试。'], 422);
    }
    if ((int)$captcha['answer'] !== (int)$captchaAnswer) {
        json_response(['message' => '验证码答案错误，请重新输入。'], 422);
    }
    
    // 标记验证码已使用
    $pdo->prepare("UPDATE captcha_answers SET used = 1 WHERE captcha_key = ?")->execute([$captchaKey]);
} catch (PDOException $e) {
    json_response(['message' => '验证码验证失败。'], 500);
}

$email = trim((string) ($data['email'] ?? ''));
$title = trim((string) ($data['title'] ?? ''));
$body = trim((string) ($data['body'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $title === '' || $body === '' || mb_strlen($title) > 120 || mb_strlen($body) > 5000) json_response(['message' => '请检查邮箱和反馈内容。'], 422);
$statement = $connection->prepare('INSERT INTO feedback (email, title, body) VALUES (?, ?, ?)');
$statement->bind_param('sss', $email, $title, $body);
$statement->execute();

// 向管理员发送邮件通知（异步，失败不影响用户响应）
// 管理员收件邮箱（硬编码，因为 config.local.php 中没有 email 配置）
$adminNotifyEmail = 'Guailoudou@163.com';
// 使用 config.local.php 中的邮件 API 配置（与 reply.php 保持一致）
$mail = $config['mail_api'] ?? [];
$mailApiUrl = $mail['url'] ?? '';
if ($adminNotifyEmail !== '' && $mailApiUrl !== '' && !str_starts_with($mailApiUrl, '填写')) {
    $notifyBody = "收到新反馈\n\n"
        . "发件人邮箱：{$email}\n"
        . "标题：{$title}\n"
        . "详细内容：\n{$body}";
    $notifyPayload = http_build_query([
        'email' => $adminNotifyEmail,
        'body' => $notifyBody,
        'title' => '【新反馈】' . $title,
        'sendname' => $mail['sendname'] ?? 'OPL 联机工具',
        'sendemail' => $mail['sendemail'] ?? 'gldoffice@163.com',
    ]);
    $notifyContext = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\nContent-Length: " . strlen($notifyPayload),
        'content' => $notifyPayload,
        'timeout' => 15,
        'ignore_errors' => true,
    ]]);
    @file_get_contents($mailApiUrl, false, $notifyContext);
}

json_response(['message' => '已收到，感谢反馈。']);
