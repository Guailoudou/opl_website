import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { siteConfig } from './site-config';
import './styles.css';

const linkLabels = {
  download: 'Windows 下载', changelog: '更新日志', docs: '使用文档',
  faq: '常见问题', source: '开源地址', community: '社区 / 反馈',
};

function Logo() {
  return <a className="logo" href="#top">{siteConfig.logoUrl ? <img src={siteConfig.logoUrl} alt="OPL" /> : <><b>OPL</b><span>联机工具</span></>}</a>;
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('opl-theme') || 'system');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    theme === 'system' ? localStorage.removeItem('opl-theme') : localStorage.setItem('opl-theme', theme);
  }, [theme]);
  return <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')} title="切换主题">◐</button>;
}

function Header() {
  return <header><Logo /><nav><a href="#download">下载</a><a href="#guide">文档</a><a href="#about">关于</a><a href="#feedback">反馈</a></nav><ThemeToggle /></header>;
}

function SectionTitle({ eyebrow, title, children }) {
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2>{children}</div>;
}

function LinkButton({ href, children, outline = false }) {
  return href ? <a className={`button ${outline ? 'outline' : ''}`} href={href} target="_blank" rel="noreferrer">{children} <i>↗</i></a> : <span className={`button disabled ${outline ? 'outline' : ''}`}>{children} <i>↗</i></span>;
}

function Hero({ links }) {
  return <section className="hero" id="top"><div><p className="eyebrow">MINECRAFT · P2P MULTIPLAYER</p><h1>把好友带进<br /><em>你的世界。</em></h1><p className="intro">OPL 基于 OpenP2P，让 Minecraft 局域网世界跨越网络，简单地和好友一起玩。</p><div className="actions"><LinkButton href={links.download}>下载 OPL</LinkButton><a className="text-link" href="#guide">查看使用方法 ↓</a></div></div><div className="hero-card"><span className="status"><i /> 网络已就绪</span><p>创建世界后，生成联机码，分享给好友。</p></div></section>;
}

function Download({ links }) {
  return (
    <section id="download">
      <SectionTitle eyebrow="DOWNLOAD" title="获取 OPL" />
      <div className="download-card">
        <div className="download-info">
          <b>OPL 联机工具</b>
          <p>Windows 10/11 · 免安装 · 约 15MB</p>
          <small>最新版本 v1.2.0 · 2026-07-15 更新</small>
        </div>
        <div className="download-actions">
          <LinkButton href={links.download}>立即下载</LinkButton>
          <span className="download-meta">SHA256: a3f8e9...c7d2</span>
        </div>
      </div>
      {links.changelog && <a className="minor-link" href={links.changelog} target="_blank" rel="noreferrer">查看更新日志 →</a>}
    </section>
  );
}

function Guide({ links }) {
  const steps = ['在 Minecraft 单人世界中选择“对局域网开放”。', '启动 OPL，生成联机码。', '将联机码发送给好友，由好友加入联机。'];
  return <section id="guide"><SectionTitle eyebrow="GET STARTED" title="三步开始联机" /><ol className="steps">{steps.map((step, index) => <li key={step}><span>0{index + 1}</span><p>{step}</p></li>)}</ol><div className="link-grid">{['docs', 'faq', 'source', 'community'].map((key) => <LinkButton key={key} href={links[key]} outline>{linkLabels[key]}</LinkButton>)}</div></section>;
}

function Features() {
  const features = [
    { icon: '⚡', title: '零配置', desc: '无需端口转发、无需路由器设置，开箱即用' },
    { icon: '🔒', title: '安全可靠', desc: 'P2P 直连，数据不经过第三方服务器' },
    { icon: '🎮', title: '即开即用', desc: '联机码一键生成，好友秒速加入' },
    { icon: '💻', title: '轻量免安装', desc: '单文件运行，不污染系统' },
  ];
  return (
    <section id="features">
      <SectionTitle eyebrow="FEATURES" title="为什么选择 OPL" />
      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.title} className="feature">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return <section id="about" className="about"><SectionTitle eyebrow="ABOUT OPL" title="少一点配置，多一点联机。" /><p>OPL 是面向 Minecraft 玩家的联机辅助工具。它基于 OpenP2P，帮助自动发现局域网开放端口，并用联机码简化好友连接流程。</p></section>;
}

function Feedback() {
  const [result, setResult] = useState('');
  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`${siteConfig.apiBase}/feedback.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await response.json();
      setResult(body.message || '已收到，感谢反馈。');
      if (response.ok) { event.currentTarget.reset(); setTimeout(() => setResult(''), 3000); }
    } catch { setResult('提交失败，请稍后重试。'); }
  }
  return <section id="feedback"><SectionTitle eyebrow="FEEDBACK" title="告诉我们你的问题" /><form className="feedback-form" onSubmit={submit}><label>邮箱<input name="email" type="email" placeholder="name@example.com" required /></label><label>标题<input name="title" maxLength="120" placeholder="一句话描述问题" required /></label><label>详细说明<textarea name="body" rows="5" maxLength="5000" placeholder="请说明发生了什么、你的系统和游戏版本。" required /></label><button className="button" type="submit">提交反馈 →</button>{result && <p className="form-result">{result}</p>}</form></section>;
}

function Footer() { return <footer><Logo /><p>OPL 联机工具 · 让联机回到简单</p><a href="/admin/">管理后台</a></footer>; }

function App() {
  const [links, setLinks] = useState(siteConfig.fallbackLinks);
  useEffect(() => { fetch(`${siteConfig.apiBase}/links.php`).then((r) => r.ok ? r.json() : null).then((data) => data?.links && setLinks({ ...siteConfig.fallbackLinks, ...data.links })).catch(() => {}); }, []);
  return <><Header /><main><Hero links={links} /><Download links={links} /><Features /><Guide links={links} /><About /><Feedback /></main><Footer /></>;
}

createRoot(document.getElementById('root')).render(<App />);
