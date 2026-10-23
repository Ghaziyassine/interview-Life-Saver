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
  // State for Free LLM API key configuration
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<{ hasKey: boolean; maskedKey: string }>({ hasKey: false, maskedKey: '' });
  const [apiKeySaveMsg, setApiKeySaveMsg] = useState('');
  // State for Gemini API key configuration
  const [showGeminiApiKeyInput, setShowGeminiApiKeyInput] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [geminiApiKeyStatus, setGeminiApiKeyStatus] = useState<{ hasKey: boolean; maskedKey: string }>({ hasKey: false, maskedKey: '' });
  const [geminiApiKeySaveMsg, setGeminiApiKeySaveMsg] = useState('');
  // State for LLM host configuration
  const [showLLMHostInput, setShowLLMHostInput] = useState(false);
  const [llmHostInput, setLLMHostInput] = useState('');
  const [llmHostStatus, setLLMHostStatus] = useState<string>('');
  const [llmHostSaveMsg, setLLMHostSaveMsg] = useState('');
  // State for LLM model selection
  const [currentModel, setCurrentModel] = useState('auto');
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Models available
  const llmModels = [
    { id: 'auto', name: 'Auto (Free LLM Api)' },
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
  // Fetch API key status on mount
  useEffect(() => {
    const fetchApiKeyStatus = async () => {
      try {
        const chatbotApi = window.api.chatbot as any;
        const status = await chatbotApi.getApiKey();
        setApiKeyStatus(status);
      } catch (err) {
        console.error('Failed to get API key status:', err);
      }
    };
    fetchApiKeyStatus();
  }, []);

  // Fetch LLM host status on mount
  useEffect(() => {
    const fetchLLMHostStatus = async () => {
      try {
        const chatbotApi = window.api.chatbot as any;
        const status = await chatbotApi.getLLMHost();
        setLLMHostStatus(status.host);
      } catch (err) {
        console.error('Failed to get LLM host status:', err);
      }
    };
    fetchLLMHostStatus();
  }, []);

  // Fetch Gemini API key status on mount
  useEffect(() => {
    const fetchGeminiApiKeyStatus = async () => {
      try {
        const chatbotApi = window.api.chatbot as any;
        const status = await chatbotApi.getGeminiApiKey();
        setGeminiApiKeyStatus(status);
      } catch (err) {
        console.error('Failed to get Gemini API key status:', err);
      }
    };
    fetchGeminiApiKeyStatus();
  }, []);

  const handleSaveApiKey = async () => {
    try {
      const chatbotApi = window.api.chatbot as any;
      await chatbotApi.setApiKey(apiKeyInput);
      const status = await chatbotApi.getApiKey();
      setApiKeyStatus(status);
      setApiKeyInput('');
      setApiKeySaveMsg('✅ API key saved!');
      setTimeout(() => setApiKeySaveMsg(''), 2000);
    } catch (err) {
      console.error('Failed to save API key:', err);
      setApiKeySaveMsg('❌ Failed to save');
      setTimeout(() => setApiKeySaveMsg(''), 2000);
    }
  };

  const handleSaveGeminiApiKey = async () => {
    try {
      const chatbotApi = window.api.chatbot as any;
      await chatbotApi.setGeminiApiKey(geminiApiKeyInput);
      const status = await chatbotApi.getGeminiApiKey();
      setGeminiApiKeyStatus(status);
      setGeminiApiKeyInput('');
      setGeminiApiKeySaveMsg('✅ Gemini API key saved!');
      setTimeout(() => setGeminiApiKeySaveMsg(''), 2000);
    } catch (err) {
      console.error('Failed to save Gemini API key:', err);
      setGeminiApiKeySaveMsg('❌ Failed to save');
      setTimeout(() => setGeminiApiKeySaveMsg(''), 2000);
    }
  };

  const handleSaveLLMHost = async () => {
    try {
      const chatbotApi = window.api.chatbot as any;
      await chatbotApi.setLLMHost(llmHostInput.trim());
      const status = await chatbotApi.getLLMHost();
      setLLMHostStatus(status.host);
      setLLMHostInput('');
      setLLMHostSaveMsg('✅ LLM Host saved!');
      setTimeout(() => setLLMHostSaveMsg(''), 2000);
    } catch (err) {
      console.error('Failed to save LLM Host:', err);
      setLLMHostSaveMsg('❌ Failed to save');
      setTimeout(() => setLLMHostSaveMsg(''), 2000);
    }
  };

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

          {/* Free LLM API Key Configuration */}
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
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
              alignItems: 'center',
            }}
          >
            <span>🔑 Free LLM API Key {apiKeyStatus.hasKey ? '(configured)' : '(not set)'}</span>
            <span>{showApiKeyInput ? '▲' : '▼'}</span>
          </button>

          {showApiKeyInput && (
            <div style={{
              padding: '0.5em 0 0.5em 1em',
              marginBottom: '0.5em',
              borderLeft: '2px solid #444',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {apiKeyStatus.hasKey && (
                <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>
                  Current: {apiKeyStatus.maskedKey}
                </div>
              )}
              <input
                type="password"
                placeholder="Enter your Free LLM API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && apiKeyInput.trim()) handleSaveApiKey();
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: 8,
                  padding: '0.4em 0.6em',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim()}
                  style={{
                    background: apiKeyInput.trim() ? '#2d8cff' : '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.3em 1em',
                    fontSize: 13,
                    cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save
                </button>
                {apiKeySaveMsg && (
                  <span style={{ fontSize: 12, color: apiKeySaveMsg.startsWith('✅') ? '#4caf50' : '#f44336' }}>
                    {apiKeySaveMsg}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Get your key from your LLM provider (e.g., local AI server, OpenAI-compatible endpoint)
              </div>
            </div>
          )}

          {/* Gemini API Key Configuration (for Gemini models) */}
          <button
            onClick={() => setShowGeminiApiKeyInput(!showGeminiApiKeyInput)}
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
              alignItems: 'center',
            }}
          >
            <span>🔑 Gemini API Key {geminiApiKeyStatus.hasKey ? '(configured)' : '(not set)'}</span>
            <span>{showGeminiApiKeyInput ? '▲' : '▼'}</span>
          </button>

          {showGeminiApiKeyInput && (
            <div style={{
              padding: '0.5em 0 0.5em 1em',
              marginBottom: '0.5em',
              borderLeft: '2px solid #444',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {geminiApiKeyStatus.hasKey && (
                <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>
                  Current: {geminiApiKeyStatus.maskedKey}
                </div>
              )}
              <input
                type="password"
                placeholder="Enter your Gemini API key"
                value={geminiApiKeyInput}
                onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && geminiApiKeyInput.trim()) handleSaveGeminiApiKey();
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: 8,
                  padding: '0.4em 0.6em',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleSaveGeminiApiKey}
                  disabled={!geminiApiKeyInput.trim()}
                  style={{
                    background: geminiApiKeyInput.trim() ? '#2d8cff' : '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.3em 1em',
                    fontSize: 13,
                    cursor: geminiApiKeyInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save
                </button>
                {geminiApiKeySaveMsg && (
                  <span style={{ fontSize: 12, color: geminiApiKeySaveMsg.startsWith('✅') ? '#4caf50' : '#f44336' }}>
                    {geminiApiKeySaveMsg}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Get your key at{' '}
                <span
                  style={{ color: '#2d8cff', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    try { require('electron').shell.openExternal('https://aistudio.google.com/apikey'); } catch { /* ignore */ }
                  }}
                >
                  aistudio.google.com/apikey
                </span>
              </div>
            </div>
          )}

          {/* LLM Host Configuration */}
          <button
            onClick={() => setShowLLMHostInput(!showLLMHostInput)}
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
              alignItems: 'center',
            }}
          >
            <span>🌐 LLM Host {llmHostStatus ? '(configured)' : '(default: localhost:31415)'}</span>
            <span>{showLLMHostInput ? '▲' : '▼'}</span>
          </button>

          {showLLMHostInput && (
            <div style={{
              padding: '0.5em 0 0.5em 1em',
              marginBottom: '0.5em',
              borderLeft: '2px solid #444',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {llmHostStatus && (
                <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>
                  Current: {llmHostStatus}
                </div>
              )}
              <input
                type="text"
                placeholder="Enter LLM API endpoint (e.g., http://localhost:31415)"
                value={llmHostInput}
                onChange={(e) => setLLMHostInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && llmHostInput.trim()) handleSaveLLMHost();
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: 8,
                  padding: '0.4em 0.6em',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleSaveLLMHost}
                  disabled={!llmHostInput.trim()}
                  style={{
                    background: llmHostInput.trim() ? '#2d8cff' : '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.3em 1em',
                    fontSize: 13,
                    cursor: llmHostInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save
                </button>
                {llmHostSaveMsg && (
                  <span style={{ fontSize: 12, color: llmHostSaveMsg.startsWith('✅') ? '#4caf50' : '#f44336' }}>
                    {llmHostSaveMsg}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Default: <code style={{ color: '#2d8cff' }}>http://localhost:31415</code>
              </div>
            </div>
          )}

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
            <span>🤖 LLM Model: {llmModels.find(model => model.id === currentModel)?.name || currentModel}</span>
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
              {llmModels.map(model => (
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
