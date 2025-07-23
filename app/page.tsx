"use client";

import React, { useRef, useState } from "react";
import GradioImageUpload from "./components/GradioImageUpload";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!image) {
      setResultImages([]);
      return;
    }
    setLoading(true);
    setError(null);
    // fetch("http://localhost:7860", {
    fetch("http://10.100.102.36:7861", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("API error: " + res.status);
        const data = await res.json();
        // Expecting { images: [base64, ...] }
        if (Array.isArray(data.images)) {
          setResultImages(data.images);
        } else {
          setResultImages([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setResultImages([]);
      })
      .finally(() => setLoading(false));
  }, [image]);

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
      <h1>Image Upload (Gradio-like Minimal)</h1>
      <GradioImageUpload value={image} onChange={setImage} />
      {loading && <div style={{ marginTop: 24, color: "#0070f3" }}>Processing...</div>}
      {error && <div style={{ marginTop: 24, color: "#d00" }}>Error: {error}</div>}
      {resultImages.length > 0 && (
        <div
          className="catalog-container"
          style={{
            marginTop: 32,
            width: "100%",
            maxWidth: 1200,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            padding: 24,
            overflow: "hidden",
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 700, color: "#222", letterSpacing: 0.5 }}>Catalog</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "220px",
              gap: 32,
              maxHeight: 504, // 2 rows of 220px cards + gap
              overflowY: "auto",
              paddingBottom: 8,
              scrollbarWidth: "thin",
              scrollbarColor: "#bbb #eee",
              justifyItems: "center",
              alignItems: "center",
            }}
          >
            {resultImages.map((img, idx) => (
              <div
                key={idx}
                className="catalog-card"
                style={{
                  width: 220,
                  height: 220,
                  background: "#fff",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: 14,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 16,
                  transition: "box-shadow 0.2s, border 0.2s",
                  minWidth: 0,
                  justifyContent: "flex-start",
                  position: "relative",
                  cursor: "pointer",
                  fontFamily: 'system-ui, sans-serif',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.13)";
                  e.currentTarget.style.border = "2px solid #0070f3";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
                  e.currentTarget.style.border = "1.5px solid #e0e0e0";
                }}
              >
                <img
                  src={img}
                  alt="Product"
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "contain",
                    borderRadius: 8,
                    background: "#f6f6f6",
                    marginBottom: 16,
                  }}
                />
                <button
                  style={{
                    width: "100%",
                    padding: "8px 0",
                    background: "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: 0.2,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#0059c1")}
                  onMouseOut={e => (e.currentTarget.style.background = "#0070f3")}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// Add responsive CSS for the catalog container
if (typeof window !== "undefined") {
  const styleId = "catalog-responsive-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @media (max-width: 1300px) {
        .catalog-container { max-width: 100vw !important; }
      }
      @media (max-width: 900px) {
        .catalog-container { max-width: 100vw !important; padding: 12px !important; }
      }
    `;
    document.head.appendChild(style);
  }
} 