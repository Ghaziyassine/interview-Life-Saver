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

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div
        style={{
          position: 'fixed',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(30, 30, 40, 0.85)',
          borderRadius: 16,
          boxShadow: '0 4px 32px #0008',
          padding: '0.5em 1.5em',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          backdropFilter: 'blur(8px)',
          border: '1.5px solid #444',
          minWidth: 420,
        }}
      >
        <button
          title={visible ? 'Hide Overlay' : 'Show Overlay'}
          onClick={visible ? hideOverlay : showOverlay}
          style={{
            background: visible ? '#2d8cff' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5em 1em',
            fontSize: 20,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {visible ? '🛑' : '▶️'}
        </button>
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 8,
            padding: '0.3em 0.7em',
            fontSize: 16,
            width: 120,
          }}
          placeholder="Overlay text"
        />
        <button
          title="Update Content"
          onClick={updateContent}
          style={{
            background: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5em 1em',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >💾</button>
        <label title="Opacity" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 18 }}>🌫️</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={changeOpacity}
            style={{ width: 60 }}
          />
        </label>
        <label title="Width" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 18 }}>↔️</span>
          <input
            id="overlay-width"
            type="number"
            min="100"
            max="1920"
            value={size.width}
            onChange={changeSize}
            style={{ width: 60, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid #555', borderRadius: 8, padding: '0.2em 0.5em' }}
          />
        </label>
        <label title="Height" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 18 }}>↕️</span>
          <input
            id="overlay-height"
            type="number"
            min="50"
            max="1080"
            value={size.height}
            onChange={changeSize}
            style={{ width: 60, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid #555', borderRadius: 8, padding: '0.2em 0.5em' }}
          />
        </label>
        <button
          title="Toggle Click-Through"
          onClick={toggleClickThrough}
          style={{
            background: clickThrough ? '#2d8cff' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5em 1em',
            fontSize: 20,
            cursor: 'pointer',
          }}
        >🖱️🚫</button>
      </div>
    </>
  )
}

export default App
