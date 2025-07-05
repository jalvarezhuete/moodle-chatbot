
import { GoogleGenAI } from "@google/genai";

// Configuración para que Vercel ejecute esto como una Edge Function, ideal para streaming
export const config = {
  runtime: 'edge',
};

const model = "gemini-2.5-flash-preview-04-17";

const systemInstruction = `Eres un asistente experto especializado en el Sistema de Gestión de Aprendizaje (LMS) Moodle. Tu objetivo es responder a las preguntas de los usuarios de la manera más útil posible.

Tienes dos herramientas a tu disposición:
1. Un conjunto de documentos proporcionados (CONTEXTO).
2. Búsqueda de Google.

Sigue estas reglas para responder:
1. **Prioriza el CONTEXTO**: Primero, busca la respuesta en los documentos de Moodle proporcionados en el CONTEXTO. Basa tu respuesta en esta información si es relevante.
2. **Usa la Búsqueda de Google si es necesario**: Si la pregunta del usuario trata sobre una versión de Moodle diferente a la del CONTEXTO, o si no puedes encontrar una respuesta en el CONTEXTO, utiliza la Búsqueda de Google para encontrar la información más actualizada.
3. **Cita tus fuentes**: Cuando uses la Búsqueda de Google, DEBES citar las fuentes de tu respuesta.
4. **Respuesta cuando no encuentres nada**: Si después de buscar tanto en el CONTEXTO como en la Búsqueda de Google no puedes encontrar una respuesta relevante, informa al usuario que no pudiste encontrar la información.
5. **Idioma**: Responde siempre en español.`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { query, context } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'La clave API de Google no está configurada en el servidor.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const fullPrompt = `CONTEXTO:\n---\n${context || 'No hay contexto proporcionado.'}\n---\nPREGUNTA: ${query}`;
    
    const geminiStream = await ai.models.generateContentStream({
        model: model,
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }],
        },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of geminiStream) {
          // Crea un objeto simplificado que coincide con la estructura esperada por el cliente.
          // El accesor .text proporciona el contenido del texto.
          // Incluimos .candidates para que el cliente pueda acceder a los metadatos de las fuentes.
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
