import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron'

const overlayAPI = {
  show: (opts) => ipcRenderer.send('overlay:show', opts),
  hide: () => ipcRenderer.send('overlay:hide'),
  updateContent: (content) => ipcRenderer.send('overlay:update-content', content),
  move: (args) => ipcRenderer.send('overlay:move', args),
  setOpacity: (opacity) => ipcRenderer.send('overlay:set-opacity', opacity),
  setSize: (size) => ipcRenderer.send('overlay:set-size', size),
  setClickThrough: (clickThrough) => ipcRenderer.send('overlay:set-click-through', clickThrough),
  getState: () => ipcRenderer.invoke('overlay:get-state'),
  onContentUpdate: (cb) => ipcRenderer.on('overlay:update-content', (_e, content) => cb(content)),
}

// Custom APIs for renderer
const api = {
  overlay: overlayAPI
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
