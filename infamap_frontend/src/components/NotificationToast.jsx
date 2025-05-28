import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Zap } from 'lucide-react';

const NotificationToast = ({ notifications = [], onRemove, darkMode = false }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'analysis':
        return <Zap className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStyles = (type) => {
    const base = "border-l-4 shadow-lg backdrop-blur-sm transition-all duration-300";
    
    if (darkMode) {
      switch (type) {
        case 'success':
          return `${base} bg-green-900/80 border-green-400 text-green-100`;
        case 'warning':
          return `${base} bg-yellow-900/80 border-yellow-400 text-yellow-100`;
        case 'info':
          return `${base} bg-blue-900/80 border-blue-400 text-blue-100`;
        case 'analysis':
          return `${base} bg-purple-900/80 border-purple-400 text-purple-100`;
        default:
          return `${base} bg-gray-800/80 border-gray-400 text-gray-100`;
      }
    } else {
      switch (type) {
        case 'success':
          return `${base} bg-green-50/90 border-green-500 text-green-800`;
        case 'warning':
          return `${base} bg-yellow-50/90 border-yellow-500 text-yellow-800`;
        case 'info':
          return `${base} bg-blue-50/90 border-blue-500 text-blue-800`;
        case 'analysis':
          return `${base} bg-purple-50/90 border-purple-500 text-purple-800`;
        default:
          return `${base} bg-gray-50/90 border-gray-500 text-gray-800`;
      }
    }
  };

  const getActionButtonStyles = () => {
    return darkMode 
      ? "mt-2 text-xs px-3 py-1 bg-gray-700/70 hover:bg-gray-600 text-gray-200 rounded transition-colors font-medium"
      : "mt-2 text-xs px-3 py-1 bg-white/70 hover:bg-white rounded transition-colors font-medium";
  };

  const getCloseButtonStyles = () => {
    return darkMode
      ? "flex-shrink-0 ml-2 p-1 hover:bg-white/10 rounded transition-colors"
      : "flex-shrink-0 ml-2 p-1 hover:bg-black/10 rounded transition-colors";
  };

  return (
    <div className="fixed top-4 right-4 z-[2000] space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg transform animate-slideInRight ${getStyles(notification.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">{notification.title}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
              {notification.action && (
                <button 
                  onClick={notification.action.onClick}
                  className={getActionButtonStyles()}
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className={getCloseButtonStyles()}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast; 