
interface StreamChunk {
    text: string;
    candidates?: {
        groundingMetadata?: {
            groundingChunks?: {
                web?: {
                    uri: string;
                    title?: string;
                };
            }[];
        };
    }[];
}

export async function* getMoodleAnswerStream(query: string, context: string): AsyncGenerator<StreamChunk> {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, context }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de red o respuesta no válida.' }));
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("No se pudo obtener el lector de la respuesta del servidor.");
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                try {
                    yield JSON.parse(line);
                } catch (e) {
                    console.error("Error al parsear línea del stream JSON:", line, e);
                }
            }
        }
    }

    if (buffer.trim()) {
       try {
            yield JSON.parse(buffer);
        } catch (e) {
            console.error("Error al parsear buffer final del stream JSON:", buffer, e);
        }
    }
}
