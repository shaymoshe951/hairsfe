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

  return (
    <div className="flex flex-col items-center h-full w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-1">Your selected hairstyle preview</p>
      </div>

      <div className="flex flex-wrap justify-center gap-12 items-start max-w-full mb-8">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Front View</h3>
          <ImagePreview src={imageSrc} alt={title} className="rounded-xl shadow-md max-w-xs" />
        </div>

        {modelProfile?.resultImage && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Side View</h3>
            <ImagePreview src={modelProfile.resultImage} alt={`${title} Profile`} border className="rounded-xl shadow-md max-w-xs" />
          </div>
        )}

        {modelProfile?.status === "processing" && (
          <div className="flex flex-col items-center w-full max-w-md text-center mt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Processing Style...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${modelProfile.progress}%` }} />
            </div>
            <p className="text-sm text-gray-600 mt-2">{modelProfile.progress}%</p>
          </div>
        )}

        {modelProfile?.status === "error" && (
          <div className="flex flex-col items-center mt-8">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Processing Error</h3>
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-red-700 text-sm">{modelProfile.error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-auto">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <DownloadIcon />
          <span>Download</span>
        </button>

        <button className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          <ColorIcon />
          <span>Edit Hair Color</span>
        </button>

        <button className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <BrushIcon />
          <span>Manual Edit Hair Shape</span>
        </button>
      </div>
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
