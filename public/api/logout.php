<?php
require __DIR__ . '/bootstrap.php';
$_SESSION = [];
session_destroy();
json_response(['message' => '已退出。']);
