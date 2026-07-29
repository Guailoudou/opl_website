<?php
// 复制此文件为 config.local.php 后填写部署参数；config.local.php 不应提交到仓库。
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'opl_site',
        'user' => '填写数据库账号',
        'password' => '填写数据库密码',
    ],
    'admin' => [
        'username' => 'admin',
        // 使用 password_hash('你的密码', PASSWORD_DEFAULT) 生成并填写。
        'password_hash' => '填写密码哈希',
    ],
    'mail_api' => [
        'url' => '填写邮件发送 API 地址',
        'sendname' => 'OPL 联机工具',
        'sendemail' => '填写发件邮箱',
    ],
];
