"use client";
import React, { useState } from "react";

const hairColorDict = {
  "1.1": { Category: "Cool / Ash", Code: "1.1", Name: "Blue Black", Description: "Very dark with a blue undertone", imagePath: "/resources/hair_colors/1.1.jpeg" },
  "4.1": { Category: "Cool / Ash", Code: "4.1", Name: "Ash Brown", Description: "Medium brown with ash undertones", imagePath: "/resources/hair_colors/4.1.jpeg" },
  "5.1": { Category: "Cool / Ash", Code: "5.1", Name: "Light Ash Brown", Description: "Slightly lighter ash brown", imagePath: "/resources/hair_colors/5.1.jpeg" },
  "6.1": { Category: "Cool / Ash", Code: "6.1", Name: "Dark Ash Blonde", Description: "Cool-toned dark blonde", imagePath: "/resources/hair_colors/6.1.jpeg" },
  "7.1": { Category: "Cool / Ash", Code: "7.1", Name: "Ash Blonde", Description: "Medium blonde with silvery undertones", imagePath: "/resources/hair_colors/7.1.jpeg" },
  "8.1": { Category: "Cool / Ash", Code: "8.1", Name: "Light Ash Blonde", Description: "Light cool blonde", imagePath: "/resources/hair_colors/8.1.jpeg" },
  "9.3": { Category: "Golden / Warm", Code: "9.3", Name: "Very Light Golden Blonde", Description: "Warm pale blonde", imagePath: "/resources/hair_colors/9.3.jpeg" },
  "8.03": { Category: "Golden / Warm", Code: "8.03", Name: "Light Natural-Golden Blonde", Description: "Natural golden tone", imagePath: "/resources/hair_colors/8.03.jpeg" },
  "8.3": { Category: "Golden / Warm", Code: "8.3", Name: "Light Golden Blonde", Description: "Golden light blonde", imagePath: "/resources/hair_colors/8.3.jpeg" },
  "7.3": { Category: "Golden / Warm", Code: "7.3", Name: "Dark Golden Blonde", Description: "Warm golden dark blonde", imagePath: "/resources/hair_colors/7.3.jpeg" },
  "6.34": { Category: "Golden / Warm", Code: "6.34", Name: "Light Brown with Gold-Copper", Description: "Golden-copper brown", imagePath: "/resources/hair_colors/6.34.jpeg" },
  "6.3": { Category: "Golden / Warm", Code: "6.3", Name: "Light Golden Brown", Description: "Warm light brown", imagePath: "/resources/hair_colors/6.3.jpeg" },
  "8.8": { Category: "Mocha", Code: "8.8", Name: "Light Mocha Blonde", Description: "Medium-light blonde with mocha tone", imagePath: "/resources/hair_colors/8.8.jpeg" },
  "7.8": { Category: "Mocha", Code: "7.8", Name: "Mocha Blonde", Description: "Slightly darker mocha blonde", imagePath: "/resources/hair_colors/7.8.jpeg" },
  "6.8": { Category: "Mocha", Code: "6.8", Name: "Dark Mocha Blonde", Description: "Deep warm blonde with mocha", imagePath: "/resources/hair_colors/6.8.jpeg" },
  "5.8": { Category: "Mocha", Code: "5.8", Name: "Light Mocha Brown", Description: "Rich warm light brown", imagePath: "/resources/hair_colors/5.8.jpeg" },
  "4.8": { Category: "Mocha", Code: "4.8", Name: "Mocha Brown", Description: "Warm medium brown", imagePath: "/resources/hair_colors/4.8.jpeg" },
  "4.2": { Category: "Fashion", Code: "4.2", Name: "Intense Violet Brown", Description: "Deep brown with purple tone", imagePath: "/resources/hair_colors/4.2.jpeg" },
  "9.22": { Category: "Fashion", Code: "9.22", Name: "Very Light Blonde – Deep Iris", Description: "Pale blonde with violet/iridescent", imagePath: "/resources/hair_colors/9.22.jpeg" },
  "9.2": { Category: "Fashion", Code: "9.2", Name: "Very Light Blonde – Iridescent Ash", Description: "Pale ash with iridescent tones", imagePath: "/resources/hair_colors/9.2.jpeg" },
  "9": { Category: "Classic", Code: "9", Name: "Very Light Blonde", Description: "", imagePath: "/resources/hair_colors/9.jpeg" },
  "8": { Category: "Classic", Code: "8", Name: "Light Blonde", Description: "", imagePath: "/resources/hair_colors/8.jpeg" },
  "7": { Category: "Classic", Code: "7", Name: "Dark Blonde", Description: "", imagePath: "/resources/hair_colors/7.jpeg" },
  "6": { Category: "Classic", Code: "6", Name: "Light Brown", Description: "", imagePath: "/resources/hair_colors/6.jpeg" },
  "5": { Category: "Classic", Code: "5", Name: "Medium Brown", Description: "", imagePath: "/resources/hair_colors/5.jpeg" },
  "4": { Category: "Classic", Code: "4", Name: "Dark Brown", Description: "", imagePath: "/resources/hair_colors/4.jpeg" },
  "3": { Category: "Classic", Code: "3", Name: "Very Dark Brown", Description: "", imagePath: "/resources/hair_colors/3.jpeg" },
  "1": { Category: "Classic", Code: "1", Name: "Black", Description: "", imagePath: "/resources/hair_colors/1.jpeg" }
};

// Group dictionary into tab categories
const categorizedColors = {
  classic: Object.values(hairColorDict).filter(c => c.Category.toLowerCase().includes("classic")),
  fashion: Object.values(hairColorDict).filter(c => c.Category.toLowerCase().includes("fashion")),
  mocha: Object.values(hairColorDict).filter(c => c.Category.toLowerCase().includes("mocha")),
  warm: Object.values(hairColorDict).filter(c => c.Category.toLowerCase().includes("golden / warm")),
  cool: Object.values(hairColorDict).filter(c => c.Category.toLowerCase().includes("cool / ash")),
};

const HairColorSelector = (props) => {
  const [currentCategory, setCurrentCategory] = useState("classic");
  const [selectedColor, setSelectedColor] = useState(null);

  const handleTabClick = (category) => {
    setCurrentCategory(category);
    setSelectedColor(null);
    props.onTabChanged?.({ category });
  };

  const handleSelectColor = (color) => {
    setSelectedColor(color);
    props.onColorSelected?.(color);
  };

  const handleApply = () => {
    selectedColor
      ? props.onColorApplied?.(selectedColor)
      : alert("Please select a color first!");
  };

  const handleNavigate = (type) => {
    props.onNavigate?.({ type });
  };

  return (
    <div className="font-sans bg-gradient-to-br from-blue-50 to-indigo-200 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-7xl w-full">
        {/* <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Color Change</h1> */}
        <p className="text-gray-600 text-center mb-8 text-base">Select color to change</p>
        <div className="flex justify-center gap-8 mb-10 border-b-2 border-gray-200 pb-4">
          {["classic", "fashion", "mocha", "warm", "cool"].map(cat => (
            <button
              key={cat}
              className={`tab px-5 py-2 text-gray-600 font-medium transition-all duration-300 relative text-base ${currentCategory === cat ? "active text-indigo-500" : "hover:text-gray-800"}`}
              onClick={() => handleTabClick(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className={`selected-info text-center p-5 bg-gray-100 rounded-xl mb-5 ${selectedColor ? "block animate-fadeIn" : "hidden"}`}>
          <strong>Selected:</strong> <span>{selectedColor ? `${selectedColor.Name} (${selectedColor.Code})` : "None"}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 mb-10 min-h-[300px]">
          {categorizedColors[currentCategory].map((color, idx) => (
            <div
              key={idx}
              className={`cursor-pointer text-center p-3 rounded-2xl bg-gray-50 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${selectedColor?.Code === color.Code ? "bg-indigo-100 shadow-md" : ""}`}
              onClick={() => handleSelectColor(color)}
            >
              <img src={color.imagePath} alt={color.Name} className="rounded-xl w-full h-24 object-cover mb-2" />
              {/* <div className="text-sm font-medium text-gray-800">{color.Name}</div> */}
              <div className="text-s text-gray-600">{color.Code}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HairColorSelector;
