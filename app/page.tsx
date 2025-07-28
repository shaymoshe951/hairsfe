// page.tsx
// app/page.tsx (refactored with Tailwind CSS)
"use client";

import React, { useReducer, useEffect, useState } from "react";
import Image from "next/image";
import GradioImageUpload from "./components/GradioImageUpload";
import ImageCard from "./components/ImageCard";
import SelectedImageTab from "./components/SelectedImageTab";

// const API_BASE_URL = "https://pipnam3nkqvb6u-8000.proxy.runpod.net";
const API_BASE_URL = "http://localhost:8000";

const initialState = {
  sourceImage: null,
  items: [],
  isLoading: false,
  error: null,
  activeProcessingCount: 0,
  sourceImageId: null, // add to initial state
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case "SET_SOURCE_IMAGE":
      return { ...initialState, sourceImage: action.payload };
    case "FETCH_INITIAL_IMAGES_START":
      return { ...state, isLoading: true, error: null, items: [], sourceImageId: action.payload.sourceImageId };
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
  const [tabs, setTabs] = useState<Array<{ id: string; imageSrc: string; title: string }>>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.sourceImage) return;

    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/upload_source_image`, {
          method: "POST",
          headers: undefined,
          body: dataURLtoFormData(state.sourceImage),
        });
        if (!res.ok) throw new Error("API error: " + res.status);
        const data = await res.json();
        // Expecting { images: [...], sourceImageId: ... }
        console.log("data.sourceImageId=",data.sourceImageId )
        dispatch({ type: "FETCH_INITIAL_IMAGES_START", payload: { sourceImageId: data.sourceImageId } });
        dispatch({ type: "FETCH_INITIAL_IMAGES_SUCCESS", payload: data.images || [] });
        console.log("data.images=", data.images.length )
      } catch (err) {
        dispatch({ type: "FETCH_INITIAL_IMAGES_ERROR", payload: (err as Error).message });
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
          const startRes = await fetch(`${API_BASE_URL}/start/model_ht`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index, source_image_id: state.sourceImageId }),
          });
          if (!startRes.ok) throw new Error("Server error on start");
          const { task_id } = await startRes.json();
          taskId = task_id;
          dispatch({ type: "PROCESS_START", payload: { index, taskId } });

          let isDone = false;
          let progData: any = {};
          while (!isDone) {
            await new Promise((r) => setTimeout(r, 500));
            if (!taskId) return;
            const progRes = await fetch(`${API_BASE_URL}/status/${taskId}`);
            if (!progRes.ok) continue;
            progData = await progRes.json();
            isDone = progData.done  || (progData.progress >= 100);
            dispatch({ type: "PROCESS_PROGRESS", payload: { index, progress: progData.progress ?? 0 } });
          }
          console.log('Done; status=', progData.status, 'done=', progData.done, 'progress=', progData.progress)  
          if (progData.status === "Failed") {
            console.error(`Error processing image ${index}:`, progData.error);
            dispatch({ type: "PROCESS_ERROR", payload: { index, error: progData.error } });          
          } else if (progData.status === "Completed") {
            const image = progData.result; // fastAPI now returns {status, result, done}
            dispatch({ type: "PROCESS_SUCCESS", payload: { index, image } });
          } else if (progData.status === "Canceled") {
            console.error(`Canceled processing image ${index}`);
            dispatch({ type: "PROCESS_ERROR", payload: { index, error: "Canceled" } });
          } else {
            throw new Error("Unknown status: " + progData.status);
          }

        } catch (e) {
          console.error(`Error processing image ${index}:`, e);
          dispatch({ type: "PROCESS_ERROR", payload: { index } });
        }
      };

      processItem(nextItemIndex);
    }
  }, [state.items, state.activeProcessingCount]);

  const handleSelectImage = (imageSrc: string, index: number) => {
    // Check if a tab for this image already exists
    const existingTab = tabs.find(tab => tab.imageSrc === imageSrc);
    if (existingTab) {
      console.log("Existing tab found", existingTab);
      setActiveTabId(existingTab.id);
      return;
    }
    // Otherwise, create a new tab
    const tabId = `tab-${index}-${Math.random().toString(36).slice(2, 10)}`;
    const newTab = {
      id: tabId,
      imageSrc,
      title: `Style ${index + 1}`
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[tabs.length - 2]?.id || null : null);
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <main className="flex flex-col w-full h-screen">
      <div className="flex flex-col items-center px-5 pt-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900">From Vision to Virtual – Your Hair, Reimagined</h1>
        <h3 className="mt-2 mb-8 text-xl font-medium text-primary">Style It. See It. Love It.</h3>
      </div>

      {/* Main layout: sidebar always visible */}
      <div className="flex flex-1">
        {/* Navigation Panel */}
        {tabs.length > 0 && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <button
              onClick={() => setActiveTabId(null)}
              className="w-full mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center text-3xl"
              title="Back to Catalog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-home"
                aria-label="Home"
              >
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9.5z" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Styles</h3>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    activeTabId === tab.id ? 'bg-blue-100 border border-blue-300' : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden rounded">
                      <Image
                        src={tab.imageSrc}
                        alt={tab.title}
                        width={32}
                        height={32}
                        style={{ objectFit: "cover", borderRadius: 6, display: "block" }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">{tab.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 p-6 ${tabs.length === 0 ? '' : ''}`}>
          {activeTab ? (
            <SelectedImageTab imageSrc={activeTab.imageSrc} title={activeTab.title} />
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <GradioImageUpload
                  value={state.sourceImage}
                  onChange={(image) => dispatch({ type: "SET_SOURCE_IMAGE", payload: image })}
                />

                {state.sourceImage && state.items.length === 0 && <div className="mt-6 text-blue-600 text-center">Processing...</div>}
                {state.error && <div className="mt-6 text-red-600 text-center">Error: {state.error}</div>}
              </div>

              {state.items.length > 0 && (
                <section className="catalog-container w-full">
                  <h2 className="text-xl font-semibold text-accent mb-6 text-center">Choose your style</h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-9 max-h-[60vh] overflow-y-auto">
                    {state.items.map((item: any, idx: any) => (
                      <ImageCard
                        key={idx}
                        item={item}
                        isHovered={hoveredCard === idx}
                        onHover={() => setHoveredCard(idx)}
                        onFavoriteToggle={() => dispatch({ type: "TOGGLE_FAVORITE", payload: idx })}
                        onSelect={() => handleSelectImage(item.src, idx)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function dataURLtoFormData(sourceImage: string): FormData {
  // sourceImage is expected to be a data URL (e.g., "data:image/png;base64,...")
  // Convert it to a Blob and append to FormData as "file"
  if (!sourceImage.startsWith("data:image/")) {
    throw new Error("Source image must be a data URL of an image");
  }

  // Split the data URL
  const [header, base64] = sourceImage.split(",");
  const match = header.match(/data:(image\/[a-zA-Z0-9.+-]+);base64/);
  if (!match) {
    throw new Error("Invalid data URL format");
  }
  const mimeType = match[1];

  // Decode base64 to binary
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([array], { type: mimeType });

  // Create FormData and append as "file"
  const formData = new FormData();
  formData.append("file", blob, "upload." + mimeType.split("/")[1]);
  return formData;
}
