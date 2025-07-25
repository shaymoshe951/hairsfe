"use client";

import React from "react";

interface SelectedImageTabProps {
  imageSrc: string;
  title: string;
}

export default function SelectedImageTab({ imageSrc, title }: SelectedImageTabProps) {
  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">Your selected hair style</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={title}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          style={{ maxWidth: "600px", maxHeight: "600px" }}
        />
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