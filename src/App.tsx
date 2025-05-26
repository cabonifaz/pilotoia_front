import { useState } from 'react';
import './App.css';

function App() {
  const [consulta, setConsulta] = useState('');
  const [respuesta, setRespuesta] = useState('');

  const manejarConsulta = async () => {
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
    }
  };

  return (
    <div className='contenido'>
      <img 
        src = "https://staffing.fractal.com.pe/img/fractal-logo.png"
        className='fractal'
      />
      <section className='izquierda'>
        <h1 className='Titulo'>Piloto IA </h1> 
        <div className='formulario'>
          <textarea
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Escribe tu consulta"
            className='pregunta'
          />
          <button onClick={manejarConsulta} className='Boton'>
            Enviar
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
        />
        <div className="info-container">
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