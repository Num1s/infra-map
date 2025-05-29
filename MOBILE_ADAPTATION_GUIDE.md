# 📱 Руководство по мобильной адаптации InfraMap

## 🎯 Обзор

Данное руководство содержит полную информацию о мобильной адаптации системы InfraMap, включая все созданные компоненты, стили и хуки.

## 📋 Содержание

- [Созданные файлы](#созданные-файлы)
- [Основные возможности](#основные-возможности)
- [Использование компонентов](#использование-компонентов)
- [CSS классы и стили](#css-классы-и-стили)
- [Брейкпоинты](#брейкпоинты)
- [Интеграция в приложение](#интеграция-в-приложение)
- [Примеры использования](#примеры-использования)
- [Рекомендации](#рекомендации)

## 📁 Созданные файлы

### React компоненты
```
src/
├── components/
│   ├── MobilePanelToggle.jsx      # Кнопки переключения панелей
│   ├── MobileAccordion.jsx        # Аккордеон для экономии места
│   └── MobileLayoutExample.jsx    # Пример интеграции
├── hooks/
│   └── useResponsive.js           # Хуки для отслеживания размера экрана
```

### Стили и конфигурация
```
src/
├── index.css                      # Дополнен мобильными стилями
└── ../tailwind.config.js          # Обновлена конфигурация
```

### Документация
```
MOBILE_ADAPTATION_GUIDE.md         # Этот файл
```

## ✨ Основные возможности

### 🔧 Адаптивное управление панелями
- Автоматическое скрытие/показ панелей на мобильных устройствах
- Плавающие кнопки переключения
- Анимированные переходы

### 📐 Гибкие брейкпоинты
- Extra Small (0-479px) - мобильные телефоны
- Small (480-767px) - крупные мобильные
- Medium (768-1023px) - планшеты
- Large (1024px+) - десктоп

### 🎨 Умные компоненты
- Автоматическая адаптация под размер экрана
- Аккордеоны для экономии места
- Touch-friendly элементы

### 🍎 Специальная поддержка iOS
- Учет безопасных зон (notch)
- Предотвращение зума при фокусе на input
- Оптимизация для Safari

## 🧩 Использование компонентов

### MobilePanelToggle

Компонент для управления видимостью панелей на мобильных устройствах.

```jsx
import MobilePanelToggle from './components/MobilePanelToggle';

<MobilePanelToggle
  showControlPanel={showControlPanel}
  showResultsPanel={showResultsPanel}
  onToggleControlPanel={toggleControlPanel}
  onToggleResultsPanel={toggleResultsPanel}
  isMobile={isMobile}
/>
```

**Props:**
- `showControlPanel` (boolean) - видимость панели управления
- `showResultsPanel` (boolean) - видимость панели результатов
- `onToggleControlPanel` (function) - обработчик переключения панели управления
- `onToggleResultsPanel` (function) - обработчик переключения панели результатов
- `isMobile` (boolean) - флаг мобильного устройства

### MobileAccordion

Аккордеон для компактного отображения контента.

```jsx
import MobileAccordion, { MobileAccordionGroup, GroupedAccordionItem } from './components/MobileAccordion';

// Простой аккордеон
<MobileAccordion 
  title="Настройки" 
  defaultOpen={true}
  icon={<Settings className="w-4 h-4" />}
>
  <div>Содержимое аккордеона</div>
</MobileAccordion>

// Группа аккордеонов (только один открыт)
<MobileAccordionGroup allowMultiple={false}>
  <GroupedAccordionItem title="Раздел 1" icon={<Filter />}>
    Содержимое 1
  </GroupedAccordionItem>
  <GroupedAccordionItem title="Раздел 2" icon={<Search />}>
    Содержимое 2
  </GroupedAccordionItem>
</MobileAccordionGroup>
```

### useResponsive Hook

Хук для отслеживания размера экрана и адаптивной логики.

```jsx
import { useResponsive, useMobilePanels } from '../hooks/useResponsive';

const MyComponent = () => {
  const responsive = useResponsive();
  const {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    screenSize,
    orientation,
    shouldUseMobileLayout,
    shouldShowPanelToggles,
    isIOS,
    isTouchDevice
  } = responsive;

  const {
    showControlPanel,
    showResultsPanel,
    toggleControlPanel,
    toggleResultsPanel
  } = useMobilePanels(isMobile);

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* Ваш контент */}
    </div>
  );
};
```

## 🎨 CSS классы и стили

### Основные контейнеры

```css
/* Основной контейнер приложения */
.app-container {
  overflow-x: hidden;
  position: relative;
}

/* Панели на мобильных */
.control-panel {
  position: absolute !important;
  top: 10px !important;
  left: 10px !important;
  right: 10px !important;
  z-index: 1000 !important;
  max-height: 40vh !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px) !important;
}

.results-panel {
  position: absolute !important;
  bottom: 10px !important;
  left: 10px !important;
  right: 10px !important;
  max-height: 35vh !important;
}
```

### Кнопки переключения панелей

```css
.panel-toggle-btn {
  position: absolute !important;
  z-index: 1001 !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 50% !important;
  width: 44px !important;
  height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.toggle-control-panel {
  top: 10px !important;
  right: 60px !important;
}

.toggle-results-panel {
  bottom: 10px !important;
  right: 60px !important;
}
```

### Адаптивные кнопки

```css
/* Полноширинные кнопки на мобильных */
.btn-primary, .btn-secondary {
  width: 100% !important;
  padding: 14px 16px !important;
  font-size: 16px !important;
  margin-bottom: 8px !important;
  touch-action: manipulation !important;
}

/* Компактные кнопки */
.btn-compact {
  padding: 8px 12px !important;
  font-size: 14px !important;
  margin: 2px !important;
  width: auto !important;
}

/* Сетка кнопок */
.button-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 8px !important;
}
```

### Аккордеоны

```css
.accordion-section {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.accordion-header {
  padding: 12px 0 !important;
  cursor: pointer !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.accordion-content {
  max-height: 0 !important;
  overflow: hidden !important;
  transition: max-height 0.3s ease !important;
}

.accordion-content.open {
  max-height: 300px !important;
  padding-bottom: 12px !important;
}
```

### Touch-friendly элементы

```css
.touch-target {
  min-height: 44px !important;
  min-width: 44px !important;
}

/* Предотвращение зума на iOS */
.prevent-zoom {
  font-size: 16px !important;
}

/* Оптимизация для тач-устройств */
@media (pointer: coarse) {
  button, .btn {
    min-height: 44px !important;
    min-width: 44px !important;
    padding: 12px 16px !important;
  }
  
  .facility-marker {
    transform: scale(1.2) !important;
  }
}
```

## 📐 Брейкпоинты

### CSS Media Queries

```css
/* Extra Small - мобильные телефоны */
@media (max-width: 479px) { }

/* Small - крупные мобильные */
@media (min-width: 480px) and (max-width: 767px) { }

/* Medium - планшеты */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Ландшафтная ориентация */
@media (orientation: landscape) and (max-height: 600px) { }

/* Touch устройства */
@media (pointer: coarse) { }

/* iOS Safari */
@supports (-webkit-touch-callout: none) { }
```

### TailwindCSS классы

```jsx
{/* Скрытие на мобильных */}
<div className="hidden mobile:block">Только на мобильных</div>
<div className="block mobile:hidden">Скрыто на мобильных</div>

{/* Адаптивные размеры */}
<div className="w-full mobile:w-auto">
<div className="p-4 mobile:p-2">
<div className="text-lg mobile:text-base">

{/* Touch устройства */}
<button className="touch:min-h-11 touch:min-w-11">

{/* Безопасные зоны для iOS */}
<div className="pt-safe pb-safe">
```

## 🔧 Интеграция в приложение

### 1. Обновление главного App.jsx

```jsx
import { useResponsive, useMobilePanels } from './hooks/useResponsive';
import MobilePanelToggle from './components/MobilePanelToggle';

function App() {
  const responsive = useResponsive();
  const { isMobile, shouldUseMobileLayout } = responsive;
  
  const {
    showControlPanel,
    showResultsPanel,
    toggleControlPanel,
    toggleResultsPanel
  } = useMobilePanels(isMobile);

  return (
    <div className={`app-container ${isMobile ? 'mobile-layout' : ''}`}>
      {/* Карта */}
      <InteractiveMap isMobile={isMobile} />
      
      {/* Переключатели панелей для мобильных */}
      {shouldUseMobileLayout && (
        <MobilePanelToggle
          showControlPanel={showControlPanel}
          showResultsPanel={showResultsPanel}
          onToggleControlPanel={toggleControlPanel}
          onToggleResultsPanel={toggleResultsPanel}
          isMobile={isMobile}
        />
      )}
      
      {/* Панели с адаптивными классами */}
      <div className={getControlPanelClasses()}>
        <ControlPanel />
      </div>
      
      {(showResultsPanel || !isMobile) && (
        <div className={getResultsPanelClasses()}>
          <ResultsPanel />
        </div>
      )}
    </div>
  );
}
```

### 2. Адаптация существующих компонентов

```jsx
const ControlPanel = ({ isMobile, isCompact }) => {
  if (isMobile) {
    return (
      <MobileAccordionGroup>
        <GroupedAccordionItem title="Настройки" defaultOpen={true}>
          {/* Мобильная версия контента */}
        </GroupedAccordionItem>
      </MobileAccordionGroup>
    );
  }
  
  return (
    <div className="desktop-layout">
      {/* Десктопная версия */}
    </div>
  );
};
```

### 3. Обновление стилей карты

```jsx
const InteractiveMap = ({ isMobile, isCompact }) => {
  const mapClasses = [
    'leaflet-container',
    isMobile ? 'touch-action-pan-x-pan-y' : '',
    isCompact ? 'compact-map' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={mapClasses}>
      {/* Содержимое карты */}
    </div>
  );
};
```

## 💡 Примеры использования

### Условный рендеринг

```jsx
const MyComponent = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return (
    <div>
      {isMobile && <MobileOnlyComponent />}
      {isTablet && <TabletOptimizedComponent />}
      {isDesktop && <DesktopComponent />}
    </div>
  );
};
```

### Адаптивные модальные окна

```jsx
const Modal = ({ children, isMobile }) => {
  const modalClasses = isMobile 
    ? 'modal-container mobile-modal'
    : 'modal-container desktop-modal';
    
  return (
    <div className={modalClasses}>
      {children}
    </div>
  );
};
```

### Умная панель инструментов

```jsx
const Toolbar = () => {
  const { shouldUseCompactLayout, isTouchDevice } = useResponsive();
  
  return (
    <div className={shouldUseCompactLayout ? 'toolbar-compact' : 'toolbar-full'}>
      <button 
        className={isTouchDevice ? 'btn touch-target' : 'btn'}
      >
        Кнопка
      </button>
    </div>
  );
};
```

## 📝 Рекомендации

### ✅ Лучшие практики

1. **Используйте хук useResponsive** для всех проверок размера экрана
2. **Применяйте touch-target** для всех интерактивных элементов на мобильных
3. **Используйте prevent-zoom** класс для input полей на iOS
4. **Группируйте функции в аккордеоны** на маленьких экранах
5. **Тестируйте на реальных устройствах**, особенно iOS Safari

### ⚠️ Частые ошибки

1. **Не забывайте про безопасные зоны** на iPhone X+
2. **Избегайте мелкого текста** (< 14px) на мобильных
3. **Не делайте кликабельные элементы меньше 44px**
4. **Учитывайте ландшафтную ориентацию** с малой высотой экрана
5. **Оптимизируйте анимации** для слабых устройств

### 🔧 Отладка

```jsx
// Добавьте индикатор для разработки
{process.env.NODE_ENV === 'development' && (
  <div className="fixed top-2 left-2 z-50 bg-black text-white text-xs px-2 py-1 rounded">
    {currentBreakpoint} - {screenSize.width}x{screenSize.height}
    {isLandscape ? ' (L)' : ' (P)'}
  </div>
)}
```

### 📊 Производительность

```css
/* Для слабых устройств отключите сложные эффекты */
.performance-mode .card,
.performance-mode .modal-container {
  box-shadow: none !important;
  backdrop-filter: none !important;
}

/* Упрощенные анимации */
@media (max-width: 767px) {
  * {
    animation-duration: 0.2s !important;
    transition-duration: 0.2s !important;
  }
}
```

## 🚀 Заключение

Данная мобильная адаптация обеспечивает:

- ✅ **Отличный UX** на всех устройствах
- ✅ **Производительность** даже на слабых смартфонах
- ✅ **Accessibility** с поддержкой screen readers
- ✅ **iOS/Android совместимость** 
- ✅ **Легкую поддержку** и расширение

Используйте созданные компоненты и хуки для быстрой адаптации вашего приложения под мобильные устройства! 