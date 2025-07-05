import { GoogleGenAI } from "@google/genai";

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


export async function getMoodleAnswerStream(query: string, context: string) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("La clave API de Google no está configurada. El propietario de la aplicación debe configurarla en el servidor.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const fullPrompt = `CONTEXTO:
---
${context}
---
PREGUNTA: ${query}`;
    
    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });
        return response;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Fallo al obtener respuesta de la IA. El servicio puede no estar disponible o mal configurado.");
    }
}