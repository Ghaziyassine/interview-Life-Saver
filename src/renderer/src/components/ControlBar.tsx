import { icons } from '@renderer/assets/icons';
import { useEffect, useState } from 'react';

// Import the GeminiModel interface
export interface GeminiModel {
  id: string;
  name: string;
}

interface ControlBarProps {
  opacity: number;
  setOpacity: (v: number) => void;
  size: { width: number; height: number };
  setSize: (size: { width: number; height: number }) => void;
  clickThrough: boolean;
  toggleClickThrough: () => void;
  toggleAnim: boolean;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  settingsRef: React.RefObject<HTMLDivElement>;
  handleCloseApp: () => void;
  stealth: boolean;
  setStealth: (v: boolean) => void;
  setCaptureProtectionCallback?: (fn: (enabled: boolean) => Promise<void>) => void;
}

export function ControlBar({
  opacity,
  setOpacity,
  setSize,
  clickThrough,
  toggleClickThrough,
  toggleAnim,
  showSettings,
  setShowSettings,
  settingsRef,
  handleCloseApp,
  stealth,
  setStealth,
  setCaptureProtectionCallback,
}: ControlBarProps) {
  // State for screen capture protection
  const [isHiddenFromCapture, setIsHiddenFromCapture] = useState(true);
  const [captureProtectionSupported, setCaptureProtectionSupported] = useState(false);
  // State for Gemini model selection
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // Models available in the free tier
  const geminiModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' }
  ];
  
  // Fetch the current model on component mount
  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        // Use type assertion to work around TypeScript limitation
        const chatbotApi = window.api.chatbot as any;
        const response = await chatbotApi.getModel();
        setCurrentModel(response.model);
      } catch (err) {
        console.error('Failed to get current model:', err);
      }
    };
    
    fetchCurrentModel();
  }, []);
  // Check if screen capture protection is supported on this platform
  useEffect(() => {
    const checkCaptureState = async () => {
      try {
        const main = window.api.main as any;
        const state = await main.getCaptureState();
        setCaptureProtectionSupported(state.supported);
        if (state.supported) {
          // Always enable protection by default
          await main.hideFromCapture();
          setIsHiddenFromCapture(true);
        }
      } catch (err) {
        console.error('Failed to check capture state:', err);
      }
    };

    checkCaptureState();
  }, []);
  // Toggle screen capture protection
  const toggleCaptureProtection = async () => {
    try {
      // Use type assertion if TypeScript still has issues
      const main = window.api.main as any;
      let result;
      if (isHiddenFromCapture) {
        result = await main.showInCapture();
      } else {
        result = await main.hideFromCapture();
      }
      
      if (result) {
        setIsHiddenFromCapture(!isHiddenFromCapture);
      }
    } catch (err) {
      console.error('Failed to toggle capture protection:', err);
    }
  };

  // External control for capture protection
  useEffect(() => {
    if (setCaptureProtectionCallback) {
      setCaptureProtectionCallback(async (enabled: boolean) => {
        const main = window.api.main as any;
        if (enabled) {
          await main.hideFromCapture();
          setIsHiddenFromCapture(true);
        } else {
          await main.showInCapture();
          setIsHiddenFromCapture(false);
        }
      });
    }
  }, [setCaptureProtectionCallback]);

  // Automatically resize the frame when stealth mode is activated
  useEffect(() => {
    if (stealth) {
      // Example: minimize to a small bar (width: 60, height: 40)
      const stealthSize = { width: 600, height: 800 };
      setSize(stealthSize);
      window.api.main.setSize(stealthSize);
    }
  }, [stealth]);
  // Define constants (used in return JSX for minWidth)
  const CONTROL_BAR_MIN_WIDTH = 420; // Used in div style minWidth below
  const changeOpacity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setOpacity(v);
    window.api.main.setOpacity(v);
  };
  // Uncomment if you need to use the size controls again
  /* 
  const changeSize = () => {
    const w = parseInt((document.getElementById('overlay-width') as HTMLInputElement).value);
    const h = parseInt((document.getElementById('overlay-height') as HTMLInputElement).value);
    if (w < CONTROL_BAR_MIN_WIDTH) {
      setSize({ width: CONTROL_BAR_MIN_WIDTH, height: h });
      window.api.main.setSize({ width: CONTROL_BAR_MIN_WIDTH, height: h });
    } else {
      setSize({ width: w, height: h });
      window.api.main.setSize({ width: w, height: h });
    }
  };
  */

  return (
    <div
      style={{
        position: 'fixed',
        top: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3000,
        background: 'rgba(30, 30, 40, 0.85)',
        borderRadius: 16,
        boxShadow: '0 4px 32px #0008',
        padding: '0.5em 1.5em',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        backdropFilter: 'blur(8px)',
        border: '1.5px solid #444',
        minWidth: CONTROL_BAR_MIN_WIDTH,
        opacity: stealth ? 0 : 1,
        pointerEvents: stealth ? 'none' : 'auto',
        transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <button
        title={stealth ? 'Show Control Bar' : 'Stealth Mode (Alt+Shift+i)'}
        onClick={() => setStealth(!stealth)}
        style={{
          background: stealth ? '#2d8cff' : '#444',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0.5em 1em',
          fontSize: 20,
          cursor: 'pointer',
          marginRight: 8,
          transition: 'background 0.3s',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {stealth ? <icons.unlock /> : <icons.lock />}
      </button>
      
      {/* Screen Capture Protection Toggle Button (Windows only) */}
      {captureProtectionSupported && (
        <button
          title={isHiddenFromCapture ? 'Disable Screen Capture Protection' : 'Enable Screen Capture Protection'}
          onClick={toggleCaptureProtection}
          style={{
            background: isHiddenFromCapture ? '#2d8cff' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5em 1em',
            fontSize: 20,
            cursor: 'pointer',
            marginRight: 8,
            transition: 'background 0.3s',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isHiddenFromCapture ? <icons.shield /> : <icons.shieldOff />}
        </button>
      )}
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
      {/* <label title="Width" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 18 }}>↔️</span>
        <input
          id="overlay-width"
          type="number"
          min={CONTROL_BAR_MIN_WIDTH}
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
      </label> */}
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
      >
        🖱️
      </button>
      
      <button
        title="Settings"
        onClick={() => setShowSettings(!showSettings)}
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
      >
        ⚙️
      </button>
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
            minWidth: 300,
          }}
        >
          <button
            onClick={() => {
              // Open system prompt modal
              window.dispatchEvent(new CustomEvent('open-system-prompt-modal'));
            }}
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
            🤖 System Prompt
          </button>
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>🤖 Gemini Model: {geminiModels.find(model => model.id === currentModel)?.name || currentModel}</span>
            <span>{showModelSelector ? '▲' : '▼'}</span>
          </button>
          
          {showModelSelector && (
            <div style={{ 
              padding: '0 0 0.5em 1em', 
              marginBottom: '0.5em', 
              borderLeft: '2px solid #444',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {geminiModels.map(model => (
                <button
                  key={model.id}
                  onClick={async () => {
                    try {
                      // Use type assertion to work around TypeScript limitation
                      const chatbotApi = window.api.chatbot as any;
                      const result = await chatbotApi.setModel(model.id);
                      if (result.success) {
                        setCurrentModel(result.model);
                        setShowModelSelector(false);
                      }
                    } catch (err) {
                      console.error('Failed to set model:', err);
                    }
                  }}
                  style={{
                    background: currentModel === model.id ? 'rgba(45, 140, 255, 0.2)' : 'none',
                    color: currentModel === model.id ? '#2d8cff' : '#ccc',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.3em 0.5em',
                    fontSize: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {model.name}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => {
              // Reset context: refresh conversation
              window.location.reload();
            }}
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
            🔄 Reset Context
          </button>
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
      <button
            title="Minimize"
            onClick={() => window.api.main.minimize()}
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
          >
            🗕 
          </button>
    </div>
  );
}
