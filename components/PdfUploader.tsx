import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadIcon, LoadingSpinner } from '../constants';

// Set the worker source for pdf.js. This is required for it to work in a web environment.
// We are using a stable version from a CDN to match the library version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

interface PdfUploaderProps {
  onProcessStart: () => void;
  onProcessComplete: (text: string) => void;
  onProcessError: (error: string) => void;
  isProcessing: boolean;
  error: string | null;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ 
  onProcessStart, 
  onProcessComplete,
  onProcessError,
  isProcessing,
  error 
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      onProcessError("No se seleccionaron archivos.");
      return;
    }

    onProcessStart();
    let combinedText = '';

    try {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
            console.warn(`Omitiendo archivo no PDF: ${file.name}`);
            continue;
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
          combinedText += pageText + '\n\n';
        }
      }

      if(!combinedText.trim()){
        throw new Error("No se pudo extraer texto de los PDF proporcionados. Asegúrese de que contengan texto seleccionable.");
      }
      onProcessComplete(combinedText);
    } catch (e) {
        console.error("Error al procesar los PDFs:", e);
        const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido durante el procesamiento del PDF.";
        onProcessError(errorMessage);
    }
  }, [onProcessStart, onProcessComplete, onProcessError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);


  return (
    <div className="flex-1 flex items-center justify-center w-full h-full">
      <div className="w-full max-w-2xl text-center">
        <form 
            id="form-file-upload" 
            className={`relative w-full h-80 rounded-2xl border-2 border-dashed ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white'} transition-all duration-300 flex flex-col items-center justify-center p-8`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onSubmit={(e) => e.preventDefault()}
        >
          <input 
            type="file" 
            id="input-file-upload" 
            multiple={true} 
            className="hidden" 
            accept=".pdf"
            onChange={handleChange}
            disabled={isProcessing}
          />
          <label htmlFor="input-file-upload" className="h-full w-full flex flex-col items-center justify-center cursor-pointer">
            <UploadIcon />
            <p className="font-semibold text-gray-700 mt-4">
                Arrastra y suelta tus documentos PDF de Moodle aquí
            </p>
            <p className="text-gray-500 text-sm mt-1">o haz clic para explorar</p>
            <button
                type="button"
                onClick={() => document.getElementById('input-file-upload')?.click()}
                disabled={isProcessing}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
                Seleccionar Archivos
            </button>
          </label>
        </form>

        {isProcessing && (
            <div className="mt-6 flex items-center justify-center">
                <LoadingSpinner />
                <p className="ml-3 text-gray-600 font-medium">Analizando la documentación... esto puede tardar un momento.</p>
            </div>
        )}
        {error && (
            <div className="mt-4 text-red-600 bg-red-100 border border-red-400 rounded-lg p-3">
                <strong>Error:</strong> {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default PdfUploader;