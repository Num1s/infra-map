import React, { useState, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import ControlPanel from './ControlPanel';
import ResultsPanel from './ResultsPanel';
import MobilePanelToggle from './MobilePanelToggle';
import MobileAccordion, { MobileAccordionGroup, GroupedAccordionItem } from './MobileAccordion';
import { useResponsive, useMobilePanels } from '../hooks/useResponsive';
import { 
  Settings, 
  BarChart3, 
  Map, 
  Filter,
  Search,
  Info
} from 'lucide-react';

// Пример интеграции мобильной адаптации в приложение
const MobileLayoutExample = () => {
  const responsive = useResponsive();
  const {
    isMobile,
    isTablet,
    isDesktop,
    shouldUseMobileLayout,
    shouldUseCompactLayout,
    shouldShowPanelToggles,
    shouldUseTouchFriendlyElements
  } = responsive;

  const {
    showControlPanel,
    showResultsPanel,
    toggleControlPanel,
    toggleResultsPanel
  } = useMobilePanels(isMobile);

  // Демо данные
  const [selectedFacilityType, setSelectedFacilityType] = useState('school');
  const [travelTime, setTravelTime] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Классы для основного контейнера приложения
  const appContainerClasses = [
    'app-container',
    'relative',
    'h-screen',
    'w-full',
    'overflow-hidden',
    isMobile ? 'mobile-layout' : '',
    shouldUseCompactLayout ? 'compact-layout' : '',
    responsive.isIOS ? 'ios-device' : '',
    responsive.isTouchDevice ? 'touch-device' : ''
  ].filter(Boolean).join(' ');

  // Адаптивные классы для панелей
  const getControlPanelClasses = () => {
    if (!shouldUseMobileLayout) {
      return 'control-panel desktop-layout';
    }
    
    return [
      'control-panel',
      'slide-in-top',
      showControlPanel ? 'visible' : 'hidden',
      responsive.isSmallMobile ? 'small-mobile' : '',
      responsive.isLandscape && isMobile ? 'landscape-mobile' : ''
    ].filter(Boolean).join(' ');
  };

  const getResultsPanelClasses = () => {
    if (!shouldUseMobileLayout) {
      return 'results-panel desktop-layout';
    }
    
    return [
      'results-panel',
      'slide-in-bottom',
      showResultsPanel ? 'visible' : 'hidden',
      responsive.isSmallMobile ? 'small-mobile' : '',
      responsive.isLandscape && isMobile ? 'landscape-mobile' : ''
    ].filter(Boolean).join(' ');
  };

  // Функция для адаптивной загрузки данных
  const handleGenerateRecommendations = async () => {
    try {
      setIsLoading(true);
      
      // На мобильных показываем результаты автоматически
      if (isMobile) {
        // Скрываем панель управления и показываем результаты
        toggleControlPanel();
        if (!showResultsPanel) {
          toggleResultsPanel();
        }
      }
      
      // Эмуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Демо результаты
      setRecommendations([
        { id: 1, coordinates: [42.8746, 74.5698], score: 0.85 },
        { id: 2, coordinates: [42.8656, 74.5789], score: 0.78 }
      ]);
      
    } catch (error) {
      console.error('Ошибка генерации рекомендаций:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={appContainerClasses}>
      {/* Основная карта */}
      <div className="map-container w-full h-full">
        <InteractiveMap
          facilities={facilities}
          populationData={[]}
          recommendations={recommendations}
          activeLayers={{ facilities: true, population: true, recommendations: true }}
          selectedFacilityType={selectedFacilityType}
          onFacilityClick={(facility) => console.log('Facility clicked:', facility)}
          isMobile={isMobile}
          isCompact={shouldUseCompactLayout}
        />
      </div>

      {/* Кнопки переключения панелей (только на мобильных) */}
      {shouldShowPanelToggles && (
        <MobilePanelToggle
          showControlPanel={showControlPanel}
          showResultsPanel={showResultsPanel}
          onToggleControlPanel={toggleControlPanel}
          onToggleResultsPanel={toggleResultsPanel}
          isMobile={isMobile}
        />
      )}

      {/* Панель управления */}
      <div className={getControlPanelClasses()}>
        {shouldUseMobileLayout ? (
          // Мобильная версия с аккордеонами
          <MobileLayoutControlPanel
            selectedFacilityType={selectedFacilityType}
            setSelectedFacilityType={setSelectedFacilityType}
            travelTime={travelTime}
            setTravelTime={setTravelTime}
            onGenerateRecommendations={handleGenerateRecommendations}
            isLoading={isLoading}
            isCompact={shouldUseCompactLayout}
          />
        ) : (
          // Десктопная версия
          <ControlPanel
            selectedFacilityType={selectedFacilityType}
            setSelectedFacilityType={setSelectedFacilityType}
            travelTime={travelTime}
            setTravelTime={setTravelTime}
            onGenerateRecommendations={handleGenerateRecommendations}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Панель результатов */}
      {(showResultsPanel || !shouldUseMobileLayout) && (
        <div className={getResultsPanelClasses()}>
          <ResultsPanel
            recommendations={recommendations}
            statistics={null}
            isLoading={isLoading}
            isMobile={shouldUseMobileLayout}
            isCompact={shouldUseCompactLayout}
          />
        </div>
      )}

      {/* Индикатор размера экрана (только в разработке) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 left-2 z-50 bg-black text-white text-xs px-2 py-1 rounded mobile:bg-red-500 tablet:bg-yellow-500 desktop:bg-green-500">
          {responsive.currentBreakpoint} - {responsive.screenSize.width}x{responsive.screenSize.height}
          {responsive.isLandscape ? ' (L)' : ' (P)'}
        </div>
      )}
    </div>
  );
};

// Мобильная версия панели управления с аккордеонами
const MobileLayoutControlPanel = ({
  selectedFacilityType,
  setSelectedFacilityType,
  travelTime,
  setTravelTime,
  onGenerateRecommendations,
  isLoading,
  isCompact
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary-500" />
        <h2 className="text-lg font-semibold">Управление</h2>
      </div>

      {/* Аккордеоны для экономии места */}
      <MobileAccordionGroup allowMultiple={false}>
        {/* Основные настройки */}
        <GroupedAccordionItem
          title="Основные настройки"
          icon={<Filter className="w-4 h-4" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            {/* Тип учреждения */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Тип учреждения
              </label>
              <select 
                value={selectedFacilityType}
                onChange={(e) => setSelectedFacilityType(e.target.value)}
                className="input-field prevent-zoom"
              >
                <option value="school">🏫 Школы</option>
                <option value="hospital">🏥 Больницы</option>
                <option value="fire_station">🚒 Пожарные станции</option>
              </select>
            </div>

            {/* Время доезда */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Время доезда: {travelTime} мин
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={travelTime}
                onChange={(e) => setTravelTime(Number(e.target.value))}
                className="slider-modern w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 мин</span>
                <span>30 мин</span>
              </div>
            </div>
          </div>
        </GroupedAccordionItem>

        {/* Поиск */}
        <GroupedAccordionItem
          title="Поиск учреждений"
          icon={<Search className="w-4 h-4" />}
        >
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Поиск по названию или адресу..."
              className="input-field prevent-zoom"
            />
            <div className="button-grid">
              <button className="btn-compact btn-secondary">
                По району
              </button>
              <button className="btn-compact btn-secondary">
                По типу
              </button>
            </div>
          </div>
        </GroupedAccordionItem>

        {/* Настройки карты */}
        <GroupedAccordionItem
          title="Настройки карты"
          icon={<Map className="w-4 h-4" />}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="show-population" className="rounded" />
              <label htmlFor="show-population" className="text-sm">
                Плотность населения
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="show-coverage" className="rounded" />
              <label htmlFor="show-coverage" className="text-sm">
                Зоны покрытия
              </label>
            </div>
          </div>
        </GroupedAccordionItem>
      </MobileAccordionGroup>

      {/* Кнопка генерации рекомендаций */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={onGenerateRecommendations}
          disabled={isLoading}
          className={`btn-primary w-full ${shouldUseTouchFriendlyElements ? 'touch-target' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="spinner-enhanced w-4 h-4" />
              Анализ...
            </div>
          ) : (
            'Найти оптимальные места'
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileLayoutExample; 