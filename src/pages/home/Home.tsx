import { useState } from 'react';

export const HomePage = () => {
    const [consulta, setConsulta] = useState('');
    const [respuesta, setRespuesta] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarConsulta = async () => {
        setCargando(true);
        setRespuesta('');
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: consulta,
                  user_id: "user123",
                  company_id: "Edificaciones",
                  similarity_threshold: 0.7,
                  temperature: 0.3,
                  max_tokens: 512
                }),
            });
            console.log(res)
            const data = await res.json();
            setRespuesta(data.answer);
        } catch (error) {
            console.log(error)
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
};
