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
      className="w-64 h-auto bg-white border-none rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] flex flex-col items-center p-[20px] relative cursor-pointer transition-[box-shadow] duration-200 font-[system-ui,sans-serif]"
      onMouseOver={onHover}
      onMouseOut={() => onHover(null)}
    >
      {showFavoriteButton && (
        <div className="absolute top-0 right-0 p-2 z-[2]">
          <button
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            className={`w-8 h-8 text-[48px] rounded-full flex items-center justify-center cursor-pointer shadow-sm transition duration-200 ${
              isFavorite
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

      {!isDone && (<img
        src={src}
        alt="Style"
        className="w-full h-[120px] object-cover rounded-[10px] bg-[#f7f5f2]"
      />)}
      {isDone && (<img
        src={src}
        alt="Style"
        className="w-full h-[120px] object-cover rounded-[10px] bg-[#f7f5f2] transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
        onClick={onSelect}
      />)}
      

    <div className="relative w-full h-5">
      {progress && !isDone && (
      <div className="absolute inset-0 w-full h-4 rounded-[5px] mt-2 mb-2">
      <div
        className="h-full bg-purple-500 rounded-[5px] transition-[width] duration-[0.3s] ease-in-out"
        style={{ width: `${progress ?? 0}%` }}
      />
      </div>)}

      {isDone && (
        <button
          className="absolute inset-0 w-full py-[10px] bg-indigo-200 text-[#fff] border-none rounded-[8px] font-[600] text-[16px] leading-[16px] cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-[background] duration-200"
          onClick={onSelect}
        >
          Select
        </button>
      )}
    </div>
    </div>
  );
};

export default ImageCard;
