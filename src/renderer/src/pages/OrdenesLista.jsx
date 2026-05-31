import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, CheckCircle, Clock, Search } from 'lucide-react'
import { EstatusBadge } from './Dashboard'

export default function OrdenesLista() {
  const [ordenes, setOrdenes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    window.db.listarOrdenes().then(setOrdenes)
  }, [])

  const lista = ordenes.filter(o => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return o.numero_servicio.toLowerCase().includes(q)
        || o.nombre.toLowerCase().includes(q)
        || (o.placa || '').toLowerCase().includes(q)
  })

  const totalManoObra = lista.reduce((s, o) => s + Number(o.precio_mano_obra || 0), 0)

  return (
    <div style={{ padding:'28px 32px' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800 }}>Órdenes de Trabajo</h1>
          <p style={{ color:'var(--subtexto)', fontSize:'0.875rem', marginTop:2 }}>
            {lista.length} orden{lista.length !== 1 ? 'es' : ''} registrada{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--subtexto)', pointerEvents:'none' }} />
          <input
            className="inp"
            placeholder="Buscar servicio, cliente, placa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width:280, paddingLeft:34 }}
          />
        </div>
      </div>

      {/* Resumen rápido */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, background:'rgba(255,224,0,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ClipboardList size={20} color="var(--primario)" />
          </div>
          <div>
            <p style={{ fontSize:'0.7rem', color:'var(--subtexto)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Total órdenes</p>
            <p style={{ fontSize:'1.6rem', fontWeight:900, lineHeight:1.1 }}>{ordenes.length}</p>
          </div>
        </div>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, background:'rgba(74,222,128,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CheckCircle size={20} color="#4ade80" />
          </div>
          <div>
            <p style={{ fontSize:'0.7rem', color:'var(--subtexto)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Con conformidad</p>
            <p style={{ fontSize:'1.6rem', fontWeight:900, lineHeight:1.1 }}>{ordenes.filter(o => o.conformidad).length}</p>
          </div>
        </div>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, background:'rgba(255,224,0,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Clock size={20} color="#FFE000" />
          </div>
          <div>
            <p style={{ fontSize:'0.7rem', color:'var(--subtexto)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Total mano de obra</p>
            <p style={{ fontSize:'1.4rem', fontWeight:900, lineHeight:1.1, color:'#FFE000' }}>${totalManoObra.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        {lista.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--subtexto)' }}>
            <ClipboardList size={36} style={{ margin:'0 auto 10px', opacity:0.3 }} />
            <p>{busqueda ? 'Sin resultados para esa búsqueda' : 'No hay órdenes registradas aún'}</p>
            {!busqueda && <p style={{ fontSize:'0.78rem', marginTop:4, opacity:0.7 }}>Las órdenes se crean desde la sección Clientes</p>}
          </div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Mano de obra</th>
                <th>Conformidad</th>
                <th>Estatus</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map(o => (
                <tr key={o.id}>
                  <td>
                    <span style={{ color:'var(--primario)', fontWeight:800, fontSize:'0.8rem' }}>{o.numero_servicio}</span>
                  </td>
                  <td style={{ fontWeight:600 }}>{o.nombre}</td>
                  <td style={{ color:'var(--subtexto)' }}>
                    {o.marca} {o.modelo}
                    {o.placa && <span style={{ marginLeft:6, background:'var(--gris3)', border:'1px solid var(--gris4)', borderRadius:4, padding:'1px 6px', fontSize:'0.72rem', fontWeight:700, color:'var(--texto)' }}>{o.placa}</span>}
                  </td>
                  <td style={{ fontWeight:700, color:'#FFE000' }}>${Number(o.precio_mano_obra || 0).toFixed(2)}</td>
                  <td>
                    {o.conformidad
                      ? <span style={{ display:'flex', alignItems:'center', gap:5, color:'#4ade80', fontSize:'0.8rem', fontWeight:600 }}><CheckCircle size={14}/> Conforme</span>
                      : <span style={{ color:'var(--subtexto)', fontSize:'0.8rem' }}>Pendiente</span>
                    }
                  </td>
                  <td><EstatusBadge estatus={o.estatus} /></td>
                  <td style={{ color:'var(--subtexto)', fontSize:'0.78rem', whiteSpace:'nowrap' }}>
                    {new Date(o.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/ordenes/${o.servicio_id}`)}
                      style={{ background:'var(--gris3)', border:'1px solid var(--gris4)', borderRadius:6, padding:'5px 12px', color:'var(--texto)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--primario)'; e.currentTarget.style.color='#000' }}
                      onMouseLeave={e => { e.currentTarget.style.background='var(--gris3)'; e.currentTarget.style.color='var(--texto)' }}
                    >
                      Ver orden
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
