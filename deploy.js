import { execSync } from 'child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SSH_USER = 'root';
const SSH_HOST = '120.26.2.3';
const SSH_PORT = 22;
const SSH_KEY = path.join(__dirname, '.ssh', 'deploy_key');
const REMOTE_PATH = '/www/wwwroot/opl.gldhn.top';

if (!fs.existsSync(SSH_KEY)) {
  console.error('[ERROR] SSH key not found:', SSH_KEY);
  process.exit(1);
}

const privateKey = fs.readFileSync(SSH_KEY);

function sftpUploadDir(sftp, localDir, remoteDir) {
  return new Promise((resolve, reject) => {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    let pending = entries.length;
    if (!pending) return resolve();

    sftp.mkdir(remoteDir, () => {
      for (const entry of entries) {
        const localPath = path.join(localDir, entry.name);
        const remotePath = remoteDir + '/' + entry.name;
        if (entry.isDirectory()) {
          sftpUploadDir(sftp, localPath, remotePath).then(() => { if (!--pending) resolve(); }).catch(reject);
        } else {
          sftp.fastPut(localPath, remotePath, (err) => {
            if (err) return reject(err);
            if (!--pending) resolve();
          });
        }
      }
    });
  });
}

function sftpRmDir(sftp, remoteDir) {
  return new Promise((resolve) => {
    sftp.readdir(remoteDir, (err, list) => {
      if (err) return resolve();
      let pending = list.length;
      if (!pending) { sftp.rmdir(remoteDir, resolve); return; }
      for (const item of list) {
        const fullPath = remoteDir + '/' + item.filename;
        if (item.attrs.isDirectory()) {
          sftpRmDir(sftp, fullPath).then(() => { if (!--pending) sftp.rmdir(remoteDir, resolve); }).catch(() => resolve());
        } else {
          sftp.unlink(fullPath, () => { if (!--pending) sftp.rmdir(remoteDir, resolve); });
        }
      }
    });
  });
}

async function deploy() {
  console.log('[1/4] Building...');
  try { fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true }); } catch {}
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });

  console.log('[2/4] Connecting to server...');
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect({ host: SSH_HOST, port: SSH_PORT, username: SSH_USER, privateKey });
  });
  console.log('Connected.');

  const sftp = await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
  });

  console.log('[3/4] Uploading dist/...');
  await sftpRmDir(sftp, REMOTE_PATH);
  await sftpUploadDir(sftp, path.join(__dirname, 'dist'), REMOTE_PATH);

  const backendDir = path.join(__dirname, 'backend');
  if (fs.existsSync(backendDir)) {
    console.log('[4/4] Uploading backend/...');
    await sftpRmDir(sftp, REMOTE_PATH + '/backend');
    await sftpUploadDir(sftp, backendDir, REMOTE_PATH + '/backend');
  } else {
    console.log('[4/4] Skipping backend/ (not found)');
  }

  console.log('[5/4] Uploading robots.txt & sitemap.xml...');
  await new Promise((resolve, reject) => {
    sftp.fastPut(path.join(__dirname, 'public', 'robots.txt'), REMOTE_PATH + '/robots.txt', (err) => {
      if (err) reject(err); else resolve();
    });
  });
  await new Promise((resolve, reject) => {
    sftp.fastPut(path.join(__dirname, 'public', 'sitemap.xml'), REMOTE_PATH + '/sitemap.xml', (err) => {
      if (err) reject(err); else resolve();
    });
  });

  conn.end();
  console.log('Deploy complete!');
}

deploy().catch((err) => { console.error(err); process.exit(1); });
