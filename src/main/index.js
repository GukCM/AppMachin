const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const fs   = require('fs')
const { initDatabase, dbHandlers } = require('./database')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0a',
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function registerIpcHandlers() {
  // Handlers de base de datos
  Object.entries(dbHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, (_event, ...args) => handler(...args))
  })

  // Guardar PDF con diálogo nativo de Windows
  ipcMain.handle('guardar-pdf', async (_event, { nombre, bytes }) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Guardar PDF',
      defaultPath: path.join(app.getPath('documents'), nombre),
      filters: [{ name: 'Documento PDF', extensions: ['pdf'] }],
      buttonLabel: 'Guardar',
    })

    if (canceled || !filePath) return { ok: false }

    try {
      fs.writeFileSync(filePath, Buffer.from(bytes))
      shell.openPath(filePath)
      return { ok: true, path: filePath }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })
}
