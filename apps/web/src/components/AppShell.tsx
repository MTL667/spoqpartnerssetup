import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dashboard } from '../pages/Dashboard';
import { Partners } from '../pages/Partners';
import { OnboardingDetail } from '../pages/OnboardingDetail';
import { Notifications } from '../pages/Notifications';
import { Templates } from '../pages/Templates';
import { AdminUsers } from '../pages/AdminUsers';
import { Settings } from '../pages/Settings';
import { PartnerProgress } from '../pages/PartnerProgress';
import { PartnerActions } from '../pages/PartnerActions';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦', roles: ['ADMIN', 'BDM', 'BD'] },
  { to: '/partners', label: 'Partners', icon: '◎', roles: ['ADMIN', 'BDM', 'BD', 'IT', 'MARKETING', 'SALES'] },
  { to: '/notifications', label: 'Notificaties', icon: '⬡', roles: ['ADMIN', 'BDM', 'BD', 'IT', 'MARKETING', 'SALES'] },
  { to: '/templates', label: 'Templates', icon: '⊞', roles: ['ADMIN', 'BDM'] },
  { to: '/admin', label: 'Beheer', icon: '⚙', roles: ['ADMIN'] },
  { to: '/settings', label: 'Instellingen', icon: '⊕', roles: ['ADMIN', 'BDM', 'BD', 'IT', 'MARKETING', 'SALES', 'PARTNER'] },
];

const PARTNER_NAV = [
  { to: '/portal/progress', label: 'Voortgang', icon: '◉' },
  { to: '/portal/actions', label: 'Acties', icon: '⬡' },
  { to: '/settings', label: 'Instellingen', icon: '⊕' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const isPartner = user?.role === 'PARTNER';
  const navItems = isPartner ? PARTNER_NAV : NAV_ITEMS.filter((n) => n.roles.includes(user?.role ?? ''));

  const defaultRoute = isPartner ? '/portal/progress' : '/dashboard';

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>S</div>
          <span style={styles.logoText}>SPOQ</span>
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                background: isActive ? '#1f2937' : 'transparent',
                color: isActive ? '#fff' : '#9ca3af',
              })}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' as const }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.userSection}>
          <div style={styles.avatar}>{user?.email.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{user?.email}</div>
            <div style={styles.userRole}>{user?.role}</div>
          </div>
          <button onClick={logout} style={styles.logoutBtn} title="Uitloggen">✕</button>
        </div>
      </aside>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/onboarding/:id" element={<OnboardingDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/admin" element={<AdminUsers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/portal/progress" element={<PartnerProgress />} />
          <Route path="/portal/actions" element={<PartnerActions />} />
        </Routes>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', height: '100vh' },
  sidebar: {
    width: 220, background: '#111827', color: '#fff',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  },
  logo: {
    padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10,
    borderBottom: '1px solid #1f2937',
  },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8, background: '#3b82f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16,
  },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: 1 },
  nav: { flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    padding: '10px 16px', fontSize: 13, fontWeight: 500,
    textDecoration: 'none', borderRadius: 6, margin: '0 8px',
    display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s',
  },
  userSection: {
    padding: '12px 16px', borderTop: '1px solid #1f2937',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: '#3b82f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: 13, flexShrink: 0,
  },
  userName: { fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: '#6b7280' },
  logoutBtn: { background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer' },
  main: { flex: 1, padding: 24, overflow: 'auto', background: '#f9fafb' },
};
