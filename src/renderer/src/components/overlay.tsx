import { useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';

// --- Token counting utility (simple estimation) ---
function estimateTokens(text: string): number {
  // Roughly 1.3 tokens per word (for English, varies by language/model)
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// --- Summarization utility (very basic, replace with LLM call for better results) ---
function summarizeMessages(messages: { text: string; from: string }[]): string {
  // Simple summary: concatenate first and last user/bot messages, or use a placeholder
  if (messages.length === 0) return '';
  const first = messages[0];
  const last = messages[messages.length - 1];
  return `Summary: Conversation started with "${first.text.slice(0, 40)}..." and most recently "${last.text.slice(0, 40)}..."`;
}

// --- Prompt builder ---
function buildPromptContext(
  allMessages: { text: string; from: string }[],
  tokenLimit: number
): { summary: string; recentMessages: { text: string; from: string }[] } {
  let totalTokens = 0;
  const reversed: { text: string; from: string }[] = [];
  // Traverse from end (most recent) backwards
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i];
    const tokens = estimateTokens(msg.text);
    if (totalTokens + tokens > tokenLimit) break;
    reversed.push(msg);
    totalTokens += tokens;
  }
  const recentMessages = reversed.reverse();
  const olderMessages = allMessages.slice(0, allMessages.length - recentMessages.length);
  const summary = olderMessages.length > 0 ? summarizeMessages(olderMessages) : '';
  return { summary, recentMessages };
}



function ChatOverlay() {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you?', from: 'bot' }
  ]);
  const [input, setInput] = useState('');
  // Multiple images: array of { base64, mime }
  const [images, setImages] = useState<{ base64: string; mime: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // In-memory full conversation history (not persisted)
  const conversationHistory = useRef<{ text: string; from: string }[]>([
    { text: 'Hello! How can I help you?', from: 'bot' }
  ]);
  // Token limit for prompt context
  const TOKEN_LIMIT = 1000;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle multiple image file selection and convert to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setImages([]);
      return;
    }
    const fileArr = Array.from(files);
    const readers = fileArr.map(file => {
      return new Promise<{ base64: string; mime: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve({ base64, mime: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(setImages);
  };

  const sendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt && images.length === 0) return;
    // Add user message to history
    let userMsgText = prompt;
    if (images.length > 0) {
      userMsgText = `[${images.length} Image${images.length > 1 ? 's' : ''} sent]` + (prompt ? ' ' + prompt : '');
    }
    conversationHistory.current.push({ text: userMsgText, from: 'user' });
    setMessages((prev) => [
      ...prev,
      { text: userMsgText, from: 'user' },
    ]);
    setInput('');

    // Build Gemini request
    let geminiRequest: any;
    if (images.length > 0) {
      // Send multiple images and text as parts
      const imageParts = images.map(img => ({
        inlineData: {
          mimeType: img.mime,
          data: img.base64,
        },
      }));
      geminiRequest = {
        contents: [
          {
            parts: [
              ...imageParts,
              ...(prompt ? [{ text: prompt }] : []),
            ],
          },
        ],
      };
    } else {
      // Text only: build context as before
      const { summary, recentMessages } = buildPromptContext(conversationHistory.current, TOKEN_LIMIT);
      let promptContext = '';
      if (summary) {
        promptContext += summary + '\n';
      }
      for (const msg of recentMessages) {
        promptContext += `${msg.from === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
      }
      geminiRequest = promptContext;
    }

    // Clear images after sending
    setImages([]);

    try {
      // Send the composed prompt context or image+text to the LLM API via IPC (base64 images included)
      // Use window.electron.ipcRenderer.invoke for IPC transfer
      let res;
      if (window.electron?.ipcRenderer?.invoke) {
        res = await window.electron.ipcRenderer.invoke('chatbot:ask-mcp', geminiRequest);
      } else if (window.api?.chatbot?.askMcp) {
        // fallback for existing API
        res = await window.api.chatbot.askMcp(geminiRequest);
      }
      let botMsg = '';
      if (res?.success) {
        botMsg = res.answer ?? 'No response';
      } else {
        botMsg = res?.error ?? 'Error contacting local LLM';
      }
      // Add bot message to history
      conversationHistory.current.push({ text: botMsg, from: 'bot' });
      setMessages((prev) => [
        ...prev,
        { text: botMsg, from: 'bot' },
      ]);
    } catch (err) {
      const errorMsg = (err && typeof err === 'object' && 'message' in err)
        ? (err as any).message
        : String(err);
      conversationHistory.current.push({ text: 'Error: ' + errorMsg, from: 'bot' });
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
              userSelect: 'text',
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
          alignItems: 'center',
        }}
        autoComplete="off"
      >
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(45,140,255,0.10)',
          borderRadius: 8,
          border: '1.5px solid #2d8cff33',
          padding: '6px 10px',
          cursor: 'pointer',
          color: '#7ecfff',
          fontWeight: 600,
          fontSize: '1em',
          transition: 'background 0.2s',
        }} title="Attach images">
          <span style={{ fontSize: 18 }}>📎</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </label>
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(45,140,255,0.10)',
            borderRadius: 8,
            border: '1.5px solid #2d8cff33',
            padding: '6px 10px',
            cursor: 'pointer',
            color: '#7ecfff',
            fontWeight: 600,
            fontSize: '1em',
            transition: 'background 0.2s',
          }}
          title="Take screenshot and attach"
          onClick={async () => {
            if (window.electron?.ipcRenderer?.invoke) {
              const res = await window.electron.ipcRenderer.invoke('overlay:take-screenshot');
              if (res && res.success && res.base64) {
                setImages(prev => [...prev, { base64: res.base64, mime: res.mime || 'image/png' }]);
              } else {
                alert(res?.error || 'Screenshot failed');
              }
            }
          }}
        >
          <span style={{ fontSize: 18 }}>📸</span>
        </button>
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
        {images.length > 0 && (
          <>
            <span style={{ color: '#7ecfff', fontSize: '0.95em', marginLeft: 8 }}>{images.length} image{images.length > 1 ? 's' : ''} ready</span>
            <button
              type="button"
              onClick={() => setImages([])}
              style={{
                marginLeft: 8,
                background: '#232b3a',
                color: '#7ecfff',
                border: '1px solid #2d8cff33',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.95em',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title="Clear attached images"
            >
              🧹 
            </button>
          </>
        )}
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
          code({node, className, children, ...props}) {
            const isInline = !(className && className.includes('language-'));
            return !isInline ? (
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
