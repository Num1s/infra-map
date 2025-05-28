import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X, 
  Settings,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react';

const NotificationSystem = ({ darkMode = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    critical: true,
    warnings: true,
    info: true,
    analytics: false,
    realtime: true
  });

  // Функция добавления уведомления
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  };

  // Функция удаления уведомления
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Функция очистки всех уведомлений
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleAction = (notification) => {
    console.log(`Выполняется действие: ${notification.action} для ${notification.facility}`);
    // Здесь будет логика обработки действий
    removeNotification(notification.id);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      critical: AlertTriangle,
      warning: Clock,
      info: Info,
      analytics: TrendingUp,
      success: CheckCircle
    };
    return icons[type] || Info;
  };

  const getNotificationColor = (type) => {
    const colors = {
      critical: 'red',
      warning: 'orange', 
      info: 'blue',
      analytics: 'purple',
      success: 'green'
    };
    return colors[type] || 'gray';
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`relative p-2 rounded-lg transition-colors ${
          darkMode 
            ? 'hover:bg-gray-700 text-gray-300' 
            : 'hover:bg-gray-100 text-gray-600'
        } ${unreadCount > 0 ? 'animate-pulse' : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showSettings && (
        <div className={`absolute right-0 top-12 w-96 max-h-96 overflow-hidden rounded-xl shadow-2xl border z-50 ${
          darkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Bell className="w-4 h-4 mr-2" />
                Уведомления {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет новых уведомлений</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const color = getNotificationColor(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full flex-shrink-0 bg-${color}-100`}>
                          <IconComponent className={`w-4 h-4 text-${color}-600`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className={`p-1 rounded transition-colors ${
                                darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                              }`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          
                          <div className={`flex items-center mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{notification.location}</span>
                            <span className="mx-2">•</span>
                            <span>{notification.timestamp.toLocaleTimeString('ru-RU', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          
                          {notification.action && (
                            <button
                              onClick={() => handleAction(notification)}
                              className={`mt-2 text-xs px-3 py-1 rounded-full transition-colors bg-${color}-500 text-white hover:bg-${color}-600`}
                            >
                              {getActionText(notification.action)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings Footer */}
          <div className={`p-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Настройки уведомлений
              </span>
              <button
                onClick={() => {/* Open notification settings */}}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(notificationSettings).map(([key, enabled]) => (
                <button
                  key={key}
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    [key]: !prev[key]
                  }))}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    enabled
                      ? 'bg-primary-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {getSettingLabel(key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Вспомогательные функции
const getActionText = (action) => {
  const actions = {
    redirect_patients: 'Перенаправить пациентов',
    optimize_schedule: 'Оптимизировать расписание',
    find_alternative: 'Найти альтернативу',
    analyze_trend: 'Анализировать тренд',
    view_results: 'Посмотреть результаты'
  };
  return actions[action] || 'Действие';
};

const getSettingLabel = (key) => {
  const labels = {
    critical: 'Критические',
    warnings: 'Предупреждения', 
    info: 'Информационные',
    analytics: 'Аналитика',
    realtime: 'Реальное время'
  };
  return labels[key] || key;
};

export default NotificationSystem; 