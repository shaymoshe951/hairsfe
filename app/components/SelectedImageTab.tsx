"use client";
import React from "react";
import ImagePreview from "./ImagePreview";
import { ModelProfile } from "../types";
import { fetchWithErrorHandling, pollTaskStatus } from "../utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface SelectedImageTabProps {
  imageSrc: string;
  title: string;
  modelProfile?: ModelProfile;
  onApplyColor?: (newImage: string) => void;
}

type ViewMode = 'preview' | 'color-edit' | 'shape-edit';

interface HairColor {
  Category: string;
  Code: string;
  Name: string;
  Description: string;
  imagePath: string;
}

const hairColorDict: Record<string, HairColor> = {
  "1": { Category: "Classic", Code: "1", Name: "Black", Description: "", imagePath: "/resources/hair_colors/1.png" },
  "3": { Category: "Classic", Code: "3", Name: "Very Dark Brown", Description: "", imagePath: "/resources/hair_colors/3.png" },
  "4": { Category: "Classic", Code: "4", Name: "Dark Brown", Description: "", imagePath: "/resources/hair_colors/4.png" },
  "5": { Category: "Classic", Code: "5", Name: "Medium Brown", Description: "", imagePath: "/resources/hair_colors/5.png" },
  "6": { Category: "Classic", Code: "6", Name: "Light Brown", Description: "", imagePath: "/resources/hair_colors/6.png" },
  "7": { Category: "Classic", Code: "7", Name: "Dark Blonde", Description: "", imagePath: "/resources/hair_colors/7.png" },
  "8": { Category: "Classic", Code: "8", Name: "Light Blonde", Description: "", imagePath: "/resources/hair_colors/8.png" },
  "9": { Category: "Classic", Code: "9", Name: "Very Light Blonde", Description: "", imagePath: "/resources/hair_colors/9.png" },
  // Add other categories and colors as needed
  "1.1": { Category: "Cool / Ash", Code: "1.1", Name: "Blue Black", Description: "Very dark with a blue undertone", imagePath: "/resources/hair_colors/1.1.png" },
  "4.1": { Category: "Cool / Ash", Code: "4.1", Name: "Ash Brown", Description: "Medium brown with ash undertones", imagePath: "/resources/hair_colors/4.1.png" },
  "9.3": { Category: "Golden / Warm", Code: "9.3", Name: "Very Light Golden Blonde", Description: "Warm pale blonde", imagePath: "/resources/hair_colors/9.3.png" },
  "8.8": { Category: "Mocha", Code: "8.8", Name: "Light Mocha Blonde", Description: "Medium-light blonde with mocha tone", imagePath: "/resources/hair_colors/8.8.png" },
  "4.2": { Category: "Fashion", Code: "4.2", Name: "Intense Violet Brown", Description: "Deep brown with purple tone", imagePath: "/resources/hair_colors/4.2.png" },
};

export default function SelectedImageTab({ imageSrc, title, modelProfile, onApplyColor }: SelectedImageTabProps) {
  const [currentView, setCurrentView] = React.useState<ViewMode>('preview');
  const [selectedColor, setSelectedColor] = React.useState<HairColor | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>("Classic");
  const [isProcessingColor, setIsProcessingColor] = React.useState(false);
  const [colorResultImage, setColorResultImage] = React.useState<string | null>(null);
  const [colorTaskId, setColorTaskId] = React.useState<string | null>(null);
  const [colorProgress, setColorProgress] = React.useState<number>(0);

  React.useEffect(() => {
    setColorResultImage(imageSrc);
  }, [imageSrc]);

  const handleDownload = async () => {
    try {
      if (!modelProfile?.resultImage) {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = `${title}_style.jpg`;
        link.click();
        return;
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img1 = new Image();
      const img2 = new Image();
      img1.crossOrigin = "anonymous";
      img2.crossOrigin = "anonymous";
      const load = (img: HTMLImageElement, src: string) =>
        new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = rej;
          img.src = src;
        });
      await Promise.all([load(img1, imageSrc), load(img2, modelProfile.resultImage)]);
      const padding = 20;
      canvas.width = img1.width + img2.width + padding;
      canvas.height = Math.max(img1.height, img2.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img1, 0, 0);
      ctx.drawImage(img2, img1.width + padding, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${title}_combined.jpg`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, "image/jpeg", 0.9);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const getColorsByCategory = (category: string): HairColor[] => {
    return Object.values(hairColorDict).filter(color => color.Category === category);
  };

  const getAllCategories = (): string[] => {
    return Array.from(new Set(Object.values(hairColorDict).map(color => color.Category)));
  };

  const handleColorSelect = async (color: HairColor) => {
    setSelectedColor(color);
    
    // Call the model_haircolor API
    try {
      setIsProcessingColor(true);
      setColorResultImage(null); // Reset previous result
      setColorProgress(0); // Reset progress
      
      const response = await fetchWithErrorHandling(`${API_BASE_URL}/start/model_haircolor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc, color: color.Name }),
      });
      
      const { task_id } = response;
      setColorTaskId(task_id);
      
      // Use the existing pollTaskStatus function
      try {
        const result = await pollTaskStatus(task_id, setColorProgress, "hair color processing");
        
        // Handle the result
        if (result.result || result.resultImage || result.image || result.data) {
          const resultImage = result.result || result.resultImage || result.image || result.data;
          setColorResultImage(resultImage);
          setColorProgress(100);
        } else {
          console.error("No result image found in response:", result);
        }
      } catch (error) {
        console.error("Error polling color task status:", error);
      } finally {
        setIsProcessingColor(false);
      }
      
    } catch (error) {
      console.error("Error starting hair color processing:", error);
      setIsProcessingColor(false);
      setColorProgress(0);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedColor(null); // Reset selected color when changing category
    setColorResultImage(null); // Reset result image
    setColorProgress(0); // Reset progress
  };

  const renderColorEditView = () => {
    const categories = getAllCategories();
    const colors = selectedCategory ? getColorsByCategory(selectedCategory) : [];

    return (
      <div className="w-full animate-fade-in flex">
        {/* Vertical Category Selection */}
        <div className="w-1/6 p-4 bg-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Categories</h3>
          {categories.map((category) => (
            <button
              key={category}
              className={`w-full text-left py-2 mb-2 text-sm text-gray-700 hover:bg-gray-200 rounded ${
                selectedCategory === category ? 'bg-blue-200 font-bold' : ''
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="w-5/6 p-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Choose Hair Color</h2>
            <p className="text-gray-500 mt-2">Select a color to apply to your hairstyle</p>
            {selectedColor && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">Selected: {selectedColor.Name}</p>
                <p className="text-blue-600 text-sm">{selectedColor.Description}</p>
              </div>
            )}
          </div>
          
          {/* Image Comparison Section */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-8 items-start">
              {/* Original Image */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Original</h3>
                <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
                  <ImagePreview src={imageSrc} alt={title} className="rounded-lg shadow-md" />
                </div>
              </div>
              
              {/* Result Image */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Result</h3>
                <div className="bg-gray-100 rounded-lg p-4 max-w-xs min-h-[200px] flex items-center justify-center">
                  {isProcessingColor ? (
                    <div className="text-center w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600 mb-3">Processing color...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${colorProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{colorProgress}%</p>
                    </div>
                  ) : selectedColor && colorResultImage ? (
                    <ImagePreview src={colorResultImage} alt={`${title} with ${selectedColor?.Name}`} className="rounded-lg shadow-md" />
                  ) : (
                    <div className="text-center text-gray-500">
                      <p className="text-sm">Select a color to see the result</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto mb-12">
            {selectedCategory && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  {selectedCategory}
                </h3>
                <div className="flex justify-center gap-4 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.Code}
                      className={`group flex flex-col items-center p-2 rounded-full transition-all duration-200 ${
                        selectedColor?.Code === color.Code
                          ? 'ring-2 ring-blue-500'
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                      onClick={() => handleColorSelect(color)}
                      title={color.Description}
                      disabled={isProcessingColor}
                    >
                      <div className="relative">
                        <img
                          src={color.imagePath}
                          alt={color.Name}
                          className="w-16 h-16 rounded-full object-cover shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLDivElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                        <div
                          className="w-16 h-16 rounded-full shadow-md bg-gray-300 hidden"
                          style={{ backgroundColor: '#8d6e63' }}
                        />
                      </div>
                      <span className="text-xs text-gray-700 mt-2 text-center leading-tight font-medium">
                        {color.Name}
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        {color.Code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentView('preview')}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transform transition-all duration-200 hover:scale-105"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H6m0 0l4-4m-4 4l4 4"/>
              </svg>
              <span>Back to Preview</span>
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 ${
                selectedColor && colorResultImage
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!selectedColor || !colorResultImage}
              onClick={() => {
                if (selectedColor && colorResultImage && onApplyColor) {
                  onApplyColor(colorResultImage);
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>Apply Color</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewView = () => (
    <div className="flex flex-col items-center h-full w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-1">Your selected hairstyle preview</p>
      </div>
      <div className="flex flex-wrap justify-center gap-12 items-start max-w-full mb-8">
        <div className="flex flex-col items-center animate-fade-in">
          <h3 className="text-lg font-medium text-gray-700 mb-2 transition-all duration-300">Front View</h3>
          <div className="transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
            <ImagePreview src={imageSrc} alt={title} className="rounded-xl shadow-md max-w-xs transition-all duration-300" />
          </div>
        </div>
        {modelProfile?.resultImage && (
          <div className="flex flex-col items-center animate-slide-in-right">
            <h3 className="text-lg font-medium text-gray-700 mb-2 transition-all duration-300">Side View</h3>
            <div className="transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <ImagePreview src={modelProfile.resultImage} alt={`${title} Profile`} border className="rounded-xl shadow-md max-w-xs transition-all duration-300" />
            </div>
          </div>
        )}
        {modelProfile?.status === "processing" && (
          <div className="flex flex-col items-center w-full max-w-md text-center mt-8 animate-pulse-gentle">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 animate-fade-in">Processing Style...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out animate-pulse"
                style={{ width: `${modelProfile.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 animate-fade-in">{modelProfile.progress}%</p>
          </div>
        )}
        {modelProfile?.status === "error" && (
          <div className="flex flex-col items-center mt-8 animate-shake">
            <h3 className="text-lg font-semibold text-red-600 mb-2 animate-fade-in">Processing Error</h3>
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 transform transition-all duration-300 hover:scale-105">
              <p className="text-red-700 text-sm">{modelProfile.error}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-auto animate-fade-in-up">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <DownloadIcon />
          <span>Download</span>
        </button>
        <button
          onClick={() => setCurrentView('color-edit')}
          className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <ColorIcon />
          <span>Edit Hair Color</span>
        </button>
        <button
          onClick={() => setCurrentView('shape-edit')}
          className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <BrushIcon />
          <span>Manual Edit Hair Shape</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      {currentView === 'preview' && renderPreviewView()}
      {currentView === 'color-edit' && renderColorEditView()}
      {currentView === 'shape-edit' && (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Manual Hair Shape Editor</h2>
          <p className="text-gray-500 mb-8">Coming soon...</p>
          <button
            onClick={() => setCurrentView('preview')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transform transition-all duration-200 hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H6m0 0l4-4m-4 4l4 4"/>
            </svg>
            <span>Back to Preview</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}