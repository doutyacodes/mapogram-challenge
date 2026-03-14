import React, { useState } from 'react';
import { Target, MapPin, Utensils, X, Clock, Check, IndianRupee, Star, Map as MapIcon } from 'lucide-react';

// We will pass the specific items as a prop instead of relying on an internal static block.

const StateCategoryContent = ({ category, district, itemsData = [], onClose }) => {
  const [items, setItems] = useState(itemsData);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleAction = (id, actionType) => {
    console.log(`${actionType} item ${id}`);
    
    // For "hide", remove it from local state to demonstrate the action working
    if (actionType === 'hide') {
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItem(null);
    } else {
      // Just visually show success for Accept/Deny
      alert(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} registered successfully!`);
      setSelectedItem(null);
    }
  };

  const getCategoryConfig = () => {
    switch(category) {
      case 'Challenges': return { icon: Target, title: 'Active Challenges', bgClass: 'bg-orange-50', textClass: 'text-orange-500', borderActive: 'border-orange-300 ring-orange-100 ring-1' };
      case 'Places':     return { icon: MapPin, title: 'Places to Visit', bgClass: 'bg-green-50', textClass: 'text-green-500', borderActive: 'border-green-300 ring-green-100 ring-1' };
      case 'Food':       return { icon: Utensils, title: 'Local Restaurants', bgClass: 'bg-red-50', textClass: 'text-red-500', borderActive: 'border-red-300 ring-red-100 ring-1' };
      default:           return { icon: MapIcon, title: 'Category', bgClass: 'bg-blue-50', textClass: 'text-blue-500', borderActive: 'border-blue-300 ring-blue-100 ring-1' };
    }
  };

  const config = getCategoryConfig();
  const Icon = config.icon;

  return (
    <div className="absolute top-4 right-4 z-[100] pointer-events-auto w-80 sm:w-96 max-h-[calc(100vh-160px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-8 duration-300">
      
      {/* Header */}
      <div className={`p-4 border-b border-gray-100 ${config.bgClass} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-white rounded-lg shadow-sm ${config.textClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 leading-tight">{config.title}</h2>
            <p className="text-xs text-gray-500 font-medium">{district}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50">
        
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No more items in this category.</p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                selectedItem === item.id 
                  ? `${config.borderActive} shadow-md` 
                  : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer'
              }`}
              onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
            >
              {/* Card Image */}
              <div className="h-32 w-full relative overflow-hidden group">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Reward points pill */}
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-yellow-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Star size={12} fill="currentColor" />
                  {item.points} pts
                </div>

                {/* Specific category badges */}
                {item.distance && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <MapPin size={10} /> {item.distance}
                  </div>
                )}
                {item.rating && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <Star size={10} fill="currentColor"/> {item.rating}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h3>
                
                {item.hours && (
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Clock size={12}/> {item.hours}
                  </p>
                )}
                
                <p className={`text-xs text-gray-600 ${selectedItem === item.id ? '' : 'line-clamp-2'}`}>
                  {item.description}
                </p>

                {/* Action Buttons (Expand when selected) */}
                <div className={`grid grid-cols-3 gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
                  selectedItem === item.id ? 'max-h-12 mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'
                }`}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'accept'); }}
                    className="flex items-center justify-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'deny'); }}
                    className="flex items-center justify-center py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                  >
                    Deny
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'hide'); }}
                    className="flex items-center justify-center py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors border border-red-100"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StateCategoryContent;
