// page.tsx
// app/page.tsx (refactored with Tailwind CSS)
"use client";

import React, { useReducer, useEffect, useState } from "react";
import GradioImageUpload from "./components/GradioImageUpload";
import ImageCard from "./components/ImageCard";

const API_BASE_URL = "http://localhost:7860";

const initialState = {
  sourceImage: null,
  items: [],
  isLoading: false,
  error: null,
  activeProcessingCount: 0,
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case "SET_SOURCE_IMAGE":
      return { ...initialState, sourceImage: action.payload };
    case "FETCH_INITIAL_IMAGES_START":
      return { ...state, isLoading: true, error: null, items: [] };
    case "FETCH_INITIAL_IMAGES_SUCCESS":
      return {
        ...state,
        isLoading: false,
        items: action.payload.map((src: any) => ({
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
        items: state.items.map((item: any, index: any) =>
          index === action.payload
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ),
      };
    case "PROCESS_START":
      return {
        ...state,
        activeProcessingCount: state.activeProcessingCount + 1,
        items: state.items.map((item: any, index: any) =>
          index === action.payload.index
            ? { ...item, isProcessing: true, taskId: action.payload.taskId }
            : item
        ),
      };
    case "PROCESS_PROGRESS":
      return {
        ...state,
        items: state.items.map((item: any, index: any) =>
          index === action.payload.index
            ? { ...item, progress: action.payload.progress }
            : item
        ),
      };
    case "PROCESS_SUCCESS":
      return {
        ...state,
        activeProcessingCount: state.activeProcessingCount - 1,
        items: state.items.map((item: any, index: any) =>
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
        items: state.items.map((item: any, index: any) =>
          index === action.payload.index
            ? { ...item, isProcessing: false }
            : item
        ),
      };
    default:
      throw new Error("Unhandled action type");
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hoveredCard, setHoveredCard] = useState(null);

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

  useEffect(() => {
    if (state.activeProcessingCount > 0) return;

    const findNextItem = () => {
      const favoriteItem = state.items.find((item: any) => item.isFavorite && !item.isDone && !item.isProcessing);
      if (favoriteItem) return state.items.indexOf(favoriteItem);

      const nextRegularItem = state.items.find((item: any) => !item.isDone && !item.isProcessing);
      if (nextRegularItem) return state.items.indexOf(nextRegularItem);

      return -1;
    };

    const nextItemIndex = findNextItem();

    if (nextItemIndex !== -1) {
      const processItem = async (index: number) => {
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
    <main className="flex flex-col w-full">
      <div className="flex flex-col items-center px-5 pt-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900">From Vision to Virtual – Your Hair, Reimagined</h1>
        <h3 className="mt-2 mb-8 text-xl font-medium text-primary">Style It. See It. Love It.</h3>

        <GradioImageUpload
          value={state.sourceImage}
          onChange={(image) => dispatch({ type: "SET_SOURCE_IMAGE", payload: image })}
        />

        {state.isLoading && <div className="mt-6 text-blue-600">Processing...</div>}
        {state.error && <div className="mt-6 text-red-600">Error: {state.error}</div>}
      </div>

      {state.items.length > 0 && (
        <section className="catalog-container">
          <h2 className="text-xl font-semibold text-accent mb-6">Choose your style</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-9 max-h-[60vh] overflow-y-auto">
            {state.items.map((item: any, idx: any) => (
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
        </section>
      )}
    </main>
  );
}