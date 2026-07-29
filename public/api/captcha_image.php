<?php
/**
 * 验证码图形 API
 * 
 * GET 请求：生成带干扰的数学验证码图片
 *   返回: PNG 图片
 *   Header: X-Captcha-Key: 验证码密钥（用于提交时验证）
 */

// 关闭错误显示，避免破坏图片输出
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: image/png');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// 检查 GD 扩展
if (!function_exists('imagecreatetruecolor')) {
    outputErrorImage('GD extension not available');
}

// 加载数据库配置
$configFile = __DIR__ . '/auth_config.php';
if (!file_exists($configFile)) {
    outputErrorImage('Config file missing');
}
$config = require $configFile;
$dbConfig = $config['database'];

// 连接数据库
try {
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    outputErrorImage('DB connect failed');
}

// 确保验证码表存在
$pdo->exec("CREATE TABLE IF NOT EXISTS captcha_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    captcha_key VARCHAR(64) NOT NULL UNIQUE,
    answer INT NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_key (captcha_key),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

// 生成数学题
$question = generateMath($correctAnswer);
$captchaKey = bin2hex(random_bytes(16));
$expiresAt = date('Y-m-d H:i:s', time() + 600);

$stmt = $pdo->prepare("INSERT INTO captcha_answers (captcha_key, answer, expires_at) VALUES (?, ?, ?)");
$stmt->execute([$captchaKey, $correctAnswer, $expiresAt]);

// 清理过期数据
if (random_int(1, 10) === 1) {
    $pdo->exec("DELETE FROM captcha_answers WHERE expires_at < NOW() OR used = 1");
}

header('X-Captcha-Key: ' . $captchaKey);

// 绘制验证码图片
renderCaptcha($question);

function outputErrorImage($msg) {
    $img = imagecreatetruecolor(200, 60);
    imagefill($img, 0, 0, imagecolorallocate($img, 255, 200, 200));
    imagestring($img, 3, 10, 20, $msg, imagecolorallocate($img, 200, 0, 0));
    imagepng($img);
    imagedestroy($img);
    exit;
}

function generateMath(&$answer) {
    $ops = [['+', 1, 20, 1, 20], ['-', 5, 25, 1, 24], ['*', 1, 10, 1, 10]];
    $op = $ops[random_int(0, 2)];
    $a = random_int($op[1], $op[2]);
    $bLimit = ($op[0] === '-') ? $a - 1 : $op[4];
    $b = random_int($op[3], $bLimit);
    switch ($op[0]) {
        case '+': $answer = $a + $b; return "{$a} + {$b} = ?";
        case '-': $answer = $a - $b; return "{$a} - {$b} = ?";
        case '*': $answer = $a * $b; return "{$a} x {$b} = ?";
    }
}

function renderCaptcha($text) {
    $w = 220;
    $h = 70;
    $img = imagecreatetruecolor($w, $h);
    
    // 随机浅色背景
    imagefill($img, 0, 0, imagecolorallocate($img, 
        random_int(230, 250), random_int(230, 250), random_int(230, 250)));
    
    // 干扰线 (5-8条)
    for ($i = 0; $i < random_int(5, 8); $i++) {
        imagesetthickness($img, random_int(1, 2));
        imageline($img, random_int(0, $w), random_int(0, $h), random_int(0, $w), random_int(0, $h),
            imagecolorallocatealpha($img, random_int(50, 180), random_int(50, 180), random_int(50, 180), random_int(40, 80)));
    }
    
    // 干扰点 (80-150个)
    for ($i = 0; $i < random_int(80, 150); $i++) {
        imagesetpixel($img, random_int(0, $w), random_int(0, $h),
            imagecolorallocatealpha($img, random_int(0, 255), random_int(0, 255), random_int(0, 255), random_int(60, 100)));
    }
    
    // 尝试 TTF 字体
    $fontPath = findFont();
    $useTTF = $fontPath && function_exists('imagettftext');
    
    if ($useTTF) {
        $size = 22;
        $totalW = 0;
        $charWs = [];
        $len = strlen($text);
        
        // 先计算总宽度
        for ($i = 0; $i < $len; $i++) {
            $bbox = @imagettfbbox($size, 0, $fontPath, $text[$i]);
            if (!$bbox) { $useTTF = false; break; }
            $cw = abs($bbox[2] - $bbox[0]);
            $charWs[] = $cw;
            $totalW += $cw + 3;
        }
        
        if ($useTTF) {
            $x = ($w - $totalW) / 2;
            $y = $h / 2 + $size / 2 - 2;
            
            for ($i = 0; $i < $len; $i++) {
                $color = imagecolorallocate($img, random_int(30, 70), random_int(30, 70), random_int(30, 70));
                $angle = random_int(-12, 12);
                $dy = random_int(-2, 2);
                @imagettftext($img, $size, $angle, $x, $y + $dy, $color, $fontPath, $text[$i]);
                $x += $charWs[$i] + 3;
            }
        }
    }
    
    // 降级为内置字体
    if (!$useTTF) {
        $color = imagecolorallocate($img, random_int(30, 70), random_int(30, 70), random_int(30, 70));
        $fw = imagefontwidth(5);
        $fh = imagefontheight(5);
        $tx = ($w - strlen($text) * $fw) / 2;
        $ty = ($h - $fh) / 2;
        imagestring($img, 5, $tx, $ty, $text, $color);
    }
    
    // 边框
    imagerectangle($img, 0, 0, $w - 1, $h - 1, imagecolorallocate($img, 180, 180, 180));
    
    imagepng($img);
    imagedestroy($img);
}

function findFont() {
    $fonts = [
        'C:\Windows\Fonts\arial.ttf',
        'C:\Windows\Fonts\verdana.ttf',
        'C:\Windows\Fonts\tahoma.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/TTF/DejaVuSans.ttf',
    ];
    foreach ($fonts as $f) {
        if (file_exists($f)) return $f;
    }
    return null;
}
