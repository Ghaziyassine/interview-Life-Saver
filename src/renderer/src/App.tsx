import { useEffect, useState, useRef } from 'react'
import { ChatOverlay } from './components/overlay'
import { ControlBar } from './components/ControlBar'

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
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <ChatOverlay />
        </div>
      </div>
    </>
  )
}

export default App
