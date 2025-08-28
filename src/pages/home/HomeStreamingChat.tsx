import { useState, useRef, useEffect } from 'react';
import AIConfigPanel from '../../components/AIConfigPanel/AIConfigPanel';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIConfig {
  user_id: string;
  company_id: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
}

const HomeStreamingChat = () => {
  const [consulta, setConsulta] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [cargando, setCargando] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    user_id: 'user123',
    company_id: 'CIA00001',
    similarity_threshold: 0.4,
    temperature: 0.3,
    max_tokens: 1024,
  });
  const [configExpanded, setConfigExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Use both setTimeout and requestAnimationFrame for more reliable scrolling
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (messagesEndRef.current) {
          const container = messagesEndRef.current.parentElement;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 50);
    });
  };

  // More robust scroll effect
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Additional effect for streaming messages
  useEffect(() => {
    if (streamingMessageId) {
      scrollToBottom();
    }
  }, [streamingMessageId]);

  const manejarConsulta = async () => {
    if (!consulta.trim()) return;

    setCargando(true);
    
    // Store the current question before clearing input
    const currentConsulta = consulta;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentConsulta,
      timestamp: new Date()
    };
    
    // Add AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setStreamingMessageId(aiMessageId);
    setConsulta('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/chat-streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' ,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({
          message: currentConsulta,
          user_id: aiConfig.user_id,
          company_id: aiConfig.company_id,
          similarity_threshold: aiConfig.similarity_threshold,
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.max_tokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const flushBlock = (block: string) => {
        const lines = block.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const evt = JSON.parse(jsonStr);
            if (evt.type === 'chunk' && typeof evt.content === 'string') {
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: evt.content }
                  : msg
              ));
            } else if (evt.type === 'complete') {
              controller.abort();
            }
          } catch {
            // ignoramos frames inválidos
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) flushBlock(part);
      }

      if (buffer.trim()) flushBlock(buffer);
    } catch (err) {
      if (err instanceof DOMException && err?.name !== 'AbortError') {
        console.error(err);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: 'Error al consultar la API' }
            : msg
        ));
      }
    } finally {
      setCargando(false);
      setStreamingMessageId(null);
    }
  };

  const cancelar = () => {
    abortRef.current?.abort();
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`message-container ${message.type}`}>
      <div className={`message-card ${message.type}`}>
        <div className="message-header">
          <span className="message-sender">
            {message.type === 'user' ? `👤 ${aiConfig.user_id}` : '🤖 Piloto IA'}
          </span>
          <span className="message-time">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="message-content">
          {message.content || (message.type === 'ai' ? 'Escribiendo...' : '')}
          {streamingMessageId === message.id && (
            <span className="typing-indicator">▊</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="contenido">
      <img
        src="https://staffing.fractal.com.pe/img/fractal-logo.png"
        className="fractal"
        alt="Logo Fractal"
      />

      <section className="chat-section">
        <div className="chat-header">
          <h1 className="Titulo">Piloto IA</h1>
          <div className="info-container info-mediana">
            <label className="info-label">
              <b>{aiConfig.company_id}</b><br />
            </label>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="welcome-card">
                <h3>💬 ¡Bienvenido al Piloto IA!</h3>
                <p>Haz tu primera consulta sobre {aiConfig.company_id}</p>
              </div>
            </div>
          ) : (
            messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="input-wrapper">
            <textarea
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder={`Escribe tu consulta sobre ${aiConfig.company_id}...`}
              className="chat-input"
              disabled={cargando}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  manejarConsulta();
                }
              }}
            />
            <div className="input-buttons">
              {cargando ? (
                <button onClick={cancelar} className="cancel-btn">
                  ⏹️ Detener
                </button>
              ) : (
                <button 
                  onClick={manejarConsulta} 
                  className="send-btn" 
                  disabled={!consulta.trim()}
                >
                  ▶️ Enviar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={`image-section ${configExpanded ? 'config-expanded' : ''}`}>
        <img
          src="https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/reportajes/las-mentiras-visuales-de-la-ia/11896126-1-esl-MX/Las-mentiras-visuales-de-la-IA.jpg"
          className="imagen"
          alt="Imagen IA"
        />

        <div className="info-container info-grande">
          <label className="info-label">
            <b>{aiConfig.company_id}</b><br />
          </label>
        </div>

        <AIConfigPanel 
          onConfigChange={setAiConfig}
          initialConfig={aiConfig}
          onExpandedChange={setConfigExpanded}
        />
      </section>
    </div>
  );
};


export default HomeStreamingChat;