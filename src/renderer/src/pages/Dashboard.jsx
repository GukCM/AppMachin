import { useEffect, useState } from 'react'
import { Car, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'

export function EstatusBadge({ estatus }) {
  const styles = {
    'Ingresado':  { background:'rgba(251,191,36,0.12)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.25)' },
    'En Proceso': { background:'rgba(59,130,246,0.12)',  color:'#60a5fa', border:'1px solid rgba(59,130,246,0.25)' },
    'Finalizado': { background:'rgba(34,197,94,0.12)',   color:'#4ade80', border:'1px solid rgba(34,197,94,0.25)' },
  }
  return (
    <span style={{
      ...(styles[estatus] || { background:'var(--gris3)', color:'var(--subtexto)', border:'1px solid var(--gris4)' }),
      fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {estatus}
    </span>
  )
}

export default function Dashboard() {
  const [servicios, setServicios] = useState([])

  useEffect(() => {
    window.db.listarServicios().then(setServicios)
  }, [])

  const total      = servicios.length
  const ingresados = servicios.filter(s => s.estatus === 'Ingresado').length
  const enProceso  = servicios.filter(s => s.estatus === 'En Proceso').length
  const finalizados= servicios.filter(s => s.estatus === 'Finalizado').length

  return (
    <div style={{ padding: '28px 32px', minHeight:'100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--texto)' }}>Panel de Control</h1>
        <p style={{ color:'var(--subtexto)', fontSize:'0.875rem', marginTop:2 }}>
          Resumen general · {new Date().toLocaleDateString('es-MX',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <StatCard label="Total Servicios" value={total}      icon={TrendingUp}  accent="#000"    bg="linear-gradient(135deg,#FFE000,#d4b800)" textColor="#000" />
        <StatCard label="Ingresados"      value={ingresados} icon={AlertCircle} accent="#fbbf24" bg="var(--gris2)" />
        <StatCard label="En Proceso"      value={enProceso}  icon={Clock}       accent="#60a5fa" bg="var(--gris2)" />
        <StatCard label="Finalizados"     value={finalizados}icon={CheckCircle} accent="#4ade80" bg="var(--gris2)" />
      </div>

      {/* Tabla recientes */}
      <div className="card">
        <p className="section-title">Servicios Recientes</p>
        {servicios.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--subtexto)', fontSize:'0.875rem' }}>
            <Car size={36} style={{ margin:'0 auto 10px', opacity:0.3 }} />
            <p>No hay servicios registrados aún</p>
            <p style={{ fontSize:'0.78rem', marginTop:4, opacity:0.7 }}>Registra tu primer vehículo en "Nuevo Servicio"</p>
          </div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Falla</th>
                <th>Fecha</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {servicios.slice(0, 10).map(s => (
                <tr key={s.id}>
                  <td>
                    <span style={{ color:'var(--primario)', fontWeight:800, fontSize:'0.8rem' }}>
                      {s.numero_servicio}
                    </span>
                  </td>
                  <td style={{ fontWeight:600 }}>{s.nombre}</td>
                  <td style={{ color:'var(--subtexto)' }}>{s.marca} {s.modelo} {s.anio && `(${s.anio})`}</td>
                  <td style={{ color:'var(--subtexto)', maxWidth:180 }}>
                    <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>
                      {s.falla}
                    </span>
                  </td>
                  <td style={{ color:'var(--subtexto)', fontSize:'0.78rem', whiteSpace:'nowrap' }}>
                    {new Date(s.fecha_ingreso).toLocaleDateString('es-MX')}
                  </td>
                  <td><EstatusBadge estatus={s.estatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, bg, textColor }) {
  const isGradient = bg.includes('gradient')
  const valueColor = textColor || (isGradient ? '#000' : '#fff')
  const labelColor = isGradient ? 'rgba(0,0,0,0.6)' : 'var(--subtexto)'
  const iconBg     = isGradient ? 'rgba(0,0,0,0.12)' : `${accent}18`
  const iconColor  = isGradient ? '#000' : accent

  return (
    <div style={{
      background: bg,
      border: `1px solid ${isGradient ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color: labelColor, marginBottom:8 }}>
            {label}
          </p>
          <p style={{ fontSize:'2rem', fontWeight:900, color: valueColor, lineHeight:1 }}>{value}</p>
        </div>
        <div style={{ width:38, height:38, borderRadius:10, background: iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} color={iconColor} />
        </div>
      </div>
    </div>
  )
}
