import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'

let overlayWindow: BrowserWindow | null = null

export function createOverlayWindow(options: {
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

  // Determine display
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

  overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'))

  if (options.opacity !== undefined) {
    overlayWindow.setOpacity(options.opacity)
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })

  return overlayWindow
}

export function getOverlayWindow() {
  return overlayWindow
}
