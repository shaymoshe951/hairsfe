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
  const [processing, setProcessing] = useState<{ progress: number; isProcessing: boolean; isDone: boolean; }[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [selectVisible, setSelectVisible] = useState(false);
  const processingRef = React.useRef<{ cancel: (() => void) | null }>({ cancel: null });
  const lastFavIdxRef = React.useRef<number | null>(null);

  const API_BASE_URL = "http://10.100.102.36:7861"; //"http://localhost:7860"

  React.useEffect(() => {
    if (!image) {
      setResultImages([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/get_images`, {
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

  // Start background processing when resultImages change
  React.useEffect(() => {
    if (resultImages.length === 0) return;
    setSelectVisible(false);
    setProcessing(resultImages.map(() => ({ progress: 0, isProcessing: false, isDone: false })));
    let cancelled = false;
    let current = 0;
    let resumeFrom = 0;
    let queue: number[] = Array.from({ length: resultImages.length }, (_, i) => i);
    let isPaused = false;

    const processImage = async (idx: number) => {
      setProcessingIndex(idx);
      setProcessing(prev => prev.map((p, i) => i === idx ? { ...p, isProcessing: true } : p));
      let taskId = null;
      try {
        // Start processing and get task_id
        const startRes = await fetch(`${API_BASE_URL}/process_image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: idx }),
        });
        if (!startRes.ok) throw new Error("Server error");
        const startData = await startRes.json();
        taskId = startData.task_id;
        // Poll for progress
        let done = false;
        let localDone = false;
        while (!done && !localDone) {
          if (processing[idx]?.isDone) { localDone = true; break; }
          await new Promise(r => setTimeout(r, 300));
          if (localDone) break;
          const progRes = await fetch(`${API_BASE_URL}/progress?task_id=${taskId}`);
          if (!progRes.ok) throw new Error("Progress error");
          const progData = await progRes.json();
          const percent = progData.progress ?? 0;
          done = percent >= 100 || progData.done;
          if (done) {
            setProcessing(prev => prev.map((p, i) => i === idx ? { ...p, progress: 100, isProcessing: false, isDone: true } : p));
            localDone = true;
            break;
          }
          if (!localDone) {
            setProcessing(prev => prev.map((p, i) => i === idx ? { ...p, progress: percent, isProcessing: true } : p));
          }
        }
        // Fetch result
        const resultRes = await fetch(`${API_BASE_URL}/result?task_id=${taskId}`);
        if (!resultRes.ok) throw new Error("Result error");
        const resultData = await resultRes.json();
        setProcessing(prev => prev.map((p, i) => i === idx ? { ...p, progress: 100, isProcessing: false, isDone: true } : p));
        setResultImages(prev => prev.map((img, i) => i === idx ? resultData.image : img));
      } catch (e) {
        setProcessing(prev => prev.map((p, i) => i === idx ? { ...p, isProcessing: false } : p));
      } finally {
        setProcessingIndex(null);
        processingRef.current.cancel = null;
      }
    };

    const runQueue = async () => {
      for (let i = 0; i < queue.length; i++) {
        if (cancelled) break;
        const idx = queue[i];
        if (processing[idx]?.isDone || favorites[idx]) continue; // Skip already processed or favorited
        await processImage(idx);
        if (cancelled) break;
      }
      setSelectVisible(true);
    };

    runQueue();
    return () => { cancelled = true; };
  }, [resultImages]);

  // Handle favorite during processing
  React.useEffect(() => {
    // Find the first favorite that is not done
    const favIdxEntry = Object.entries(favorites).find(([idx, val]) => val && (!processing[+idx]?.isDone));
    const favIdx = favIdxEntry ? +favIdxEntry[0] : null;
    // Only process if a new favorite is found and it's not already being processed or done
    if (
      favIdx !== null &&
      favIdx !== processingIndex &&
      favIdx !== lastFavIdxRef.current &&
      !processing[favIdx]?.isDone
    ) {
      lastFavIdxRef.current = favIdx;
      // Cancel current
      if (processingRef.current.cancel) processingRef.current.cancel();
      // Process favorite immediately
      (async () => {
        setProcessingIndex(favIdx);
        setProcessing(prev => prev.map((p, i) => i === favIdx ? { ...p, isProcessing: true } : p));
        let taskId = null;
        try {
          // Start processing
          const startRes = await fetch(`${API_BASE_URL}/process_image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index: favIdx }),
          });
          if (!startRes.ok) throw new Error("Server error");
          const startData = await startRes.json();
          taskId = startData.task_id;
          // Poll for progress
          let done = false;
          let localDone = false;
          while (!done && !localDone) {
            if (processing[favIdx]?.isDone) { localDone = true; break; }
            await new Promise(r => setTimeout(r, 300));
            if (localDone) break;
            const progRes = await fetch(`${API_BASE_URL}/progress?task_id=${taskId}`);
            if (!progRes.ok) throw new Error("Progress error");
            const progData = await progRes.json();
            const percent = progData.progress ?? 0;
            done = percent >= 100 || progData.done;
            if (done) {
              setProcessing(prev => prev.map((p, i) => i === favIdx ? { ...p, progress: 100, isProcessing: false, isDone: true } : p));
              localDone = true;
              break;
            }
            if (!localDone) {
              setProcessing(prev => prev.map((p, i) => i === favIdx ? { ...p, progress: percent, isProcessing: true } : p));
            }
          }
          // Fetch result
          const resultRes = await fetch(`${API_BASE_URL}/result?task_id=${taskId}`);
          if (!resultRes.ok) throw new Error("Result error");
          const resultData = await resultRes.json();
          setProcessing(prev => prev.map((p, i) => i === favIdx ? { ...p, progress: 100, isProcessing: false, isDone: true } : p));
          setResultImages(prev => prev.map((img, i) => i === favIdx ? resultData.image : img));
        } catch (e) {
          setProcessing(prev => prev.map((p, i) => i === favIdx ? { ...p, isProcessing: false } : p));
        } finally {
          setProcessingIndex(null);
          processingRef.current.cancel = null;
        }
      })();
    }
    // Only depend on favorites, processing, and processingIndex
  }, [favorites, processing, processingIndex]);

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
                  {/* <button
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
                  </button> */}
                  {/* Progress bar placeholder (hidden by default) */}
                  {processing[idx]?.isProcessing && !processing[idx]?.isDone && (
                    <div style={{ width: "100%", height: 10, background: "#ede7f6", borderRadius: 5, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${processing[idx].progress}%`, height: "100%", background: "#7c4dff", borderRadius: 5, transition: "width 0.3s" }} />
                    </div>
                  )}
                  {processing[idx]?.isDone && (
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
                        cursor: "pointer",
                        marginTop: "auto",
                        marginBottom: 8,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        transition: "background 0.2s",
                      }}
                    >
                      Select
                    </button>
                  )}
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