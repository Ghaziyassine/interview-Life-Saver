import 'dotenv/config';
import { app, shell, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// Import the config file
import { CONFIG } from './config'
// Tray icon reference
let tray: Tray | null = null;
import fetch from 'node-fetch';
// Import native addon for window display affinity
// Define interface for the native addon
interface WindowUtils {
  WDA_NONE: number;
  WDA_MONITOR: number;
  WDA_EXCLUDEFROMCAPTURE: number;
  hideFromCapture: (handle: number) => boolean;
  showInCapture: (handle: number) => boolean;
  getDisplayAffinity: (handle: number) => number;
  setWindowDisplayAffinity: (handle: number, affinity: number) => boolean;
  resetWindowDisplayAffinity: (handle: number) => boolean;
}

// Try to load the native addon module with proper error handling
let windowUtils: WindowUtils | null = null;
try {
  if (process.platform === 'win32') {
    windowUtils = require('window-utils') as WindowUtils;
    console.log('Screen capture protection module loaded successfully.');
  }
} catch (err: any) {
  console.error('Failed to load screen capture protection module:', err.message);
  console.warn('Screen capture protection will not be available.');
}

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
let mainStealth = false; // Track stealth state

function toggleMainClickThrough() {
  if (mainWindowRef) {
    mainClickThrough = !mainClickThrough;
    mainWindowRef.setIgnoreMouseEvents(mainClickThrough, { forward: true });
    // Notify renderer of the new state
    mainWindowRef.webContents.send('main:click-through-toggled', mainClickThrough);
  }
}

function toggleMainStealth() {
  if (mainWindowRef) {
    mainStealth = !mainStealth;
    mainWindowRef.webContents.send('main:stealth-toggled', mainStealth);
  }
}

function createWindow(): void {
  // Create the browser window.
  const { height } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow: BrowserWindow = new BrowserWindow({
    width: 600, // Set width to 440px
    height: height, // Set height to full available height
    minWidth: 600, // Enforce minimum width
    minHeight: 420, // Enforce minimum height
    x: 0, // Position at the left edge
    y: 0, // Position at the top
    show: false,
    autoHideMenuBar: true,
    transparent: true, // Make window background transparent
    frame: false,      // Remove window frame for overlay look
    alwaysOnTop: true, // Ensure window is always on top
    skipTaskbar: true, // Hide from app switcher (Windows/Linux)
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  // Hide from app switcher on macOS
  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setSkipTaskbar(true);
    // Electron does not have setExcludedFromShownWindowsMenu, so we skip this for now
  }

  mainWindowRef = mainWindow;

  // Show window by default
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    
    // Hide window from screen capture (Windows only)
    if (process.platform === 'win32' && windowUtils) {
      // Small delay to ensure the window is fully created and ready
      setTimeout(() => {
        hideWindowFromCapture(mainWindow);
      }, 500);
    }
  });

  // Create tray icon if not already created
  if (!tray) {
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (mainWindowRef) {
            mainWindowRef.show();
            mainWindowRef.focus();
            // Re-enable screen capture protection when shown via tray menu
            if (process.platform === 'win32' && windowUtils) {
              setTimeout(() => {
                if (mainWindowRef) {
                  hideWindowFromCapture(mainWindowRef);
                }
              }, 100);
            }
          }
        }
      },
      {
        label: 'Hide App',
        click: () => {
          if (mainWindowRef) {
            mainWindowRef.hide();
            // Disable screen capture protection when hidden via tray menu
            if (process.platform === 'win32' && windowUtils) {
              showWindowInCapture(mainWindowRef);
            }
          }
        }
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);
    tray.setToolTip('Electron App');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindowRef) {
        if (mainWindowRef.isVisible()) {
          mainWindowRef.hide();
          // Disable screen capture protection when hidden via tray
          if (process.platform === 'win32' && windowUtils) {
            showWindowInCapture(mainWindowRef);
          }
        } else {
          mainWindowRef.show();
          mainWindowRef.focus();
          // Re-enable screen capture protection when shown via tray
          if (process.platform === 'win32' && windowUtils && mainWindowRef) {
            setTimeout(() => {
              if (mainWindowRef) {
                hideWindowFromCapture(mainWindowRef);
              }
            }, 100);
          }
        }
      }
    });
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Hide from taskbar only when minimized
  mainWindow.on('minimize' as any, (event: Electron.Event) => {
    event.preventDefault();
    mainWindow.hide();
    
    // Disable screen capture protection when minimized (Windows only)
    if (process.platform === 'win32' && windowUtils) {
      showWindowInCapture(mainWindow);
    }
  });

  // Re-enable screen capture protection when window is shown/focused
  mainWindow.on('show', () => {
    if (process.platform === 'win32' && windowUtils) {
      // Small delay to ensure the window is fully shown
      setTimeout(() => {
        hideWindowFromCapture(mainWindow);
      }, 100);
    }
  });

  mainWindow.on('focus', () => {
    if (process.platform === 'win32' && windowUtils) {
      hideWindowFromCapture(mainWindow);
    }
  });
  // Track if app is quitting to allow real close
  let isQuitting = false;
  app.on('before-quit', () => {
    isQuitting = true;
  });
  mainWindow.on('close', (_event: Electron.Event) => {
    if (!isQuitting) {
      // Only hide on minimize, allow close
      // Note: if you want to prevent closing, use:
      // event.preventDefault();
    }
  });

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

  // Register global shortcut for Alt+Shift+S to toggle Stealth Mode
  globalShortcut.register('Alt+Shift+i', () => {
    toggleMainStealth();
  });

  // Register global shortcuts for Ctrl+Arrow keys to move window
  const moveStep = 50;
  globalShortcut.register('Control+Up', () => {
    if (mainWindowRef) {
      const [x, y] = mainWindowRef.getPosition();
      mainWindowRef.setPosition(x, y - moveStep);
    }
  });
  globalShortcut.register('Control+Down', () => {
    if (mainWindowRef) {
      const [x, y] = mainWindowRef.getPosition();
      mainWindowRef.setPosition(x, y + moveStep);
    }
  });
  globalShortcut.register('Control+Left', () => {
    if (mainWindowRef) {
      const [x, y] = mainWindowRef.getPosition();
      mainWindowRef.setPosition(x - moveStep, y);
    }
  });
  globalShortcut.register('Control+Right', () => {
    if (mainWindowRef) {
      const [x, y] = mainWindowRef.getPosition();
      mainWindowRef.setPosition(x + moveStep, y);
    }
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

// Gemini LLM handler (using Google Generative Language API)

// Screenshot handler: hides all app windows, takes screenshot, restores windows
import { desktopCapturer } from 'electron';
ipcMain.handle('overlay:take-screenshot', async () => {
  // Get primary display
  const display = screen.getPrimaryDisplay();
  
  // Use desktopCapturer to get screen sources
  const sources = await desktopCapturer.getSources({ 
    types: ['screen'], 
    thumbnailSize: { width: display.size.width, height: display.size.height } 
  });
  
  // Find the source for the primary display
  let screenSource = sources.find(src => src.display_id == String(display.id));
  if (!screenSource) {
    // fallback: use first source
    screenSource = sources[0];
  }
  
  let imageBase64: string | null = null;
  if (screenSource) {
    const image = screenSource.thumbnail;
    imageBase64 = image.toPNG().toString('base64');
  }
  
  if (imageBase64) {
    return { success: true, base64: imageBase64, mime: 'image/png' };
  } else {
    return { success: false, error: 'Could not capture screenshot.' };
  }
});
// Store the current Gemini model (defaulting to gemini-2.5-flash)
let GEMINI_MODEL = 'gemini-2.5-flash';

// IPC handler to set the Gemini model
ipcMain.handle('chatbot:set-model', (_event, model: string) => {
  // Validate model is one of the allowed free tier models
  const allowedModels = [
    
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ];
  
  if (allowedModels.includes(model)) {
    GEMINI_MODEL = model;
    return { success: true, model: GEMINI_MODEL };
  } else {
    return { success: false, error: 'Invalid model specified', model: GEMINI_MODEL };
  }
});

// IPC handler to get the current Gemini model
ipcMain.handle('chatbot:get-model', () => {
  return { model: GEMINI_MODEL };
});

ipcMain.handle('chatbot:ask-mcp', async (_event, payload: any) => {
  const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not set in environment variable GEMINI_API_KEY.' };
  }
  try {
    // If payload is a string, treat as text prompt (backward compatible)
    let body;
    if (typeof payload === 'string') {
      body = {
        contents: [{ parts: [{ text: payload }] }]
      };
    } else if (payload && typeof payload === 'object' && payload.contents) {
      // If payload is already a Gemini request (with contents/parts), send as-is
      body = payload;
    } else {
      return { success: false, error: 'Invalid request format.' };
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );
    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Gemini API error: ${res.status} ${res.statusText} - ${errorText}` };
    }
    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    return { success: true, answer };
  } catch (err) {
    let errorMsg = 'Unknown error';
    if (err && typeof err === 'object' && 'message' in err) {
      errorMsg = (err as any).message;
    } else {
      errorMsg = String(err);
    }
    return { success: false, error: errorMsg };
  }
});

// Handle close app from renderer
ipcMain.on('main:close-app', () => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (win) win.close()
})

// Function to hide a window from screen capture (only works on Windows)
function hideWindowFromCapture(window: BrowserWindow): boolean {
  if (process.platform !== 'win32' || !windowUtils) {
    console.log('hideWindowFromCapture: Not supported on this platform');
    return false;
  }
  
  try {
    const handle = window.getNativeWindowHandle().readUInt32LE(0);
    const result = windowUtils.hideFromCapture(handle);
    console.log(`Window hidden from screen capture: ${result ? 'Success' : 'Failed'}`);
    return result;
  } catch (err) {
    console.error('Failed to hide window from screen capture:', err);
    return false;
  }
}

// Function to show window in screen capture again (revert to normal)
function showWindowInCapture(window: BrowserWindow): boolean {
  if (process.platform !== 'win32' || !windowUtils) {
    console.log('showWindowInCapture: Not supported on this platform');
    return false;
  }
  
  try {
    const handle = window.getNativeWindowHandle().readUInt32LE(0);
    const result = windowUtils.showInCapture(handle);
    console.log(`Window capture protection removed: ${result ? 'Success' : 'Failed'}`);
    return result;
  } catch (err) {
    console.error('Failed to show window in screen capture:', err);
    return false;
  }
}

// IPC handlers for screen capture visibility control
ipcMain.handle('main:hide-from-capture', () => {
  if (mainWindowRef) {
    return hideWindowFromCapture(mainWindowRef);
  }
  return false;
});

ipcMain.handle('main:show-in-capture', () => {
  if (mainWindowRef) {
    return showWindowInCapture(mainWindowRef);
  }
  return false;
});

ipcMain.handle('main:get-capture-state', () => {
  if (process.platform !== 'win32' || !windowUtils || !mainWindowRef) {
    return { supported: false };
  }
  
  try {
    const handle = mainWindowRef.getNativeWindowHandle().readUInt32LE(0);
    const affinity = windowUtils.getDisplayAffinity(handle);
    return { 
      supported: true,
      hidden: affinity === windowUtils.WDA_EXCLUDEFROMCAPTURE,
      affinity
    };
  } catch (err) {
    console.error('Failed to get window capture state:', err);
    return { 
      supported: true, 
      error: String(err),
      hidden: false
    };
  }
});

// Handle minimize app from renderer
ipcMain.on('main:minimize', () => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (win) {
    win.minimize()
    // Disable screen capture protection when minimized via renderer
    if (process.platform === 'win32' && windowUtils) {
      showWindowInCapture(win);
    }
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
