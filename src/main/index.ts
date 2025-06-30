import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createOverlayWindow, getOverlayWindow } from './overlay'
import { screen } from 'electron'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Overlay IPC handlers
let overlayContent = 'Overlay'
let overlayOptions = {
  opacity: 1,
  clickThrough: false,
  width: 600,
  height: 200,
  x: undefined as number | undefined,
  y: undefined as number | undefined,
  displayId: undefined as number | undefined
}

ipcMain.on('overlay:show', (_e, opts) => {
  overlayOptions = { ...overlayOptions, ...opts }
  const win = createOverlayWindow({ ...overlayOptions, content: overlayContent })
  win.webContents.send('overlay:update-content', overlayContent)
})
ipcMain.on('overlay:hide', () => {
  const win = getOverlayWindow()
  if (win) win.close()
})
ipcMain.on('overlay:update-content', (_e, content) => {
  overlayContent = content
  const win = getOverlayWindow()
  if (win) win.webContents.send('overlay:update-content', overlayContent)
})
ipcMain.on('overlay:move', (_e, { x, y, displayId }) => {
  overlayOptions = { ...overlayOptions, x, y, displayId }
  const win = getOverlayWindow()
  if (win) {
    if (displayId) {
      const display = screen.getAllDisplays().find(d => d.id === displayId)
      if (display) win.setBounds({ x: display.bounds.x + (x ?? 100), y: display.bounds.y + (y ?? 100) })
    } else {
      win.setPosition(x ?? 100, y ?? 100)
    }
  }
})
ipcMain.on('overlay:set-opacity', (_e, opacity) => {
  overlayOptions.opacity = opacity
  const win = getOverlayWindow()
  if (win) win.setOpacity(opacity)
})
ipcMain.on('overlay:set-size', (_e, { width, height }) => {
  overlayOptions = { ...overlayOptions, width, height }
  const win = getOverlayWindow()
  if (win) win.setSize(width, height)
})
ipcMain.on('overlay:set-click-through', (_e, clickThrough) => {
  overlayOptions.clickThrough = clickThrough
  const win = getOverlayWindow()
  if (win) win.setIgnoreMouseEvents(!!clickThrough, { forward: true })
})

// Optionally, send overlay state to renderer
ipcMain.handle('overlay:get-state', () => ({
  visible: !!getOverlayWindow(),
  content: overlayContent,
  ...overlayOptions
}))

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
