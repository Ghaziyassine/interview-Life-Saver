import { useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function ChatOverlay() {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you?', from: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setMessages((prev) => [
      ...prev,
      { text: prompt, from: 'user' },
    ]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: prompt, from: 'bot' }, // echo reply
      ]);
    }, 400);
    setInput('');
  };

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      minWidth: 340,
      maxWidth: '90vw',
      minHeight: 200,
      maxHeight: '80vh',
      background: 'rgba(30,30,40,0.96)',
      borderRadius: 18,
      boxShadow: '0 4px 32px #000a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1.5px solid #444',
      fontFamily: 'Segoe UI, monospace, sans-serif',
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '18px 18px 0 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              background: msg.from === 'bot' ? 'rgba(45,140,255,0.18)' : 'rgba(255,255,255,0.08)',
              color: msg.from === 'bot' ? '#b8e0ff' : '#fff',
              padding: '10px 14px',
              borderRadius: 12,
              maxWidth: '80%',
              alignSelf: msg.from === 'bot' ? 'flex-start' : 'flex-end',
              fontSize: '1.1em',
              wordBreak: 'break-word',
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={sendPrompt}
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 18px 18px 18px',
          background: 'rgba(30,30,40,0.96)',
          borderTop: '1px solid #333',
        }}
        autoComplete="off"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
          style={{
            flex: 1,
            borderRadius: 8,
            border: '1px solid #555',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: '1em',
            padding: '8px 12px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: '#2d8cff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: '1em',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >Send</button>
      </form>
    </div>
  );
}

const rootDiv = document.getElementById('root');
if (rootDiv) {
  const root = createRoot(rootDiv);
  root.render(<ChatOverlay />);
}

export { ChatOverlay };
