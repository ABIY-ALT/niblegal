import { useState, useEffect } from 'react';
import { FileText, Scale, LayoutDashboard, BookOpen, ClipboardList, BarChart3, ShieldCheck, Bell, Users, ChevronRight, Sun, Moon, Monitor, Settings } from 'lucide-react';
import { USERS, currentUser, setCurrentUser } from './data/store';
import { ROLE_LABELS } from './utils/formatters';
import Dashboard from './pages/Dashboard';
import ContractsList from './pages/ContractsList';
import ContractDetail from './pages/ContractDetail';
import NewContract from './pages/NewContract';
import AdvisoryList from './pages/AdvisoryList';
import AdvisoryDetail from './pages/AdvisoryDetail';
import NewAdvisory from './pages/NewAdvisory';
import KnowledgeRepo from './pages/KnowledgeRepo';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import type { Contract, AdvisoryRequest } from './types';
import './index.css';

type Page =
  | 'dashboard'
  | 'contracts' | 'contract-detail' | 'new-contract'
  | 'advisory' | 'advisory-detail' | 'new-advisory'
  | 'knowledge' | 'audit' | 'reports' | 'settings';

type Theme = 'dark' | 'light' | 'system';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryRequest | null>(null);
  const [activeUser, setActiveUser] = useState(currentUser);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nib-theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nib-theme', theme);
  }, [theme]);

  const navigate = (p: Page) => { setPage(p); };

  const openContract = (c: Contract) => { setSelectedContract(c); navigate('contract-detail'); };
  const openAdvisory = (a: AdvisoryRequest) => { setSelectedAdvisory(a); navigate('advisory-detail'); };

  const switchUser = (userId: string) => {
    setCurrentUser(userId);
    setActiveUser(USERS.find(u => u.id === userId) || activeUser);
    setShowRoleSwitcher(false);
  };

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  ];
  const cmsItems = [
    { id: 'contracts', label: 'Contracts', icon: <FileText /> },
    { id: 'new-contract', label: 'New Contract', icon: <ChevronRight /> },
  ];
  const lahdItems = [
    { id: 'advisory', label: 'Legal Advisory', icon: <Scale /> },
    { id: 'new-advisory', label: 'New Advisory Request', icon: <ChevronRight /> },
  ];
  const systemItems = [
    { id: 'knowledge', label: 'Knowledge Repository', icon: <BookOpen /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 /> },
    { id: 'audit', label: 'Audit Trail', icon: <ShieldCheck /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ];

  const pageTitle: Record<Page, string> = {
    dashboard: 'Dashboard', contracts: 'Contract Management', 'contract-detail': 'Contract Detail',
    'new-contract': 'New Contract Request', advisory: 'Legal Advisory (LAHD)',
    'advisory-detail': 'Advisory Detail', 'new-advisory': 'New Advisory Request',
    knowledge: 'Knowledge Repository', audit: 'Audit Trail', reports: 'Reports & Analytics', settings: 'System Settings',
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">N</div>
          <div className="logo-text">
            <strong>Nib Bank</strong>
            <span>Legal Automation</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {navItems.map(item => (
              <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id as Page)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Contract Management</div>
            {cmsItems.map(item => (
              <button key={item.id} className={`nav-item ${page === item.id || (item.id === 'contracts' && page === 'contract-detail') ? 'active' : ''}`} onClick={() => navigate(item.id as Page)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Legal Advisory (LAHD)</div>
            {lahdItems.map(item => (
              <button key={item.id} className={`nav-item ${page === item.id || (item.id === 'advisory' && page === 'advisory-detail') ? 'active' : ''}`} onClick={() => navigate(item.id as Page)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">System</div>
            {systemItems.map(item => (
              <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id as Page)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" style={{ cursor: 'pointer' }} onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}>
            <div className="user-avatar">{initials(activeUser.name)}</div>
            <div className="user-info">
              <strong>{activeUser.name}</strong>
              <span>{ROLE_LABELS[activeUser.role]}</span>
            </div>
            <Users size={14} color="var(--text-muted)" />
          </div>
          {showRoleSwitcher && (
            <div style={{ marginTop: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {USERS.slice(0, 7).map(u => (
                <button key={u.id} onClick={() => switchUser(u.id)} style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '9px 12px', background: activeUser.id === u.id ? 'var(--accent-glow)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[u.role]} — {u.department}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">{pageTitle[page]}</div>
          <div className="topbar-actions">
            {/* Theme Switcher */}
            <div className="theme-switcher">
              <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light mode">
                <Sun size={14} />
              </button>
              <button className={`theme-btn ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')} title="System preference">
                <Monitor size={14} />
              </button>
              <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark mode">
                <Moon size={14} />
              </button>
            </div>
            <button className="btn btn-ghost btn-sm notif-btn" aria-label="Notifications">
              <Bell size={16} /><div className="notif-dot" />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('new-contract')}>
              <FileText size={14} /> New Contract
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('new-advisory')}>
              <Scale size={14} /> New Advisory
            </button>
          </div>
        </header>

        <main className="page-content">
          {page === 'dashboard' && <Dashboard onOpenContract={openContract} onOpenAdvisory={openAdvisory} onNavigate={navigate} />}
          {page === 'contracts' && <ContractsList onOpen={openContract} onNew={() => navigate('new-contract')} />}
          {page === 'contract-detail' && selectedContract && (
            <ContractDetail contract={selectedContract} onBack={() => navigate('contracts')} currentUser={activeUser} />
          )}
          {page === 'new-contract' && <NewContract onBack={() => navigate('contracts')} onSaved={() => navigate('contracts')} currentUser={activeUser} />}
          {page === 'advisory' && <AdvisoryList onOpen={openAdvisory} onNew={() => navigate('new-advisory')} />}
          {page === 'advisory-detail' && selectedAdvisory && (
            <AdvisoryDetail advisory={selectedAdvisory} onBack={() => navigate('advisory')} currentUser={activeUser} />
          )}
          {page === 'new-advisory' && <NewAdvisory onBack={() => navigate('advisory')} onSaved={() => navigate('advisory')} currentUser={activeUser} />}
          {page === 'knowledge' && <KnowledgeRepo currentUser={activeUser} />}
          {page === 'audit' && <AuditLog />}
          {page === 'reports' && <Reports />}
          {page === 'settings' && <SettingsPage currentUser={activeUser} />}
        </main>
      </div>
    </div>
  );
}
