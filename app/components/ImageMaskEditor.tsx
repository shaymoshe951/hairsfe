import React, { useRef, useState, useEffect } from 'react';
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
    }
  };

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  };

  const sendMaskToServer = async () => {
    if (!canvasRef.current) return;

    setIsSending(true);
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
      console.log('Server response:', data);
      // You can add further handling here, e.g., update UI with response
    } catch (error) {
      console.error('Error sending mask:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative border border-gray-300">
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
      <div className="mt-4 flex items-center gap-4">
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
          {isSending ? 'Sending...' : 'Show Me'}
        </button>
      </div>
    </div>
  );
};

export default ImageMaskEditor;