import { GoogleGenAI, Content } from "@google/genai";
import fs from 'fs';
import path from 'path';

const model = "gemini-2.5-flash-preview-04-17";

// Función para cargar conocimiento dinámicamente desde archivos .txt en la carpeta /data
function loadKnowledge(): string {
  try {
    const dataDirPath = path.resolve('data');
    if (!fs.existsSync(dataDirPath)) {
      console.warn("ADVERTENCIA: La carpeta 'data' no existe. El conocimiento precargado estará vacío.");
      return "No hay conocimiento precargado disponible.";
    }

    const files = fs.readdirSync(dataDirPath);
    const txtFiles = files.filter(file => path.extname(file).toLowerCase() === '.txt');

    if (txtFiles.length === 0) {
      console.warn("ADVERTENCIA: No se encontraron archivos .txt en la carpeta 'data'.");
      return "No hay conocimiento precargado disponible.";
    }

    const knowledgeParts = txtFiles.map(file => {
      const filePath = path.join(dataDirPath, file);
      return fs.readFileSync(filePath, 'utf-8');
    });

    // Une el contenido de todos los archivos con un separador claro
    return knowledgeParts.join('\n\n---\n\n');
  } catch (error) {
    console.error("Error al cargar el conocimiento desde la carpeta 'data':", error);
    return "Error al cargar el conocimiento precargado.";
  }
}

// Carga el conocimiento una vez cuando la función del servidor se inicia
const knowledge = loadKnowledge();

const systemInstruction = `Eres un asistente experto especializado en el Sistema de Gestión de Aprendizaje (LMS) Moodle. Tu objetivo es responder a las preguntas de los usuarios de la manera más útil y formal posible.

Tienes dos herramientas a tu disposición:
1. Un conjunto de documentos internos sobre Moodle (CONTEXTO).
2. Búsqueda de Google.

Sigue estas reglas ESTRICTAMENTE:
1. **Prioriza el CONTEXTO**: Siempre, y como primera opción, busca la respuesta en el CONTEXTO proporcionado a continuación. Basa tu respuesta en esta información si es relevante.
2. **Usa la Búsqueda de Google si es necesario**: SOLO si la pregunta no puede ser respondida con el CONTEXTO (por ejemplo, si se pregunta por una versión muy específica, un plugin de terceros, o un tema no cubierto), utiliza la Búsqueda de Google.
3. **Cita tus fuentes SIEMPRE que uses la Búsqueda**: Si tu respuesta se basa en información de la búsqueda web, DEBES citar las fuentes.
4. **Respuesta Formal**: Mantén siempre un tono profesional y formal.
5. **Idioma**: Responde siempre en español.

CONTEXTO INTERNO:
---
${knowledge}
---
`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { query, history } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'La clave API de Google no está configurada en el servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
        model: model,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }],
        },
        history: (history || []) as Content[],
    });
    
    const geminiStream = await chat.sendMessageStream({ message: query });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of geminiStream) {
          const simplifiedChunk = {
            text: chunk.text,
            candidates: chunk.candidates,
          };
          const chunkString = JSON.stringify(simplifiedChunk) + '\n';
          controller.enqueue(encoder.encode(chunkString));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Error en la función de API:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return new Response(JSON.stringify({ error: `Error interno del servidor: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}