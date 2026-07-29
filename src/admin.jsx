import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { siteConfig } from './site-config';
import './styles.css';

const api = (path, options) => fetch(`${siteConfig.apiBase}/${path}`, options).then(async (response) => ({ ok: response.ok, ...(await response.json()) }));
const linkNames = { download: 'Windows 下载', changelog: '更新日志', docs: '使用文档', faq: '常见问题', source: '开源地址', community: '社区 / 反馈' };

function Login({ onLogin }) {
  const [message, setMessage] = useState('');
  async function submit(event) { event.preventDefault(); const result = await api('login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); result.ok ? onLogin() : setMessage(result.message); }
  return <main className="admin"><section><p className="eyebrow">OPL ADMIN</p><h1>管理后台</h1><form className="feedback-form" onSubmit={submit}><label>账号<input name="username" required /></label><label>密码<input name="password" type="password" required /></label><button className="button">登录</button>{message && <p className="form-result">{message}</p>}</form></section></main>;
}

function LinkSettings({ links, onSave }) {
  async function submit(event) { event.preventDefault(); const links = Object.fromEntries(new FormData(event.currentTarget)); const result = await api('links.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ links }) }); onSave(result.message); }
  return <section><SectionTitle label="站点链接" /><form className="feedback-form" onSubmit={submit}>{Object.entries(linkNames).map(([key, name]) => <label key={key}>{name}<input type="url" name={key} defaultValue={links[key] || ''} placeholder="https://" /></label>)}<button className="button">保存链接</button></form></section>;
}

function SectionTitle({ label }) { return <h2 className="admin-heading">{label}</h2>; }

function FeedbackCard({ item, onReplied }) {
  const [replying, setReplying] = useState(false); const [message, setMessage] = useState('');
  async function submit(event) { event.preventDefault(); const body = new FormData(event.currentTarget).get('body'); const result = await api('reply.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, body }) }); setMessage(result.message); if (result.ok) onReplied(); }
  return <article className="ticket"><div><b>{item.title}</b><span>{item.email} · {new Date(item.created_at).toLocaleString('zh-CN')}</span></div><p>{item.body}</p>{item.reply_body ? <div className="reply"><b>已回复</b><p>{item.reply_body}</p></div> : <>{replying ? <form onSubmit={submit}><textarea name="body" rows="4" required placeholder="输入回复内容" /><button className="button">发送邮件回复</button>{message && <p className="form-result">{message}</p>}</form> : <button className="button outline" onClick={() => setReplying(true)}>回复</button>}</>}</article>;
}

function Dashboard({ onLogout }) {
  const [links, setLinks] = useState({}); const [feedback, setFeedback] = useState([]); const [message, setMessage] = useState('');
  const load = () => { api('links.php').then((r) => setLinks(r.links || {})); api('feedback.php').then((r) => setFeedback(r.feedback || [])); };
  useEffect(load, []);
  return <main className="admin"><header><a className="logo" href="/"><b>OPL</b><span>管理后台</span></a><button className="button outline" onClick={async () => { await api('logout.php', { method: 'POST' }); onLogout(); }}>退出</button></header>{message && <p className="form-result">{message}</p>}<LinkSettings links={links} onSave={(text) => { setMessage(text); load(); }} /><section><SectionTitle label={`问题反馈（${feedback.length}）`} />{feedback.length ? feedback.map((item) => <FeedbackCard key={item.id} item={item} onReplied={load} />) : <p className="empty">暂无反馈。</p>}</section></main>;
}

function App() { const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('opl_admin_logged') === '1'); const handleLogin = () => { localStorage.setItem('opl_admin_logged', '1'); setLoggedIn(true); }; const handleLogout = () => { localStorage.removeItem('opl_admin_logged'); setLoggedIn(false); }; return loggedIn ? <Dashboard onLogout={handleLogout} /> : <Login onLogin={handleLogin} />; }
createRoot(document.getElementById('root')).render(<App />);
