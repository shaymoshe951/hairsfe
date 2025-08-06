"use client";
import React from "react";

// public/HairColorSelector.js
const { useState } = React;

const HairColorSelector = (props) => {
  const [currentCategory, setCurrentCategory] = useState('classic');
  const [selectedColor, setSelectedColor] = useState(null);

  const colors = {
    classic: [
      { name: 'Very Light Blonde', code: '9', hex: '#F4E4C1' },
      { name: 'Light Blonde', code: '8', hex: '#E5C88C' },
      { name: 'Dark Blonde', code: '7', hex: '#C19A6B' },
      { name: 'Light Brown', code: '6', hex: '#A67C52' },
      { name: 'Medium Brown', code: '5', hex: '#8B6239' },
      { name: 'Dark Brown', code: '4', hex: '#6F4E37' },
      { name: 'Very Dark Brown', code: '3', hex: '#3D2314' },
      { name: 'Black', code: '1', hex: '#1C1C1C' }
    ],
    fashion: [
      { name: 'Rose Gold', code: 'RG', hex: '#E0A899' },
      { name: 'Lavender', code: 'LV', hex: '#C8B6E2' },
      { name: 'Silver', code: 'SV', hex: '#C0C0C0' },
      { name: 'Blue Black', code: 'BB', hex: '#1B2951' },
      { name: 'Cherry Red', code: 'CR', hex: '#B91C1C' },
      { name: 'Emerald Green', code: 'EG', hex: '#065F46' },
      { name: 'Pink Champagne', code: 'PC', hex: '#F9C2D1' },
      { name: 'Violet', code: 'VT', hex: '#7C3AED' }
    ],
    mocha: [
      { name: 'Mocha Brown', code: 'MB', hex: '#7B5544' },
      { name: 'Caramel Mocha', code: 'CM', hex: '#B08D57' },
      { name: 'Chocolate', code: 'CH', hex: '#5D3A1A' },
      { name: 'Espresso', code: 'ES', hex: '#3C2415' },
      { name: 'Cinnamon', code: 'CN', hex: '#9B5E3C' },
      { name: 'Hazelnut', code: 'HZ', hex: '#8B6F47' },
      { name: 'Toffee', code: 'TF', hex: '#C2A679' },
      { name: 'Cocoa', code: 'CC', hex: '#6B4423' }
    ]
  };

  const handleTabClick = (category) => {
    setCurrentCategory(category);
    setSelectedColor(null);
    if (props.onTabChanged) {
      props.onTabChanged({ category });
    }
  };

  const handleSelectColor = (color) => {
    setSelectedColor(color);
    if (props.onColorSelected) {
      props.onColorSelected(color);
    }
  };

  const handleApply = () => {
    if (selectedColor) {
      if (props.onColorApplied) {
        props.onColorApplied(selectedColor);
      }
    } else {
      alert('Please select a color first!');
    }
  };

  const handleNavigate = (type) => {
    if (props.onNavigate) {
      props.onNavigate({ type });
    }
  };

  return (
    <div className="font-sans bg-gradient-to-br from-blue-50 to-indigo-200 min-h-screen flex items-center justify-center p-5">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInUnderline {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes popIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -17px;
          left: 0;
          right: 0;
          height: 3px;
          background: #6366f1;
          border-radius: 3px;
          animation: slideInUnderline 0.3s ease-out;
        }
        .color-option.selected::after {
          content: '✓';
          position: absolute;
          top: 10px;
          right: 10px;
          background: #6366f1;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          animation: popIn 0.3s ease-out;
        }
        .hair-swatch::before {
          content: '';
          position: absolute;
          top: -10%;
          left: -10%;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent);
          border-radius: 50%;
        }
        .selected-info.show {
          display: block;
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-5xl w-full animate-slideIn">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Color Change</h1>
        <p className="text-gray-600 text-center mb-8 text-base">Select color or next to skip.</p>
        <div className="flex justify-center gap-8 mb-10 border-b-2 border-gray-200 pb-4">
          <button 
            className={`tab px-5 py-2 text-gray-600 font-medium transition-all duration-300 relative text-base ${currentCategory === 'classic' ? 'active text-indigo-500' : 'hover:text-gray-800'}`} 
            onClick={() => handleTabClick('classic')}
          >
            Classic
          </button>
          <button 
            className={`tab px-5 py-2 text-gray-600 font-medium transition-all duration-300 relative text-base ${currentCategory === 'fashion' ? 'active text-indigo-500' : 'hover:text-gray-800'}`} 
            onClick={() => handleTabClick('fashion')}
          >
            Fashion
          </button>
          <button 
            className={`tab px-5 py-2 text-gray-600 font-medium transition-all duration-300 relative text-base ${currentCategory === 'mocha' ? 'active text-indigo-500' : 'hover:text-gray-800'}`} 
            onClick={() => handleTabClick('mocha')}
          >
            Mocha
          </button>
        </div>
        <div className={`selected-info text-center p-5 bg-gray-100 rounded-xl mb-5 hidden ${selectedColor ? 'show' : ''}`}>
          <strong>Selected:</strong> <span>{selectedColor ? `${selectedColor.name} (${selectedColor.code})` : 'None'}</span>
        </div>
        <div className="color-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 mb-10 min-h-[300px]">
          {colors[currentCategory].map((color, index) => (
            <div 
              key={index}
              className={`color-option cursor-pointer text-center p-4 rounded-2xl bg-gray-50 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:bg-white ${selectedColor && selectedColor.name === color.name ? 'selected bg-indigo-100 shadow-md' : ''}`}
              onClick={() => handleSelectColor(color)}
              style={{ animation: `slideIn 0.5s ease-out ${index * 0.05}s both` }}
            >
              <div className="hair-swatch w-20 h-20 rounded-full mx-auto mb-2 relative overflow-hidden shadow-inner" style={{ backgroundColor: color.hex }}></div>
              <div className="color-name text-sm font-medium text-gray-800">{color.name}</div>
              <div className="color-code text-xs text-gray-600 mt-1">{color.code}</div>
            </div>
          ))}
        </div>
        <button className="apply-button bg-indigo-500 text-white border-none py-4 px-10 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 block mx-auto shadow-lg hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0" onClick={handleApply}>Apply Colors</button>
        <div className="navigation flex justify-between items-center mt-8 pt-8 border-t border-gray-200">
          <button className="nav-button bg-transparent border border-gray-300 py-2 px-5 rounded-lg cursor-pointer text-sm text-gray-600 transition-all duration-300 flex items-center gap-2 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-500" onClick={() => handleNavigate('home')}>
            <span>←</span> Home
          </button>
          <button className="nav-button bg-transparent border border-gray-300 py-2 px-5 rounded-lg cursor-pointer text-sm text-gray-600 transition-all duration-300 flex items-center gap-2 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-500" onClick={() => handleNavigate('previous')}>
            Previous
          </button>
          <button className="nav-button bg-transparent border border-gray-300 py-2 px-5 rounded-lg cursor-pointer text-sm text-gray-600 transition-all duration-300 flex items-center gap-2 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-500" onClick={() => handleNavigate('next')}>
            Next <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HairColorSelector;
