import React from "react";

const ImageCard = ({
  item,
  isHovered,
  onHover,
  onFavoriteToggle,
  onSelect,
}) => {
  const { src, progress, isProcessing, isDone, isFavorite } = item;
  const showFavoriteButton = isHovered || isFavorite;

  return (
    <div
      className="w-64 h-64  bg-white border-none rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] flex flex-col items-center justify-between p-[20px] relative cursor-pointer transition-[box-shadow] duration-200 font-[system-ui,sans-serif]"
      // className="w-16 h-16 bg-white border-none rounded-md shadow-md flex items-center justify-center relative cursor-pointer overflow-hidden"

      onMouseOver={onHover}
      onMouseOut={() => onHover(null)}
    // onClick={isDone ? onSelect : undefined}
    >
      {showFavoriteButton && (
        <div className="absolute top-0 right-0 p-2 z-[2]">
          <button
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            className={`w-8 h-8 text-[48px] rounded-full flex items-center justify-center cursor-pointer shadow-sm transition duration-200 bg-white ${isFavorite
                ? "bg-[#ede7f6] text-[#7c4dff]"
                : "bg-[#f7f5f2] text-[#bbb]"
              }`}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
          >
            ♥
          </button>
        </div>
      )}

      <img src={src} alt="Style" className="w-full h-[100px] object-contain rounded-[10px] bg-[#f7f5f2]" />

      {isProcessing && !isDone && (
  <div className="w-full h-[10px] bg-[#e0e0e0] rounded-[5px] overflow-hidden mt-2">
    <div
      className="h-full bg-[#7c4dff] rounded-[5px] transition-[width] duration-[0.3s] ease-in-out"
      style={{ width: `${progress ?? 0}%` }}
    />
  </div>
)}

      {isDone && (
        <button
          className="w-full py-[10px] bg-[#5c4432] text-[#fff] border-none rounded-[8px] font-[600] text-[16px] leading-[16px] cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-[background] duration-200"
          onClick={onSelect}
        >
          Select
        </button>
      )}
    </div>
  );
};

export default ImageCard;