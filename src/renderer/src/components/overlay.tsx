import { useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';

function ChatOverlay() {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you?', from: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setMessages((prev) => [
      ...prev,
      { text: prompt, from: 'user' },
    ]);
    setInput('');
    try {
      const res = await window.api?.chatbot?.askMcp?.(prompt);
      if (res?.success) {
        setMessages((prev) => [
          ...prev,
          { text: res.answer ?? 'No response', from: 'bot' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: res?.error ?? 'Error contacting local LLM', from: 'bot' },
        ]);
      }
    } catch (err) {
      const errorMsg = (err && typeof err === 'object' && 'message' in err)
        ? (err as any).message
        : String(err);
      setMessages((prev) => [
        ...prev,
        { text: 'Error: ' + errorMsg, from: 'bot' },
      ]);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: '15%',
      width: '100vw',
      height: '70vh',
      marginTop: 24,
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
              fontFamily: msg.from === 'bot' ? 'Segoe UI, monospace, sans-serif' : 'inherit',
              boxShadow: msg.from === 'bot' ? '0 2px 8px #2d8cff33' : undefined,
              border: msg.from === 'bot' ? '1px solid #2d8cff55' : undefined,
              marginBottom: 4,
            }}
          >
            {msg.from === 'bot' ? (
              <BotMessage text={msg.text} />
            ) : (
              msg.text
            )}
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

function BotMessage({ text }: { text: string }) {
  return (
    <div style={{ width: '100%' }}>
      <ReactMarkdown
        children={text}
        components={{
          code({node, inline, className, children, ...props}) {
            return !inline ? (
              <pre style={{
                background: '#181f2a',
                color: '#e6eaff',
                borderRadius: 8,
                padding: '12px 14px',
                margin: '10px 0',
                fontSize: '1em',
                overflowX: 'auto',
                border: '1px solid #2d8cff33',
                fontFamily: 'JetBrains Mono, Fira Mono, Consolas, monospace',
              }}>
                <code {...props}>{children}</code>
              </pre>
            ) : (
              <code style={{
                background: '#232b3a',
                color: '#7ecfff',
                borderRadius: 4,
                padding: '2px 6px',
                fontFamily: 'JetBrains Mono, Fira Mono, Consolas, monospace',
              }} {...props}>{children}</code>
            );
          },
          h1({children}) {
            return <div style={{ fontWeight: 900, fontSize: '2em', color: '#fff', margin: '12px 0 8px 0' }}>{children}</div>;
          },
          h2({children}) {
            return <div style={{ fontWeight: 700, fontSize: '1.5em', color: '#b8e0ff', margin: '10px 0 6px 0' }}>{children}</div>;
          },
          h3({children}) {
            return <div style={{ fontWeight: 600, fontSize: '1.2em', color: '#7ecfff', margin: '8px 0 4px 0' }}>{children}</div>;
          },
          strong({children}) {
            return <b style={{ fontWeight: 700 }}>{children}</b>;
          },
          em({children}) {
            return <i style={{ fontStyle: 'italic' }}>{children}</i>;
          },
          del({children}) {
            return <span style={{ textDecoration: 'line-through' }}>{children}</span>;
          },
        }}
      />
    </div>
  );
}

const rootDiv = document.getElementById('root');
if (rootDiv) {
  const root = createRoot(rootDiv);
  root.render(<ChatOverlay />);
}

export { ChatOverlay };
