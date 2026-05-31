import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Download } from 'lucide-react'
import { generarCotizacionPDF } from '../utils/pdf'

export default function Cotizaciones() {
  const { id: servicioId } = useParams()
  const navigate = useNavigate()

  const [servicio,    setServicio]    = useState(null)
  const [cotizacion,  setCotizacion]  = useState(null)
  const [items,       setItems]       = useState([])
  const [newItem,     setNewItem]     = useState({ concepto:'', cantidad:1, precio:0 })

  useEffect(() => {
    const init = async () => {
      const s = await window.db.obtenerServicio(Number(servicioId))
      setServicio(s)
      let c = await window.db.obtenerCotizacion(Number(servicioId))
      if (!c) c = await window.db.crearCotizacion({ servicioId: Number(servicioId) })
      setCotizacion(c)
      setItems(await window.db.listarItemsCotizacion(c.id))
    }
    init()
  }, [servicioId])

  const reItems = () => window.db.listarItemsCotizacion(cotizacion.id).then(setItems)

  const agregar = async () => {
    if (!newItem.concepto) return
    await window.db.agregarItemCotizacion({ cotizacionId: cotizacion.id, ...newItem })
    setNewItem({ concepto:'', cantidad:1, precio:0 })
    reItems()
  }

  const total = items.reduce((s, i) => s + i.total, 0)

  if (!servicio) return <div style={{ padding:32, color:'var(--subtexto)' }}>Cargando...</div>

  return (
    <div style={{ padding:'28px 32px', maxWidth:760 }}>

      <button onClick={() => navigate('/clientes')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--subtexto)', cursor:'pointer', fontSize:'0.85rem', marginBottom:16, padding:0 }}
        onMouseEnter={e => e.currentTarget.style.color='var(--texto)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--subtexto)'}
      >
        <ArrowLeft size={16} /> Volver a Clientes
      </button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800 }}>Cotización</h1>
          <p style={{ color:'var(--primario)', fontWeight:800, marginTop:2 }}>{servicio.numero_servicio}</p>
          <p style={{ color:'var(--subtexto)', fontSize:'0.85rem' }}>{servicio.nombre} · {servicio.marca} {servicio.modelo}</p>
        </div>
        <button onClick={() => generarCotizacionPDF({ servicio, items, total })} className="btn-rojo">
          <Download size={16} /> Generar PDF
        </button>
      </div>

      <div className="card">
        <p className="section-title">Conceptos de Cotización</p>

        {/* Fila de agregar */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 44px', gap:8, marginBottom:16 }}>
          <input className="inp" placeholder="Concepto" value={newItem.concepto}
            onChange={e => setNewItem(n => ({...n, concepto:e.target.value}))}
            onKeyDown={e => e.key==='Enter' && agregar()}
          />
          <input className="inp" type="number" min="1" placeholder="Cant." value={newItem.cantidad}
            onChange={e => setNewItem(n => ({...n, cantidad:Number(e.target.value)}))}
          />
          <input className="inp" type="number" min="0" step="0.01" placeholder="Precio" value={newItem.precio}
            onChange={e => setNewItem(n => ({...n, precio:Number(e.target.value)}))}
          />
          <button onClick={agregar} className="btn-rojo" style={{ padding:0, justifyContent:'center' }}>
            <Plus size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <p style={{ color:'var(--subtexto)', fontSize:'0.875rem', textAlign:'center', padding:'24px 0' }}>
            Sin conceptos. Agrega el primero arriba.
          </p>
        ) : (
          <>
            <table className="tabla" style={{ marginBottom:14 }}>
              <thead><tr>
                <th>Concepto</th>
                <th className="td-ctr">Cant.</th>
                <th className="td-num">Precio</th>
                <th className="td-num">Total</th>
                <th style={{width:36}}></th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight:600 }}>{item.concepto}</td>
                    <td className="td-ctr" style={{ color:'var(--subtexto)' }}>{item.cantidad}</td>
                    <td className="td-num" style={{ color:'var(--subtexto)' }}>${Number(item.precio).toFixed(2)}</td>
                    <td className="td-num" style={{ fontWeight:700 }}>${Number(item.total).toFixed(2)}</td>
                    <td>
                      <button onClick={() => window.db.eliminarItemCotizacion(item.id).then(reItems)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gris4)', padding:'2px 4px' }}
                        onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--gris4)'}
                      ><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop:'1px solid var(--gris4)', paddingTop:12, display:'flex', justifyContent:'flex-end' }}>
              <div style={{ background:'var(--primario)', borderRadius:8, padding:'8px 18px', display:'flex', alignItems:'center', gap:16 }}>
                <span style={{ fontWeight:800, color:'rgba(255,255,255,0.85)' }}>Total</span>
                <span style={{ fontWeight:900, fontSize:'1.1rem', color:'#000' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={() => generarCotizacionPDF({ servicio, items, total })} className="btn-rojo" style={{ width:'100%', marginTop:14, justifyContent:'center', padding:13, fontSize:'0.95rem' }}>
        <Download size={18} /> Generar PDF de Cotización
      </button>
    </div>
  )
}
