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
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 16, fontSize: 20, fontWeight: 600, color: "#222" }}>Catalog</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "180px",
              gap: 32,
              maxHeight: 440, // 2 rows of 180px cards + gap
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
                style={{
                  width: 220,
                  height: 180,
                  background: "#fafbfc",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 12,
                  transition: "box-shadow 0.2s",
                  minWidth: 0,
                  justifyContent: "center",
                }}
              >
                <img
                  src={img}
                  alt="Result"
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "contain",
                    borderRadius: 6,
                    marginBottom: 8,
                    background: "#eee",
                  }}
                />
                {/* Placeholder for progress bar */}
                <div style={{ width: "100%", height: 8, background: "#f0f0f0", borderRadius: 4 }} />
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