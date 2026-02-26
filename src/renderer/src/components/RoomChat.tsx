import { useRef, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

interface RoomMessage {
  id: string;
  text?: string;
  imageData?: string;
  fileName?: string;
  mimeType?: string;
  timestamp: string;
  sender: string;
  type?: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ZoomableImageProps {
  src: string;
  alt: string;
  fileName?: string;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, fileName }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startDrag, setStartDrag] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampPosition = useCallback((
    currentX: number,
    currentY: number,
    currentScale: number,
    imgEl: HTMLImageElement,
    containerRect: DOMRect
  ) => {
    const naturalWidth = imgEl.naturalWidth;
    const naturalHeight = imgEl.naturalHeight;

    const scaledImageWidth = naturalWidth * currentScale;
    const scaledImageHeight = naturalHeight * currentScale;

    const halfContainerWidth = containerRect.width / 2;
    const halfContainerHeight = containerRect.height / 2;

    const halfScaledImageWidth = scaledImageWidth / 2;
    const halfScaledImageHeight = scaledImageHeight / 2;

    let maxX = Math.max(0, halfScaledImageWidth - halfContainerWidth);
    let maxY = Math.max(0, halfScaledImageHeight - halfContainerHeight);

    const clampedX = Math.max(-maxX, Math.min(currentX, maxX));
    const clampedY = Math.max(-maxY, Math.min(currentY, maxY));
    return { x: clampedX, y: clampedY };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!imgRef.current || !containerRef.current) return;

    const scaleAmount = 0.1;
    const newScale = e.deltaY < 0 ? scale + scaleAmount : scale - scaleAmount;
    const clampedNewScale = Math.max(0.5, Math.min(newScale, 5));

    if (clampedNewScale === scale) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const imgElement = imgRef.current;

    // Mouse position relative to the container's top-left corner
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Current image center relative to container's top-left
    const currentImgCenterX = containerRect.width / 2 + position.x;
    const currentImgCenterY = containerRect.height / 2 + position.y;

    // Mouse position relative to the image's current center
    const mouseRelToImgCenterX = mouseX - currentImgCenterX;
    const mouseRelToImgCenterY = mouseY - currentImgCenterY;

    // Calculate how much the image needs to shift to keep the mouse point stationary
    let newPosX = position.x - mouseRelToImgCenterX * (clampedNewScale / scale - 1);
    let newPosY = position.y - mouseRelToImgCenterY * (clampedNewScale / scale - 1);

    // Apply clamping after calculating new position
    const clampedPos = clampPosition(newPosX, newPosY, clampedNewScale, imgElement, containerRect);

    setScale(clampedNewScale);
    setPosition(clampedPos);
  }, [scale, position, clampPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!startDrag) return;
    e.preventDefault();

    const containerRect = containerRef.current?.getBoundingClientRect();
    const imgElement = imgRef.current;
    if (!containerRect || !imgElement) return;

    const newX = e.clientX - startDrag.x;
    const newY = e.clientY - startDrag.y;

    const clampedPos = clampPosition(newX, newY, scale, imgElement, containerRect);

    setPosition(clampedPos);
  }, [startDrag, scale, clampPosition]);

  const handleMouseUp = useCallback(() => {
    setStartDrag(null);
  }, []);

  // Reset zoom and position when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      style={{
        overflow: 'hidden',
        cursor: startDrag ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in'),
        borderRadius: 8,
        marginTop: 4,
        position: 'relative',
        maxWidth: '100%',
        maxHeight: 300, // Keep initial max height for the container
        display: 'inline-block', // To make container wrap content
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the image area
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: startDrag ? 'none' : 'transform 0.1s ease-out',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          pointerEvents: scale > 1 ? 'auto' : 'none',
        }}
      />
      {fileName && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{fileName}</div>}
    </div>
  );
};

export function RoomChat() {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [joinKeyInput, setJoinKeyInput] = useState('');
  const [nickname, setNickname] = useState(() => localStorage.getItem('room-nickname') || '');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [notification, setNotification] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [images, setImages] = useState<{ base64: string; mime: string; name: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showNotification = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Listen for messages and status from main process via IPC
  useEffect(() => {
    const roomApi = window.api.room;

    roomApi.onMessage((message: any) => {
      switch (message.type) {
        case 'connected':
          showNotification('Connected to server', 'success');
          break;
        case 'room_created':
          if (message.success) {
            setCurrentRoom(message.roomKey);
            setParticipantCount(1);
            setMessages([]);
            showNotification(`Room created: ${message.roomKey}`, 'success');
          }
          break;
        case 'room_joined':
          if (message.success) {
            setCurrentRoom(message.roomKey);
            setParticipantCount(message.participantCount || 1);
            setMessages([]);
            showNotification(`Joined room: ${message.roomKey}`, 'success');
          }
          break;
        case 'join_error':
          showNotification(message.error || 'Failed to join room', 'error');
          break;
        case 'message':
          setMessages(prev => [...prev, {
            id: message.id,
            text: message.text,
            timestamp: message.timestamp,
            sender: message.sender,
          }]);
          break;
        case 'image_message':
          setMessages(prev => [...prev, {
            id: message.id,
            imageData: message.imageData,
            fileName: message.fileName,
            mimeType: message.mimeType,
            timestamp: message.timestamp,
            sender: message.sender,
            type: 'image',
          }]);
          break;
        case 'participant_joined':
          setParticipantCount(message.participantCount);
          showNotification('A participant joined', 'info');
          break;
        case 'participant_left':
          setParticipantCount(message.participantCount);
          showNotification('A participant left', 'info');
          break;
        case 'room_left':
          setCurrentRoom(null);
          setMessages([]);
          setParticipantCount(0);
          showNotification('Left the room', 'info');
          break;
        case 'error':
          showNotification(message.error || 'An error occurred', 'error');
          break;
        case 'pong':
          break;
        default:
          break;
      }
    });

    roomApi.onStatus((status: string) => {
      setConnectionStatus(status as ConnectionStatus);
    });

    // Check initial status
    roomApi.getStatus().then((status) => {
      setConnectionStatus(status as ConnectionStatus);
    });

    return () => {
      roomApi.removeAllListeners();
    };
  }, [showNotification]);

  const connect = async () => {
    await window.api.room.connect();
  };

  const disconnect = async () => {
    await window.api.room.disconnect();
    setCurrentRoom(null);
    setMessages([]);
    setParticipantCount(0);
  };

  const sendWs = async (msg: any) => {
    const res = await window.api.room.send(msg);
    if (!res.success) {
      showNotification('Not connected to server', 'error');
    }
  };

  const createRoom = () => { sendWs({ type: 'create_room' }); };

  const joinRoom = () => {
    const key = joinKeyInput.trim().toUpperCase();
    if (!key) return;
    sendWs({ type: 'join_room', roomKey: key });
    setJoinKeyInput('');
  };

  const leaveRoom = () => { sendWs({ type: 'leave_room' }); };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text && images.length === 0) return;
    const senderName = nickname || 'Anonymous';
    if (text) { sendWs({ type: 'send_message', text, sender: senderName }); }
    for (const img of images) {
      sendWs({ type: 'send_image', imageData: img.base64, fileName: img.name, mimeType: img.mime, sender: senderName });
    }
    setInput('');
    setImages([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    const readers = fileArr.map(file => {
      return new Promise<{ base64: string; mime: string; name: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve({ base64, mime: file.type, name: file.name });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(newImages => setImages(prev => [...prev, ...newImages]));
    e.target.value = '';
  };

  // Paste images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));
      if (imageItems.length === 0) return;
      e.preventDefault();
      const readers = imageItems.map(item => {
        const file = item.getAsFile();
        if (!file) return null;
        return new Promise<{ base64: string; mime: string; name: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mime: file.type, name: file.name || 'pasted-image.png' });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }).filter(Boolean) as Promise<{ base64: string; mime: string; name: string }>[];
      if (readers.length > 0) {
        Promise.all(readers).then(newImages => setImages(prev => [...prev, ...newImages]));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const saveNickname = (name: string) => {
    setNickname(name);
    localStorage.setItem('room-nickname', name);
  };

  const statusColor = connectionStatus === 'connected' ? '#4caf50' : connectionStatus === 'connecting' ? '#ff9800' : '#f44336';

  // ── Not connected: show connect screen ──
  if (connectionStatus !== 'connected') {
    return (
      <div style={{
        position: 'absolute', left: 0, top: '15%', width: '100vw', height: '70vh',
        marginTop: 24, background: 'rgba(30,30,40,0.96)', borderRadius: 18,
        boxShadow: '0 4px 32px #000a', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
        border: '1.5px solid #444', fontFamily: 'Segoe UI, monospace, sans-serif', color: '#fff',
      }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>🌐 Room Mode</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          <span style={{ fontSize: 14, color: '#aaa', textTransform: 'capitalize' }}>{connectionStatus}</span>
        </div>
        <input
          type="text" value={nickname} onChange={e => saveNickname(e.target.value)}
          placeholder="Your nickname..."
          style={{
            borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.08)',
            color: '#fff', fontSize: '1em', padding: '8px 12px', outline: 'none', width: 220, textAlign: 'center',
          }}
        />
        <button onClick={connect} disabled={connectionStatus === 'connecting'} style={{
          background: '#2d8cff', color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 32px', fontSize: 16, fontWeight: 600,
          cursor: connectionStatus === 'connecting' ? 'wait' : 'pointer',
        }}>
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Server'}
        </button>
      </div>
    );
  }

  // ── Connected but no room: show lobby ──
  if (!currentRoom) {
    return (
      <div style={{
        position: 'absolute', left: 0, top: '15%', width: '100vw', height: '70vh',
        marginTop: 24, background: 'rgba(30,30,40,0.96)', borderRadius: 18,
        boxShadow: '0 4px 32px #000a', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        border: '1.5px solid #444', fontFamily: 'Segoe UI, monospace, sans-serif', color: '#fff',
      }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>🏠 Lobby</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: '#aaa' }}>Connected as <b style={{ color: '#7ecfff' }}>{nickname || 'Anonymous'}</b></span>
        </div>

        {notification && (
          <div style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13,
            background: notification.type === 'error' ? '#f4433622' : notification.type === 'success' ? '#4caf5022' : '#2d8cff22',
            color: notification.type === 'error' ? '#f44336' : notification.type === 'success' ? '#4caf50' : '#7ecfff',
            border: `1px solid ${notification.type === 'error' ? '#f4433644' : notification.type === 'success' ? '#4caf5044' : '#2d8cff44'}`,
          }}>
            {notification.text}
          </div>
        )}

        <button onClick={createRoom} style={{
          background: '#2d8cff', color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: 260,
        }}>
          + Create Room
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 13 }}>
          <span>──────</span> or <span>──────</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" value={joinKeyInput}
            onChange={e => setJoinKeyInput(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') joinRoom(); }}
            placeholder="Room key..." maxLength={8}
            style={{
              borderRadius: 8, border: '1px solid #555', background: 'rgba(255,255,255,0.08)',
              color: '#fff', fontSize: '1em', padding: '8px 12px', outline: 'none',
              width: 130, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase',
            }}
          />
          <button onClick={joinRoom} disabled={!joinKeyInput.trim()} style={{
            background: joinKeyInput.trim() ? '#2d8cff' : '#555', color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 20px', fontSize: 15, fontWeight: 600,
            cursor: joinKeyInput.trim() ? 'pointer' : 'not-allowed',
          }}>
            Join
          </button>
        </div>

        <button onClick={disconnect} style={{
          background: 'transparent', color: '#f44336', border: '1px solid #f4433644',
          borderRadius: 8, padding: '6px 18px', fontSize: 13, cursor: 'pointer', marginTop: 12,
        }}>
          Disconnect
        </button>
      </div>
    );
  }

  // ── In a room: show chat ──
  return (
    <div style={{
      position: 'absolute', left: 0, top: '15%', width: '100vw', height: '70vh',
      marginTop: 24, background: 'rgba(30,30,40,0.96)', borderRadius: 18,
      boxShadow: '0 4px 32px #000a', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', border: '1.5px solid #444', fontFamily: 'Segoe UI, monospace, sans-serif',
    }}>
      {/* Room header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px', borderBottom: '1px solid #333', background: 'rgba(30,30,40,0.98)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔑</span>
          <span style={{
            color: '#7ecfff', fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace',
            fontSize: 16, userSelect: 'all',
          }}>
            {currentRoom}
          </span>
          <button
            onClick={() => { navigator.clipboard.writeText(currentRoom); showNotification('Room key copied!', 'success'); }}
            title="Copy room key"
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
          >
            📋
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 13 }}>👥 {participantCount}</span>
          <button onClick={leaveRoom} style={{
            background: '#f4433622', color: '#f44336', border: '1px solid #f4433644',
            borderRadius: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer',
          }}>
            Leave
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          padding: '6px 18px', fontSize: 13, textAlign: 'center',
          background: notification.type === 'error' ? '#f4433622' : notification.type === 'success' ? '#4caf5022' : '#2d8cff22',
          color: notification.type === 'error' ? '#f44336' : notification.type === 'success' ? '#4caf50' : '#7ecfff',
        }}>
          {notification.text}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '18px 18px 0 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === (nickname || 'Anonymous');
          return (
            <div key={msg.id} style={{
              background: isMe ? 'rgba(255,255,255,0.08)' : 'rgba(45,140,255,0.18)',
              color: isMe ? '#fff' : '#b8e0ff',
              padding: '10px 14px', borderRadius: 12, maxWidth: '80%',
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              fontSize: '1.05em', wordBreak: 'break-word',
              boxShadow: !isMe ? '0 2px 8px #2d8cff33' : undefined,
              border: !isMe ? '1px solid #2d8cff55' : undefined,
              marginBottom: 4, userSelect: 'text',
            }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: isMe ? '#7ecfff' : '#ffb347' }}>{msg.sender}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              {msg.type === 'image' && msg.imageData && msg.mimeType ? (
                <ZoomableImage
                  src={`data:${msg.mimeType};base64,${msg.imageData}`}
                  alt={msg.fileName || 'image'}
                  fileName={msg.fileName}
                />
              ) : (
                <ReactMarkdown
                  children={msg.text || ''}
                  components={{
                    code({ className, children, ...props }) {
                      const isInline = !(className && className.includes('language-'));
                      return !isInline ? (
                        <pre style={{
                          background: '#181f2a', color: '#e6eaff', borderRadius: 8,
                          padding: '12px 14px', margin: '10px 0', fontSize: '1em',
                          overflowX: 'auto', border: '1px solid #2d8cff33',
                          fontFamily: 'JetBrains Mono, Fira Mono, Consolas, monospace',
                        }}>
                          <code {...props}>{children}</code>
                        </pre>
                      ) : (
                        <code style={{
                          background: '#232b3a', color: '#7ecfff', borderRadius: 4,
                          padding: '2px 6px',
                          fontFamily: 'JetBrains Mono, Fira Mono, Consolas, monospace',
                        }} {...props}>{children}</code>
                      );
                    },
                  }}
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        style={{
          display: 'flex', gap: 8, padding: '12px 18px 18px 18px',
          background: 'rgba(30,30,40,0.96)', borderTop: '1px solid #333', alignItems: 'center',
        }}
        autoComplete="off"
      >
        <label style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(45,140,255,0.10)', borderRadius: 8,
          border: '1.5px solid #2d8cff33', padding: '6px 10px',
          cursor: 'pointer', color: '#7ecfff', fontWeight: 600, fontSize: '1em',
        }} title="Attach images">
          <span style={{ fontSize: 18 }}>📎</span>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
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
                setImages(prev => [...prev, { base64: res.base64, mime: res.mime || 'image/png', name: 'screenshot.png' }]);
              } else {
                showNotification(res?.error || 'Screenshot failed', 'error');
              }
            }
          }}
        >
          <span style={{ fontSize: 18 }}>📸</span>
        </button>
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Type a message..." autoComplete="off"
          style={{
            flex: 1, borderRadius: 8, border: '1px solid #555',
            background: 'rgba(255,255,255,0.08)', color: '#fff',
            fontSize: '1em', padding: '8px 12px', outline: 'none',
          }}
        />
        <button type="submit" style={{
          background: '#2d8cff', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 18px', fontSize: '1em', cursor: 'pointer',
        }}>
          Send
        </button>
        {images.length > 0 && (
          <>
            <span style={{ color: '#7ecfff', fontSize: '0.95em', marginLeft: 8 }}>
              {images.length} image{images.length > 1 ? 's' : ''} ready
            </span>
            <button type="button" onClick={() => setImages([])} style={{
              marginLeft: 4, background: '#232b3a', color: '#7ecfff',
              border: '1px solid #2d8cff33', borderRadius: 6,
              padding: '4px 10px', fontSize: '0.95em', cursor: 'pointer',
            }} title="Clear attached images">
              🧹
            </button>
          </>
        )}
      </form>
    </div>
  );
}
