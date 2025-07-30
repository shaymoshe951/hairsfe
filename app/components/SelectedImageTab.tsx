"use client";

import React from "react";
import ImagePreview from "./ImagePreview";
import { ModelProfile } from "../types";

interface SelectedImageTabProps {
  imageSrc: string;
  title: string;
  modelProfile?: ModelProfile;
}

export default function SelectedImageTab({ imageSrc, title, modelProfile }: SelectedImageTabProps) {
  const handleDownload = async () => {
    try {
      if (!modelProfile?.resultImage) {
        // Download single image if no profile result
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `${title}_style.jpg`;
        link.click();
        return;
      }

      // Create canvas to concatenate both images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load both images
      const img1 = new Image();
      const img2 = new Image();
      
      img1.crossOrigin = 'anonymous';
      img2.crossOrigin = 'anonymous';
      
      const loadImage = (img: HTMLImageElement, src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = src;
        });
      };

      await Promise.all([
        loadImage(img1, imageSrc),
        loadImage(img2, modelProfile.resultImage)
      ]);

      // Set canvas size (side by side with some padding)
      const maxHeight = Math.max(img1.height, img2.height);
      const padding = 20;
      canvas.width = img1.width + img2.width + padding;
      canvas.height = maxHeight;

      // Fill background with white
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Draw both images
      ctx!.drawImage(img1, 0, 0);
      ctx!.drawImage(img2, img1.width + padding, 0);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title}_combined.jpg`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-center mb-3">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">Your selected hair style</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center space-x-8">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Front View</h3>
          <ImagePreview src={imageSrc} alt={title} className="shadow-lg" />
        </div>

        {modelProfile?.resultImage && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Side View</h3>
            <ImagePreview src={modelProfile.resultImage} alt={`${title} Profile`} border className="shadow-lg" />
          </div>
        )}

        {modelProfile?.status === "processing" && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Processing Profile...</h3>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${modelProfile.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{modelProfile.progress}%</p>
          </div>
        )}

        {modelProfile?.status === "error" && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Processing Error</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <p className="text-red-700 text-sm">{modelProfile.error}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex space-x-4">
        <button 
          onClick={handleDownload}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download</span>
        </button>
        
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="13.5" cy="6.5" r=".5" />
            <circle cx="17.5" cy="10.5" r=".5" />
            <circle cx="8.5" cy="7.5" r=".5" />
            <circle cx="6.5" cy="12.5" r=".5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          <span>Edit Hair Color</span>
        </button>
        
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Manual Edit Hair Shape</span>
        </button>
      </div>
    </div>
  );
}