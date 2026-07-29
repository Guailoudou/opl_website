CREATE TABLE site_links (
  link_key VARCHAR(32) PRIMARY KEY,
  url VARCHAR(2048) NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE feedback (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  reply_body TEXT NULL,
  replied_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX created_at_idx (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO site_links (link_key, url) VALUES
('download', ''), ('changelog', ''), ('docs', ''), ('faq', ''), ('source', ''), ('community', '');
