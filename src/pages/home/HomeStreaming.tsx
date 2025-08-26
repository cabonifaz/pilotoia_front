import { useState, useRef } from 'react';

const HomeStreaming = () => {
  const [consulta, setConsulta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const respuestaRef = useRef<HTMLTextAreaElement>(null);

  const manejarConsulta = async () => {
    setCargando(true);
    setRespuesta('');

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
          message: consulta,
          user_id: 'user123',
          company_id: 'Edificaciones',
          similarity_threshold: 0.7,
          temperature: 0.3,
          max_tokens: 512,
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
        // Cada bloque puede tener varias líneas: buscamos las que empiezan con "data:"
        const lines = block.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim(); // quita "data:"
          if (!jsonStr) continue;

          try {
            const evt = JSON.parse(jsonStr);
            // Tu backend envía: metadata | chunk | complete
            if (evt.type === 'chunk' && typeof evt.content === 'string') {
              // El servidor ya concatena el contenido, así que solo reflejamos
              setRespuesta(evt.content);
              queueMicrotask(() => {
                if (respuestaRef.current) {
                  respuestaRef.current.scrollTop = respuestaRef.current.scrollHeight;
                }
              })
            } else if (evt.type === 'complete') {
              controller.abort();
            }
            // Si quieres usar metadata/complete, puedes manejarlo aquí
          } catch {
            // ignoramos frames inválidos
          }
        }
      };

      // Leer el stream por partes
       
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Los eventos SSE vienen separados por "\n\n"
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) flushBlock(part);
      }

      // Si quedó algo sin el separador final, intenta procesarlo
      if (buffer.trim()) flushBlock(buffer);
    } catch (err) {
      if (err instanceof DOMException && err?.name !== 'AbortError') {
        console.error(err);
        setRespuesta('Error al consultar la API');
      }
    } finally {
      setCargando(false);
    }
  };

  const cancelar = () => {
    abortRef.current?.abort();
  };

  return (
    <div className='contenido'>
      <img
        src="https://staffing.fractal.com.pe/img/fractal-logo.png"
        className='fractal'
        alt="Logo Fractal"
      />

      <section className='izquierda'>
        <div className="titulo-info">
          <h1 className='Titulo'>Piloto IA</h1>

          <div className="info-container info-mediana">
            <label className="info-label">
              <b>Reglamento de la Ley N° 32069, ley general de contrataciones públicas</b><br />
            </label>
            <a
              href="https://acortar.link/Rtr3wE"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              https://acortar.link/Rtr3wE
            </a>
          </div>
        </div>

        <div className='formulario'>
          <textarea
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Escribe tu consulta"
            className='pregunta'
            disabled={cargando}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={manejarConsulta} className='Boton' disabled={cargando}>
              {cargando ? <div className="spinner"></div> : 'Enviar'}
            </button>
            <button onClick={cancelar} className='Boton' disabled={!cargando}>
              Cancelar
            </button>
          </div>
        </div>

        <textarea
          ref={respuestaRef}
          value={respuesta}
          readOnly
          className='respuesta'
        />
      </section>

      <section>
        <img
          src='https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/reportajes/las-mentiras-visuales-de-la-ia/11896126-1-esl-MX/Las-mentiras-visuales-de-la-IA.jpg'
          className='imagen'
          alt="Imagen IA"
        />

        <div className="info-container info-grande">
          <label className="info-label">
            <b>Reglamento de la Ley N° 32069, ley general de contrataciones públicas</b><br />
          </label>
          <a
            href="https://acortar.link/Rtr3wE"
            target="_blank"
            rel="noopener noreferrer"
            className="info-link"
          >
            https://acortar.link/Rtr3wE
          </a>
        </div>
      </section>
    </div>
  );
};


export default HomeStreaming;