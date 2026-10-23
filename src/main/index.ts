import 'dotenv/config';
import { app, shell, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
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
// Store the current LLM model (defaulting to 'auto')
let LLM_MODEL = 'auto';

// IPC handler to set the LLM model
ipcMain.handle('chatbot:set-model', (_event, model: string) => {
  if (model && typeof model === 'string' && model.trim().length > 0) {
    LLM_MODEL = model.trim();
    return { success: true, model: LLM_MODEL };
  } else {
    return { success: false, error: 'Invalid model specified', model: LLM_MODEL };
  }
});

// IPC handler to get the current LLM model
ipcMain.handle('chatbot:get-model', () => {
  return { model: LLM_MODEL };
});

// --- User-configured API key (persisted to userData) ---
const API_KEY_FILE = join(app.getPath('userData'), 'api-key.json');
const GEMINI_API_KEY_FILE = join(app.getPath('userData'), 'gemini-api-key.json');
const LLM_HOST_FILE = join(app.getPath('userData'), 'llm-host.json');

function loadApiKey(): string {
  try {
    if (existsSync(API_KEY_FILE)) {
      const data = JSON.parse(readFileSync(API_KEY_FILE, 'utf-8'));
      return data.apiKey || '';
    }
  } catch (err) {
    console.error('Failed to load API key:', err);
  }
  return '';
}

function saveApiKey(key: string): void {
  try {
    writeFileSync(API_KEY_FILE, JSON.stringify({ apiKey: key }), 'utf-8');
  } catch (err) {
    console.error('Failed to save API key:', err);
  }
}

function loadGeminiApiKey(): string {
  try {
    if (existsSync(GEMINI_API_KEY_FILE)) {
      const data = JSON.parse(readFileSync(GEMINI_API_KEY_FILE, 'utf-8'));
      return data.apiKey || '';
    }
  } catch (err) {
    console.error('Failed to load Gemini API key:', err);
  }
  return '';
}

function saveGeminiApiKey(key: string): void {
  try {
    writeFileSync(GEMINI_API_KEY_FILE, JSON.stringify({ apiKey: key }), 'utf-8');
  } catch (err) {
    console.error('Failed to save Gemini API key:', err);
  }
}

function loadLLMHost(): string {
  try {
    if (existsSync(LLM_HOST_FILE)) {
      const data = JSON.parse(readFileSync(LLM_HOST_FILE, 'utf-8'));
      return data.llmHost || '';
    }
  } catch (err) {
    console.error('Failed to load LLM host:', err);
  }
  return '';
}

function saveLLMHost(host: string): void {
  try {
    writeFileSync(LLM_HOST_FILE, JSON.stringify({ llmHost: host }), 'utf-8');
  } catch (err) {
    console.error('Failed to save LLM host:', err);
  }
}

let USER_API_KEY = loadApiKey();
let USER_GEMINI_API_KEY = loadGeminiApiKey();
let USER_LLM_HOST = loadLLMHost();

function getEffectiveApiKey(): string {
  if (CONFIG.LLM_API_KEY && CONFIG.LLM_API_KEY.trim() && CONFIG.LLM_API_KEY !== 'your_api_key_here') {
    return CONFIG.LLM_API_KEY.trim();
  }
  if (USER_API_KEY && USER_API_KEY.trim() && USER_API_KEY !== 'your_api_key_here') {
    return USER_API_KEY.trim();
  }
  if (USER_GEMINI_API_KEY && USER_GEMINI_API_KEY.trim() && USER_GEMINI_API_KEY !== 'your_api_key_here') {
    return USER_GEMINI_API_KEY.trim();
  }
  if (CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.trim() && CONFIG.GEMINI_API_KEY !== 'your_api_key_here') {
    return CONFIG.GEMINI_API_KEY.trim();
  }
  return '';
}

function getEffectiveGeminiApiKey(): string {
  if (CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.trim() && CONFIG.GEMINI_API_KEY !== 'your_api_key_here') {
    return CONFIG.GEMINI_API_KEY.trim();
  }
  if (USER_GEMINI_API_KEY && USER_GEMINI_API_KEY.trim() && USER_GEMINI_API_KEY !== 'your_api_key_here') {
    return USER_GEMINI_API_KEY.trim();
  }
  return '';
}

function getEffectiveLLMHost(): string {
  if (USER_LLM_HOST && USER_LLM_HOST.trim() && USER_LLM_HOST !== 'your_llm_host_here') {
    return USER_LLM_HOST.trim();
  }
  return CONFIG.LLM_HOST || 'http://127.0.0.1:31415';
}

// IPC handler to set the API key (for Free LLM)
ipcMain.handle('chatbot:set-api-key', (_event, apiKey: string) => {
  USER_API_KEY = apiKey.trim();
  saveApiKey(USER_API_KEY);
  return { success: true };
});

// IPC handler to set the Gemini API key
ipcMain.handle('chatbot:set-gemini-api-key', (_event, apiKey: string) => {
  USER_GEMINI_API_KEY = apiKey.trim();
  saveGeminiApiKey(USER_GEMINI_API_KEY);
  return { success: true };
});

// IPC handler to get the API key (masked for security)
ipcMain.handle('chatbot:get-api-key', () => {
  const key = getEffectiveApiKey();
  if (!key) return { hasKey: false, maskedKey: '' };
  const masked = key.length > 8
    ? key.slice(0, 4) + '\u2022'.repeat(key.length - 8) + key.slice(-4)
    : '\u2022'.repeat(key.length);
  return { hasKey: true, maskedKey: masked };
});

// IPC handler to get the Gemini API key (masked for security)
ipcMain.handle('chatbot:get-gemini-api-key', () => {
  const key = getEffectiveGeminiApiKey();
  if (!key) return { hasKey: false, maskedKey: '' };
  const masked = key.length > 8
    ? key.slice(0, 4) + '\u2022'.repeat(key.length - 8) + key.slice(-4)
    : '\u2022'.repeat(key.length);
  return { hasKey: true, maskedKey: masked };
});

// IPC handler to set the LLM host
ipcMain.handle('chatbot:set-llm-host', (_event, llmHost: string) => {
  USER_LLM_HOST = llmHost.trim();
  saveLLMHost(USER_LLM_HOST);
  return { success: true };
});

// IPC handler to get the LLM host
ipcMain.handle('chatbot:get-llm-host', () => {
  const host = getEffectiveLLMHost();
  return { host };
});

// Helper to check if model is a Gemini model
function isGeminiModel(model: string): boolean {
  return model.startsWith('gemini-');
}

// Helper to call Google Gemini API
async function callGeminiAPI(model: string, messages: any[], apiKey: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert OpenAI messages format to Gemini format
  const contents = messages.map(msg => {
    const parts: any[] = [];
    if (msg.content) {
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url') {
            // Extract base64 from data URL
            const url = part.image_url?.url;
            if (url && url.startsWith('data:')) {
              const [mimePart, base64] = url.split(',');
              const mimeType = mimePart.replace('data:', '').replace(';base64', '');
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64
                }
              });
            }
          }
        }
      }
    }
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts
    };
  });

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { success: false, error: `Gemini API error: ${res.status} ${res.statusText} - ${errorText}` };
  }

  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

  return { success: true, answer };
}

ipcMain.handle('chatbot:ask-mcp', async (_event, payload: any) => {
  const LLM_HOST = getEffectiveLLMHost().replace(/\/+$/, '');
  const LLM_API_KEY = getEffectiveApiKey();
  const GEMINI_API_KEY = getEffectiveGeminiApiKey();

  try {
    let messages: any[] = [];
    let model = LLM_MODEL || 'auto';

    if (typeof payload === 'string') {
      messages = [{ role: 'user', content: payload }];
    } else if (Array.isArray(payload)) {
      messages = payload;
    } else if (payload && typeof payload === 'object') {
      if (payload.messages) {
        messages = payload.messages;
        if (payload.model) model = payload.model;
      } else if (payload.contents) {
        // Fallback for Gemini structure: contents -> parts
        messages = payload.contents.map((item: any) => {
          const parts = item.parts || [];
          const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
          const imageParts = parts.filter((p: any) => p.inlineData).map((p: any) => ({
            type: 'image_url',
            image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` }
          }));

          if (imageParts.length > 0) {
            const content: any[] = [];
            if (textParts) content.push({ type: 'text', text: textParts });
            content.push(...imageParts);
            return [{ role: 'user', content }];
          }
          return [{ role: 'user', content: textParts }];
        });
      } else {
        return { success: false, error: 'Invalid request format.' };
      }
    } else {
      return { success: false, error: 'Invalid request payload.' };
    }

    // If model is "auto", use the default model for the current API type
    if (model === 'auto') {
      model = 'auto';
    }

    // Check if we should use Gemini API
    const useGemini = isGeminiModel(model);

    if (useGemini) {
      if (!GEMINI_API_KEY) {
        return { success: false, error: 'No Gemini API key configured. Please add a Gemini API key in settings.' };
      }
      return await callGeminiAPI(model, messages, GEMINI_API_KEY);
    }

    // Use Free LLM (OpenAI-compatible) API
    if (!LLM_API_KEY) {
      return { success: false, error: 'No Free LLM API key configured. Please add an API key in settings.' };
    }

    const endpoint = `${LLM_HOST}/v1/chat/completions`;
    const body = {
      model,
      messages
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (LLM_API_KEY) {
      headers['Authorization'] = `Bearer ${LLM_API_KEY}`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Local LLM API error: ${res.status} ${res.statusText} - ${errorText}` };
    }

    const data = await res.json();
    const answer =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      (typeof data?.choices?.[0]?.message === 'string' ? data.choices[0].message : null) ||
      'No response';

    return { success: true, answer };
  } catch (err: any) {
    let errorMsg = 'Unknown error';
    if (err && typeof err === 'object' && 'message' in err) {
      errorMsg = err.message;
    } else {
      errorMsg = String(err);
    }
    return { success: false, error: errorMsg };
  }
});

ipcMain.handle('chatbot:transcribe-audio', async (_event, data: { audioBuffer: string; mimeType: string }) => {
  const LLM_HOST = getEffectiveLLMHost().replace(/\/+$/, '');
  const LLM_API_KEY = getEffectiveApiKey();
  const endpoint = `${LLM_HOST}/v1/audio/transcriptions`;

  // Debug logging
  console.log('[Transcription] Endpoint:', endpoint);
  console.log('[Transcription] Has API key:', !!LLM_API_KEY);
  console.log('[Transcription] API key preview:', LLM_API_KEY ? `${LLM_API_KEY.slice(0, 8)}...` : 'none');

  try {
    // Expect base64 string from renderer
    const buffer = Buffer.from(data.audioBuffer, 'base64');
    console.log('[Transcription] Audio buffer size:', buffer.length, 'bytes');

    // Manually construct multipart/form-data to avoid Node.js fetch + FormData + headers bug
    // Node.js undici fetch breaks multipart boundary when headers object is passed with FormData
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15);
    const CRLF = '\r\n';

    // model field
    const modelPart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="model"${CRLF}${CRLF}` +
      `auto${CRLF}`;

    // file field
    const fileHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="speech.webm"${CRLF}` +
      `Content-Type: audio/webm${CRLF}${CRLF}`;

    const fileFooter = CRLF;
    const closingBoundary = `--${boundary}--${CRLF}`;

    // Build complete body as Buffer
    const bodyBuffers = [
      Buffer.from(modelPart, 'utf-8'),
      Buffer.from(fileHeader, 'utf-8'),
      buffer,
      Buffer.from(fileFooter, 'utf-8'),
      Buffer.from(closingBoundary, 'utf-8')
    ];

    const fullBody = Buffer.concat(bodyBuffers);
    console.log('[Transcription] Multipart body size:', fullBody.length, 'bytes, boundary:', boundary);

    // Send with manually set Content-Type including boundary, plus Authorization header
    const headers: Record<string, string> = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    };

    if (LLM_API_KEY && LLM_API_KEY.length > 0) {
      headers['Authorization'] = `Bearer ${LLM_API_KEY}`;
      console.log('[Transcription] Adding Authorization header with manual multipart');
    }

    console.log('[Transcription] Sending request with manual multipart...');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: fullBody
    });

    console.log('[Transcription] Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Transcription] Error response:', errorText);
      let detailedError = `Transcription API error: ${res.status} ${res.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          detailedError += ` - ${errorJson.error.message}`;
        } else if (errorJson?.message) {
          detailedError += ` - ${errorJson.message}`;
        } else {
          detailedError += ` - ${errorText}`;
        }
      } catch {
        detailedError += ` - ${errorText}`;
      }

      return { success: false, error: detailedError };
    }

    const result = await res.json();
    console.log('[Transcription] Success:', !!result?.text);
    const text = result?.text || result?.transcript || '';
    return { success: true, text };
  } catch (err: any) {
    console.error('[Transcription] Network/connection error:', err);
    return { success: false, error: `Network/connection error: ${err?.message || String(err)}` };
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

// ─── WebSocket Room Mode (connection managed in main process) ───
import WebSocket from 'ws';

let roomSocket: WebSocket | null = null;
let roomReconnectAttempts = 0;
const ROOM_MAX_RECONNECT = 5;
let roomReconnectTimer: ReturnType<typeof setTimeout> | null = null;

function sendToRenderer(channel: string, data: any) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send(channel, data);
  }
}

function handleRoomMessage(raw: string) {
  try {
    const message = JSON.parse(raw);
    sendToRenderer('room:message', message);
  } catch (err) {
    console.error('Room WS parse error:', err);
  }
}

function roomAttemptReconnect() {
  if (roomReconnectAttempts >= ROOM_MAX_RECONNECT) {
    sendToRenderer('room:message', { type: 'error', error: 'Max reconnect attempts reached' });
    return;
  }
  roomReconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, roomReconnectAttempts), 16000);
  roomReconnectTimer = setTimeout(() => {
    roomConnect();
  }, delay);
}

function roomConnect() {
  if (roomSocket && roomSocket.readyState === WebSocket.OPEN) return;

  const url = CONFIG.WS_URL;
  sendToRenderer('room:status', 'connecting');

  try {
    roomSocket = new WebSocket(url);

    roomSocket.on('open', () => {
      roomReconnectAttempts = 0;
      sendToRenderer('room:status', 'connected');
    });

    roomSocket.on('message', (data) => {
      handleRoomMessage(data.toString());
    });

    roomSocket.on('close', () => {
      sendToRenderer('room:status', 'disconnected');
      roomAttemptReconnect();
    });

    roomSocket.on('error', (err) => {
      console.error('Room WS error:', err.message);
    });
  } catch (err) {
    console.error('Room WS connect failed:', err);
    sendToRenderer('room:status', 'disconnected');
    roomAttemptReconnect();
  }
}

function roomDisconnect() {
  if (roomReconnectTimer) {
    clearTimeout(roomReconnectTimer);
    roomReconnectTimer = null;
  }
  roomReconnectAttempts = ROOM_MAX_RECONNECT; // stop auto-reconnect
  if (roomSocket) {
    roomSocket.close();
    roomSocket = null;
  }
  sendToRenderer('room:status', 'disconnected');
}

function roomSend(msg: any) {
  if (roomSocket && roomSocket.readyState === WebSocket.OPEN) {
    roomSocket.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

// Keep-alive ping
setInterval(() => {
  if (roomSocket && roomSocket.readyState === WebSocket.OPEN) {
    roomSocket.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// IPC handlers for room mode
ipcMain.handle('room:connect', () => {
  roomReconnectAttempts = 0;
  roomConnect();
  return { success: true };
});

ipcMain.handle('room:disconnect', () => {
  roomDisconnect();
  return { success: true };
});

ipcMain.handle('room:send', (_event, msg: any) => {
  const ok = roomSend(msg);
  return { success: ok };
});

ipcMain.handle('room:get-status', () => {
  if (roomSocket && roomSocket.readyState === WebSocket.OPEN) return 'connected';
  if (roomSocket && roomSocket.readyState === WebSocket.CONNECTING) return 'connecting';
  return 'disconnected';
});
