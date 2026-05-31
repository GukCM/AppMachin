const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const fs = require('fs')

let db

function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'elmachin.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT NOT NULL,
      telefono    TEXT,
      correo      TEXT,
      created_at  TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS vehiculos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      placa      TEXT,
      marca      TEXT NOT NULL,
      modelo     TEXT NOT NULL,
      vin        TEXT,
      anio       TEXT,
      cliente_id INTEGER NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_servicio  TEXT NOT NULL UNIQUE,
      cliente_id       INTEGER NOT NULL,
      vehiculo_id      INTEGER NOT NULL,
      falla            TEXT NOT NULL,
      estatus          TEXT NOT NULL DEFAULT 'Ingresado',
      fecha_ingreso    TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id)  REFERENCES clientes(id),
      FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
    );

    CREATE TABLE IF NOT EXISTS fotos_servicio (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      servicio_id INTEGER NOT NULL,
      nombre      TEXT NOT NULL,
      datos       BLOB NOT NULL,
      created_at  TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    );

    CREATE TABLE IF NOT EXISTS ordenes_trabajo (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      servicio_id       INTEGER NOT NULL UNIQUE,
      precio_mano_obra  REAL DEFAULT 0,
      conformidad       INTEGER DEFAULT 0,
      firma_data        TEXT,
      created_at        TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    );

    CREATE TABLE IF NOT EXISTS items_orden (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id        INTEGER NOT NULL,
      descripcion     TEXT NOT NULL,
      cantidad        REAL NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL DEFAULT 0,
      total           REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id)
    );

    CREATE TABLE IF NOT EXISTS bitacora (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id   INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      fecha      TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id)
    );

    CREATE TABLE IF NOT EXISTS cotizaciones (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      servicio_id INTEGER NOT NULL UNIQUE,
      created_at  TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    );

    CREATE TABLE IF NOT EXISTS items_cotizacion (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      cotizacion_id  INTEGER NOT NULL,
      concepto       TEXT NOT NULL,
      cantidad       REAL NOT NULL DEFAULT 1,
      precio         REAL NOT NULL DEFAULT 0,
      total          REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id)
    );

    CREATE TABLE IF NOT EXISTS contador_servicios (
      id      INTEGER PRIMARY KEY CHECK (id = 1),
      ultimo  INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO contador_servicios (id, ultimo) VALUES (1, 0);
  `)
}

function generarNumeroServicio() {
  const row = db.prepare('SELECT ultimo FROM contador_servicios WHERE id = 1').get()
  const nuevo = row.ultimo + 1
  db.prepare('UPDATE contador_servicios SET ultimo = ? WHERE id = 1').run(nuevo)
  return `MACHIN-${String(nuevo).padStart(3, '0')}`
}

const dbHandlers = {
  // ── SERVICIOS ──────────────────────────────────────────────────────────────
  'crear-servicio': (data) => {
    const { nombre, telefono, correo, placa, marca, modelo, vin, anio, falla } = data

    const insertCliente = db.prepare(
      'INSERT INTO clientes (nombre, telefono, correo) VALUES (?, ?, ?)'
    )
    const clienteResult = insertCliente.run(nombre, telefono || '', correo || '')
    const clienteId = clienteResult.lastInsertRowid

    const insertVehiculo = db.prepare(
      'INSERT INTO vehiculos (placa, marca, modelo, vin, anio, cliente_id) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const vehiculoResult = insertVehiculo.run(placa || '', marca, modelo, vin || '', anio || '', clienteId)
    const vehiculoId = vehiculoResult.lastInsertRowid

    const numeroServicio = generarNumeroServicio()

    const insertServicio = db.prepare(
      'INSERT INTO servicios (numero_servicio, cliente_id, vehiculo_id, falla) VALUES (?, ?, ?, ?)'
    )
    const servicioResult = insertServicio.run(numeroServicio, clienteId, vehiculoId, falla)

    return { id: servicioResult.lastInsertRowid, numero_servicio: numeroServicio }
  },

  'listar-servicios': () => {
    return db.prepare(`
      SELECT s.id, s.numero_servicio, s.estatus, s.fecha_ingreso, s.falla,
             c.nombre, c.telefono,
             v.marca, v.modelo, v.placa, v.anio
      FROM servicios s
      JOIN clientes c  ON c.id = s.cliente_id
      JOIN vehiculos v ON v.id = s.vehiculo_id
      ORDER BY s.id DESC
    `).all()
  },

  'obtener-servicio': (id) => {
    return db.prepare(`
      SELECT s.*, c.nombre, c.telefono, c.correo,
             v.marca, v.modelo, v.placa, v.vin, v.anio
      FROM servicios s
      JOIN clientes c  ON c.id = s.cliente_id
      JOIN vehiculos v ON v.id = s.vehiculo_id
      WHERE s.id = ?
    `).get(id)
  },

  'actualizar-estatus': (id, estatus) => {
    db.prepare('UPDATE servicios SET estatus = ? WHERE id = ?').run(estatus, id)
    return { ok: true }
  },

  'eliminar-servicio': (id) => {
    db.prepare('DELETE FROM bitacora WHERE orden_id IN (SELECT id FROM ordenes_trabajo WHERE servicio_id = ?)').run(id)
    db.prepare('DELETE FROM items_orden WHERE orden_id IN (SELECT id FROM ordenes_trabajo WHERE servicio_id = ?)').run(id)
    db.prepare('DELETE FROM ordenes_trabajo WHERE servicio_id = ?').run(id)
    db.prepare('DELETE FROM items_cotizacion WHERE cotizacion_id IN (SELECT id FROM cotizaciones WHERE servicio_id = ?)').run(id)
    db.prepare('DELETE FROM cotizaciones WHERE servicio_id = ?').run(id)
    db.prepare('DELETE FROM fotos_servicio WHERE servicio_id = ?').run(id)
    db.prepare('DELETE FROM servicios WHERE id = ?').run(id)
    return { ok: true }
  },

  // ── FOTOS ──────────────────────────────────────────────────────────────────
  'guardar-foto': ({ servicioId, nombre, datos }) => {
    const result = db.prepare(
      'INSERT INTO fotos_servicio (servicio_id, nombre, datos) VALUES (?, ?, ?)'
    ).run(servicioId, nombre, datos)
    return { id: result.lastInsertRowid }
  },

  'obtener-fotos': (servicioId) => {
    return db.prepare(
      'SELECT id, nombre, datos FROM fotos_servicio WHERE servicio_id = ? ORDER BY id ASC'
    ).all(servicioId)
  },

  'eliminar-foto': (id) => {
    db.prepare('DELETE FROM fotos_servicio WHERE id = ?').run(id)
    return { ok: true }
  },

  // ── ORDEN DE TRABAJO ───────────────────────────────────────────────────────
  'crear-orden': ({ servicioId }) => {
    const existing = db.prepare('SELECT id FROM ordenes_trabajo WHERE servicio_id = ?').get(servicioId)
    if (existing) return existing
    const result = db.prepare(
      'INSERT INTO ordenes_trabajo (servicio_id) VALUES (?)'
    ).run(servicioId)
    return { id: result.lastInsertRowid }
  },

  'obtener-orden': (servicioId) => {
    return db.prepare('SELECT * FROM ordenes_trabajo WHERE servicio_id = ?').get(servicioId)
  },

  'actualizar-orden': (id, { precio_mano_obra, conformidad, firma_data }) => {
    db.prepare(
      'UPDATE ordenes_trabajo SET precio_mano_obra = ?, conformidad = ?, firma_data = ? WHERE id = ?'
    ).run(precio_mano_obra ?? 0, conformidad ?? 0, firma_data ?? null, id)
    return { ok: true }
  },

  // ── ITEMS ORDEN ────────────────────────────────────────────────────────────
  'agregar-item-orden': ({ ordenId, descripcion, cantidad, precio_unitario }) => {
    const total = cantidad * precio_unitario
    const result = db.prepare(
      'INSERT INTO items_orden (orden_id, descripcion, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?)'
    ).run(ordenId, descripcion, cantidad, precio_unitario, total)
    return { id: result.lastInsertRowid, total }
  },

  'listar-items-orden': (ordenId) => {
    return db.prepare('SELECT * FROM items_orden WHERE orden_id = ? ORDER BY id ASC').all(ordenId)
  },

  'eliminar-item-orden': (id) => {
    db.prepare('DELETE FROM items_orden WHERE id = ?').run(id)
    return { ok: true }
  },

  // ── BITÁCORA ───────────────────────────────────────────────────────────────
  'agregar-bitacora': ({ ordenId, descripcion }) => {
    const result = db.prepare(
      'INSERT INTO bitacora (orden_id, descripcion) VALUES (?, ?)'
    ).run(ordenId, descripcion)
    return { id: result.lastInsertRowid }
  },

  'listar-bitacora': (ordenId) => {
    return db.prepare('SELECT * FROM bitacora WHERE orden_id = ? ORDER BY id ASC').all(ordenId)
  },

  'eliminar-bitacora': (id) => {
    db.prepare('DELETE FROM bitacora WHERE id = ?').run(id)
    return { ok: true }
  },

  // ── LISTAR ÓRDENES ────────────────────────────────────────────────────────
  'listar-ordenes': () => {
    return db.prepare(`
      SELECT o.id, o.precio_mano_obra, o.conformidad, o.created_at,
             s.id AS servicio_id, s.numero_servicio, s.estatus, s.falla,
             c.nombre, c.telefono,
             v.marca, v.modelo, v.placa, v.anio
      FROM ordenes_trabajo o
      JOIN servicios s ON s.id = o.servicio_id
      JOIN clientes  c ON c.id = s.cliente_id
      JOIN vehiculos v ON v.id = s.vehiculo_id
      ORDER BY o.id DESC
    `).all()
  },

  // ── COTIZACIONES ───────────────────────────────────────────────────────────
  'crear-cotizacion': ({ servicioId }) => {
    const existing = db.prepare('SELECT id FROM cotizaciones WHERE servicio_id = ?').get(servicioId)
    if (existing) return existing
    const result = db.prepare('INSERT INTO cotizaciones (servicio_id) VALUES (?)').run(servicioId)
    return { id: result.lastInsertRowid }
  },

  'obtener-cotizacion': (servicioId) => {
    return db.prepare('SELECT * FROM cotizaciones WHERE servicio_id = ?').get(servicioId)
  },

  // ── ITEMS COTIZACIÓN ───────────────────────────────────────────────────────
  'agregar-item-cotizacion': ({ cotizacionId, concepto, cantidad, precio }) => {
    const total = cantidad * precio
    const result = db.prepare(
      'INSERT INTO items_cotizacion (cotizacion_id, concepto, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)'
    ).run(cotizacionId, concepto, cantidad, precio, total)
    return { id: result.lastInsertRowid, total }
  },

  'listar-items-cotizacion': (cotizacionId) => {
    return db.prepare(
      'SELECT * FROM items_cotizacion WHERE cotizacion_id = ? ORDER BY id ASC'
    ).all(cotizacionId)
  },

  'eliminar-item-cotizacion': (id) => {
    db.prepare('DELETE FROM items_cotizacion WHERE id = ?').run(id)
    return { ok: true }
  },
}

module.exports = { initDatabase, dbHandlers }
