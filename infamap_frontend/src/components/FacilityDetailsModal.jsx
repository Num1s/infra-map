import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Phone,
  Calendar,
  Users,
  Building,
  Activity,
  TrendingUp,
  Car,
  Clock
} from 'lucide-react';
import { apiService } from '../services/apiService';

const FacilityDetailsModal = ({ isOpen, onClose, facility, facilityType }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && facility) {
      loadAnalytics();
    }
  }, [isOpen, facility]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAnalytics(facility.type);
      setAnalytics(data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !facility) return null;

  const typeNames = {
    school: 'Школа',
    hospital: 'Больница',
    fire_station: 'Пожарная станция'
  };

  const typeIcons = {
    school: '🏫',
    hospital: '🏥',
    fire_station: '🚒'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white text-xl">
              {typeIcons[facility.type]}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{facility.name}</h2>
              <p className="text-sm text-gray-600">{typeNames[facility.type]}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Основная информация</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Адрес</p>
                    <p className="text-sm text-gray-600">{facility.address}</p>
                  </div>
                </div>

                {facility.contact && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Контакт</p>
                      <p className="text-sm text-gray-600">{facility.contact}</p>
                    </div>
                  </div>
                )}

                {facility.type === 'school' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Вместимость</p>
                        <p className="text-sm text-gray-600">{facility.capacity} учеников</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Год основания</p>
                        <p className="text-sm text-gray-600">{facility.established}</p>
                      </div>
                    </div>
                  </>
                )}

                {facility.type === 'hospital' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Количество коек</p>
                        <p className="text-sm text-gray-600">{facility.beds}</p>
                      </div>
                    </div>
                    {facility.specialties && (
                      <div className="flex items-start space-x-3">
                        <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Отделения</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {facility.specialties.map((spec, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {facility.type === 'fire_station' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Техника</p>
                        <p className="text-sm text-gray-600">{facility.vehicles} единиц</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Персонал</p>
                        <p className="text-sm text-gray-600">{facility.personnel} человек</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Аналитика */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Аналитика и статистика</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : analytics ? (
                <div className="space-y-4">
                  {/* Демографический анализ */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Демография района
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {analytics.demographic_analysis.age_groups.children}%
                        </div>
                        <div className="text-gray-600">Дети</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {analytics.demographic_analysis.age_groups.adults}%
                        </div>
                        <div className="text-gray-600">Взрослые</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {analytics.demographic_analysis.age_groups.elderly}%
                        </div>
                        <div className="text-gray-600">Пожилые</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      Рост населения: +{analytics.demographic_analysis.population_growth}% в год
                    </div>
                  </div>

                  {/* Транспортный анализ */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Car className="w-4 h-4 mr-2" />
                      Транспортная доступность
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Плотность дорог:</span>
                        <span className="font-medium">{analytics.transport_analysis.road_density}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Общественный транспорт:</span>
                        <span className="font-medium">{analytics.transport_analysis.public_transport_coverage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Загруженность дорог:</span>
                        <span className="font-medium">{analytics.transport_analysis.traffic_congestion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Экономические факторы */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Экономические показатели
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Инвестиционный приоритет:</span>
                        <span className={`font-medium ${
                          analytics.economic_factors.investment_priority === 'high' ? 'text-red-600' :
                          analytics.economic_factors.investment_priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {analytics.economic_factors.investment_priority}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Затраты на обслуживание:</span>
                        <span className="font-medium">{analytics.economic_factors.maintenance_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Социальное влияние:</span>
                        <span className="font-medium text-green-600">{analytics.economic_factors.social_impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Нет данных для анализа</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Координаты: {facility.coordinates[0].toFixed(6)}, {facility.coordinates[1].toFixed(6)}
          </div>
          
          <div className="flex space-x-2">
            <button className="btn-secondary">
              Экспорт данных
            </button>
            <button 
              onClick={onClose}
              className="btn-primary"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailsModal; 