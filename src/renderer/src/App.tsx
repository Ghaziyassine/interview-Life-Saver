import { useEffect, useState, useRef } from 'react'
import { ChatOverlay } from './components/overlay'
import { RoomChat } from './components/RoomChat'
import { ControlBar } from './components/ControlBar'

function App(): React.JSX.Element {
  const [opacity, setOpacity] = useState(1)
  const [clickThrough, setClickThrough] = useState(false)
  const [size, setSize] = useState({ width: 900, height: 670 })
  const [toggleAnim, setToggleAnim] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [stealth, setStealth] = useState(false)
  const [appMode, setAppMode] = useState<'llm' | 'room'>('llm')
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

    // Listen for stealth toggled from main process (shortcut or programmatic)
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('main:stealth-toggled', (_event, state) => {
        setStealth(state)
      });
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
      <ControlBar
        opacity={opacity}
        setOpacity={setOpacity}
        size={size}
        setSize={setSize}
        clickThrough={clickThrough}
        toggleClickThrough={toggleClickThrough}
        toggleAnim={toggleAnim}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settingsRef={settingsRef as React.RefObject<HTMLDivElement>}
        handleCloseApp={handleCloseApp}
        stealth={stealth}
        setStealth={setStealth}
      />
      {/* Mode toggle tabs */}
      <div style={{
        position: 'fixed',
        top: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2500,
        display: 'flex',
        gap: 0,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1.5px solid #444',
        opacity: stealth ? 0 : 1,
        pointerEvents: stealth ? 'none' : 'auto',
        transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1)',
      }}>
        <button
          onClick={() => setAppMode('llm')}
          style={{
            background: appMode === 'llm' ? '#2d8cff' : 'rgba(30,30,40,0.85)',
            color: appMode === 'llm' ? '#fff' : '#888',
            border: 'none',
            padding: '6px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          🤖 LLM
        </button>
        <button
          onClick={() => setAppMode('room')}
          style={{
            background: appMode === 'room' ? '#4caf50' : 'rgba(30,30,40,0.85)',
            color: appMode === 'room' ? '#fff' : '#888',
            border: 'none',
            padding: '6px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          🌐 Room
        </button>
      </div>

      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: appMode === 'llm' ? 'block' : 'none' }}>
          <ChatOverlay />
        </div>
        <div style={{ pointerEvents: 'auto', display: appMode === 'room' ? 'block' : 'none' }}>
          <RoomChat />
        </div>
      </div>
    </>
  )
}

export default App
