# OPL 联机工具官网

## 前端

```bash
npm install
npm run build
```

将 `dist/` 部署为网站根目录。首页的 Logo、接口根路径和未配置接口时的链接兜底值在 `src/site-config.js`。

## PHP 与 MySQL

1. 创建数据库并执行 `backend/schema.sql`。
2. 将 `backend/config.php` 复制为 `backend/config.local.php`，填写 MySQL、管理员密码哈希、邮件 API 与发件人。`config.local.php` 已被忽略。
3. 将 `backend/api/` 映射到站点的 `/api/` 路径（或同步修改 `src/site-config.js` 的 `apiBase`）。
4. 后台入口：`/admin/`。首次登录使用 `config.local.php` 中的账号和密码哈希。

邮件 API 接收 `email`、`body`、`title`、`sendname`、`sendemail` 五个表单 POST 字段。管理后台保存的链接会覆盖前端兜底链接。
