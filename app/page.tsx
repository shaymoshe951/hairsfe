"use client";

import React, { useRef, useState } from "react";
import GradioImageUpload from "./components/GradioImageUpload";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<{ [idx: number]: boolean }>({});
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  React.useEffect(() => {
    if (!image) {
      setResultImages([]);
      return;
    }
    setLoading(true);
    setError(null);
    // fetch("http://localhost:7860", {
    fetch("http://10.100.102.36:7861/get_images", {
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
      <h1>From Vision to Virtual – Your Hair, Reimagined</h1>
      <h3 style={{ margin: 0, marginBottom: 32, fontWeight: 500, fontSize: 20, color: "#a67c52", letterSpacing: 0.2, fontFamily: 'system-ui, sans-serif' }}>
        Style It. See It. Love It.
      </h3>
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
            background: "#f7f5f2",
            border: "none",
            borderRadius: 18,
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            padding: 32,
            overflow: "hidden",
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 24, fontSize: 22, fontWeight: 700, color: "#6b4f36", letterSpacing: 0.5 }}>Choose your style</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "240px",
              gap: 36,
              maxHeight: 544, // 2 rows of 240px cards + gap
              overflowY: "auto",
              paddingBottom: 8,
              scrollbarWidth: "thin",
              scrollbarColor: "#bbb #eee",
              justifyItems: "center",
              alignItems: "center",
            }}
          >
            {resultImages.map((img, idx) => {
              const isFav = !!favorites[idx];
              const isHovered = hoveredCard === idx;
              return (
                <div
                  key={idx}
                  className="catalog-card"
                  style={{
                    width: 240,
                    height: 240,
                    background: "#fff",
                    border: "none",
                    borderRadius: 18,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 20,
                    transition: "box-shadow 0.2s, border 0.2s",
                    minWidth: 0,
                    justifyContent: "flex-start",
                    position: "relative",
                    cursor: "pointer",
                    fontFamily: 'system-ui, sans-serif',
                  }}
                  onMouseOver={() => setHoveredCard(idx)}
                  onMouseOut={() => setHoveredCard(null)}
                >
                  {/* Love icon button (show on hover or if favorited) */}
                  {(isHovered || isFav) && (
                    <button
                      aria-label={isFav ? "Unfavorite" : "Favorite"}
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: isFav ? "#ede7f6" : "#f7f5f2",
                        border: "none",
                        borderRadius: "50%",
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        color: isFav ? "#7c4dff" : "#bbb",
                        cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                        transition: "color 0.2s, background 0.2s",
                        zIndex: 2,
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setFavorites(favs => ({ ...favs, [idx]: !favs[idx] }));
                      }}
                      onMouseOver={e => { e.currentTarget.style.color = "#7c4dff"; }}
                      onMouseOut={e => { e.currentTarget.style.color = isFav ? "#7c4dff" : "#bbb"; }}
                    >
                      ♥
                    </button>
                  )}
                  <img
                    src={img}
                    alt="Product"
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "contain",
                      borderRadius: 10,
                      background: "#f7f5f2",
                      marginBottom: 24,
                      marginTop: 8,
                    }}
                  />
                  <button
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: "#5c4432",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: 0.2,
                      cursor: "not-allowed",
                      opacity: 0.7,
                      marginTop: "auto",
                      marginBottom: 8,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      transition: "background 0.2s",
                    }}
                    disabled
                  >
                    Select
                  </button>
                  {/* Progress bar placeholder (hidden by default) */}
                  <div style={{ width: "100%", height: 10, background: "#f7f5f2", borderRadius: 5, visibility: "hidden" }} />
                </div>
              );
            })}
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