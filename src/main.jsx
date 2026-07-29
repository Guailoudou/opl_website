import { createRoot } from 'react-dom/client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { siteConfig } from './site-config';
import './styles.css';
import { BackgroundEffects, CursorGlow, useScrollAnimation } from './animations';
import { DeploymentUnitIcon, NetIcon, GameIcon, LinkIcon } from './components/Icons';

const ICONS = '/img/icons';

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
  return (
    <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')} title="切换主题">
      <img src={`${ICONS}/moon_circle_fill.svg`} alt="主题" className="theme-icon" />
    </button>
  );
}

function Header({ version }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <Logo />
      <button className={`menu-toggle ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
        <span></span><span></span><span></span>
      </button>
      <nav className={menuOpen ? 'open' : ''}>
        <a href="#download" onClick={() => setMenuOpen(false)}>下载</a>
        <a href="#guide" onClick={() => setMenuOpen(false)}>文档</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>关于</a>
        <a href="#feedback" onClick={() => setMenuOpen(false)}>反馈</a>
        <a href="#download" className="nav-cta" onClick={() => setMenuOpen(false)}>快速开始 →</a>
      </nav>
      <div className="header-right">
        <span className="version-tag">{version || 'v1.0.3.5'}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}

function SectionTitle({ eyebrow, title, children }) {
  return <div className="section-title scroll-fade"><span>{eyebrow}</span><h2>{title}</h2>{children}</div>;
}

function LinkButton({ href, children, outline = false }) {
  const arrow = <img src={`${ICONS}/arrow_right_up_and_square.svg`} alt="" className="btn-arrow" />;
  return href ? (
    <a className={`button ${outline ? 'outline' : ''}`} href={href} target="_blank" rel="noreferrer">
      {children} {arrow}
    </a>
  ) : (
    <span className={`button disabled ${outline ? 'outline' : ''}`}>{children} {arrow}</span>
  );
}

function Hero({ links }) {
  return (
    <section className="hero" id="top">
      <div className="hero-content">
        <p className="eyebrow">OPENP2P · 局域网联机工具</p>
        <h1>让好友加入<br /><em>你的局域网。</em></h1>
        <p className="intro">OPL 基于 OpenP2P，通过隧道或组网功能，让好友像在同一局域网一样连接你的游戏。支持 Minecraft、饥荒、泰拉瑞亚、星露谷等多种游戏。</p>
        <div className="actions">
          <LinkButton href={links.download}>下载 OPL</LinkButton>
          <a className="text-link" href="#guide">查看使用方法 ↓</a>
        </div>
      </div>
      <div className="hero-visual">
        <img src="/img/opl.png" alt="OPL 联机工具界面截图" className="app-screenshot" />
      </div>
    </section>
  );
}

function Download({ links }) {
  return (
    <section id="download">
      <SectionTitle eyebrow="DOWNLOAD" title="获取 OPL" />
      <div className="download-card scroll-scale">
        <div className="download-info">
          <b>OPL 联机工具</b>
          <p>Windows 10/11 · 免安装版 / 安装包 · 约 15MB</p>
          <small>最新版本 {links.version || 'v1.0.3.5'} · 原生支持 Win10-Win11</small>
        </div>
        <div className="download-actions">
          <LinkButton href={links.download}>立即下载</LinkButton>
          <span className="download-meta">提供免安装版、单文件版、安装包三种选择</span>
        </div>
      </div>
      {links.changelog && <a className="minor-link" href={links.changelog} target="_blank" rel="noreferrer">查看更新日志 →</a>}
    </section>
  );
}

function Guide({ links }) {
  const steps = ['房主启动 OPL，新建隧道并启用，获取 UID 和端口号。', '连接者新建隧道，输入房主的 UID 和远程端口，启用隧道。', '隧道状态灯变绿后，使用 127.0.0.1 和对应端口连接游戏。'];
  return (
    <section id="guide">
      <SectionTitle eyebrow="GET STARTED" title="三步开始联机" />
      <ol className="steps">{steps.map((step, index) => <li key={step} className="scroll-fade" style={{ transitionDelay: `${index * 0.15}s` }}><span>0{index + 1}</span><p>{step}</p></li>)}</ol>
      <div className="link-grid scroll-fade">{['docs', 'faq', 'source', 'community'].map((key) => <LinkButton key={key} href={links[key]} outline>{linkLabels[key]}</LinkButton>)}</div>
    </section>
  );
}

// 3D 倾斜卡片组件
function TiltCard({ children, style }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    // 直接设置 transform，绕过 CSS transition 延迟
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  }, []);

  return (
    <div ref={cardRef} className="feature tilt" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={style}>
      {children}
    </div>
  );
}

function Features() {
  const features = [
    { Icon: DeploymentUnitIcon, title: '隧道穿透', desc: '基于 OpenP2P，支持 TCP/UDP 协议，轻松跨越网络限制' },
    { Icon: NetIcon, title: '组网功能', desc: '集成 EasyTier 组网，多设备互联，构建虚拟局域网' },
    { Icon: GameIcon, title: '多游戏支持', desc: '预设 MC、饥荒、泰拉瑞亚、星露谷等游戏配置，开箱即用' },
    { Icon: LinkIcon, title: '连接码分享', desc: '一键导出连接码，好友导入即可快速连接，简单便捷' },
  ];
  return (
    <section id="features">
      <SectionTitle eyebrow="FEATURES" title="为什么选择 OPL" />
      <div className="feature-grid">
        {features.map((f, i) => (
          <TiltCard key={f.title} style={{ transitionDelay: `${i * 0.1}s` }}>
            <span className="feature-icon"><f.Icon /></span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function About() {
  return <section id="about" className="about scroll-fade"><SectionTitle eyebrow="ABOUT OPL" title="少一点配置，多一点联机。" /><p>OPL 是基于 OpenP2P 的局域网联机工具，通过隧道穿透或组网功能，让好友像在同一局域网一样连接你的游戏。支持 Minecraft、饥荒、泰拉瑞亚、星露谷等多种游戏，提供连接码一键分享，简化联机流程。</p></section>;
}

function Feedback() {
  const [result, setResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`${siteConfig.apiBase}/feedback.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await response.json();
      setResult(body.message || '已收到，感谢反馈。');
      if (response.ok) { event.currentTarget.reset(); setTimeout(() => setResult(''), 3000); }
    } catch { setResult('提交失败，请稍后重试。'); }
    finally { setIsSubmitting(false); }
  }

  return (
    <section id="feedback">
      <SectionTitle eyebrow="FEEDBACK" title="告诉我们你的问题" />
      <div className="feedback-intro scroll-fade">
        <p>遇到问题或有改进建议？请填写下方表单，我们会在 <strong>24 小时内</strong>通过邮件回复您。</p>
      </div>
      <form className="feedback-form scroll-fade" onSubmit={submit}>
        <label>邮箱<input name="email" type="email" placeholder="name@example.com" required /></label>
        <label>标题<input name="title" maxLength="120" placeholder="一句话描述问题" required /></label>
        <label>详细说明<textarea name="body" rows="5" maxLength="5000" placeholder="请说明发生了什么、你的系统和游戏版本。" required /></label>
        <button className={`button ${isSubmitting ? 'loading' : ''}`} type="submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交反馈 →'}
        </button>
        {result && <p className="form-result">{result}</p>}
      </form>
    </section>
  );
}

function Footer() { return <footer className="scroll-fade"><Logo /><p>OPL 联机工具 · 让联机回到简单</p><a href="/admin/">管理后台</a></footer>; }

function App() {
  const [links, setLinks] = useState(siteConfig.fallbackLinks);
  useEffect(() => { fetch(`${siteConfig.apiBase}/links.php`).then((r) => r.ok ? r.json() : null).then((data) => data?.links && setLinks({ ...siteConfig.fallbackLinks, ...data.links })).catch(() => {}); }, []);

  // 启用滚动动画
  useScrollAnimation();

  return (
    <>
      <BackgroundEffects />
      <CursorGlow />
      <Header version={links.version} />
      <main>
        <Hero links={links} />
        <Download links={links} />
        <Features />
        <Guide links={links} />
        <About />
        <Feedback />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
