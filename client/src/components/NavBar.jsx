import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',        label: 'Practice' },
  { to: '/progress', label: 'Progress' },
  { to: '/review',   label: 'Review'   },
];

export default function NavBar() {
  return (
    <nav style={nav}>
      <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={brand}>Neev's CAASPP Math</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>v{__APP_VERSION__}</span>
      </NavLink>
      <div style={linkRow}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              ...linkBase,
              color:        isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
              borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
              fontWeight:   isActive ? 600 : 400,
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const nav = {
  position: 'fixed', top: 0, left: 0, right: 0, height: 60,
  background: '#1d4ed8',
  boxShadow: '0 2px 4px rgba(29,78,216,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 32px', zIndex: 1000,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
const brand   = { fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' };
const linkRow = { display: 'flex', gap: 8 };
const linkBase = {
  padding: '6px 12px', textDecoration: 'none', fontSize: 14,
  borderRadius: 6, transition: 'all 0.2s ease', paddingBottom: 4,
};
