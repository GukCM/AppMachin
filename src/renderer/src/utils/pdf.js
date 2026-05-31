import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Paleta ────────────────────────────────────────────────────────────────
const C = {
  rojo:    [204,  0,   0 ],
  negro:   [ 10,  10,  10],
  blanco:  [255, 255, 255],
  gris1:   [ 28,  28,  28],
  gris2:   [ 45,  45,  45],
  grisTxt: [160, 160, 160],
  amarillo:[255, 224,   0],
}

function fill(doc, color)   { doc.setFillColor(color[0],  color[1],  color[2])  }
function text(doc, color)   { doc.setTextColor(color[0],  color[1],  color[2])  }
function draw(doc, color)   { doc.setDrawColor(color[0],  color[1],  color[2])  }

// ── Encabezado ────────────────────────────────────────────────────────────
function encabezado(doc, servicio, titulo) {
  const W = doc.internal.pageSize.getWidth()

  fill(doc, C.negro); doc.rect(0, 0, W, 36, 'F')
  fill(doc, C.rojo);  doc.rect(0, 36, W, 6, 'F')

  text(doc, C.blanco)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('EL MACHIN', 14, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  text(doc, C.grisTxt)
  doc.text('REFACCIONARIAS  -  ATENCION Y PRESTIGIO', 14, 23)
  doc.setFontSize(6.5)
  doc.text('TU CARRO MERECE LO MEJOR', 14, 29)

  text(doc, C.amarillo)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(servicio.numero_servicio || '', W - 14, 16, { align: 'right' })

  text(doc, C.grisTxt)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(titulo.toUpperCase(), W - 14, 23, { align: 'right' })
  doc.text(
    new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' }),
    W - 14, 29, { align: 'right' }
  )

  text(doc, C.blanco)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(titulo.toUpperCase(), W / 2, 40.5, { align: 'center' })
}

// ── Bloque cliente / vehiculo ─────────────────────────────────────────────
function bloqueCliente(doc, s, y) {
  const W = doc.internal.pageSize.getWidth()

  fill(doc, C.gris1)
  doc.roundedRect(14, y, W - 28, 26, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  text(doc, C.rojo)
  doc.text('CLIENTE Y VEHICULO', 20, y + 6)

  const fila = (label, val, x, yy) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    text(doc, C.grisTxt)
    doc.text(label + ':', x, yy)

    doc.setFont('helvetica', 'normal')
    text(doc, C.blanco)
    const lw = doc.getStringUnitWidth(label + ':') * 7 / doc.internal.scaleFactor + 2
    doc.text(String(val || '-'), x + lw, yy)
  }

  fila('Cliente',  s.nombre,   20,  y + 13)
  fila('Tel',      s.telefono, 80,  y + 13)
  fila('Placa',    s.placa,    145, y + 13)
  fila('Vehiculo', `${s.marca || ''} ${s.modelo || ''} ${s.anio ? '(' + s.anio + ')' : ''}`, 20, y + 20)
  fila('VIN',      s.vin,      80,  y + 20)

  return y + 30
}

// ── Pie de pagina ─────────────────────────────────────────────────────────
function pie(doc) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  fill(doc, C.rojo)
  doc.rect(0, H - 9, W, 9, 'F')
  text(doc, C.blanco)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text(
    'EL MACHIN REFACCIONARIAS  -  ATENCION Y PRESTIGIO  -  TU CARRO MERECE LO MEJOR',
    W / 2, H - 3.5, { align: 'center' }
  )
}

// ── Enviar a proceso principal via IPC ────────────────────────────────────
async function guardarPDF(doc, nombre) {
  const arrayBuffer = doc.output('arraybuffer')
  const bytes = Array.from(new Uint8Array(arrayBuffer))
  return window.db.guardarPDF({ nombre, bytes })
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDEN DE TRABAJO
// ═══════════════════════════════════════════════════════════════════════════
export async function generarOrdenPDF({ servicio, items, bitacora, manoObra, conformidad }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const W   = doc.internal.pageSize.getWidth()

  encabezado(doc, servicio, 'Orden de Trabajo')
  let y = bloqueCliente(doc, servicio, 48)

  // Falla reportada
  fill(doc, C.gris1)
  doc.roundedRect(14, y, W - 28, 13, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  text(doc, C.rojo)
  doc.text('FALLA REPORTADA:', 20, y + 5.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  text(doc, C.blanco)
  const fallaLines = doc.splitTextToSize(String(servicio.falla || ''), W - 80)
  doc.text(fallaLines[0] || '', 60, y + 5.5)
  if (fallaLines[1]) doc.text(fallaLines[1], 20, y + 11)
  y += 17

  // Tabla de refacciones
  autoTable(doc, {
    startY: y,
    head: [['SERVICIO / REFACCION', 'CANT.', 'P. UNITARIO', 'TOTAL']],
    body: items.length > 0
      ? items.map(i => [
          String(i.descripcion),
          String(i.cantidad),
          '$' + Number(i.precio_unitario).toFixed(2),
          '$' + Number(i.total).toFixed(2),
        ])
      : [['Sin refacciones registradas', '', '', '']],
    styles:          { fillColor: C.gris1, textColor: C.blanco, fontSize: 8, cellPadding: 3 },
    headStyles:      { fillColor: C.rojo,  textColor: C.blanco, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [22, 22, 22] },
    columnStyles: {
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right',  cellWidth: 32 },
      3: { halign: 'right',  cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 4

  // Totales
  const totalRef = items.reduce((s, i) => s + Number(i.total), 0)
  const totalGen = totalRef + Number(manoObra)
  const totX     = W - 80

  fill(doc, C.gris1)
  doc.roundedRect(totX, y, 66, 20, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  text(doc, C.grisTxt)
  doc.text('Subtotal refacciones:', totX + 4, y + 7)
  text(doc, C.blanco)
  doc.text('$' + totalRef.toFixed(2), W - 16, y + 7, { align: 'right' })
  text(doc, C.grisTxt)
  doc.text('Mano de obra:', totX + 4, y + 14)
  text(doc, C.blanco)
  doc.text('$' + Number(manoObra).toFixed(2), W - 16, y + 14, { align: 'right' })

  fill(doc, C.rojo)
  doc.roundedRect(totX, y + 22, 66, 9, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  text(doc, C.blanco)
  doc.text('TOTAL:', totX + 4, y + 28.5)
  doc.text('$' + totalGen.toFixed(2), W - 16, y + 28.5, { align: 'right' })

  y += 36

  // Bitacora
  if (bitacora.length > 0) {
    fill(doc, C.rojo)
    doc.roundedRect(14, y, W - 28, 7, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    text(doc, C.blanco)
    doc.text('BITACORA DE TRABAJO', 20, y + 4.8)
    y += 10

    for (const b of bitacora) {
      const lines = doc.splitTextToSize('- ' + String(b.descripcion || ''), W - 38)
      const bh    = lines.length * 5 + 5
      fill(doc, C.gris1)
      doc.roundedRect(14, y, W - 28, bh, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      text(doc, C.blanco)
      doc.text(lines, 20, y + 5)
      doc.setFontSize(6.5)
      text(doc, C.grisTxt)
      doc.text(String(b.fecha || ''), W - 16, y + 5, { align: 'right' })
      y += bh + 2
    }
    y += 2
  }

  // Conformidad
  fill(doc, C.gris1)
  doc.roundedRect(14, y, W - 28, 12, 2, 2, 'F')
  doc.setFont('helvetica', conformidad ? 'bold' : 'normal')
  doc.setFontSize(8)
  text(doc, conformidad ? [74, 222, 128] : C.grisTxt)
  doc.text(
    conformidad
      ? 'OK - El trabajo fue realizado y el cliente esta conforme.'
      : 'PENDIENTE - Conformidad del cliente.',
    20, y + 7.5
  )
  y += 16

  // Espacio de firma
  const sigW = 75
  fill(doc, C.gris1)
  doc.roundedRect(14, y, sigW, 26, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  text(doc, C.rojo)
  doc.text('FIRMA DEL CLIENTE', 20, y + 6)
  draw(doc, C.grisTxt)
  doc.setLineWidth(0.4)
  doc.line(20, y + 22, 14 + sigW - 6, y + 22)
  doc.setFont('helvetica', 'normal')
  text(doc, C.grisTxt)
  doc.text('Firma', 20, y + 25.5)

  const fechaX = 14 + sigW + 6
  fill(doc, C.gris1)
  doc.roundedRect(fechaX, y, W - 28 - sigW - 6, 26, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  text(doc, C.rojo)
  doc.text('FECHA Y SELLO', fechaX + 6, y + 6)
  draw(doc, C.grisTxt)
  doc.line(fechaX + 6, y + 22, W - 20, y + 22)
  doc.setFont('helvetica', 'normal')
  text(doc, C.grisTxt)
  doc.text('Fecha', fechaX + 6, y + 25.5)

  pie(doc)

  return guardarPDF(doc, 'OrdenTrabajo-' + servicio.numero_servicio + '.pdf')
}

// ═══════════════════════════════════════════════════════════════════════════
// COTIZACION
// ═══════════════════════════════════════════════════════════════════════════
export async function generarCotizacionPDF({ servicio, items, total }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const W   = doc.internal.pageSize.getWidth()

  encabezado(doc, servicio, 'Cotizacion')
  let y = bloqueCliente(doc, servicio, 48)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['CONCEPTO', 'CANT.', 'PRECIO', 'TOTAL']],
    body: items.length > 0
      ? items.map(i => [
          String(i.concepto),
          String(i.cantidad),
          '$' + Number(i.precio).toFixed(2),
          '$' + Number(i.total).toFixed(2),
        ])
      : [['Sin conceptos registrados', '', '', '']],
    styles:          { fillColor: C.gris1, textColor: C.blanco, fontSize: 8, cellPadding: 3 },
    headStyles:      { fillColor: C.rojo,  textColor: C.blanco, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [22, 22, 22] },
    columnStyles: {
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right',  cellWidth: 32 },
      3: { halign: 'right',  cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 6

  fill(doc, C.rojo)
  doc.roundedRect(W - 80, y, 66, 9, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  text(doc, C.blanco)
  doc.text('TOTAL:', W - 80 + 4, y + 6.2)
  doc.text('$' + Number(total).toFixed(2), W - 16, y + 6.2, { align: 'right' })

  y += 16
  fill(doc, C.gris1)
  doc.roundedRect(14, y, W - 28, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  text(doc, C.grisTxt)
  doc.text(
    'Esta cotizacion tiene una vigencia de 15 dias a partir de la fecha de emision.',
    W / 2, y + 6.5, { align: 'center' }
  )

  pie(doc)

  return guardarPDF(doc, 'Cotizacion-' + servicio.numero_servicio + '.pdf')
}
