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
    fetch("http://localhost:7860", {
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
        <div style={{
          marginTop: 32,
          width: "100%",
          maxWidth: 800,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          padding: 24,
          overflow: "hidden",
        }}>
          <h2 style={{ margin: 0, marginBottom: 16, fontSize: 20, fontWeight: 600, color: "#222" }}>Catalog</h2>
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            overflowX: "auto",
            paddingBottom: 8,
            scrollbarWidth: "thin",
            scrollbarColor: "#bbb #eee",
          }}>
            {resultImages.map((img, idx) => (
              <div key={idx} style={{
                minWidth: 180,
                maxWidth: 180,
                background: "#fafbfc",
                border: "1px solid #ddd",
                borderRadius: 10,
                boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 12,
                transition: "box-shadow 0.2s",
              }}>
                <img
                  src={img}
                  alt={`Result ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 6,
                    marginBottom: 8,
                    background: "#eee",
                  }}
                />
                <span style={{ fontSize: 13, color: "#888" }}>Image {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
} 