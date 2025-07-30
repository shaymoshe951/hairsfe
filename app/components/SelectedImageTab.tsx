"use client";

import React from "react";
import Image from "next/image";

interface ModelProfile {
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  resultImage: string | null;
  error: string | null;
}

interface SelectedImageTabProps {
  imageSrc: string;
  title: string;
  modelProfile?: ModelProfile;
}

export default function SelectedImageTab({ imageSrc, title, modelProfile }: SelectedImageTabProps) {
  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-center mb-3">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">Your selected hair style</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center space-x-8">
        {/* Original Image */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Front View</h3>
          <Image
            src={imageSrc}
            alt={title}
            width={400}
            height={400}
            className="rounded-lg shadow-lg object-contain"
            style={{ maxWidth: "400px", maxHeight: "400px" }}
          />
        </div>

        {/* Model Profile Result Image */}
        {modelProfile?.resultImage && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Side View</h3>
            <Image
              src={modelProfile.resultImage}
              alt={`${title} Profile`}
              width={400}
              height={400}
              className="rounded-lg shadow-lg object-contain border-2 border-green-300"
              style={{ maxWidth: "400px", maxHeight: "400px" }}
            />
          </div>
        )}

        {/* Processing Status */}
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

        {/* Error Status */}
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
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Download
        </button>
        <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
          Share
        </button>
      </div>
    </div>
  );
} 