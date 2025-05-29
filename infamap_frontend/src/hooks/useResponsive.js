import { useState, useEffect } from 'react';

// Брейкпоинты согласно нашим CSS медиа-запросам
const breakpoints = {
  xs: 0,      // 0px - 479px (мобильные телефоны)
  sm: 480,    // 480px - 767px (крупные мобильные)
  md: 768,    // 768px - 1023px (планшеты)
  lg: 1024    // 1024px+ (десктоп)
};

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight 
      ? 'landscape' 
      : 'portrait'
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Вызываем сразу для установки начальных значений

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Определение текущего брейкпоинта
  const getCurrentBreakpoint = () => {
    const { width } = screenSize;
    if (width < breakpoints.sm) return 'xs';
    if (width < breakpoints.md) return 'sm';
    if (width < breakpoints.lg) return 'md';
    return 'lg';
  };

  const currentBreakpoint = getCurrentBreakpoint();

  // Удобные булевы значения
  const isMobile = currentBreakpoint === 'xs' || currentBreakpoint === 'sm';
  const isTablet = currentBreakpoint === 'md';
  const isDesktop = currentBreakpoint === 'lg';
  const isSmallMobile = currentBreakpoint === 'xs';
  const isLargeMobile = currentBreakpoint === 'sm';

  // Дополнительные проверки
  const isLandscape = orientation === 'landscape';
  const isPortrait = orientation === 'portrait';
  const isSmallScreen = screenSize.width <= 359; // Очень маленькие экраны
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Проверка для iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return {
    // Размеры экрана
    screenSize,
    orientation,
    
    // Брейкпоинты
    currentBreakpoint,
    breakpoints,
    
    // Булевы значения для удобства
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,
    isLandscape,
    isPortrait,
    isSmallScreen,
    isTouchDevice,
    isIOS,
    isSafari,

    // Функции для проверки размеров
    isBreakpoint: (bp) => currentBreakpoint === bp,
    isMinBreakpoint: (bp) => screenSize.width >= breakpoints[bp],
    isMaxBreakpoint: (bp) => screenSize.width < breakpoints[bp],
    
    // Специальные случаи
    shouldUseMobileLayout: isMobile,
    shouldUseCompactLayout: isMobile || (isLandscape && screenSize.height <= 600),
    shouldShowPanelToggles: isMobile,
    shouldUseFullScreenModals: isMobile,
    shouldUseTouchFriendlyElements: isTouchDevice || isMobile
  };
};

// Хук для управления состоянием панелей на мобильных
export const useMobilePanels = (isMobile) => {
  const [showControlPanel, setShowControlPanel] = useState(!isMobile);
  const [showResultsPanel, setShowResultsPanel] = useState(!isMobile);

  // При изменении размера экрана адаптируем состояние панелей
  useEffect(() => {
    if (!isMobile) {
      // На десктопе показываем обе панели
      setShowControlPanel(true);
      setShowResultsPanel(true);
    } else {
      // На мобильных по умолчанию показываем только панель управления
      setShowControlPanel(true);
      setShowResultsPanel(false);
    }
  }, [isMobile]);

  const toggleControlPanel = () => setShowControlPanel(prev => !prev);
  const toggleResultsPanel = () => setShowResultsPanel(prev => !prev);

  // Автоматически скрываем одну панель при открытии другой на маленьких экранах
  const showControlPanelMobile = (show = true) => {
    setShowControlPanel(show);
    if (show && isMobile) {
      setShowResultsPanel(false);
    }
  };

  const showResultsPanelMobile = (show = true) => {
    setShowResultsPanel(show);
    if (show && isMobile) {
      setShowControlPanel(false);
    }
  };

  return {
    showControlPanel,
    showResultsPanel,
    toggleControlPanel,
    toggleResultsPanel,
    showControlPanelMobile,
    showResultsPanelMobile,
    setShowControlPanel,
    setShowResultsPanel
  };
};

export default useResponsive; 