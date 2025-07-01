import { app, shell, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Overlay window logic (merged from overlay.ts)
let overlayWindow: BrowserWindow | null = null
function createOverlayWindow(options: {
  content?: string
  opacity?: number
  clickThrough?: boolean
  width?: number
  height?: number
  x?: number
  y?: number
  displayId?: number
} = {}): BrowserWindow {
  if (overlayWindow) {
    overlayWindow.close()
    overlayWindow = null
  }
  let display = screen.getPrimaryDisplay()
  if (options.displayId) {
    const found = screen.getAllDisplays().find(d => d.id === options.displayId)
    if (found) display = found
  }
  overlayWindow = new BrowserWindow({
    width: options.width || 600,
    height: options.height || 200,
    x: options.x ?? display.bounds.x + 100,
    y: options.y ?? display.bounds.y + 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: !options.clickThrough,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  if (options.clickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  }
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'].replace(/\/?$/, '/overlay.html'))
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'))
  }
  if (options.opacity !== undefined) {
    overlayWindow.setOpacity(options.opacity)
  }
  if (options.clickThrough) {
    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    overlayWindow.setVisibleOnAllWorkspaces(true)
    overlayWindow.setFocusable(false)
  } else {
    overlayWindow.setFocusable(true)
  }
  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
  return overlayWindow
}
function getOverlayWindow() {
  return overlayWindow
}

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

// Add IPC handlers for main window control
let mainWindowRef: BrowserWindow | null = null;
let mainClickThrough = false; // Track click-through state

function toggleMainClickThrough() {
  if (mainWindowRef) {
    mainClickThrough = !mainClickThrough;
    mainWindowRef.setIgnoreMouseEvents(mainClickThrough, { forward: true });
    // Notify renderer of the new state
    mainWindowRef.webContents.send('main:click-through-toggled', mainClickThrough);
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 420, // Enforce minimum width
    show: false,
    autoHideMenuBar: true,
    transparent: true, // Make window background transparent
    frame: false,      // Remove window frame for overlay look
    alwaysOnTop: true, // Ensure window is always on top
    // Optionally, use 'screen-saver' level for highest priority
    // alwaysOnTop: true, level: 'screen-saver',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindowRef = mainWindow;

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

  // Register global shortcut for Alt+Shift+O to toggle click-through
  globalShortcut.register('Alt+Shift+O', () => {
    toggleMainClickThrough();
  });

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.on('main:set-opacity', (_e, opacity) => {
  if (mainWindowRef) mainWindowRef.setOpacity(opacity);
});
ipcMain.on('main:set-size', (_e, { width, height }) => {
  // Prevent window width from being set below 420px (control bar min width)
  const minWidth = 420;
  const safeWidth = Math.max(width, minWidth);
  if (mainWindowRef) mainWindowRef.setSize(safeWidth, height);
});
ipcMain.on('main:set-click-through', (_e, clickThrough) => {
  if (mainWindowRef) mainWindowRef.setIgnoreMouseEvents(!!clickThrough, { forward: true });
  mainClickThrough = !!clickThrough;
  if (mainWindowRef) mainWindowRef.webContents.send('main:click-through-toggled', mainClickThrough);
});

// Handle close app from renderer
ipcMain.on('main:close-app', () => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (win) win.close()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
