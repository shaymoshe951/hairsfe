import React, { useRef, useState, useEffect } from 'react';

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
  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set up canvas for masking
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        setContext(ctx);

        // Load the image
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
      }
    }
  }, [imageSrc, width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (context) {
      context.beginPath(); // Reset path to prevent unwanted lines
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      // Handle touch events
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Handle mouse events
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
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        context.drawImage(img, 0, 0, width, height);
      };
    }
  };

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  };

  const prepareUpdatedHair = async () => {
    if (!canvasRef.current) return;
    // Get mask as base64
    const maskData = canvasRef.current.toDataURL('image/png');
    // Get original image as base64
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = 'Anonymous';
    img.onload = async () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0, width, height);
        const imageData = tempCanvas.toDataURL('image/png');
        // POST to model_update_shape
        const response = await fetch('/model_hair_reshape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData, mask: maskData }),
        });
        const data = await response.json();
        setResultImage(data.result_image); // expects base64 string
      }
    };
  };

  return (
    <div className="flex flex-row items-start gap-8">
      {resultImage && (
        <img
          src={resultImage}
          alt="Result"
          style={{ width, height }}
          className="border border-gray-300"
        />
      )}
      <div className="flex flex-col items-center">
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
          className="border border-gray-300"
        />
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
            onClick={prepareUpdatedHair}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Show Me
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageMaskEditor;