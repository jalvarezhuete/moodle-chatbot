import React from 'react';
import { MoodleIcon, AppTitle } from '../constants';

const ConfigNeededScreen = () => {
  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50 text-gray-800">
      <header className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
        <MoodleIcon />
        <h1 className="text-xl font-bold ml-3">{AppTitle}</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-full max-w-3xl bg-white p-10 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Bienvenido! Casi todo está listo.</h2>
          <p className="text-gray-600 mb-6">
            Esta aplicación necesita una clave API de Google para conectar con el modelo de lenguaje Gemini. 
            Como administrador de esta aplicación, debes configurarla para que tus alumnos puedan usarla.
          </p>
          <div className="text-left bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Sigue estos pasos:</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>
                Obtén tu clave API desde Google AI Studio: 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline ml-1 font-medium">
                  aistudio.google.com/app/apikey
                </a>.
              </li>
              <li>
                Despliega esta aplicación en un servicio de hosting (como Vercel, Netlify o similar).
              </li>
              <li>
                En la configuración de tu proyecto en el hosting, busca la sección de "Environment Variables" (Variables de Entorno).
              </li>
              <li>
                Crea una nueva variable con el nombre <code className="bg-gray-200 text-red-600 font-mono p-1 rounded">API_KEY</code> y pega tu clave API como valor.
              </li>
              <li>
                Guarda los cambios y vuelve a desplegar la aplicación. ¡Eso es todo!
              </li>
            </ol>
          </div>
           <p className="text-xs text-gray-400 mt-6">
            Esta pantalla solo es visible para ti. Una vez que la API_KEY esté configurada, tus alumnos verán directamente el asistente de Moodle.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ConfigNeededScreen;
