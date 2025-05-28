import React, { useState, useEffect, useCallback } from 'react';
import InteractiveMap from './components/InteractiveMap';
import ControlPanel from './components/ControlPanel';
import ResultsPanel from './components/ResultsPanel';
import ReportModal from './components/ReportModal';
import FacilityDetailsModal from './components/FacilityDetailsModal';
import { apiService } from './services/apiService';
import { 
  MapPin, 
  Settings, 
  BarChart3, 
  Info, 
  PanelLeftOpen, 
  PanelLeftClose, 
  Download,
  HelpCircle,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Moon,
  Sun
} from 'lucide-react';

function App() {
  console.log('🚀 APP COMPONENT ИНИЦИАЛИЗАЦИЯ');
  
  // State для основных данных
  const [facilities, setFacilities] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // State для UI
  const [selectedFacilityType, setSelectedFacilityType] = useState('school');
  const [travelTime, setTravelTime] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // State для интерфейса
  const [darkMode, setDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  
  // State для слоев карты
  const [activeLayers, setActiveLayers] = useState({
    facilities: true,
    population: true,
    recommendations: false
  });
  const [showCoverageZones, setShowCoverageZones] = useState(false);
  
  // State для модальных окон
  const [selectedFacilityForDetails, setSelectedFacilityForDetails] = useState(null);
  const [showFacilityDetails, setShowFacilityDetails] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  // State для туториала
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  console.log('📊 НАЧАЛЬНЫЕ СОСТОЯНИЯ App:');
  console.log('  - recommendations.length:', recommendations.length);
  console.log('  - showRecommendations:', showRecommendations);
  console.log('  - activeLayers:', activeLayers);
  console.log('  - selectedFacilityType:', selectedFacilityType);

  // Отслеживание статуса подключения
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Загрузка данных при старте приложения
  useEffect(() => {
    loadInitialData();
  }, []);

  // Отслеживание изменений в facilities для диагностики
  useEffect(() => {
    console.log('🔄 FACILITIES STATE ИЗМЕНИЛСЯ:');
    console.log('  - facilities.length:', facilities.length);
    console.log('  - activeLayers.facilities:', activeLayers.facilities);
    console.log('  - selectedFacilityType:', selectedFacilityType);
    if (facilities.length > 0) {
      console.log('  - Первые 3 учреждения:', facilities.slice(0, 3).map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        coordinates: f.coordinates
      })));
      console.log('  - Типы учреждений:', [...new Set(facilities.map(f => f.type))]);
    }
  }, [facilities]);

  // Отслеживание изменений в populationData для диагностики
  useEffect(() => {
    console.log('🔄 POPULATION DATA STATE ИЗМЕНИЛСЯ:');
    console.log('  - populationData.length:', populationData.length);
    console.log('  - activeLayers.population:', activeLayers.population);
    if (populationData.length > 0) {
      console.log('  - Первые 3 точки:', populationData.slice(0, 3));
    }
  }, [populationData]);

  // Отслеживание изменений в activeLayers для диагностики
  useEffect(() => {
    console.log('🔄 ACTIVE LAYERS STATE ИЗМЕНИЛСЯ:', activeLayers);
  }, [activeLayers]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 НАЧИНАЕМ ЗАГРУЗКУ ДАННЫХ...');
      
      console.log('📡 Запрашиваем данные учреждений...');
      const facilitiesData = await apiService.getFacilities();
      console.log('📊 ПОЛУЧЕННЫЕ ДАННЫЕ УЧРЕЖДЕНИЙ:');
      console.log('  - Тип данных:', typeof facilitiesData);
      console.log('  - Является массивом:', Array.isArray(facilitiesData));
      console.log('  - Длина:', facilitiesData?.length);
      console.log('  - Первые 3 элемента:', facilitiesData?.slice(0, 3));
      
      if (facilitiesData && facilitiesData.length > 0) {
        console.log('✅ Устанавливаем данные учреждений в стейт:', facilitiesData.length);
        setFacilities(facilitiesData);
        
        // Проверяем что стейт обновился
        setTimeout(() => {
          console.log('🔄 Проверка стейта через 100мс - facilities.length должен быть', facilitiesData.length);
        }, 100);
      } else {
        console.warn('⚠️ НЕ ПОЛУЧЕНО ДАННЫХ ОБ УЧРЕЖДЕНИЯХ');
        console.log('   facilitiesData:', facilitiesData);
      }
      
      // Используем новый API для получения данных популяции
      try {
        console.log('📡 Запрашиваем данные популяции...');
        const populationEstimate = await apiService.getPopulationEstimate();
        console.log('📊 ПОЛУЧЕННЫЕ ДАННЫЕ ПОПУЛЯЦИИ:');
        console.log('  - populationEstimate:', populationEstimate);
        console.log('  - populationEstimate.heatmapData length:', populationEstimate?.heatmapData?.length);
        
        if (populationEstimate && populationEstimate.heatmapData) {
          console.log('✅ Устанавливаем данные популяции в стейт:', populationEstimate.heatmapData.length);
          setPopulationData(populationEstimate.heatmapData);
          console.log('📈 Общая популяция:', populationEstimate.totalPopulation);
          console.log('🏢 Всего зданий:', populationEstimate.totalBuildings);
        } else {
          console.warn('⚠️ НЕ ПОЛУЧЕНО ДАННЫХ О ПОПУЛЯЦИИ');
        }
      } catch (populationError) {
        console.error('❌ ОШИБКА ЗАГРУЗКИ ДАННЫХ ПОПУЛЯЦИИ:', populationError.message);
        // Fallback на старый метод
        try {
          console.log('🔄 Пробуем fallback метод...');
          const heatmapData = await apiService.getPopulationHeatmap();
          if (heatmapData && heatmapData.length > 0) {
            setPopulationData(heatmapData);
            console.log('✅ Использованы fallback данные населения:', heatmapData.length);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback данные населения также недоступны:', fallbackError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ЗАГРУЗКИ ДАННЫХ:', error);
      console.error('   Error stack:', error.stack);
    } finally {
      setIsLoading(false);
      console.log('✅ ЗАГРУЗКА ДАННЫХ ЗАВЕРШЕНА');
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setIsLoading(true);
      
      console.log('🚀 ЗАПУСК ГЕНЕРАЦИИ РЕКОМЕНДАЦИЙ:');
      console.log('selectedFacilityType:', selectedFacilityType);
      console.log('travelTime:', travelTime);
      
      // Дополнительная проверка: рекомендации должны генерироваться только по кнопке
      if (!showRecommendations && activeLayers.recommendations) {
        console.warn('⚠️ Попытка автоматической генерации рекомендаций заблокирована');
        console.log('  - showRecommendations:', showRecommendations);
        console.log('  - activeLayers.recommendations:', activeLayers.recommendations);
        return;
      }
      
      const params = {
        facility_type: selectedFacilityType,
        max_travel_time: travelTime
      };
      
      console.log('📋 Параметры запроса:', params);
      
      const result = await apiService.getRecommendations(params);
      
      console.log('📊 РЕЗУЛЬТАТ ПОЛУЧЕН:');
      console.log('result:', result);
      console.log('result.recommendations:', result.recommendations);
      console.log('result.recommendations.length:', result.recommendations?.length);
      console.log('result.statistics:', result.statistics);
      
      setRecommendations(result.recommendations || []);
      setStatistics(result.statistics || null);
      setShowRecommendations(true);
      
      console.log('🔄 ОБНОВЛЕНИЕ activeLayers.recommendations на true');
      setActiveLayers(prev => {
        const newLayers = { ...prev, recommendations: true };
        console.log('activeLayers before:', prev);
        console.log('activeLayers after:', newLayers);
        return newLayers;
      });
      
      setLastUpdateTime(new Date());
      
      console.log('✅ ГЕНЕРАЦИЯ РЕКОМЕНДАЦИЙ ЗАВЕРШЕНА');
      
    } catch (error) {
      console.error('❌ Ошибка генерации рекомендаций:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMap = () => {
    setRecommendations([]);
    setShowRecommendations(false);
    setStatistics(null);
    setActiveLayers(prev => ({ ...prev, recommendations: false }));
  };

  const handleLayerToggle = (layerName) => {
    console.log('🔄 ПЕРЕКЛЮЧЕНИЕ СЛОЯ:', {
      layerName,
      currentState: activeLayers[layerName],
      newState: !activeLayers[layerName],
      allLayers: activeLayers
    });
    
    setActiveLayers(prev => {
      const newLayers = {
        ...prev,
        [layerName]: !prev[layerName]
      };
      
      console.log('✅ НОВОЕ СОСТОЯНИЕ СЛОЕВ:', newLayers);
      
      return newLayers;
    });
  };

  const handleToggleCoverageZones = () => {
    setShowCoverageZones(prev => !prev);
  };

  const handleShowFacilityDetails = (facility) => {
    setSelectedFacilityForDetails(facility);
    setShowFacilityDetails(true);
  };

  // Улучшенная функция экспорта с уведомлением
  const handleExportData = () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        parameters: {
          facilityType: selectedFacilityType,
          maxTravelTime: travelTime,
          showCoverageZones,
          activeLayers
        },
        statistics: {
          totalFacilities: facilities.length,
          recommendations: recommendations.length,
          populationCovered: populationData?.totalPopulation || 0
        },
        recommendations,
        totalFacilities: facilities.length,
        version: "1.0"
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inframap-analysis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  };

  // Функция автосохранения настроек
  const saveUserSettings = () => {
    const settings = {
      darkMode,
      selectedFacilityType,
      travelTime,
      showCoverageZones,
      activeLayers,
      lastSaved: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('inframap_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  // Функция загрузки настроек
  const loadUserSettings = () => {
    try {
      const savedSettings = localStorage.getItem('inframap_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode || false);
        setSelectedFacilityType(settings.selectedFacilityType || 'school');
        setTravelTime(settings.travelTime || 15);
        setShowCoverageZones(settings.showCoverageZones || false);
        // ПРИНУДИТЕЛЬНО отключаем рекомендации при загрузке настроек
        setActiveLayers({
          ...(settings.activeLayers || {}),
          facilities: settings.activeLayers?.facilities !== false, // true по умолчанию, если не указано false
          population: settings.activeLayers?.population !== false, // true по умолчанию, если не указано false
          recommendations: false // ВСЕГДА false при загрузке
        });
        console.log('📥 ЗАГРУЖЕНЫ НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ:');
        console.log('  - darkMode:', settings.darkMode || false);
        console.log('  - selectedFacilityType:', settings.selectedFacilityType || 'school');
        console.log('  - activeLayers.recommendations принудительно установлен в false');
      } else {
        console.log('📥 НЕТ СОХРАНЁННЫХ НАСТРОЕК - используем значения по умолчанию');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  // Автосохранение настроек при изменении
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveUserSettings();
    }, 2000); // Сохранение через 2 секунды после изменения

    return () => clearTimeout(timeoutId);
  }, [darkMode, selectedFacilityType, travelTime, showCoverageZones, activeLayers]);

  // Загрузка настроек при запуске
  useEffect(() => {
    // ВРЕМЕННО: очищаем localStorage для отладки
    console.log('🗑️ ОЧИСТКА localStorage для отладки автоматических запросов');
    localStorage.removeItem('inframap_settings');
    localStorage.removeItem('inframap_tutorial_completed');
    
    loadUserSettings();
  }, []);

  // Функция анализа производительности
  const analyzePerformance = () => {
    const performanceData = {
      facilitiesCount: facilities.length,
      recommendationsCount: recommendations.length,
      renderTime: lastUpdateTime ? Date.now() - lastUpdateTime.getTime() : 0,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      timestamp: new Date().toISOString()
    };

    // Проверка производительности
    if (performanceData.facilitiesCount > 1000) {
      console.warn('Большое количество объектов. Это может замедлить работу.');
    }

    return performanceData;
  };

  // Мониторинг производительности каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (facilities.length > 0) {
        analyzePerformance();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [facilities.length, recommendations.length]);

  // Улучшенная функция генерации отчета
  const generateDetailedReport = () => {
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        parameters: {
          facilityType: selectedFacilityType,
          maxTravelTime: travelTime,
          showCoverageZones,
          activeLayers
        }
      },
      summary: {
        totalFacilities: facilities.length,
        totalRecommendations: recommendations.length,
        populationCovered: populationData?.totalPopulation || 0,
        averageDistance: recommendations.length > 0 
          ? (recommendations.reduce((sum, rec) => sum + (rec.distance || 0), 0) / recommendations.length).toFixed(2)
          : 0
      },
      analysis: {
        facilityDistribution: facilities.reduce((acc, facility) => {
          acc[facility.type] = (acc[facility.type] || 0) + 1;
          return acc;
        }, {}),
        coverageAnalysis: {
          wellCovered: recommendations.filter(r => r.priority === 'low').length,
          moderatelyCovered: recommendations.filter(r => r.priority === 'medium').length,
          poorlyCovered: recommendations.filter(r => r.priority === 'high').length
        },
        performanceMetrics: analyzePerformance()
      },
      recommendations: recommendations.map(rec => ({
        ...rec,
        estimatedCost: rec.priority === 'high' ? 5000000 : rec.priority === 'medium' ? 3000000 : 1000000,
        estimatedTimeframe: rec.priority === 'high' ? '6-12 месяцев' : rec.priority === 'medium' ? '12-18 месяцев' : '18-24 месяца'
      })),
      actionPlan: {
        immediate: recommendations.filter(r => r.priority === 'high').slice(0, 3),
        shortTerm: recommendations.filter(r => r.priority === 'medium').slice(0, 5),
        longTerm: recommendations.filter(r => r.priority === 'low').slice(0, 10)
      }
    };

    setReportData(reportData);
    setShowReportModal(true);
  };

  // Функция запуска туториала
  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
  };

  // Функция завершения туториала
  const completeTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.setItem('inframap_tutorial_completed', 'true');
  };

  // Проверка, нужно ли показать туториал новому пользователю
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('inframap_tutorial_completed');
    if (!tutorialCompleted && facilities.length > 0) {
      setTimeout(() => {
        startTutorial();
      }, 3000);
    }
  }, [facilities.length]);

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 dark' : 'bg-gray-50'
    }`}>
      {/* Header */}
              <header className={`shadow-sm border-b px-6 py-4 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                InfraMap
              </h1>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Анализ размещения госучреждений
                {!isOnline && <span className="text-red-500 ml-2">• Офлайн режим</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Переключатель темной темы */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? "Светлая тема" : "Темная тема"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Управление панелями */}
            <div className={`flex items-center space-x-1 border rounded-lg p-1 transition-colors duration-300 ${
              darkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <button
                onClick={() => setShowControlPanel(!showControlPanel)}
                className={`p-2 rounded transition-colors ${
                  showControlPanel 
                    ? 'bg-primary-100 text-primary-600' 
                    : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`
                }`}
                title="Панель управления"
              >
                {showControlPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowResultsPanel(!showResultsPanel)}
                className={`p-2 rounded transition-colors ${
                  showResultsPanel && statistics
                    ? 'bg-primary-100 text-primary-600' 
                    : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`
                }`}
                title="Панель результатов"
                disabled={!statistics}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Статус соединения */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
            </div>

            {/* Экспорт данных */}
            <button
              onClick={handleExportData}
              className={`p-2 transition-colors ${
                darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Экспортировать данные"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Помощь и туториал */}
            <button
              onClick={startTutorial}
              className={`p-2 transition-colors ${
                darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Помощь и туториал"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                console.log('Кнопка отчёта нажата. Statistics:', !!statistics);
                if (statistics) {
                  generateDetailedReport();
                } else {
                  console.warn('Отчёт недоступен');
                }
              }}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                statistics 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } font-medium py-2 px-4 rounded-lg`}
              disabled={!statistics}
            >
              <Info className="w-4 h-4" />
              <span>{statistics ? 'Создать отчёт' : 'Отчёт недоступен'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Control Panel */}
        {showControlPanel && (
          <div className={`w-96 shadow-xl border-r flex flex-col h-full transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <ControlPanel
              selectedFacilityType={selectedFacilityType}
              setSelectedFacilityType={setSelectedFacilityType}
              maxTravelTime={travelTime}
              setMaxTravelTime={setTravelTime}
              onGenerateRecommendations={handleGenerateRecommendations}
              onClearMap={handleClearMap}
              isLoading={isLoading}
              activeLayers={activeLayers}
              onLayerToggle={handleLayerToggle}
              showCoverageZones={showCoverageZones}
              onToggleCoverageZones={handleToggleCoverageZones}
              facilities={facilities}
              statistics={statistics}
              recommendations={recommendations}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
            
            {statistics && showResultsPanel && (
              <div className={`border-t transition-colors duration-300 ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <ResultsPanel
                  statistics={statistics}
                  recommendations={recommendations}
                  facilityType={selectedFacilityType}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative h-full">
          <InteractiveMap
            facilities={facilities}
            recommendations={recommendations}
            populationData={populationData}
            selectedFacilityType={selectedFacilityType}
            activeLayers={activeLayers}
            maxTravelTime={travelTime}
            showCoverageZones={showCoverageZones}
            onShowFacilityDetails={handleShowFacilityDetails}
            darkMode={darkMode}
          />
          
          {/* Плавающая мини-панель управления когда основная скрыта */}
          {!showControlPanel && (
            <div className={`absolute top-4 left-4 backdrop-blur-sm rounded-xl shadow-lg border p-4 z-[1000] min-w-64 transition-all duration-300 animate-slideInUp ${
              darkMode 
                ? 'bg-gray-800/95 border-gray-600' 
                : 'bg-white/95 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Быстрое управление</h3>
                <button
                  onClick={() => setShowControlPanel(true)}
                  className={`transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Тип учреждения</label>
                  <select
                    value={selectedFacilityType}
                    onChange={(e) => setSelectedFacilityType(e.target.value)}
                    className={`w-full mt-1 text-sm border rounded-lg px-2 py-1 transition-colors duration-300 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Все учреждения</option>
                    <option value="school">Школы</option>
                    <option value="hospital">Больницы</option>
                    <option value="fire_station">Пожарные станции</option>
                  </select>
                </div>
                
                <div>
                  <label className={`text-xs font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Время доезда: {travelTime} мин
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={travelTime}
                    onChange={(e) => setTravelTime(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
                
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                  className="w-full btn-primary text-sm py-2"
                >
                  {isLoading ? 'Анализируем...' : 'Анализ'}
                </button>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[1000] backdrop-blur-sm">
              <div className={`rounded-xl p-6 shadow-2xl border animate-bounceIn ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-ping"></div>
                  </div>
                  <div>
                    <div className={`font-medium transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Анализируем данные...</div>
                    <div className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>Это может занять несколько секунд</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Информация о последнем обновлении */}
          {lastUpdateTime && statistics && (
            <div className={`absolute top-4 right-4 backdrop-blur-sm rounded-lg p-3 text-xs shadow-md z-[1000] animate-fadeInUp ${
              darkMode 
                ? 'bg-gray-800/90 text-gray-300 border border-gray-600' 
                : 'bg-white/90 text-gray-600 border border-gray-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Последнее обновление:</span>
              </div>
              <div className="mt-1 font-mono text-xs opacity-75">
                {lastUpdateTime.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className={`p-6 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="font-semibold">Загрузка данных...</div>
                <div className="text-sm opacity-75">Получение информации об учреждениях</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          statistics={statistics}
          recommendations={recommendations}
          facilityType={selectedFacilityType}
          darkMode={darkMode}
        />
      )}

      {/* Facility Details Modal */}
      {showFacilityDetails && (
        <FacilityDetailsModal
          isOpen={showFacilityDetails}
          onClose={() => setShowFacilityDetails(false)}
          facility={selectedFacilityForDetails}
          facilityType={selectedFacilityForDetails?.type}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default App; 