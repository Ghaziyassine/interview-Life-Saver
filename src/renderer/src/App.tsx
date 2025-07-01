import { useEffect, useState, useRef } from 'react'
import electronLogo from './assets/electron.svg'
import { ChatOverlay } from './components/overlay'

function App(): React.JSX.Element {
  const [opacity, setOpacity] = useState(1)
  const [clickThrough, setClickThrough] = useState(false)
  const [size, setSize] = useState({ width: 900, height: 670 })
  const [toggleAnim, setToggleAnim] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Listen for click-through toggled from main process (shortcut or programmatic)
    if (window.api?.main?.onClickThroughToggled) {
      window.api.main.onClickThroughToggled((state) => {
        setClickThrough(state)
        setToggleAnim(true)
        setTimeout(() => setToggleAnim(false), 600)
      })
    }
  }, [])

  useEffect(() => {
    // Hide settings menu when clicking outside
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClick)
    } else {
      document.removeEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSettings])

  const changeOpacity = (e) => {
    const v = parseFloat(e.target.value)
    setOpacity(v)
    window.api.main.setOpacity(v)
  }
  const changeSize = (e) => {
    const w = parseInt((document.getElementById('overlay-width') as HTMLInputElement).value)
    const h = parseInt((document.getElementById('overlay-height') as HTMLInputElement).value)
    setSize({ width: w, height: h })
    window.api.main.setSize({ width: w, height: h })
  }
  const toggleClickThrough = () => {
    window.api.main.setClickThrough(!clickThrough)
    setClickThrough(!clickThrough)
    setToggleAnim(true)
    setTimeout(() => setToggleAnim(false), 600)
  }
  const handleCloseApp = () => {
    setShowSettings(false)
    window.api?.main?.closeApp?.()
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
          title="Click-Through (alt+shit+o)"
          onClick={toggleClickThrough}
          style={{
            background: clickThrough ? '#2d8cff' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5em 1em',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: toggleAnim ? '0 0 0 4px #2d8cff88' : undefined,
            transition: 'box-shadow 0.3s',
            outline: toggleAnim ? '2px solid #2d8cff' : undefined,
          }}
        >🖱️</button>
        <button
          title="Settings"
          onClick={() => setShowSettings(v => !v)}
          style={{
            background: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5em 1em',
            fontSize: 20,
            cursor: 'pointer',
            position: 'relative',
          }}
        >⚙️</button>
        {showSettings && (
          <div
            ref={settingsRef}
            style={{
              position: 'absolute',
              top: 56,
              right: 0,
              background: '#222',
              color: '#fff',
              borderRadius: 10,
              boxShadow: '0 4px 16px #0008',
              padding: '0.5em 1.5em',
              zIndex: 2001,
              minWidth: 120,
            }}
          >
            <button
              onClick={handleCloseApp}
              style={{
                background: 'none',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.5em 0',
                fontSize: 16,
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              ❌ Close App
            </button>
          </div>
        )}
      </div>
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <ChatOverlay />
        </div>
      </div>
    </>
  )
}

export default App
