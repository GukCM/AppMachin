import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Car, Users, ClipboardList, FileText } from 'lucide-react'

import Dashboard    from './pages/Dashboard'
import NuevoServicio from './pages/NuevoServicio'
import Clientes     from './pages/Clientes'
import OrdenesLista from './pages/OrdenesLista'
import OrdenTrabajo from './pages/OrdenTrabajo'
import Cotizaciones from './pages/Cotizaciones'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Inicio'        },
  { to: '/servicios',    icon: Car,             label: 'Nuevo Servicio' },
  { to: '/clientes',     icon: Users,           label: 'Clientes'       },
  { to: '/ordenes',      icon: ClipboardList,   label: 'Órdenes'        },
  { to: '/cotizaciones', icon: FileText,        label: 'Cotizaciones'   },
]

export default function App() {
  return (
    <HashRouter>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--negro)' }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside style={{
          width: 220,
          background: 'var(--gris1)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,224,0,0.2)',
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{
            padding: '16px 14px 14px',
            borderBottom: '1px solid rgba(255,224,0,0.2)',
          }}>
            <img
              src="./images/LogoWeb.jpeg"
              alt="El Machin"
              style={{ width:52, height:52, borderRadius:8, objectFit:'cover' }}
            />
          </div>

          {/* Nav links */}
          <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: isActive ? 'var(--primario)' : 'transparent',
                  color: isActive ? '#000' : 'var(--subtexto)',
                })}
                onMouseEnter={e => { if (e.currentTarget.getAttribute('aria-current') !== 'page') { e.currentTarget.style.background = 'var(--gris3)'; e.currentTarget.style.color = '#fff' } }}
                onMouseLeave={e => { if (e.currentTarget.getAttribute('aria-current') !== 'page') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--subtexto)' } }}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(255,224,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--primario)',
              borderRadius: 8,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink: 0,
            }}>
              <span style={{ color:'#000', fontWeight:900, fontSize:'0.9rem' }}>M</span>
            </div>
            <div>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--texto)' }}>El Machin</p>
              <p style={{ fontSize:'0.65rem', color:'var(--subtexto)' }}>Atención y Prestigio</p>
            </div>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main style={{ flex:1, overflow:'auto' }}>
          <Routes>
            <Route path="/"                 element={<Dashboard />}     />
            <Route path="/servicios"        element={<NuevoServicio />} />
            <Route path="/clientes"         element={<Clientes />}      />
            <Route path="/ordenes"          element={<OrdenesLista />}  />
            <Route path="/ordenes/:id"      element={<OrdenTrabajo />}  />
            <Route path="/cotizaciones/:id" element={<Cotizaciones />}  />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
