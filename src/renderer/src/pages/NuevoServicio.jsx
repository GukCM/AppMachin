import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

const empty = {
  nombre:'', telefono:'', correo:'',
  placa:'', marca:'', modelo:'', vin:'', anio:'', falla:'',
}

export default function NuevoServicio() {
  const [form, setForm]       = useState(empty)
  const [fotos, setFotos]     = useState([])
  const [exito, setExito]     = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onFotos = e => {
    Array.from(e.target.files).forEach(file => {
      const r = new FileReader()
      r.onload = ev => setFotos(p => [...p, { nombre: file.name, datos: ev.target.result }])
      r.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const validar = () => {
    if (!form.nombre.trim())   return 'El nombre del cliente es obligatorio.'
    if (!form.telefono.trim()) return 'El teléfono es obligatorio.'
    if (!/^\d{10}$/.test(form.telefono.replace(/\D/g, '')))
                               return 'El teléfono debe tener exactamente 10 dígitos.'
    if (form.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                               return 'El correo no tiene un formato válido.'
    if (!form.placa.trim())    return 'La placa es obligatoria.'
    if (!form.marca.trim())    return 'La marca del vehículo es obligatoria.'
    if (!form.modelo.trim())   return 'El modelo del vehículo es obligatorio.'
    if (!form.vin.trim())      return 'El VIN es obligatorio.'
    if (!form.anio.trim())     return 'El año del vehículo es obligatorio.'
    if (!/^\d{4}$/.test(form.anio.trim()) || Number(form.anio) < 1900 || Number(form.anio) > new Date().getFullYear() + 1)
                               return 'Ingresa un año válido (ej. 2020).'
    if (!form.falla.trim())    return 'La falla o motivo de ingreso es obligatorio.'
    return null
  }

  const submit = async e => {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setLoading(true); setError(null)
    try {
      const { id, numero_servicio } = await window.db.crearServicio(form)
      for (const f of fotos) await window.db.guardarFoto({ servicioId: id, nombre: f.nombre, datos: f.datos })
      setExito(numero_servicio); setForm(empty); setFotos([])
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding:'28px 32px', maxWidth:760 }}>

      <h1 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:4 }}>Nuevo Servicio</h1>
      <p style={{ color:'var(--subtexto)', fontSize:'0.875rem', marginBottom:24 }}>
        Completa los datos del cliente y vehículo. Se generará el número de servicio automáticamente.
      </p>

      {exito && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, marginBottom:16,
          background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)',
          color:'#4ade80', padding:'12px 16px', borderRadius:10,
        }}>
          <CheckCircle size={18} />
          <span style={{ fontWeight:600 }}>Servicio registrado: <strong>{exito}</strong></span>
          <button onClick={() => setExito(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#4ade80', cursor:'pointer' }}><X size={16}/></button>
        </div>
      )}
      {error && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, marginBottom:16,
          background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
          color:'#f87171', padding:'12px 16px', borderRadius:10,
        }}>
          <AlertCircle size={18} />
          <span style={{ fontSize:'0.875rem' }}>{error}</span>
        </div>
      )}

      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Cliente */}
        <div className="card">
          <p className="section-title">Datos del Cliente</p>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2fr', gap:12 }}>
            <Field label="Nombre completo *"   name="nombre"   value={form.nombre}   onChange={set} placeholder="Juan Pérez" />
            <Field label="Teléfono * (10 dígitos)" name="telefono" value={form.telefono} onChange={set} placeholder="5551234567" maxLength={10} />
            <Field label="Correo (opcional)"   name="correo"   value={form.correo}   onChange={set} placeholder="correo@ejemplo.com" />
          </div>
        </div>

        {/* Vehículo */}
        <div className="card">
          <p className="section-title">Datos del Vehículo</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
            <Field label="Marca *"  name="marca"  value={form.marca}  onChange={set} placeholder="Toyota" />
            <Field label="Modelo *" name="modelo" value={form.modelo} onChange={set} placeholder="Corolla" />
            <Field label="Año *"    name="anio"   value={form.anio}   onChange={set} placeholder="2020" maxLength={4} />
            <Field label="Placa *"  name="placa"  value={form.placa}  onChange={set} placeholder="ABC-1234" />
            <div style={{ gridColumn:'span 2' }}>
              <Field label="VIN *" name="vin" value={form.vin} onChange={set} placeholder="1HGBH41JXMN109186" />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'var(--subtexto)', marginBottom:6 }}>
              Falla por la que entra *
            </label>
            <textarea
              name="falla" value={form.falla} onChange={set} rows={3}
              placeholder="Describe la falla o motivo de ingreso del vehículo..."
              style={{ width:'100%', background:'var(--gris1)', border:'1px solid var(--gris4)', borderRadius:8, padding:'9px 12px', color:'var(--texto)', fontSize:'0.875rem', resize:'none', outline:'none', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='var(--primario)'}
              onBlur={e => e.target.style.borderColor='var(--gris4)'}
            />
          </div>
        </div>

        {/* Fotos */}
        <div className="card">
          <p className="section-title">Fotos del Vehículo al Ingreso</p>
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'9px 16px', background:'var(--gris3)',
              border:'1px dashed var(--gris4)', borderRadius:8,
              color:'var(--subtexto)', fontSize:'0.85rem', cursor:'pointer',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primario)'; e.currentTarget.style.color='var(--texto)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gris4)'; e.currentTarget.style.color='var(--subtexto)' }}
          >
            <Upload size={16} /> Agregar fotos
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={onFotos} />

          {fotos.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:12 }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ position:'relative', width:88, height:88, borderRadius:8, overflow:'hidden', border:'1px solid var(--gris4)' }}>
                  <img src={f.datos} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button
                    type="button"
                    onClick={() => setFotos(p => p.filter((_,j) => j!==i))}
                    style={{
                      position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.75)',
                      border:'none', borderRadius:'50%', width:20, height:20,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', color:'#fff',
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-rojo" style={{ padding:'13px', fontSize:'0.95rem', justifyContent:'center' }}>
          {loading ? 'Registrando...' : 'Registrar Servicio'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, maxLength }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'var(--subtexto)', marginBottom:6 }}>{label}</label>
      <input
        className="inp" name={name} value={value} onChange={onChange}
        placeholder={placeholder} maxLength={maxLength}
        onFocus={e => e.target.style.borderColor='var(--primario)'}
        onBlur={e => e.target.style.borderColor='var(--gris4)'}
      />
    </div>
  )
}
