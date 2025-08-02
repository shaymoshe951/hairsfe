"use client";

import React from "react";
import ImagePreview from "./ImagePreview";
import { ModelProfile } from "../types";

interface SelectedImageTabProps {
  imageSrc: string;
  title: string;
  modelProfile?: ModelProfile;
}

type ViewMode = 'preview' | 'color-edit' | 'shape-edit';

// Hair color data structure based on the Python reference
interface HairColor {
  Category: string;
  Code: string;
  Name: string;
  Description: string;
  imagePath: string;
}

const hairColorDict: Record<string, HairColor> = {
  "1.1": { Category: "Cool / Ash", Code: "1.1", Name: "Blue Black", Description: "Very dark with a blue undertone", imagePath: "/resources/hair_colors/1.1.png" },
  "4.1": { Category: "Cool / Ash", Code: "4.1", Name: "Ash Brown", Description: "Medium brown with ash undertones", imagePath: "/resources/hair_colors/4.1.png" },
  "5.1": { Category: "Cool / Ash", Code: "5.1", Name: "Light Ash Brown", Description: "Slightly lighter ash brown", imagePath: "/resources/hair_colors/5.1.png" },
  "6.1": { Category: "Cool / Ash", Code: "6.1", Name: "Dark Ash Blonde", Description: "Cool-toned dark blonde", imagePath: "/resources/hair_colors/6.1.png" },
  "7.1": { Category: "Cool / Ash", Code: "7.1", Name: "Ash Blonde", Description: "Medium blonde with silvery undertones", imagePath: "/resources/hair_colors/7.1.png" },
  "8.1": { Category: "Cool / Ash", Code: "8.1", Name: "Light Ash Blonde", Description: "Light cool blonde", imagePath: "/resources/hair_colors/8.1.png" },
  "9.3": { Category: "Golden / Warm", Code: "9.3", Name: "Very Light Golden Blonde", Description: "Warm pale blonde", imagePath: "/resources/hair_colors/9.3.png" },
  "8.03": { Category: "Golden / Warm", Code: "8.03", Name: "Light Natural-Golden Blonde", Description: "Natural golden tone", imagePath: "/resources/hair_colors/8.03.png" },
  "8.3": { Category: "Golden / Warm", Code: "8.3", Name: "Light Golden Blonde", Description: "Golden light blonde", imagePath: "/resources/hair_colors/8.3.png" },
  "7.3": { Category: "Golden / Warm", Code: "7.3", Name: "Dark Golden Blonde", Description: "Warm golden dark blonde", imagePath: "/resources/hair_colors/7.3.png" },
  "6.34": { Category: "Golden / Warm", Code: "6.34", Name: "Light Brown with Gold-Copper", Description: "Golden-copper brown", imagePath: "/resources/hair_colors/6.34.png" },
  "6.3": { Category: "Golden / Warm", Code: "6.3", Name: "Light Golden Brown", Description: "Warm light brown", imagePath: "/resources/hair_colors/6.3.png" },
  "8.8": { Category: "Mocha", Code: "8.8", Name: "Light Mocha Blonde", Description: "Medium-light blonde with mocha tone", imagePath: "/resources/hair_colors/8.8.png" },
  "7.8": { Category: "Mocha", Code: "7.8", Name: "Mocha Blonde", Description: "Slightly darker mocha blonde", imagePath: "/resources/hair_colors/7.8.png" },
  "6.8": { Category: "Mocha", Code: "6.8", Name: "Dark Mocha Blonde", Description: "Deep warm blonde with mocha", imagePath: "/resources/hair_colors/6.8.png" },
  "5.8": { Category: "Mocha", Code: "5.8", Name: "Light Mocha Brown", Description: "Rich warm light brown", imagePath: "/resources/hair_colors/5.8.png" },
  "4.8": { Category: "Mocha", Code: "4.8", Name: "Mocha Brown", Description: "Warm medium brown", imagePath: "/resources/hair_colors/4.8.png" },
  "4.2": { Category: "Fashion", Code: "4.2", Name: "Intense Violet Brown", Description: "Deep brown with purple tone", imagePath: "/resources/hair_colors/4.2.png" },
  "9.22": { Category: "Fashion", Code: "9.22", Name: "Very Light Blonde – Deep Iris", Description: "Pale blonde with violet/iridescent", imagePath: "/resources/hair_colors/9.22.png" },
  "9.2": { Category: "Fashion", Code: "9.2", Name: "Very Light Blonde – Iridescent Ash", Description: "Pale ash with iridescent tones", imagePath: "/resources/hair_colors/9.2.png" },
  "9": { Category: "Classic", Code: "9", Name: "Very Light Blonde", Description: "", imagePath: "/resources/hair_colors/9.png" },
  "8": { Category: "Classic", Code: "8", Name: "Light Blonde", Description: "", imagePath: "/resources/hair_colors/8.png" },
  "7": { Category: "Classic", Code: "7", Name: "Dark Blonde", Description: "", imagePath: "/resources/hair_colors/7.png" },
  "6": { Category: "Classic", Code: "6", Name: "Light Brown", Description: "", imagePath: "/resources/hair_colors/6.png" },
  "5": { Category: "Classic", Code: "5", Name: "Medium Brown", Description: "", imagePath: "/resources/hair_colors/5.png" },
  "4": { Category: "Classic", Code: "4", Name: "Dark Brown", Description: "", imagePath: "/resources/hair_colors/4.png" },
  "3": { Category: "Classic", Code: "3", Name: "Very Dark Brown", Description: "", imagePath: "/resources/hair_colors/3.png" },
  "1": { Category: "Classic", Code: "1", Name: "Black", Description: "", imagePath: "/resources/hair_colors/1.png" },
};

export default function SelectedImageTab({ imageSrc, title, modelProfile }: SelectedImageTabProps) {
  const [currentView, setCurrentView] = React.useState<ViewMode>('preview');
  const [selectedColor, setSelectedColor] = React.useState<HairColor | null>(null);

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

  const handleColorSelect = (color: HairColor) => {
    setSelectedColor(color);
    console.log(`Selected color: ${color.Name} (${color.Code})`);
    // Here you would implement the actual color application logic
  };

  const renderColorEditView = () => {
    const categories = getAllCategories();

    return (
      <div className="w-full animate-fade-in">
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

        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
            <ImagePreview src={imageSrc} alt={title} className="rounded-lg shadow-md" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-12">
          {categories.map((category) => {
            const categoryColors = getColorsByCategory(category);
            const mid = Math.ceil(categoryColors.length / 2);
            const row1 = categoryColors.slice(0, mid);
            const row2 = categoryColors.slice(mid);
            return (
              <div key={category} className="mb-10">
                <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center border-b border-gray-200 pb-2">
                  {category}
                </h3>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-row justify-center gap-4 md:gap-8 lg:gap-12 xl:gap-16 flex-wrap">
                    {row1.map((color) => (
                      <button
                        key={color.Code}
                        className={`group flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                          selectedColor?.Code === color.Code 
                            ? 'bg-blue-100 border-2 border-blue-500' 
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                        onClick={() => handleColorSelect(color)}
                        title={color.Description}
                      >
                        <div className="relative">
                          <img
                            src={color.imagePath}
                            alt={color.Name}
                            className={`w-16 h-16 rounded-full border-2 border-gray-300 group-hover:border-gray-400 group-hover:scale-110 transition-all duration-200 shadow-md object-cover ${
                              selectedColor?.Code === color.Code ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onError={(e) => {
                              // Fallback to a colored div if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                          <div 
                            className="w-16 h-16 rounded-full border-2 border-gray-300 group-hover:border-gray-400 group-hover:scale-110 transition-all duration-200 shadow-md bg-gray-300 hidden"
                            style={{ backgroundColor: '#8d6e63' }} // Fallback color
                          />
                        </div>
                        <span className="text-xs text-gray-600 mt-2 text-center leading-tight font-medium">
                          {color.Name}
                        </span>
                        <span className="text-xs text-gray-400 text-center">
                          {color.Code}
                        </span>
                      </button>
                    ))}
                  </div>
                  {row2.length > 0 && (
                    <div className="flex flex-row justify-center gap-4 md:gap-8 lg:gap-12 xl:gap-16 flex-wrap">
                      {row2.map((color) => (
                        <button
                          key={color.Code}
                          className={`group flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                            selectedColor?.Code === color.Code 
                              ? 'bg-blue-100 border-2 border-blue-500' 
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                          onClick={() => handleColorSelect(color)}
                          title={color.Description}
                        >
                          <div className="relative">
                            <img
                              src={color.imagePath}
                              alt={color.Name}
                              className={`w-16 h-16 rounded-full border-2 border-gray-300 group-hover:border-gray-400 group-hover:scale-110 transition-all duration-200 shadow-md object-cover ${
                                selectedColor?.Code === color.Code ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onError={(e) => {
                                // Fallback to a colored div if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLDivElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                            <div 
                              className="w-16 h-16 rounded-full border-2 border-gray-300 group-hover:border-gray-400 group-hover:scale-110 transition-all duration-200 shadow-md bg-gray-300 hidden"
                              style={{ backgroundColor: '#8d6e63' }} // Fallback color
                            />
                          </div>
                          <span className="text-xs text-gray-600 mt-2 text-center leading-tight font-medium">
                            {color.Name}
                          </span>
                          <span className="text-xs text-gray-400 text-center">
                            {color.Code}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
              selectedColor 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!selectedColor}
            onClick={() => {
              if (selectedColor) {
                console.log(`Applying color: ${selectedColor.Name}`);
                // Implement color application logic here
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
