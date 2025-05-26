import { useState } from 'react';
import './App.css';

function App() {
  const [consulta, setConsulta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarConsulta = async () => {
    setCargando(true);
    setRespuesta('');
    try {
      const res = await fetch('https://backpilotoia-f7eeapfvazc3axcu.canadacentral-01.azurewebsites.net/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensaje: consulta }),
      });

      const data = await res.json();
      setRespuesta(data.respuesta);
    } catch (error) {
      setRespuesta('Error al consultar la API');
    } finally {
      setCargando(false);
    }
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

          {/* INFO para pantallas medianas y pequeñas */}
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
          <button onClick={manejarConsulta} className='Boton' disabled={cargando}>
            {cargando ? <div className="spinner"></div> : 'Enviar'}
          </button>
        </div>

        <textarea
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

        {/* INFO para pantallas grandes */}
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
}

export default App;
