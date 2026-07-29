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

// 验证码验证
$captchaKey = trim((string) ($data['captcha_key'] ?? ''));
$captchaAnswer = trim((string) ($data['captcha_answer'] ?? ''));
if ($captchaKey === '' || $captchaAnswer === '') {
    json_response(['message' => '请完成验证码验证。'], 422);
}

// 连接数据库验证验证码
try {
    $configFile = __DIR__ . '/auth_config.php';
    if (!file_exists($configFile)) {
        json_response(['message' => '配置缺失。'], 500);
    }
    $config = require $configFile;
    $dbConfig = $config['database'];
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
$emailConfig = $config['email'] ?? [];
$adminEmail = $emailConfig['admin_email'] ?? '';
$mailApiUrl = $emailConfig['mail_api_url'] ?? '';
if ($adminEmail !== '' && $mailApiUrl !== '' && !str_starts_with($mailApiUrl, '填写')) {
    // 将相对路径解析为绝对 URL（feedback.php 位于 /api/ 目录下）
    if (!preg_match('#^https?://#', $mailApiUrl)) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $mailApiUrl = $scheme . '://' . $host . '/' . ltrim($mailApiUrl, '/');
    }
    $notifyBody = "收到新反馈\n\n"
        . "发件人邮箱：{$email}\n"
        . "标题：{$title}\n"
        . "详细内容：\n{$body}";
    $notifyPayload = http_build_query([
        'email' => $adminEmail,
        'body' => $notifyBody,
        'title' => '【新反馈】' . $title,
        'sendname' => 'OPL 联机工具',
        'sendemail' => 'noreply@opl.local',
    ]);
    $notifyContext = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\nContent-Length: " . strlen($notifyPayload),
        'content' => $notifyPayload,
        'timeout' => 10,
        'ignore_errors' => true,
    ]]);
    @file_get_contents($mailApiUrl, false, $notifyContext);
}

json_response(['message' => '已收到，感谢反馈。']);
