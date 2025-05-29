import React, { useState } from 'react';
import { 
  X, 
  BarChart3, 
  MapPin, 
  TrendingUp, 
  Users,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { exportService } from '../services/exportService';

const ReportModal = ({ isOpen, onClose, statistics, recommendations, facilityType }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const facilityTypeNames = {
    school: 'школ',
    hospital: 'больниц',
    fire_station: 'пожарных станций',
    polyclinic: 'поликлиник',
    clinic: 'клиник',
    police_station: 'полицейских участков',
    post_office: 'почтовых отделений'
  };

  const isUnsupportedType = ['polyclinic', 'police_station', 'post_office'].includes(facilityType);

  if (!isOpen) return null;

  if (!statistics || isUnsupportedType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-primary-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Отчет по анализу</h2>
                <p className="text-sm text-gray-600">
                  Анализ размещения {facilityTypeNames[facilityType] || 'учреждений'}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center space-y-6">
              {isUnsupportedType ? (
                <>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Функция в разработке
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Анализ для {facilityTypeNames[facilityType]} находится в стадии разработки. 
                      В будущих версиях здесь будет доступен подробный отчет.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-blue-900 mb-2">Что будет доступно:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 text-left">
                      <li>• Анализ текущего размещения</li>
                      <li>• Выявление проблемных зон</li>
                      <li>• Рекомендации по оптимизации</li>
                      <li>• Детальная статистика</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Нет данных для отчета
                    </h3>
                    <p className="text-gray-600">
                      Сначала выполните анализ для получения статистики.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200">
            <button 
              onClick={onClose}
              className="btn-primary"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  const slides = [
    {
      title: 'Обзор анализа',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Анализ размещения {facilityTypeNames[facilityType]}
            </h3>
            <p className="text-gray-600">
              Результаты пространственного анализа и рекомендации по оптимальному размещению
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {statistics.new_points_count}
              </div>
              <div className="text-sm text-gray-600">Новых точек</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                +{statistics.coverage_improvement?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Улучшение покрытия</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {statistics.people_covered?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Человек охвачено</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Проблемные зоны',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Выявленные проблемные зоны
          </h3>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">
              Зоны с недостаточным покрытием
            </h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Районы с высокой плотностью населения</li>
              <li>• Удалённые от существующих учреждений</li>
              <li>• Время доезда превышает установленные нормативы</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">
              Критерии выявления
            </h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Анализ плотности населения</li>
              <li>• Расчёт времени доезда до ближайших учреждений</li>
              <li>• Оценка транспортной доступности</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Рекомендуемые точки',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Предложенные места размещения
          </h3>
          
          <div className="max-h-64 overflow-y-auto space-y-3">
            {recommendations.map((rec, index) => (
              <div key={rec.id || index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Точка #{index + 1}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Координаты: {rec.coordinates[0].toFixed(4)}, {rec.coordinates[1].toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {(rec.score * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Оценка</div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Ожидаемый охват: ~{rec.estimated_coverage?.toLocaleString() || 'N/A'} чел.
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-purple-600 text-xs">Высокий приоритет</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Сравнение до/после',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Сравнительный анализ
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">До оптимизации</h4>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {(100 - (statistics.coverage_improvement || 0)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-red-700">Покрытие населения</div>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Неравномерное распределение</li>
                <li>• Большие пробелы в покрытии</li>
                <li>• Превышение нормативов доезда</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">После оптимизации</h4>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {(100 - (statistics.coverage_improvement || 0) + (statistics.coverage_improvement || 0)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Покрытие населения</div>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Равномерное распределение</li>
                <li>• Минимизация пробелов</li>
                <li>• Соблюдение нормативов</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                Улучшение на {statistics.coverage_improvement?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleExportReport = async () => {
    try {
      await exportService.exportToPDF(statistics, recommendations, facilityType);
    } catch (error) {
      console.error('Ошибка экспорта отчёта:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 10000}}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Отчёт по анализу
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportReport}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Экспорт PDF</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Slide Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlide
                        ? 'bg-primary-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <div className="text-sm text-gray-500">
                {currentSlide + 1} из {slides.length}
              </div>
            </div>

            {/* Slide Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {slides[currentSlide].title}
                </h3>
              </div>
              
              {slides[currentSlide].content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          
          <div className="text-sm text-gray-500">
            {slides[currentSlide].title}
          </div>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Далее</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal; 