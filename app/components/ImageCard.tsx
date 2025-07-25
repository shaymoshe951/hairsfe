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
      className="w-[240px] h-[240px] bg-white border-none rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] flex flex-col items-center justify-between p-[20px] relative cursor-pointer transition-[box-shadow] duration-200 font-[system-ui,sans-serif]"
      onMouseOver={onHover}
      onMouseOut={() => onHover(null)}
      // onClick={isDone ? onSelect : undefined}
    >
      {showFavoriteButton && (
        <button
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
          className={`absolute top-[16px] right-[16px] border-none rounded-full w-[36px] h-[36px] flex items-center justify-center text-[22px] cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-[color,background] duration-200 z-[2] ${isFavorite ? "bg-[#ede7f6] text-[#7c4dff]" : "bg-[#f7f5f2] text-[#bbb]"}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onFavoriteToggle();
          }}
        >
          ♥
        </button>
      )}

      <img src={src} alt="Style" className="w-full h-[140px] object-contain rounded-[10px] bg-[#f7f5f2]" />

      {isProcessing && !isDone && (
        <div className="w-full h-[10px] bg-[#ede7f6] rounded-[5px] overflow-hidden">
          <div
            className="h-full bg-[#7c4dff] rounded-[5px] transition-[width] duration-[0.3s] ease-in-out"
            style={{ width: `${progress}%` }}
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