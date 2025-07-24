"use client";

import React, { useReducer, useEffect, useState } from "react";
import GradioImageUpload from "./components/GradioImageUpload";
import ImageCard from "./components/ImageCard";

const API_BASE_URL = "http://localhost:7861";

// --- State Management with useReducer ---

const initialState = {
  sourceImage: null,
  items: [],
  isLoading: false,
  error: null,
  activeProcessingCount: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_SOURCE_IMAGE":
      return { ...initialState, sourceImage: action.payload };
    case "FETCH_INITIAL_IMAGES_START":
      return { ...state, isLoading: true, error: null, items: [] };
    case "FETCH_INITIAL_IMAGES_SUCCESS":
      return {
        ...state,
        isLoading: false,
        items: action.payload.map((src) => ({
          src,
          progress: 0,
          isProcessing: false,
          isDone: false,
          isFavorite: false,
          taskId: null,
        })),
      };
    case "FETCH_INITIAL_IMAGES_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "TOGGLE_FAVORITE":
      return {
        ...state,
        items: state.items.map((item, index) =>
          index === action.payload
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ),
      };
    case "PROCESS_START":
      return {
        ...state,
        activeProcessingCount: state.activeProcessingCount + 1,
        items: state.items.map((item, index) =>
          index === action.payload.index
            ? { ...item, isProcessing: true, taskId: action.payload.taskId }
            : item
        ),
      };
    case "PROCESS_PROGRESS":
      return {
        ...state,
        items: state.items.map((item, index) =>
          index === action.payload.index
            ? { ...item, progress: action.payload.progress }
            : item
        ),
      };
    case "PROCESS_SUCCESS":
      return {
        ...state,
        activeProcessingCount: state.activeProcessingCount - 1,
        items: state.items.map((item, index) =>
          index === action.payload.index
            ? {
                ...item,
                src: action.payload.image,
                isProcessing: false,
                isDone: true,
                progress: 100,
              }
            : item
        ),
      };
    case "PROCESS_ERROR":
      return {
        ...state,
        activeProcessingCount: state.activeProcessingCount - 1,
        items: state.items.map((item, index) =>
          index === action.payload.index
            ? { ...item, isProcessing: false }
            : item
        ),
      };
    default:
      throw new Error("Unhandled action type");
  }
}

// --- Main Component ---

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Effect for fetching initial images when a source image is uploaded
  useEffect(() => {
    if (!state.sourceImage) return;

    const fetchImages = async () => {
      dispatch({ type: "FETCH_INITIAL_IMAGES_START" });
      try {
        const res = await fetch(`${API_BASE_URL}/get_images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: state.sourceImage }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        dispatch({ type: "FETCH_INITIAL_IMAGES_SUCCESS", payload: data.images || [] });
      } catch (err) {
        dispatch({ type: "FETCH_INITIAL_IMAGES_ERROR", payload: err.message });
      }
    };

    fetchImages();
  }, [state.sourceImage]);

  // Effect for managing the background processing queue
  useEffect(() => {
    if (state.activeProcessingCount > 0) {
      return;
    }

    const findNextItem = () => {
      const favoriteItem = state.items.find(item => item.isFavorite && !item.isDone && !item.isProcessing);
      if (favoriteItem) return state.items.indexOf(favoriteItem);

      const nextRegularItem = state.items.find(item => !item.isDone && !item.isProcessing);
      if (nextRegularItem) return state.items.indexOf(nextRegularItem);
      
      return -1;
    };

    const nextItemIndex = findNextItem();

    if (nextItemIndex !== -1) {
      const processItem = async (index) => {
        let taskId;
        try {
          const startRes = await fetch(`${API_BASE_URL}/process_image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index }),
          });
          if (!startRes.ok) throw new Error("Server error on start");
          const { task_id } = await startRes.json();
          taskId = task_id;
          dispatch({ type: "PROCESS_START", payload: { index, taskId } });

          let isDone = false;
          while (!isDone) {
            await new Promise((r) => setTimeout(r, 500));
            if (!taskId) return;
            const progRes = await fetch(`${API_BASE_URL}/progress?task_id=${taskId}`);
            if (!progRes.ok) continue;
            const progData = await progRes.json();
            isDone = progData.done || progData.progress >= 100;
            dispatch({ type: "PROCESS_PROGRESS", payload: { index, progress: progData.progress ?? 0 } });
          }

          const resultRes = await fetch(`${API_BASE_URL}/result?task_id=${taskId}`);
          if (!resultRes.ok) throw new Error("Server error on result");
          const { image } = await resultRes.json();
          dispatch({ type: "PROCESS_SUCCESS", payload: { index, image } });
        } catch (e) {
          console.error(`Error processing image ${index}:`, e);
          dispatch({ type: "PROCESS_ERROR", payload: { index } });
        }
      };
      
      processItem(nextItemIndex);
    }
  }, [state.items, state.activeProcessingCount]);

  return (
    <main style={styles.main}>
      <div style={styles.headerContainer}>
        <h1>From Vision to Virtual – Your Hair, Reimagined</h1>
        <h3 style={styles.subtitle}>Style It. See It. Love It.</h3>
        
        <GradioImageUpload
          value={state.sourceImage}
          onChange={(image) => dispatch({ type: "SET_SOURCE_IMAGE", payload: image })}
        />
        
        {state.isLoading && <div style={styles.statusText}>Processing...</div>}
        {state.error && <div style={styles.errorText}>Error: {state.error}</div>}
      </div>

      {state.items.length > 0 && (
        <div className="catalog-container">
          <h2 style={styles.catalogTitle}>Choose your style</h2>
          <div className="grid" style={styles.grid}>
            {state.items.map((item, idx) => (
              <ImageCard
                key={idx}
                item={item}
                isHovered={hoveredCard === idx}
                onHover={() => setHoveredCard(idx)}
                onFavoriteToggle={() => dispatch({ type: "TOGGLE_FAVORITE", payload: idx })}
                onSelect={() => console.log("Selected item:", idx)}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// --- Styles ---
const styles = {
  main: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px 0 20px',
    textAlign: 'center',
  },
  subtitle: {
    margin: "0 0 32px",
    fontWeight: 500,
    fontSize: 20,
    color: "#a67c52",
    letterSpacing: 0.2,
    fontFamily: "system-ui, sans-serif",
  },
  statusText: {
    marginTop: 24,
    color: "#0070f3",
  },
  errorText: {
    marginTop: 24,
    color: "#d00",
  },
  catalogTitle: {
    margin: "0 0 24px",
    fontSize: 22,
    fontWeight: 700,
    color: "#6b4f36",
    letterSpacing: 0.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 36,
    maxHeight: "60vh",
    overflowY: "auto",
    padding: "0 8px 8px 0",
    justifyItems: "center",
  },
};