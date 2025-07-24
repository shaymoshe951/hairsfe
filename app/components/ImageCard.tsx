// app/components/ImageCard.js
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
      style={styles.card}
      onMouseOver={onHover}
      onMouseOut={() => onHover(null)}
      onClick={isDone ? onSelect : undefined}
    >
      {showFavoriteButton && (
        <button
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
          style={{
            ...styles.favoriteButton,
            background: isFavorite ? "#ede7f6" : "#f7f5f2",
            color: isFavorite ? "#7c4dff" : "#bbb",
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onFavoriteToggle();
          }}
        >
          ♥
        </button>
      )}

      <img src={src} alt="Style" style={styles.cardImage} />

      {isProcessing && !isDone && (
        <div style={styles.progressBarContainer}>
          <div
            style={{ ...styles.progressBar, width: `${progress}%` }}
          />
        </div>
      )}

      {isDone && (
        <button style={styles.selectButton} onClick={onSelect}>
          Select
        </button>
      )}
    </div>
  );
};

// Styles for the ImageCard component
const styles = {
  card: {
    width: 240,
    height: 240,
    background: "#fff",
    border: "none",
    borderRadius: 18,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    position: "relative",
    cursor: "pointer",
    transition: "box-shadow 0.2s",
    fontFamily: "system-ui, sans-serif",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    transition: "color 0.2s, background 0.2s",
    zIndex: 2,
  },
  cardImage: {
    width: "100%",
    height: 140,
    objectFit: "contain",
    borderRadius: 10,
    background: "#f7f5f2",
  },
  progressBarContainer: {
    width: "100%",
    height: 10,
    background: "#ede7f6",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "#7c4dff",
    borderRadius: 5,
    transition: "width 0.3s ease-in-out",
  },
  selectButton: {
    width: "100%",
    padding: "10px 0",
    background: "#5c4432",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    transition: "background 0.2s",
  },
};

export default ImageCard;