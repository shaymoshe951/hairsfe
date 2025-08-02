"use client";

import React, { useReducer, useEffect, useState } from "react";
import GradioImageUpload from "./components/GradioImageUpload";
import ImageCard from "./components/ImageCard";
import SelectedImageTab from "./components/SelectedImageTab";
import ImagePreview from "./components/ImagePreview";
import { Tab } from "./types";
import { fetchWithErrorHandling, pollTaskStatus, handleTaskStatus, logger } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const initialState = {
  sourceImage: null,
  items: [],
  isLoading: false,
  error: null,
  activeProcessingCount: 0,
  sourceImageId: null,
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
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Debug: Auto-upload source image on page load
  useEffect(() => {
    const DEBUG_MODE = true; // Set to false to disable debug mode
    
    if (DEBUG_MODE && !state.sourceImage) {
      // Load the resource image and convert it to a data URL
      const imageUrl = "/resources/image_wh3.jpeg"; // Use public folder path for Next.js

      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            console.log("DEBUG: Auto-uploading resource image as source image");
            dispatch({ type: "SET_SOURCE_IMAGE", payload: dataUrl });
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error("DEBUG: Failed to load resource image", err);
        });
    }
  }, [state.sourceImage]);

  // Debug: Auto-select first style when images are available
  useEffect(() => {
    const DEBUG_MODE = true; // Set to false to disable debug mode
    
    if (DEBUG_MODE && state.items.length > 0 && tabs.length === 0 && !activeTabId) {
      // Wait a moment for the first item to be processed
      const timer = setTimeout(() => {
        const firstItem = state.items[0];
        if (firstItem && firstItem.src) {
          console.log("DEBUG: Auto-selecting first style");
          handleSelectImage(firstItem.src, 0);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.items, tabs.length, activeTabId]);

  const updateTabModelProfile = (tabId: string, updates: Partial<Tab["modelProfile"]>) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId
          ? { ...tab, modelProfile: { ...tab.modelProfile, ...updates } }
          : tab
      )
    );
  };

  useEffect(() => {
    if (!state.sourceImage) return;

    const fetchImages = async () => {
      try {
        const data = await fetchWithErrorHandling(`${API_BASE_URL}/upload_source_image`, {
          method: "POST",
          body: dataURLtoFormData(state.sourceImage),
        });
        logger.log("data.sourceImageId=", data.sourceImageId);
        dispatch({ type: "FETCH_INITIAL_IMAGES_START", payload: { sourceImageId: data.sourceImageId } });
        dispatch({ type: "FETCH_INITIAL_IMAGES_SUCCESS", payload: data.images || [] });
        logger.log("data.images=", data.images.length);
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

    const processItem = async (index: number) => {
      try {
        const { task_id } = await fetchWithErrorHandling(`${API_BASE_URL}/start/model_ht`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index, source_image_id: state.sourceImageId }),
        });
        dispatch({ type: "PROCESS_START", payload: { index, taskId: task_id } });

        const progData = await pollTaskStatus(task_id, progress =>
          dispatch({ type: "PROCESS_PROGRESS", payload: { index, progress } }), "model_ht"
        );

        handleTaskStatus(
          progData,
          result => dispatch({ type: "PROCESS_SUCCESS", payload: { index, image: result } }),
          error => dispatch({ type: "PROCESS_ERROR", payload: { index, error } })
        );
      } catch (e) {
        logger.error(`Error processing image ${index}:`, e);
        dispatch({ type: "PROCESS_ERROR", payload: { index, error: (e as Error).message } });
      }
    };

    const nextItemIndex = findNextItem();
    if (nextItemIndex !== -1) {
      processItem(nextItemIndex);
    }
  }, [state.items, state.activeProcessingCount]);

  const handleSelectImage = (imageSrc: string, index: number) => {
    const existingTab = tabs.find(tab => tab.imageSrc === imageSrc);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const tabId = `tab-${index}-${Math.random().toString(36).slice(2, 10)}`;
    const newTab: Tab = {
      id: tabId,
      imageSrc,
      title: `Style ${index + 1}`,
      modelProfile: {
        status: "pending",
        progress: 0,
        resultImage: null,
        error: null,
      },
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);

    (async () => {
      try {
        updateTabModelProfile(tabId, { status: "processing", progress: 0, error: null });
        const { task_id } = await fetchWithErrorHandling(`${API_BASE_URL}/start/model_profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageSrc }),
        });

        const progData = await pollTaskStatus(task_id, progress =>
          updateTabModelProfile(tabId, { status: "processing", progress }), "model_profile"
        );

        handleTaskStatus(
          progData,
          result => updateTabModelProfile(tabId, { status: "done", progress: 100, resultImage: result }),
          error => updateTabModelProfile(tabId, { status: "error", error, progress: progData.progress ?? 0 })
        );
      } catch (e) {
        logger.error("Model profile processing error:", e);
        updateTabModelProfile(tabId, { status: "error", error: (e as Error).message || "Unknown error" });
      }
    })();
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[tabs.length - 2]?.id || null : null);
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <main className="flex flex-col w-full h-screen bg-white text-gray-800">
      <header className="text-center py-10 px-5">
        <h1 className="text-4xl font-bold">From Vision to Virtual – Your Hair, Reimagined</h1>
        <p className="text-lg mt-2 text-gray-600 italic">Style It. See It. Love It.</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {tabs.length > 0 && (
          <aside className="w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <button
              onClick={() => setActiveTabId(null)}
              className="w-full mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              title="Back to Catalog"
            >
              ← Back to Catalog
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Styles</h3>
            <div className="space-y-3">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${
                    activeTabId === tab.id ? 'bg-blue-100 border border-blue-300' : 'bg-white border hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <ImagePreview src={tab.imageSrc} alt={tab.title} size={32} />
                    {tab.modelProfile.resultImage && (
                      <ImagePreview src={tab.modelProfile.resultImage} alt="Profile" size={32} border />
                    )}
                    <span className="text-sm truncate">{tab.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        <section className="flex-1 p-6 overflow-y-auto">
          {activeTab ? (
            <SelectedImageTab
              imageSrc={activeTab.imageSrc}
              title={activeTab.title}
              modelProfile={activeTab.modelProfile}
            />
          ) : (
            <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
              <GradioImageUpload
                value={state.sourceImage}
                onChange={(image) => dispatch({ type: "SET_SOURCE_IMAGE", payload: image })}
              />

              {state.sourceImage && state.items.length === 0 && (
                <div className="mt-6 text-blue-600 text-center">Processing...</div>
              )}
              {state.error && <div className="mt-6 text-red-600 text-center">Error: {state.error}</div>}

              {state.items.length > 0 && (
                <section className="w-full mt-10">
                  <h2 className="text-2xl font-semibold text-center mb-6">Choose Your Style</h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6 max-h-[60vh] overflow-y-auto">
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
        </section>
      </div>
    </main>
  );
}

function dataURLtoFormData(sourceImage: string): FormData {
  const [header, base64] = sourceImage.split(",");
  const mime = header.match(/data:(image\/.+);base64/)?.[1] || "image/png";
  const binary = atob(base64);
  const array = Uint8Array.from(binary, c => c.charCodeAt(0));
  const blob = new Blob([array], { type: mime });
  const formData = new FormData();
  formData.append("file", blob, "upload." + mime.split("/")[1]);
  return formData;
}
