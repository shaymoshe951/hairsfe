"use client";

import React, { useRef, useState } from "react";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    setImage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
      <h1>Image Upload (Gradio-like Minimal)</h1>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: dragActive ? "2px solid #0070f3" : "2px dashed #bbb",
          borderRadius: 12,
          width: 400,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: dragActive ? "#e6f0fa" : "#fafafa",
          cursor: "pointer",
          transition: "border 0.2s, background 0.2s",
          position: "relative",
        }}
      >
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
        {image ? (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <button
              onClick={e => { e.stopPropagation(); handleRemove(); }}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid #bbb",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: "bold",
                zIndex: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                padding: 0,
              }}
              aria-label="Remove image"
            >
              ×
            </button>
            <img
              src={image}
              alt="Uploaded Preview"
              style={{
                maxWidth: "100%",
                maxHeight: 220,
                borderRadius: 8,
                marginBottom: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              }}
            />
          </div>
        ) : (
          <span style={{ color: "#888", fontSize: 18, textAlign: "center" }}>
            {dragActive ? "Drop image here" : "Click or drag an image here to upload"}
          </span>
        )}
      </div>
    </main>
  );
} 