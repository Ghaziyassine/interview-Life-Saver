import { useEffect, useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const [overlayState, setOverlayState] = useState<any>(null)
  const [content, setContent] = useState('Hello Overlay!')
  const [opacity, setOpacity] = useState(1)
  const [clickThrough, setClickThrough] = useState(false)
  const [visible, setVisible] = useState(false)
  const [size, setSize] = useState({ width: 600, height: 200 })

  useEffect(() => {
    window.api.overlay.getState().then(setOverlayState)
    window.api.overlay.onContentUpdate((c) => setContent(c))
  }, [])

  const showOverlay = () => {
    window.api.overlay.show({ content, opacity, clickThrough, ...size })
    setVisible(true)
  }
  const hideOverlay = () => {
    window.api.overlay.hide()
    setVisible(false)
  }
  const updateContent = () => {
    window.api.overlay.updateContent(content)
  }
  const changeOpacity = (e) => {
    const v = parseFloat(e.target.value)
    setOpacity(v)
    window.api.overlay.setOpacity(v)
  }
  const changeSize = (e) => {
    const w = parseInt((document.getElementById('overlay-width') as HTMLInputElement).value)
    const h = parseInt((document.getElementById('overlay-height') as HTMLInputElement).value)
    setSize({ width: w, height: h })
    window.api.overlay.setSize({ width: w, height: h })
  }
  const toggleClickThrough = () => {
    window.api.overlay.setClickThrough(!clickThrough)
    setClickThrough(!clickThrough)
  }

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
      <div style={{ margin: '2em 0', padding: '1em', border: '1px solid #333', borderRadius: 8 }}>
        <h2>Overlay Controls</h2>
        <div>
          <button onClick={showOverlay} disabled={visible}>Show Overlay</button>
          <button onClick={hideOverlay} disabled={!visible}>Hide Overlay</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Content: <input value={content} onChange={e => setContent(e.target.value)} /></label>
          <button onClick={updateContent}>Update Content</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Opacity: <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={changeOpacity} /></label> {opacity}
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Width: <input id="overlay-width" type="number" min="100" max="1920" value={size.width} onChange={changeSize} /></label>
          <label> Height: <input id="overlay-height" type="number" min="50" max="1080" value={size.height} onChange={changeSize} /></label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label><input type="checkbox" checked={clickThrough} onChange={toggleClickThrough} /> Click-Through</label>
        </div>
      </div>
    </>
  )
}

export default App
