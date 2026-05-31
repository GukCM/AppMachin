const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('db', {
  // Servicios
  crearServicio:       (data) => ipcRenderer.invoke('crear-servicio', data),
  listarServicios:     ()     => ipcRenderer.invoke('listar-servicios'),
  obtenerServicio:     (id)   => ipcRenderer.invoke('obtener-servicio', id),
  actualizarEstatus:   (id, estatus) => ipcRenderer.invoke('actualizar-estatus', id, estatus),
  eliminarServicio:    (id)   => ipcRenderer.invoke('eliminar-servicio', id),

  // Fotos
  guardarFoto:         (data) => ipcRenderer.invoke('guardar-foto', data),
  obtenerFotos:        (servicioId) => ipcRenderer.invoke('obtener-fotos', servicioId),
  eliminarFoto:        (id)   => ipcRenderer.invoke('eliminar-foto', id),

  // Listado de órdenes
  listarOrdenes:       ()     => ipcRenderer.invoke('listar-ordenes'),

  // Guardar PDF via diálogo nativo
  guardarPDF: (data) => ipcRenderer.invoke('guardar-pdf', data),

  // Orden de trabajo
  crearOrden:          (data) => ipcRenderer.invoke('crear-orden', data),
  obtenerOrden:        (servicioId) => ipcRenderer.invoke('obtener-orden', servicioId),
  actualizarOrden:     (id, data)   => ipcRenderer.invoke('actualizar-orden', id, data),

  // Items de orden
  agregarItemOrden:    (data) => ipcRenderer.invoke('agregar-item-orden', data),
  listarItemsOrden:    (ordenId) => ipcRenderer.invoke('listar-items-orden', ordenId),
  eliminarItemOrden:   (id)   => ipcRenderer.invoke('eliminar-item-orden', id),

  // Bitácora
  agregarBitacora:     (data) => ipcRenderer.invoke('agregar-bitacora', data),
  listarBitacora:      (ordenId) => ipcRenderer.invoke('listar-bitacora', ordenId),
  eliminarBitacora:    (id)   => ipcRenderer.invoke('eliminar-bitacora', id),

  // Cotizaciones
  crearCotizacion:     (data) => ipcRenderer.invoke('crear-cotizacion', data),
  obtenerCotizacion:   (servicioId) => ipcRenderer.invoke('obtener-cotizacion', servicioId),

  // Items de cotización
  agregarItemCotizacion:  (data) => ipcRenderer.invoke('agregar-item-cotizacion', data),
  listarItemsCotizacion:  (cotizacionId) => ipcRenderer.invoke('listar-items-cotizacion', cotizacionId),
  eliminarItemCotizacion: (id)   => ipcRenderer.invoke('eliminar-item-cotizacion', id),
})
