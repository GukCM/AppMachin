import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, CheckCircle, Download, Save, AlertCircle } from 'lucide-react'
import { generarOrdenPDF } from '../utils/pdf'

export default function OrdenTrabajo() {
  const { id: servicioId } = useParams()
  const navigate = useNavigate()

  const [servicio,    setServicio]    = useState(null)
  const [orden,       setOrden]       = useState(null)
  const [items,       setItems]       = useState([])
  const [bitacora,    setBitacora]    = useState([])
  const [manoObra,    setManoObra]    = useState(0)
  const [conformidad, setConformidad] = useState(false)
  const [guardado,    setGuardado]    = useState(false)
  const [generando,   setGenerando]   = useState(false)
  const [errorPDF,    setErrorPDF]    = useState(null)

  const [newItem, setNewItem] = useState({ descripcion:'', cantidad:1, precio_unitario:0 })
  const [newBit,  setNewBit]  = useState('')

  useEffect(() => {
    const init = async () => {
      const s = await window.db.obtenerServicio(Number(servicioId))
      setServicio(s)
      let o = await window.db.obtenerOrden(Number(servicioId))
      if (!o) o = await window.db.crearOrden({ servicioId: Number(servicioId) })
      setOrden(o)
      setManoObra(o.precio_mano_obra || 0)
      setConformidad(!!o.conformidad)
      setItems(await window.db.listarItemsOrden(o.id))
      setBitacora(await window.db.listarBitacora(o.id))
    }
    init()
  }, [servicioId])

  const reItems = () => window.db.listarItemsOrden(orden.id).then(setItems)
  const reBit   = () => window.db.listarBitacora(orden.id).then(setBitacora)

  const agregarItem = async () => {
    if (!newItem.descripcion) return
    await window.db.agregarItemOrden({ ordenId: orden.id, ...newItem })
    setNewItem({ descripcion:'', cantidad:1, precio_unitario:0 })
    reItems()
  }

  const agregarBit = async () => {
    if (!newBit.trim()) return
    await window.db.agregarBitacora({ ordenId: orden.id, descripcion: newBit })
    setNewBit('')
    reBit()
  }

  const guardar = async () => {
    await window.db.actualizarOrden(orden.id, {
      precio_mano_obra: Number(manoObra),
      conformidad: conformidad ? 1 : 0,
      firma_data: null,
    })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const generarPDF = async () => {
    setGenerando(true)
    setErrorPDF(null)
    try {
      await guardar()
      await generarOrdenPDF({ servicio, items, bitacora, manoObra: Number(manoObra), conformidad })
    } catch (err) {
      setErrorPDF('Error al generar PDF: ' + (err?.message || String(err)))
    } finally {
      setGenerando(false)
    }
  }

  const totalRef = items.reduce((s, i) => s + Number(i.total), 0)
  const totalGen = totalRef + Number(manoObra)

  if (!servicio) return <div style={{ padding:32, color:'var(--subtexto)' }}>Cargando...</div>

  return (
    <div style={{ padding:'28px 32px', maxWidth:820 }}>

      {/* Header */}
      <button onClick={() => navigate('/clientes')}
        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--subtexto)', cursor:'pointer', fontSize:'0.85rem', marginBottom:16, padding:0 }}
        onMouseEnter={e => e.currentTarget.style.color='var(--texto)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--subtexto)'}
      >
        <ArrowLeft size={16} /> Volver a Clientes
      </button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800 }}>Orden de Trabajo</h1>
          <p style={{ color:'var(--primario)', fontWeight:800, fontSize:'1rem', marginTop:2 }}>{servicio.numero_servicio}</p>
          <p style={{ color:'var(--subtexto)', fontSize:'0.85rem' }}>{servicio.nombre} · {servicio.marca} {servicio.modelo}</p>
        </div>
        <button onClick={generarPDF} disabled={generando} className="btn-rojo">
          <Download size={16} /> {generando ? 'Generando...' : 'Generar PDF'}
        </button>
      </div>

      {/* Error PDF */}
      {errorPDF && (
        <div style={{
          display:'flex', alignItems:'flex-start', gap:10, marginBottom:16,
          background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
          color:'#f87171', padding:'12px 16px', borderRadius:10, fontSize:'0.85rem',
        }}>
          <AlertCircle size={18} style={{ flexShrink:0, marginTop:1 }} />
          <span>{errorPDF}</span>
        </div>
      )}

      {/* Info vehículo */}
      <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16, padding:'14px 18px' }}>
        {[['Placa', servicio.placa||'—'], ['Año', servicio.anio||'—'], ['VIN', servicio.vin||'—'], ['Falla', servicio.falla]].map(([k,v]) => (
          <div key={k}>
            <p style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--subtexto)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{k}</p>
            <p style={{ fontSize:'0.82rem', fontWeight:600, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Refacciones */}
      <div className="card" style={{ marginBottom:16 }}>
        <p className="section-title">Refacciones / Servicios</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 44px', gap:8, marginBottom:14 }}>
          <input className="inp" placeholder="Descripción" value={newItem.descripcion}
            onChange={e => setNewItem(n => ({...n, descripcion:e.target.value}))}
            onKeyDown={e => e.key==='Enter' && agregarItem()}
          />
          <input className="inp" type="number" min="1" placeholder="Cant." value={newItem.cantidad}
            onChange={e => setNewItem(n => ({...n, cantidad:Number(e.target.value)}))}
          />
          <input className="inp" type="number" min="0" step="0.01" placeholder="Precio unit." value={newItem.precio_unitario}
            onChange={e => setNewItem(n => ({...n, precio_unitario:Number(e.target.value)}))}
          />
          <button onClick={agregarItem} className="btn-rojo" style={{ padding:0, justifyContent:'center', width:'100%' }}>
            <Plus size={18} />
          </button>
        </div>

        {items.length > 0 && (
          <table className="tabla" style={{ marginBottom:14 }}>
            <thead><tr>
              <th>Descripción</th>
              <th className="td-ctr">Cant.</th>
              <th className="td-num">P. Unit.</th>
              <th className="td-num">Total</th>
              <th style={{width:36}}></th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight:600 }}>{item.descripcion}</td>
                  <td className="td-ctr" style={{ color:'var(--subtexto)' }}>{item.cantidad}</td>
                  <td className="td-num" style={{ color:'var(--subtexto)' }}>${Number(item.precio_unitario).toFixed(2)}</td>
                  <td className="td-num" style={{ fontWeight:700 }}>${Number(item.total).toFixed(2)}</td>
                  <td>
                    <button onClick={() => window.db.eliminarItemOrden(item.id).then(reItems)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gris4)', padding:'2px 4px' }}
                      onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--gris4)'}
                    ><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totales */}
        <div style={{ borderTop:'1px solid var(--gris4)', paddingTop:12, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ color:'var(--subtexto)', fontSize:'0.875rem' }}>Total refacciones</span>
            <span style={{ fontWeight:700, minWidth:90, textAlign:'right' }}>${totalRef.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ color:'var(--subtexto)', fontSize:'0.875rem' }}>Mano de obra</span>
            <input className="inp" type="number" min="0" step="0.01" value={manoObra}
              onChange={e => setManoObra(e.target.value)}
              style={{ width:110, textAlign:'right' }}
            />
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:16,
            background:'var(--primario)', borderRadius:8, padding:'8px 14px', marginTop:4,
          }}>
            <span style={{ fontWeight:800, fontSize:'0.95rem', color:'rgba(0,0,0,0.7)' }}>Total General</span>
            <span style={{ fontWeight:900, fontSize:'1.1rem', color:'#000', minWidth:90, textAlign:'right' }}>${totalGen.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bitácora */}
      <div className="card" style={{ marginBottom:16 }}>
        <p className="section-title">Bitácora de Trabajo</p>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input className="inp" placeholder="Describe lo que se realizó..." value={newBit}
            onChange={e => setNewBit(e.target.value)}
            onKeyDown={e => e.key==='Enter' && agregarBit()}
          />
          <button onClick={agregarBit} className="btn-rojo" style={{ flexShrink:0 }}>
            <Plus size={18} />
          </button>
        </div>
        {bitacora.length === 0
          ? <p style={{ color:'var(--subtexto)', fontSize:'0.85rem', textAlign:'center', padding:'16px 0' }}>Sin entradas en bitácora</p>
          : bitacora.map(b => (
            <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderTop:'1px solid var(--gris3)' }}>
              <div>
                <p style={{ fontSize:'0.875rem' }}>{b.descripcion}</p>
                <p style={{ fontSize:'0.72rem', color:'var(--subtexto)', marginTop:2 }}>{b.fecha}</p>
              </div>
              <button onClick={() => window.db.eliminarBitacora(b.id).then(reBit)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gris4)', flexShrink:0, marginLeft:12 }}
                onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                onMouseLeave={e => e.currentTarget.style.color='var(--gris4)'}
              ><Trash2 size={14}/></button>
            </div>
          ))
        }
      </div>

      {/* Conformidad */}
      <div className="card" style={{ marginBottom:16 }}>
        <p className="section-title">Conformidad</p>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <input type="checkbox" checked={conformidad} onChange={e => setConformidad(e.target.checked)}
            style={{ width:18, height:18, accentColor:'var(--rojo)', cursor:'pointer' }}
          />
          <span style={{ fontSize:'0.875rem', fontWeight:600 }}>El trabajo fue realizado y el cliente está conforme</span>
          {conformidad && <CheckCircle size={18} color="#4ade80" />}
        </label>
        <p style={{ fontSize:'0.75rem', color:'var(--subtexto)', marginTop:8 }}>
          La firma del cliente se incluye como espacio en blanco en el PDF generado.
        </p>
      </div>

      {/* Botones */}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={guardar} className="btn-gris" style={{ flex:1, justifyContent:'center', padding:12 }}>
          <Save size={16} /> {guardado ? '✓ Guardado' : 'Guardar'}
        </button>
        <button onClick={generarPDF} disabled={generando} className="btn-rojo" style={{ flex:1, justifyContent:'center', padding:12 }}>
          <Download size={16} /> {generando ? 'Generando...' : 'Generar PDF'}
        </button>
      </div>
    </div>
  )
}
