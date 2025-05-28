import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  Layers, 
  Clock, 
  MapPin,
  Eye,
  EyeOff,
  Search,
  Filter,
  Settings,
  Bookmark,
  History,
  TrendingUp,
  BarChart3,
  Zap,
  Moon,
  Sun,
  Download,
  Share2,
  Heart,
  Star,
  Users,
  Target
} from 'lucide-react';

const ControlPanel = ({
  selectedFacilityType,
  setSelectedFacilityType,
  maxTravelTime,
  setMaxTravelTime,
  onGenerateRecommendations,
  onClearMap,
  isLoading,
  activeLayers,
  onLayerToggle,
  showCoverageZones,
  onToggleCoverageZones,
  facilities = [],
  statistics = null,
  recommendations = [],
  darkMode = false,
  setDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [favoritesFacilities, setFavoritesFacilities] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [quickStats, setQuickStats] = useState({
    totalFacilities: 0,
    avgCoverage: 0,
    lastUpdated: new Date()
  });

  // Обновляем статистику при изменении данных
  useEffect(() => {
    setQuickStats({
      totalFacilities: facilities.length,
      avgCoverage: statistics ? statistics.current_coverage || 68.5 : 68.5,
      lastUpdated: new Date()
    });
  }, [facilities, statistics]);

  const facilityTypes = [
    { value: 'all', label: 'Все учреждения', icon: '🏢', color: 'bg-gradient-to-r from-gray-500 to-gray-600' },
    { value: 'school', label: 'Школы', icon: '🏫', color: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
    { value: 'hospital', label: 'Больницы', icon: '🏥', color: 'bg-gradient-to-r from-red-600 to-red-700' },
    { value: 'polyclinic', label: 'Поликлиники', icon: '🏨', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { value: 'clinic', label: 'Клиники', icon: '⚕️', color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { value: 'fire_station', label: 'Пожарные станции', icon: '🚒', color: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    { value: 'police_station', label: 'Полицейские участки', icon: '🚔', color: 'bg-gradient-to-r from-gray-700 to-gray-800' },
    { value: 'post_office', label: 'Почтовые отделения', icon: '📮', color: 'bg-gradient-to-r from-green-500 to-green-600' }
  ];

  const layerOptions = [
    { key: 'facilities', label: 'Учреждения', icon: MapPin, count: facilities.length },
    { key: 'heatmap', label: 'Плотность населения', icon: Layers, count: null },
    { key: 'recommendations', label: 'Рекомендации', icon: Target, count: recommendations.length }
  ];

  const addToFavorites = (facility) => {
    if (!favoritesFacilities.find(f => f.id === facility.id)) {
      setFavoritesFacilities([...favoritesFacilities, facility]);
    }
  };

  const removeFromFavorites = (facilityId) => {
    setFavoritesFacilities(favoritesFacilities.filter(f => f.id !== facilityId));
  };

  const addToSearchHistory = (query) => {
    if (query && !searchHistory.includes(query)) {
      setSearchHistory([query, ...searchHistory.slice(0, 4)]);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      addToSearchHistory(query);
    }
  };

  const filteredFacilities = facilities.filter(facility => 
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Аналитические данные из статистики
  const getAnalyticsData = () => {
    if (!statistics) return null;
    
    return {
      coverage: statistics.current_coverage || 0,
      improvement: statistics.coverage_improvement || 0,
      peopleCovered: statistics.people_covered || 0,
      newPoints: statistics.new_points_count || 0
    };
  };

  const analyticsData = getAnalyticsData();

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} transition-colors duration-300`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
              Панель управления
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Интеллектуальный анализ размещения
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="space-y-4 mb-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`relative overflow-hidden p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${
              darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
            } border ${darkMode ? 'border-gray-600' : 'border-blue-200'}`}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-blue-600">{quickStats.totalFacilities}</div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Всего объектов</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {facilities.filter(f => f.type === 'school').length} школ, {facilities.filter(f => f.type === 'hospital').length} больниц
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
            </div>

            <div className={`relative overflow-hidden p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${
              darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-green-50 to-emerald-100'
            } border ${darkMode ? 'border-gray-600' : 'border-green-200'}`}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-green-600">{analyticsData?.coverage?.toFixed(1) || quickStats.avgCoverage.toFixed(1)}%</div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Покрытие</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {(analyticsData?.coverage || quickStats.avgCoverage) > 70 ? '✅ Хорошее' : (analyticsData?.coverage || quickStats.avgCoverage) > 50 ? '⚠️ Среднее' : '❌ Низкое'} покрытие
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`text-center p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-50 to-pink-50'
            } border ${darkMode ? 'border-gray-700' : 'border-purple-100'}`}>
              <div className="text-lg font-bold text-purple-600">{recommendations.length}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Рекомендаций</div>
            </div>
            
            <div className={`text-center p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-orange-50 to-red-50'
            } border ${darkMode ? 'border-gray-700' : 'border-orange-100'}`}>
              <div className="text-lg font-bold text-orange-600">
                {facilities.filter(f => f.rating).length > 0 
                  ? (facilities.reduce((sum, f) => sum + (f.rating || 0), 0) / facilities.filter(f => f.rating).length).toFixed(1)
                  : '-'
                }
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Рейтинг ⭐</div>
            </div>
            
            <div className={`text-center p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-cyan-50 to-blue-50'
            } border ${darkMode ? 'border-gray-700' : 'border-cyan-100'}`}>
              <div className="text-lg font-bold text-cyan-600">
                {Math.round((Date.now() - quickStats.lastUpdated.getTime()) / 60000)}м
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Обновлено</div>
            </div>
          </div>

          {/* Detailed Analytics */}
          {analyticsData && (
            <div className={`p-4 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-gray-50 to-gray-100'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Аналитика рекомендаций
                </h4>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'
                }`}>
                  Данные сервера
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Улучшение</span>
                    <span className="text-sm font-medium text-green-600">+{analyticsData.improvement?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Охват населения</span>
                    <span className="text-sm font-medium text-blue-600">{analyticsData.peopleCovered?.toLocaleString() || 0}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Новых точек</span>
                    <span className="text-sm font-medium text-purple-600">{analyticsData.newPoints || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Тип объектов</span>
                    <span className="text-sm font-medium text-orange-600">{facilityTypes.find(t => t.value === selectedFacilityType)?.label || 'Все'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          
          {/* Smart Search */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                <Search className="w-4 h-4 mr-2" />
                Умный поиск
              </label>
              {searchHistory.length > 0 && (
                <button className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>
                  <History className="w-3 h-3 mr-1 inline" />
                  История
                </button>
              )}
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по названию, адресу или типу..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`input-field pr-10 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : ''} transition-all focus:ring-2 focus:ring-primary-500`}
              />
              <Search className={`w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            
            {/* Search Results */}
            {searchQuery && (
              <div className={`rounded-xl shadow-lg max-h-48 overflow-y-auto border ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                {filteredFacilities.slice(0, 5).map(facility => (
                  <div 
                    key={facility.id} 
                    className={`p-3 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer border-b last:border-b-0 ${darkMode ? 'border-gray-600' : 'border-gray-100'} transition-colors`}
                    onClick={() => {
                      setSearchQuery('');
                      // Zoom to facility logic here
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{facility.name}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{facility.address}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          favoritesFacilities.find(f => f.id === facility.id) 
                            ? removeFromFavorites(facility.id)
                            : addToFavorites(facility);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors"
                      >
                        {favoritesFacilities.find(f => f.id === facility.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredFacilities.length === 0 && (
                  <div className={`p-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                    Ничего не найдено
                  </div>
                )}
              </div>
            )}

            {/* Search History */}
            {!searchQuery && searchHistory.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(query)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {query}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Быстрый анализ</span>
            </button>
            <button className={`flex items-center justify-center space-x-2 p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
            }`}>
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Экспорт</span>
            </button>
          </div>

          {/* Facility Type Selection */}
          <div className="space-y-3">
            <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Тип учреждения
            </label>
            <div className="grid grid-cols-1 gap-2">
              {facilityTypes.map((type) => {
                const typeCount = facilities.filter(f => type.value === 'all' || f.type === type.value).length;
                const avgRating = type.value !== 'all' 
                  ? facilities.filter(f => f.type === type.value && f.rating)
                      .reduce((sum, f, _, arr) => sum + (f.rating / arr.length), 0)
                  : facilities.filter(f => f.rating)
                      .reduce((sum, f, _, arr) => sum + (f.rating / arr.length), 0);
                
                return (
                  <div key={type.value} className="space-y-0">
                    <label
                      className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 transform hover:scale-102 ${
                        selectedFacilityType === type.value
                          ? `${type.color} text-white shadow-lg scale-102`
                          : darkMode 
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      } ${selectedFacilityType === type.value ? 'rounded-b-none' : ''}`}
                    >
                      <input
                        type="radio"
                        name="facilityType"
                        value={type.value}
                        checked={selectedFacilityType === type.value}
                        onChange={(e) => setSelectedFacilityType(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{type.label}</span>
                            {avgRating > 0 && (
                              <div className={`text-xs ${selectedFacilityType === type.value ? 'text-white opacity-75' : 'text-yellow-500'}`}>
                                ⭐ {avgRating.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className={`text-xs ${selectedFacilityType === type.value ? 'text-white opacity-75' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {typeCount} объектов
                          </div>
                        </div>
                      </div>
                      {selectedFacilityType === type.value && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Travel Time Slider */}
          <div className="space-y-4">
            <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
              <Clock className="w-4 h-4 mr-2" />
              Время доезда: <span className="text-primary-600 ml-1">{maxTravelTime} мин</span>
            </label>
            <div className="space-y-3">
              <div className="relative px-2">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={maxTravelTime}
                  onChange={(e) => setMaxTravelTime(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-modern"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5 мин</span>
                  <span>30 мин</span>
                  <span>60 мин</span>
                </div>
              </div>
              
              {/* Quick time buttons */}
              <div className="flex space-x-2">
                {[10, 15, 30].map(time => (
                  <button
                    key={time}
                    onClick={() => setMaxTravelTime(time)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      maxTravelTime === time
                        ? 'bg-primary-500 text-white'
                        : darkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {time} мин
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Layer Management */}
          <div className="space-y-3">
            <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
              <Layers className="w-4 h-4 mr-2" />
              Управление слоями
            </label>
            <div className="space-y-2">
              {layerOptions.map((layer) => {
                const IconComponent = layer.icon;
                return (
                  <div
                    key={layer.key}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      activeLayers[layer.key]
                        ? darkMode 
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-primary-50 border-primary-200'
                        : darkMode
                          ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 ${activeLayers[layer.key] ? 'text-primary-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{layer.label}</span>
                        {layer.count !== null && (
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {layer.count} элементов
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onLayerToggle(layer.key)}
                      className={`p-2 rounded-lg transition-colors ${
                        activeLayers[layer.key]
                          ? 'text-primary-600 hover:text-primary-700'
                          : darkMode 
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-400 hover:text-gray-500'
                      }`}
                    >
                      {activeLayers[layer.key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
              
              {/* Coverage Zones Toggle */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                showCoverageZones
                  ? darkMode 
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-primary-50 border-primary-200'
                  : darkMode
                    ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${showCoverageZones ? 'border-primary-600' : darkMode ? 'border-gray-400' : 'border-gray-400'}`}></div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Зоны покрытия</span>
                </div>
                <button
                  onClick={onToggleCoverageZones}
                  className={`p-2 rounded-lg transition-colors ${
                    showCoverageZones
                      ? 'text-primary-600 hover:text-primary-700'
                      : darkMode 
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  {showCoverageZones ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Подсказка об индивидуальном радиусе */}
              <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 <strong>Новая функция:</strong> Нажмите кнопку "🎯 Радиус" в попапе любого учреждения, чтобы увидеть его индивидуальную зону покрытия за {maxTravelTime} минут
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onGenerateRecommendations}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 rounded-xl font-semibold text-sm shadow-lg transform transition-all hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Анализируем...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span>Сгенерировать рекомендации</span>
                </>
              )}
            </button>

            <button
              onClick={onClearMap}
              disabled={isLoading}
              className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 rounded-xl font-semibold text-sm shadow-lg transform transition-all hover:scale-105 disabled:hover:scale-100"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Очистить карту</span>
            </button>
          </div>

          {/* Tips */}
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
            <h4 className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-2 flex items-center`}>
              <Zap className="w-4 h-4 mr-2" />
              Умные советы
            </h4>
            <ul className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-800'} space-y-1`}>
              <li>• Используйте поиск для быстрого нахождения объектов</li>
              <li>• Добавляйте важные места в избранное ⭐</li>
              <li>• Настройте время доезда для точного анализа</li>
              <li>• Комбинируйте слои для лучшей визуализации</li>
            </ul>
          </div>

          {/* Live Statistics */}
          {statistics && (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800' : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'}`}>
              <h4 className={`text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-900'} mb-3 flex items-center`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Статистика анализа
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`text-center p-2 rounded ${darkMode ? 'bg-purple-800/30' : 'bg-white/70'}`}>
                  <div className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    {(statistics.current_coverage || 0).toFixed(1)}%
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Текущее покрытие</div>
                </div>
                <div className={`text-center p-2 rounded ${darkMode ? 'bg-pink-800/30' : 'bg-white/70'}`}>
                  <div className={`font-bold ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                    {statistics.new_points_count || 0}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>Новых точек</div>
                </div>
              </div>
            </div>
          )}

          {/* Favorites Section */}
          {favoritesFacilities.length > 0 && (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200'}`}>
              <h4 className={`text-sm font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-900'} mb-2 flex items-center`}>
                <Star className="w-4 h-4 mr-2" />
                Избранное ({favoritesFacilities.length})
              </h4>
              <div className="space-y-1">
                {favoritesFacilities.slice(0, 3).map(facility => (
                  <div 
                    key={facility.id}
                    className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                      darkMode 
                        ? 'bg-yellow-800/30 hover:bg-yellow-700/30 text-yellow-200' 
                        : 'bg-white/70 hover:bg-white text-yellow-800'
                    }`}
                    onClick={() => {
                      // Focus on facility on map
                    }}
                  >
                    <div className="font-medium">{facility.name}</div>
                    <div className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {getFacilityIconConfig(facility.type).name}
                    </div>
                  </div>
                ))}
                {favoritesFacilities.length > 3 && (
                  <div className={`text-xs text-center ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    +{favoritesFacilities.length - 3} ещё
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function for getting facility icon config
const getFacilityIconConfig = (type) => {
  const configs = {
    school: { name: 'Школа' },
    hospital: { name: 'Больница' },
    polyclinic: { name: 'Поликлиника' },
    clinic: { name: 'Клиника' },
    fire_station: { name: 'Пожарная станция' },
    police_station: { name: 'Полицейский участок' },
    post_office: { name: 'Почтовое отделение' },
    all: { name: 'Все учреждения' }
  };
  return configs[type] || { name: 'Учреждение' };
};

export default ControlPanel; 