import React, { useRef, useState, useEffect } from 'react';
import { fetchWithErrorHandling, pollTaskStatus } from "../utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface ImageMaskEditorProps {
  imageSrc: string;
  width?: number;
  height?: number;
}

const ImageMaskEditor: React.FC<ImageMaskEditorProps> = ({ imageSrc, width = 500, height = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultDimensions, setResultDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(233, 200, 200, 0.5)'; // Semi-transparent red for mask visibility
        setContext(ctx);
      }
    }
  }, [width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (context) {
      context.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.lineWidth = brushSize;
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  };

  const clearMask = () => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, width, height);
      setResultImage(null); // Clear result image when mask is cleared
      setResultDimensions(null);
    }
  };

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  };

  const sendMaskToServer = async () => {
    if (!canvasRef.current) return;

    setIsSending(true);
    setProgress(0);
    setResultImage(null);
    setResultDimensions(null);

    try {
      const maskData = canvasRef.current.toDataURL('image/png');
      const response = await fetch(`${API_BASE_URL}/start/model_hair_reshape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc, mask: maskData }),
      });

      if (!response.ok) {
        throw new Error('Failed to send mask');
      }

      const data = await response.json();
      const { task_id } = data;

      // Poll task status for progress
      const result = await pollTaskStatus(task_id, setProgress, "hair mask processing");

      // Handle the result
      if (result.result || result.resultImage || result.image || result.data) {
        const resultImageUrl = result.result || result.resultImage || result.image || result.data;
        setResultImage(resultImageUrl);

        // Determine the natural dimensions of the result image
        const img = new Image();
        img.onload = () => {
          setResultDimensions({ width: img.width, height: img.height });
        };
        img.src = resultImageUrl;
        setProgress(100);
      } else {
        console.error('No result image found in response:', result);
      }
    } catch (error) {
      console.error('Error sending mask:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-start gap-8">
      <div className="flex flex-col items-center">
        <div className="relative border border-gray-300" style={{ width: `${width}px`, height: `${height}px` }}>
          <img
            src={imageSrc}
            alt="Original image"
            width={width}
            height={height}
            className="block"
          />
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute top-0 left-0"
            style={{ background: 'transparent' }}
          />
        </div>
        <div className="mt-4 flex flex-col items-center gap-4 w-full max-w-md">
          <div className="flex items-center gap-4">
            <label>
              Brush Size:
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={handleBrushSizeChange}
                className="ml-2"
              />
            </label>
            <button
              onClick={clearMask}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Mask
            </button>
            <button
              onClick={sendMaskToServer}
              disabled={isSending}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSending ? 'Processing...' : 'Show Me'}
            </button>
          </div>
          {isSending && (
            <div className="w-full mt-4">
              <p className="text-sm text-gray-600 mb-2">Processing mask...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center" style={{ minWidth: `${width}px`, minHeight: `${height}px` }}>
        {resultImage && !isSending && (
          <div className="flex flex-col items-center">
            <img
              src={resultImage}
              alt="Processed mask result"
              width={resultDimensions?.width || width}
              height={resultDimensions?.height || height}
              className="rounded-lg shadow-md border border-gray-300"
            />
            <h3 className="text-lg font-medium text-gray-700 mt-2">Processed Result</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageMaskEditor;