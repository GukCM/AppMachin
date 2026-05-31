import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, FileText, Trash2, ChevronDown, Search, AlertTriangle, X } from 'lucide-react'
import { EstatusBadge } from './Dashboard'

const ESTATUS = ['Todos', 'Ingresado', 'En Proceso', 'Finalizado']

export default function Clientes() {
  const [servicios, setServicios] = useState([])
  const [filtro, setFiltro]       = useState('Todos')
  const [busqueda, setBusqueda]   = useState('')
  const [confirmar, setConfirmar] = useState(null) // { id, numero }
  const navigate = useNavigate()

  const cargar = () => window.db.listarServicios().then(setServicios)
  useEffect(() => { cargar() }, [])

  const cambiarEstatus = async (id, estatus) => {
    await window.db.actualizarEstatus(id, estatus)
    cargar()
  }

  const confirmarEliminar = (id, numero) => setConfirmar({ id, numero })

  const ejecutarEliminar = async () => {
    if (!confirmar) return
    await window.db.eliminarServicio(confirmar.id)
    setConfirmar(null)
    cargar()
  }

  const lista = servicios
    .filter(s => filtro === 'Todos' || s.estatus === filtro)
    .filter(s => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return s.numero_servicio.toLowerCase().includes(q)
          || s.nombre.toLowerCase().includes(q)
          || (s.placa || '').toLowerCase().includes(q)
          || s.marca.toLowerCase().includes(q)
    })

  return (
    <div style={{ padding:'28px 32px' }}>

      {/* Modal de confirmación */}
      {confirmar && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000,
        }}>
          <div style={{
            background:'var(--gris2)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:14, padding:'28px 32px', maxWidth:400, width:'90%',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:40, height:40, background:'rgba(239,68,68,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertTriangle size={20} color="#f87171" />
              </div>
              <div>
                <p style={{ fontWeight:800, fontSize:'1rem' }}>Eliminar servicio</p>
                <p style={{ color:'var(--subtexto)', fontSize:'0.82rem' }}>{confirmar.numero}</p>
              </div>
            </div>
            <p style={{ color:'var(--subtexto)', fontSize:'0.875rem', marginBottom:20 }}>
              Esta acción eliminará el servicio junto con su orden de trabajo, cotización y fotos. <strong style={{ color:'var(--texto)' }}>No se puede deshacer.</strong>
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => setConfirmar(null)}
                className="btn-gris"
                style={{ flex:1, justifyContent:'center' }}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarEliminar}
                style={{
                  flex:1, background:'#dc2626', color:'#fff', fontWeight:700,
                  borderRadius:8, padding:'9px 18px', fontSize:'0.875rem',
                  border:'none', cursor:'pointer', display:'flex',
                  alignItems:'center', justifyContent:'center', gap:6,
                }}
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800 }}>Clientes / Servicios</h1>
          <p style={{ color:'var(--subtexto)', fontSize:'0.875rem', marginTop:2 }}>
            {lista.length} resultado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--subtexto)', pointerEvents:'none' }} />
          <input
            className="inp"
            placeholder="Buscar nombre, placa, servicio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width:280, paddingLeft:34 }}
          />
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {ESTATUS.map(e => (
          <button key={e} onClick={() => setFiltro(e)} style={{
            padding:'6px 16px', borderRadius:20, fontSize:'0.78rem', fontWeight:700,
            border: filtro===e ? 'none' : '1px solid var(--gris4)',
            background: filtro===e ? 'var(--primario)' : 'var(--gris2)',
            color: filtro===e ? '#000' : 'var(--subtexto)',
            cursor:'pointer', transition:'all 0.15s',
          }}>
            {e}
          </button>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'50px 0', color:'var(--subtexto)' }}>
          <p>No se encontraron servicios{filtro !== 'Todos' ? ` con estatus "${filtro}"` : ''}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {lista.map(s => (
            <div key={s.id} style={{
              background:'var(--gris2)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:12, padding:'14px 18px',
              display:'flex', alignItems:'center', gap:16,
            }}>
              {/* Badge de servicio */}
              <div style={{ background:'var(--primario)', borderRadius:8, padding:'6px 12px', flexShrink:0 }}>
                <p style={{ fontSize:'0.65rem', fontWeight:900, color:'rgba(0,0,0,0.55)', letterSpacing:'0.05em' }}>SERVICIO</p>
                <p style={{ fontSize:'0.9rem', fontWeight:900, color:'#000', whiteSpace:'nowrap' }}>{s.numero_servicio}</p>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                  <p style={{ fontWeight:700, fontSize:'0.95rem' }}>{s.nombre}</p>
                  <EstatusBadge estatus={s.estatus} />
                </div>
                <p style={{ color:'var(--subtexto)', fontSize:'0.8rem' }}>
                  {s.marca} {s.modelo} {s.anio && `(${s.anio})`}
                  {s.placa && (
                    <span style={{ marginLeft:8, background:'var(--gris3)', border:'1px solid var(--gris4)', borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700, color:'var(--texto)' }}>
                      {s.placa}
                    </span>
                  )}
                </p>
                <p style={{ color:'#555', fontSize:'0.78rem', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:380 }}>
                  {s.falla}
                </p>
              </div>

              {/* Fecha */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:'0.7rem', color:'var(--subtexto)' }}>Ingreso</p>
                <p style={{ fontSize:'0.8rem', fontWeight:600 }}>
                  {new Date(s.fecha_ingreso).toLocaleDateString('es-MX')}
                </p>
              </div>

              {/* Cambiar estatus */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <select
                  value={s.estatus}
                  onChange={e => cambiarEstatus(s.id, e.target.value)}
                  style={{
                    appearance:'none', background:'var(--gris3)', border:'1px solid var(--gris4)',
                    color:'var(--texto)', fontSize:'0.78rem', fontWeight:600,
                    borderRadius:8, padding:'7px 28px 7px 10px', cursor:'pointer', outline:'none',
                  }}
                >
                  <option>Ingresado</option>
                  <option>En Proceso</option>
                  <option>Finalizado</option>
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'var(--subtexto)', pointerEvents:'none' }} />
              </div>

              {/* Acciones */}
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => navigate(`/ordenes/${s.id}`)} className="btn-rojo" style={{ padding:'7px 14px', fontSize:'0.78rem' }}>
                  <ClipboardList size={14} /> Orden
                </button>
                <button onClick={() => navigate(`/cotizaciones/${s.id}`)} className="btn-gris" style={{ padding:'7px 14px', fontSize:'0.78rem' }}>
                  <FileText size={14} /> Cotización
                </button>
                <button
                  onClick={() => confirmarEliminar(s.id, s.numero_servicio)}
                  style={{ background:'transparent', border:'1px solid var(--gris4)', borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'var(--subtexto)', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(204,0,0,0.15)'; e.currentTarget.style.color='#f87171'; e.currentTarget.style.borderColor='rgba(204,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--subtexto)'; e.currentTarget.style.borderColor='var(--gris4)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
