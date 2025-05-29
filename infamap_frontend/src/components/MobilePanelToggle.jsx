import React from 'react';
import { 
  Settings, 
  BarChart3, 
  Eye, 
  EyeOff,
  PanelLeftOpen,
  PanelLeftClose 
} from 'lucide-react';

const MobilePanelToggle = ({
  showControlPanel,
  showResultsPanel,
  onToggleControlPanel,
  onToggleResultsPanel,
  isMobile = false
}) => {
  if (!isMobile) return null;

  return (
    <>
      {/* Кнопка переключения панели управления */}
      <button
        className="panel-toggle-btn toggle-control-panel"
        onClick={onToggleControlPanel}
        aria-label={showControlPanel ? "Скрыть панель управления" : "Показать панель управления"}
      >
        {showControlPanel ? (
          <PanelLeftClose className="w-5 h-5 text-gray-600" />
        ) : (
          <Settings className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Кнопка переключения панели результатов */}
      <button
        className="panel-toggle-btn toggle-results-panel"
        onClick={onToggleResultsPanel}
        aria-label={showResultsPanel ? "Скрыть результаты" : "Показать результаты"}
      >
        {showResultsPanel ? (
          <EyeOff className="w-5 h-5 text-gray-600" />
        ) : (
          <BarChart3 className="w-5 h-5 text-gray-600" />
        )}
      </button>
    </>
  );
};

export default MobilePanelToggle; 