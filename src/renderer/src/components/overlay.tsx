import { useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';

// Define types for system prompts
interface SystemPrompt {
  id: string;
  name: string;
  content: string;
}

// Create a custom hook to handle localStorage for system prompts
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}



function SystemPromptModal({ 
  isOpen, 
  onClose, 
  systemPrompts, 
  activePromptId,
  setSystemPrompts,
  setActivePromptId
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  systemPrompts: SystemPrompt[];
  activePromptId: string | null;
  setSystemPrompts: (prompts: SystemPrompt[]) => void;
  setActivePromptId: (id: string | null) => void;
}) {
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(activePromptId);
  const [promptName, setPromptName] = useState('');
  const [promptContent, setPromptContent] = useState('');
  
  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setEditMode(null);
      setSelectedPromptId(activePromptId);
    }
  }, [isOpen, activePromptId]);
  
  // Load prompt data when edit mode changes
  useEffect(() => {
    if (editMode === 'edit' && selectedPromptId) {
      const prompt = systemPrompts.find(p => p.id === selectedPromptId);
      if (prompt) {
        setPromptName(prompt.name);
        setPromptContent(prompt.content);
      }
    } else if (editMode === 'create') {
      setPromptName('');
      setPromptContent('');
    }
  }, [editMode, selectedPromptId, systemPrompts]);
  
  const handleCreatePrompt = () => {
    setEditMode('create');
    setPromptName('');
    setPromptContent('');
  };
  
  const handleEditPrompt = () => {
    if (!selectedPromptId) return;
    setEditMode('edit');
  };
  
  const handleDeletePrompt = () => {
    if (!selectedPromptId) return;
    
    // Remove the prompt
    const newPrompts = systemPrompts.filter(p => p.id !== selectedPromptId);
    setSystemPrompts(newPrompts);
    
    // If the active prompt was deleted, set active to null
    if (activePromptId === selectedPromptId) {
      setActivePromptId(null);
    }
    
    // Reset selection
    setSelectedPromptId(null);
  };
  
  const handleSavePrompt = () => {
    if (!promptName.trim() || !promptContent.trim()) return;
    
    if (editMode === 'create') {
      // Create new prompt
      const newPrompt: SystemPrompt = {
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: promptName.trim(),
        content: promptContent.trim()
      };
      
      setSystemPrompts([...systemPrompts, newPrompt]);
      setSelectedPromptId(newPrompt.id);
    } else if (editMode === 'edit' && selectedPromptId) {
      // Update existing prompt
      const newPrompts = systemPrompts.map(p => 
        p.id === selectedPromptId 
          ? { ...p, name: promptName.trim(), content: promptContent.trim() } 
          : p
      );
      
      setSystemPrompts(newPrompts);
    }
    
    setEditMode(null);
  };
  
  const handleActivatePrompt = () => {
    setActivePromptId(selectedPromptId);
    onClose();
  };
  
  const handleClearActivePrompt = () => {
    setActivePromptId(null);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent', // Change this line from 'rgba(0, 0, 0, 0.7)' to 'transparent'
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000,
    }}>
      <div style={{
        background: 'rgba(30,30,40,0.96)',
        borderRadius: 18,
        boxShadow: '0 4px 32px #000a',
        padding: '24px',
        width: '70%',
        maxWidth: '900px',
        maxHeight: '80vh',
        border: '1.5px solid #444',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ 
          color: '#b8e0ff', 
          marginTop: 0, 
          fontSize: '1.5em' 
        }}>System Prompts</h2>
        
        {editMode ? (
          /* Edit or Create Prompt Form */
          <div style={{ marginBottom: '20px' }}>
            <p style={{ 
              color: '#7ecfff', 
              fontSize: '0.9em', 
              marginBottom: '16px' 
            }}>
              {editMode === 'create' ? 'Create a new system prompt' : 'Edit system prompt'}
            </p>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '6px' 
              }}>
                Prompt Name
              </label>
              <input
                type="text"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="Enter a name for this prompt..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  border: '1px solid #2d8cff',
                  borderRadius: 8,
                  fontSize: '1em',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '6px' 
              }}>
                Prompt Content
              </label>
              <textarea
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder="Enter the system prompt content..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  border: '1px solid #2d8cff',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: '1em',
                  resize: 'vertical',
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setEditMode(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #7ecfff',
                  color: '#7ecfff',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                style={{
                  background: '#2d8cff',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* Prompt List and Actions */
          <div style={{ 
            display: 'flex',
            height: '100%',
            maxHeight: 'calc(80vh - 120px)',
            overflow: 'hidden',
          }}>
            {/* Left panel: Prompt list */}
            <div style={{ 
              width: '40%', 
              marginRight: '20px',
              overflow: 'auto',
              borderRight: '1px solid #444',
              paddingRight: '16px',
            }}>
              <p style={{ 
                color: '#7ecfff', 
                fontSize: '0.9em', 
                marginBottom: '12px' 
              }}>
                Select a system prompt:
              </p>
              
              {systemPrompts.length === 0 ? (
                <div style={{ 
                  color: '#777', 
                  padding: '12px 0', 
                  fontStyle: 'italic' 
                }}>
                  No prompts saved yet. Create your first prompt.
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}>
                  {systemPrompts.map(prompt => (
                    <div 
                      key={prompt.id}
                      onClick={() => setSelectedPromptId(prompt.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: selectedPromptId === prompt.id 
                          ? 'rgba(45,140,255,0.2)' 
                          : 'rgba(255,255,255,0.05)',
                        border: activePromptId === prompt.id 
                          ? '1px solid #2d8cff' 
                          : '1px solid transparent',
                        position: 'relative',
                      }}
                    >
                      <div style={{ 
                        color: '#fff', 
                        fontWeight: selectedPromptId === prompt.id ? 'bold' : 'normal',
                        marginBottom: '4px',
                      }}>
                        {prompt.name}
                        {activePromptId === prompt.id && (
                          <span style={{ 
                            fontSize: '0.8em', 
                            color: '#2d8cff', 
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(45,140,255,0.1)',
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        color: '#aaa', 
                        fontSize: '0.85em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {prompt.content.substring(0, 60)}
                        {prompt.content.length > 60 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={handleCreatePrompt}
                style={{
                  background: '#2d8cff',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '16px',
                }}
              >
                Create New Prompt
              </button>
            </div>
            
            {/* Right panel: Preview and actions */}
            <div style={{ 
              width: '60%',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {selectedPromptId ? (
                <>
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    marginBottom: '16px',
                  }}>
                    <h3 style={{ 
                      color: '#7ecfff', 
                      fontSize: '1.1em',
                      marginTop: 0,
                    }}>
                      {systemPrompts.find(p => p.id === selectedPromptId)?.name}
                    </h3>
                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '12px',
                      color: '#ddd',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.95em',
                      overflow: 'auto',
                      maxHeight: '300px',
                      fontFamily: 'monospace',
                    }}>
                      {systemPrompts.find(p => p.id === selectedPromptId)?.content}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: 'auto',
                  }}>
                    <button
                      onClick={handleEditPrompt}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePrompt}
                      style={{
                        background: 'rgba(255,0,0,0.2)',
                        border: '1px solid #a55',
                        color: '#faa',
                        borderRadius: 6,
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                    {activePromptId === selectedPromptId ? (
                      <button
                        onClick={handleClearActivePrompt}
                        style={{
                          background: 'transparent',
                          border: '1px solid #7ecfff',
                          color: '#7ecfff',
                          borderRadius: 6,
                          padding: '8px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={handleActivatePrompt}
                        style={{
                          background: '#2d8cff',
                          border: 'none',
                          color: '#fff',
                          borderRadius: 6,
                          padding: '8px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ 
                  color: '#777', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '3em', marginBottom: '16px' }}>🤖</div>
                  <p>Select a prompt from the list or create a new one</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Bottom action bar */}
        <div style={{
          borderTop: '1px solid #444',
          marginTop: '20px',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <div style={{ 
            color: '#7ecfff', 
            fontSize: '0.9em' 
          }}>
            {activePromptId ? (
              <span>Active prompt: {systemPrompts.find(p => p.id === activePromptId)?.name}</span>
            ) : (
              <span>No active prompt</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #7ecfff',
              color: '#7ecfff',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatOverlay() {
  const [messages, setMessages] = useState<Array<{ text: string; from: string; id?: string }>>([
    { text: 'Hello! How can I help you?', from: 'bot', id: 'initial' }
  ]);
  const [input, setInput] = useState('');
  // Multiple images: array of { base64, mime }
  const [images, setImages] = useState<{ base64: string; mime: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // In-memory full conversation history (not persisted)
  const conversationHistory = useRef<{ text: string; from: string; id?: string }[]>([
    { text: 'Hello! How can I help you?', from: 'bot', id: 'initial' }
  ]);
  
  // Track which message is being edited (by id)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  // Edit input value
  const [editInput, setEditInput] = useState('');
  
  // System prompts state (persisted in localStorage)
  const [systemPrompts, setSystemPrompts] = useLocalStorage<SystemPrompt[]>('systemPrompts', []);
  // Active system prompt ID (persisted in localStorage)
  const [activePromptId, setActivePromptId] = useLocalStorage<string | null>('activePromptId', null);
  // System prompt modal state
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add event listener for opening the system prompt modal
  useEffect(() => {
    const handleOpenSystemPromptModal = () => {
      setShowSystemPromptModal(true);
    };
    
    window.addEventListener('open-system-prompt-modal', handleOpenSystemPromptModal);
    
    return () => {
      window.removeEventListener('open-system-prompt-modal', handleOpenSystemPromptModal);
    };
  }, []);

  // Generate unique ID for messages
  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle message editing
  const startEditing = (messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setEditInput(text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditInput('');
  };

  const saveEdit = async (messageId: string) => {
    const editedText = editInput.trim();
    if (!editedText) return;

    // Find the message index in conversation history
    const messageIndex = conversationHistory.current.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      cancelEditing();
      return;
    }

    // Update the message in history
    conversationHistory.current[messageIndex].text = editedText;
    
    // Remove all messages after the edited one (as requested)
    if (messageIndex < conversationHistory.current.length - 1) {
      conversationHistory.current = conversationHistory.current.slice(0, messageIndex + 1);
    }

    // Update UI messages to match the conversation history
    setMessages(conversationHistory.current.map(msg => ({...msg})));

    // Only generate a new response if the edited message was from a user
    if (conversationHistory.current[messageIndex].from === 'user') {
      // Generate a new bot response based on the edited context
      try {
        // Build full context from all messages (no token limit)
        let promptContext = '';
        
        // Add active system prompt if available
        if (activePromptId) {
          const activePrompt = systemPrompts.find(p => p.id === activePromptId);
          if (activePrompt) {
            promptContext += `System: ${activePrompt.content}\n`;
          }
        }
        
        for (const msg of conversationHistory.current) {
          promptContext += `${msg.from === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
        }

        const geminiRequest = promptContext;

        // Send the updated context to generate a new bot response
        let res:any;
        if (window.electron?.ipcRenderer?.invoke) {
          res = await window.electron.ipcRenderer.invoke('chatbot:ask-mcp', geminiRequest);
        } else if (window.api?.chatbot?.askMcp) {
          res = await window.api.chatbot.askMcp(geminiRequest);
        }
        
        let botMsg = '';
        if (res?.success) {
          botMsg = res.answer ?? 'No response';
        } else {
          botMsg = res?.error ?? 'Error contacting local LLM';
        }
        
        // Add new bot message to history and UI
        const botMessageId = generateMessageId();
        const botMessage = { text: botMsg, from: 'bot', id: botMessageId };
        
        conversationHistory.current.push(botMessage);
        setMessages(prev => [...prev, botMessage]);
      } catch (err) {
        const errorMsg = (err && typeof err === 'object' && 'message' in err)
          ? (err as any).message
          : String(err);
        
        // Add error message
        const errorMessageId = generateMessageId();
        const errorMessage = { text: 'Error: ' + errorMsg, from: 'bot', id: errorMessageId };
        
        conversationHistory.current.push(errorMessage);
        setMessages(prev => [...prev, errorMessage]);
      }
    }

    // Exit edit mode
    cancelEditing();
  };

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

  // Handle paste event for images
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
      }).filter(Boolean) as Promise<{ base64: string; mime: string }>[];
      if (readers.length > 0) {
        Promise.all(readers).then(newImages => {
          setImages(prev => [...prev, ...newImages]);
        });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Audio recording functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use audio/ogg format
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Always use audio/ogg MIME type as requested
        const blob = new Blob(chunks, { type: 'audio/ogg' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        console.log('Audio recorded:', blob.type, blob.size, 'bytes');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    // Add audio message to chat immediately
    const messageId = generateMessageId();
    const audioMessage = { text: `[Audio message sent - ${formatTime(recordingTime)}]`, from: 'user', id: messageId };
    conversationHistory.current.push(audioMessage);
    setMessages(prev => [...prev, audioMessage]);
    
    // Store the current audioBlob before resetting state
    const currentAudioBlob = audioBlob;
    
    // Reset audio state immediately
    setAudioBlob(null);
    setRecordingTime(0);

    // Add "thinking" message while waiting for response
    const thinkingMessageId = generateMessageId();
    const thinkingMessage = { text: '🎧 Processing audio...', from: 'bot', id: thinkingMessageId };
    conversationHistory.current.push(thinkingMessage);
    setMessages(prev => [...prev, thinkingMessage]);

    // Send audio to webhook using IPC to main process (async)
    try {
      console.log('Converting audio blob to ArrayBuffer...');
      
      // Convert blob to ArrayBuffer
      const arrayBuffer = await currentAudioBlob.arrayBuffer();
      
      console.log('Sending audio via IPC:', {
        size: arrayBuffer.byteLength,
        type: currentAudioBlob.type
      });

      // Use IPC to send from main process
      if (window.electron?.ipcRenderer?.invoke) {
        const result = await window.electron.ipcRenderer.invoke(
          'webhook:send-audio',
          arrayBuffer
        );
        
        console.log('IPC webhook result:', result);
        
        // Remove the "thinking" message first
        conversationHistory.current = conversationHistory.current.filter(msg => msg.id !== thinkingMessageId);
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
        
        if (result.success) {
          console.log('Audio successfully sent to webhook');
          console.log('Raw webhook response:', result.response);
          
          // Parse webhook response and display chatbot message
          try {
            if (result.response) {
              const response = JSON.parse(result.response);
              console.log('Parsed webhook response:', response);
              
              // Handle both array and object response formats
              let botText = null;
              
              if (Array.isArray(response) && response.length > 0) {
                // Response is an array: [{ content: { parts: [{ text: "..." }] } }]
                botText = response[0]?.content?.parts?.[0]?.text;
              } else if (response?.content?.parts) {
                // Response is an object: { content: { parts: [{ text: "..." }] } }
                botText = response.content.parts[0]?.text;
              }
              
              if (botText) {
                // Add bot response to chat
                const botMessageId = generateMessageId();
                const botMessage = { text: botText, from: 'bot', id: botMessageId };
                conversationHistory.current.push(botMessage);
                setMessages(prev => [...prev, botMessage]);
                
                console.log('Bot response added to chat:', botText);
              } else {
                console.warn('No text found in webhook response');
                // Show structure for debugging
                const debugMessageId = generateMessageId();
                const debugMessage = { text: `No text in response. Structure: ${JSON.stringify(response, null, 2)}`, from: 'bot', id: debugMessageId };
                conversationHistory.current.push(debugMessage);
                setMessages(prev => [...prev, debugMessage]);
              }
            } else {
              console.warn('Empty response from webhook');
              const emptyMessageId = generateMessageId();
              const emptyMessage = { text: 'Received empty response from webhook', from: 'bot', id: emptyMessageId };
              conversationHistory.current.push(emptyMessage);
              setMessages(prev => [...prev, emptyMessage]);
            }
          } catch (parseError) {
            console.error('Error parsing webhook response:', parseError);
            console.log('Raw response that failed to parse:', result.response);
            
            // If parsing fails but we have a response, show it as-is
            if (result.response) {
              const rawMessageId = generateMessageId();
              const rawMessage = { text: `Raw webhook response: ${result.response}`, from: 'bot', id: rawMessageId };
              conversationHistory.current.push(rawMessage);
              setMessages(prev => [...prev, rawMessage]);
            }
          }
        } else {
          console.error('Failed to send audio:', result.error || result.statusText);
          
          // Show error message in chat
          const errorMessageId = generateMessageId();
          const errorMessage = { text: `Error sending audio: ${result.error || result.statusText}`, from: 'bot', id: errorMessageId };
          conversationHistory.current.push(errorMessage);
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        console.error('IPC not available');
        
        // Remove thinking message and show error
        conversationHistory.current = conversationHistory.current.filter(msg => msg.id !== thinkingMessageId);
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
        
        const ipcErrorId = generateMessageId();
        const ipcError = { text: 'IPC not available for audio processing', from: 'bot', id: ipcErrorId };
        conversationHistory.current.push(ipcError);
        setMessages(prev => [...prev, ipcError]);
      }
      
    } catch (error) {
      console.error('Error sending audio via IPC:', error);
      
      // Remove thinking message and show error
      conversationHistory.current = conversationHistory.current.filter(msg => msg.id !== thinkingMessageId);
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
      
      // Show error message in chat
      const catchErrorId = generateMessageId();
      const catchError = { text: `Error: ${error instanceof Error ? error.message : String(error)}`, from: 'bot', id: catchErrorId };
      conversationHistory.current.push(catchError);
      setMessages(prev => [...prev, catchError]);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const sendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt && images.length === 0) return;
    
    // Add user message to history
    let userMsgText = prompt;
    if (images.length > 0) {
      userMsgText = `[${images.length} Image${images.length > 1 ? 's' : ''} sent]` + (prompt ? ' ' + prompt : '');
    }
    const messageId = generateMessageId();
    conversationHistory.current.push({ text: userMsgText, from: 'user', id: messageId });
    setMessages((prev) => [
      ...prev,
      { text: userMsgText, from: 'user', id: messageId },
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
      // Build full context from conversation history, without token limits for better accuracy
      let promptContext = '';
      
      // Add active system prompt if available
      if (activePromptId) {
        const activePrompt = systemPrompts.find(p => p.id === activePromptId);
        if (activePrompt) {
          promptContext += `System: ${activePrompt.content}\n`;
        }
      }
      
      for (const msg of conversationHistory.current) {
        promptContext += `${msg.from === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
      }
      geminiRequest = promptContext;
    }

    // Clear images after sending
    setImages([]);

    try {
      // Send the composed prompt context or image+text to the LLM API via IPC (base64 images included)
      let res:any;
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
      const botMessageId = generateMessageId();
      conversationHistory.current.push({ text: botMsg, from: 'bot', id: botMessageId });
      setMessages((prev) => [
        ...prev,
        { text: botMsg, from: 'bot', id: botMessageId },
      ]);
    } catch (err) {
      const errorMsg = (err && typeof err === 'object' && 'message' in err)
        ? (err as any).message
        : String(err);
      const errorMessageId = generateMessageId();
      conversationHistory.current.push({ text: 'Error: ' + errorMsg, from: 'bot', id: errorMessageId });
      setMessages((prev) => [
        ...prev,
        { text: 'Error: ' + errorMsg, from: 'bot', id: errorMessageId },
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
            key={msg.id || i}
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
              position: 'relative',
            }}
            onDoubleClick={() => {
              // Only allow editing user messages that have an ID
              if (msg.from === 'user' && 'id' in msg && msg.id) {
                startEditing(msg.id, msg.text);
              }
            }}
          >
            {/* For editing messages */}
            {('id' in msg) && editingMessageId === msg.id ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                width: '100%',
              }}>
                <textarea
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#fff',
                    border: '1px solid #2d8cff',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: '0.95em',
                    resize: 'vertical',
                  }}
                  autoFocus
                />
                <div style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={cancelEditing}
                    style={{
                      background: 'transparent',
                      border: '1px solid #7ecfff',
                      color: '#7ecfff',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => 'id' in msg && msg.id ? saveEdit(msg.id) : null}
                    style={{
                      background: '#2d8cff',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {msg.from === 'bot' ? (
                  <BotMessage text={msg.text} />
                ) : (
                  <>
                    {msg.text}
                    {/* Only show edit button for messages with an ID */}
                    {'id' in msg && msg.id && (
                      <button
                        onClick={() => startEditing(msg.id!, msg.text)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '0.8em',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                        className="edit-button"
                        title="Edit message"
                      >
                        ✎
                      </button>
                    )}
                  </>
                )}
              </>
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
        
        {/* Audio Recording Button */}
        {!isRecording && !audioBlob ? (
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
            title="Record voice message"
            onClick={startRecording}
          >
            <span style={{ fontSize: 18 }}>🎤</span>
          </button>
        ) : isRecording ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            background: 'rgba(255,0,0,0.10)',
            borderRadius: 8,
            border: '1.5px solid #ff333333',
            padding: '6px 10px',
            color: '#ff7e7e',
          }}>
            <span style={{ fontSize: 18, animation: 'pulse 1s infinite' }}>🎤</span>
            <span style={{ fontSize: '0.9em', minWidth: '40px' }}>{formatTime(recordingTime)}</span>
            <button
              type="button"
              onClick={stopRecording}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.8em',
                cursor: 'pointer',
                marginLeft: 4,
              }}
              title="Stop recording"
            >
              ⏹
            </button>
            <button
              type="button"
              onClick={cancelRecording}
              style={{
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.8em',
                cursor: 'pointer',
                marginLeft: 4,
              }}
              title="Cancel recording"
            >
              ✕
            </button>
          </div>
        ) : audioBlob ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            background: 'rgba(40,167,69,0.10)',
            borderRadius: 8,
            border: '1.5px solid #28a74533',
            padding: '6px 10px',
            color: '#7ecf7e',
          }}>
            <span style={{ fontSize: 18 }}>🎵</span>
            <span style={{ fontSize: '0.9em' }}>{formatTime(recordingTime)}</span>
            <button
              type="button"
              onClick={sendAudio}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.8em',
                cursor: 'pointer',
                marginLeft: 4,
              }}
              title="Send audio"
            >
              📤
            </button>
            <button
              type="button"
              onClick={cancelRecording}
              style={{
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.8em',
                cursor: 'pointer',
                marginLeft: 4,
              }}
              title="Cancel audio"
            >
              ✕
            </button>
          </div>
        ) : null}
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
      {/* System Prompt Modal */}
      <SystemPromptModal 
        isOpen={showSystemPromptModal}
        onClose={() => setShowSystemPromptModal(false)}
        systemPrompts={systemPrompts}
        activePromptId={activePromptId}
        setSystemPrompts={setSystemPrompts}
        setActivePromptId={setActivePromptId}
      />
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

// Add this CSS somewhere in your component or in a style tag
const style = document.createElement('style');
style.textContent = `
  div:hover .edit-button {
    opacity: 1;
  }
  
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export { ChatOverlay };
