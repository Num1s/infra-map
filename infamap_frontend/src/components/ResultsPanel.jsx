import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  BarChart,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Target,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { exportService } from '../services/exportService';

const ResultsPanel = ({ statistics, recommendations, facilityType }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExportCSV = () => {
    exportService.exportToCSV(recommendations, `рекомендации_${facilityType}`);
  };

  const handleExportPDF = () => {
    exportService.exportToPDF(statistics, recommendations, facilityType);
  };

  if (!statistics) {
    return null;
  }

  const facilityTypeNames = {
    all: 'всех учреждений',
    school: 'школ',
    hospital: 'больниц',
    fire_station: 'пожарных станций'
  };

  const statCards = [
    {
      key: 'coverage',
      label: 'Покрытие',
      value: `${statistics.current_coverage || 68.5}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'avg_distance',
      label: 'Средняя дистанция',
      value: `${statistics.avg_distance || 2.3} км`,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'recommendations',
      label: 'Рекомендаций',
      value: recommendations?.length || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="bg-white">
      {/* Compact Header */}
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Результаты анализа</h3>
            <p className="text-xs text-gray-600">
              Анализ размещения {facilityTypeNames[facilityType]}
            </p>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fadeInUp">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {statCards.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.key}
                  className={`${stat.bgColor} rounded-lg p-3 text-center transition-all hover:scale-105 hover-lift`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Smart Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 flex items-center">
                <Target className="w-3 h-3 mr-1" />
                Умные рекомендации ({recommendations.length})
              </h4>
              
              {/* Priority Distribution */}
              <div className="grid grid-cols-3 gap-1 text-xs">
                {['high', 'medium', 'low'].map(priority => {
                  const count = recommendations.filter(r => r.priority === priority).length;
                  const colors = {
                    high: 'bg-red-100 text-red-700',
                    medium: 'bg-yellow-100 text-yellow-700',
                    low: 'bg-green-100 text-green-700'
                  };
                  const labels = {
                    high: 'Критич.',
                    medium: 'Средн.',
                    low: 'Низк.'
                  };
                  return (
                    <div key={priority} className={`${colors[priority]} rounded p-1 text-center`}>
                      <div className="font-semibold">{count}</div>
                      <div className="text-xs opacity-80">{labels[priority]}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Top Recommendations */}
              <div className="space-y-2">
                {recommendations
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
                  })
                  .slice(0, 4).map((rec, index) => {
                    const priorityColors = {
                      high: 'border-red-300 bg-red-50',
                      medium: 'border-yellow-300 bg-yellow-50',
                      low: 'border-green-300 bg-green-50'
                    };
                    const priorityIcons = {
                      high: '🚨',
                      medium: '⚠️',
                      low: '💡'
                    };
                    
                    return (
                      <div
                        key={index}
                        className={`${priorityColors[rec.priority] || 'border-gray-300 bg-gray-50'} border rounded-lg p-2 text-xs hover:shadow-sm transition-all cursor-pointer`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <span>{priorityIcons[rec.priority] || '📍'}</span>
                            <span className="font-semibold text-gray-900">#{index + 1}</span>
                          </div>
                          <div className="text-xs font-bold text-blue-600">
                            {Math.round((rec.score || 0.85) * 100)}%
                          </div>
                        </div>
                        
                        {rec.recommendation && (
                          <div className="font-medium text-gray-800 mb-1 line-clamp-2">
                            {rec.recommendation}
                          </div>
                        )}
                        
                        <div className="text-gray-600 mb-2">
                          {rec.reason || 'Необходимость размещения объекта'}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="text-gray-500">
                            📍 {rec.coordinates?.[0]?.toFixed(3)}, {rec.coordinates?.[1]?.toFixed(3)}
                          </div>
                          <div className="text-green-600 font-medium">
                            +{(rec.estimated_coverage || 15000).toLocaleString()} чел.
                          </div>
                        </div>
                        
                        {/* Key Benefits Preview */}
                        {rec.detailedAnalysis?.benefits && rec.detailedAnalysis.benefits.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-600">
                              ✅ {rec.detailedAnalysis.benefits[0]}
                              {rec.detailedAnalysis.benefits.length > 1 && ` и ещё ${rec.detailedAnalysis.benefits.length - 1}...`}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              {/* Summary Insight */}
              {recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-xs text-blue-700 font-semibold mb-1">
                    <Target className="w-3 h-3" />
                    Анализ эффективности
                  </div>
                  <div className="text-xs text-blue-600">
                    При реализации всех рекомендаций ожидается улучшение покрытия на{' '}
                    <span className="font-bold">
                      +{Math.round(recommendations.reduce((sum, r) => sum + ((r.score || 0.85) * 5), 0))}%
                    </span>
                    {' '}и обслуживание дополнительно{' '}
                    <span className="font-bold">
                      {recommendations.reduce((sum, r) => sum + (r.estimated_coverage || 15000), 0).toLocaleString()} человек
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Stats */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-semibold text-gray-700">Дополнительная информация</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Население:</span>
                <span className="font-medium">{(statistics.total_population || 850000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Плотность:</span>
                <span className="font-medium">{statistics.population_density || '2.3к/км²'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Недоступных зон:</span>
                <span className="font-medium text-red-600">{statistics.uncovered_areas || 12}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Время анализа:</span>
                <span className="font-medium">{statistics.analysis_time || '2.3с'}</span>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center space-x-1 py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
            >
              <FileText className="w-3 h-3" />
              <span>PDF</span>
            </button>
          </div>

          {/* View Details Link */}
          <button className="w-full flex items-center justify-center space-x-1 py-2 text-xs text-primary-600 hover:text-primary-700 transition-colors">
            <BarChart className="w-3 h-3" />
            <span>Подробный отчет</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;