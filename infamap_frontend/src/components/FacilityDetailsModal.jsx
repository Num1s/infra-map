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
    fire_station: 'Пожарная станция',
    polyclinic: 'Поликлиника',
    clinic: 'Клиника',
    police_station: 'Полицейский участок',
    post_office: 'Почтовое отделение'
  };

  const typeIcons = {
    school: '🏫',
    hospital: '🏥',
    fire_station: '🚒',
    polyclinic: '🏨',
    clinic: '⚕️',
    police_station: '🚔',
    post_office: '📮'
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
              {facility.isMock && (
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-orange-600 font-medium">Демонстрационные данные</span>
                </div>
              )}
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
                        <p className="text-sm text-gray-600">{facility.isMock ? `🔄 ${facility.capacity || 'Заглушка: 500-800'} учеников` : `${facility.capacity} учеников`}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Год основания</p>
                        <p className="text-sm text-gray-600">{facility.isMock ? `🔄 ${facility.established || 'Заглушка: 1985-2005'}` : facility.established}</p>
                      </div>
                    </div>
                    {facility.isMock && (
                      <>
                        <div className="flex items-start space-x-3">
                          <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Количество учителей</p>
                            <p className="text-sm text-gray-600 italic">🔄 {facility.teachers || 'Заглушка: 25-45'} учителей</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Рейтинг школы</p>
                            <p className="text-sm text-gray-600 italic">🔄 {facility.rating || 'Заглушка: 4.2'}/5.0</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Языки обучения</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(facility.languages || ['Кыргызский', 'Русский']).map((lang, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded italic">
                                  🔄 {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {facility.type === 'hospital' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Количество коек</p>
                        <p className="text-sm text-gray-600">{facility.isMock ? `🔄 ${facility.beds || 'Заглушка: 150-300'} коек` : `${facility.beds} коек`}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Медперсонал</p>
                        <p className="text-sm text-gray-600">{facility.isMock ? `🔄 ${facility.medicalStaff || 'Заглушка: 80-150'} сотрудников` : `${facility.medicalStaff} сотрудников`}</p>
                      </div>
                    </div>
                    {facility.specialties && (
                      <div className="flex items-start space-x-3">
                        <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Отделения</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {facility.specialties.map((spec, index) => (
                              <span key={index} className={`text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ${facility.isMock ? 'italic' : ''}`}>
                                {facility.isMock ? '🔄 ' : ''}{spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {facility.isMock && (
                      <>
                        <div className="flex items-start space-x-3">
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Режим работы</p>
                            <p className="text-sm text-gray-600 italic">🔄 {facility.workingHours || 'Заглушка: Круглосуточно'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Машин скорой помощи</p>
                            <p className="text-sm text-gray-600 italic">🔄 {facility.ambulances || 'Заглушка: 5-12'} единиц</p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {facility.type === 'fire_station' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Техника</p>
                        <p className="text-sm text-gray-600">{facility.isMock ? `🔄 ${facility.vehicles || 'Данные недоступны'} единиц` : `${facility.vehicles || 'Данные недоступны'} единиц`}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Персонал</p>
                        <p className="text-sm text-gray-600">{facility.isMock ? `🔄 ${facility.personnel || 'Данные недоступны'} человек` : `${facility.personnel || 'Данные недоступны'} человек`}</p>
                      </div>
                    </div>
                    {facility.isMock && (
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Время реагирования</p>
                          <p className="text-sm text-gray-600 italic">🔄 {facility.responseTime}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {facility.type === 'polyclinic' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Пациентов в день</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.dailyPatients || 'Заглушка: 250-300'} пациентов` : `${facility.dailyPatients} пациентов`}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Профили приема</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(facility.departments || ['Терапия', 'Кардиология', 'Педиатрия']).map((dept, index) => (
                            <span key={index} className={`text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ${facility.isMock ? 'italic' : ''}`}>
                              {facility.isMock ? '🔄 ' : ''}{dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {facility.type === 'clinic' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Кабинетов</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.rooms || 'Заглушка: 8-12'} кабинетов` : `${facility.rooms} кабинетов`}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Режим работы</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.workingHours || 'Заглушка: 8:00-20:00 (пн-пт)'}` : facility.workingHours}</p>
                      </div>
                    </div>
                  </>
                )}

                {facility.type === 'police_station' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Личный состав</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.personnel || 'Заглушка: 25-40'} сотрудников` : `${facility.personnel} сотрудников`}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Патрульные машины</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.vehicles || 'Заглушка: 5-8'} единиц` : `${facility.vehicles} единиц`}</p>
                      </div>
                    </div>
                  </>
                )}

                {facility.type === 'post_office' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Режим работы</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.workingHours || 'Заглушка: 9:00-18:00 (пн-сб)'}` : facility.workingHours}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Отправлений в день</p>
                        <p className="text-sm text-gray-600 italic">{facility.isMock ? `🔄 ${facility.dailyPackages || 'Заглушка: 150-250'} отправлений` : `${facility.dailyPackages} отправлений`}</p>
                      </div>
                    </div>
                    {facility.isMock && facility.postcode && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Почтовый индекс</p>
                          <p className="text-sm text-gray-600 italic">🔄 {facility.postcode}</p>
                        </div>
                      </div>
                    )}
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
                          {analytics.demographic_analysis?.age_groups?.children || 'N/A'}%
                        </div>
                        <div className="text-gray-600">Дети</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {analytics.demographic_analysis?.age_groups?.adults || 'N/A'}%
                        </div>
                        <div className="text-gray-600">Взрослые</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {analytics.demographic_analysis?.age_groups?.elderly || 'N/A'}%
                        </div>
                        <div className="text-gray-600">Пожилые</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      Рост населения: +{analytics.demographic_analysis?.population_growth || 'N/A'}% в год
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
                        <span className="font-medium">{analytics.transport_analysis?.road_density || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Общественный транспорт:</span>
                        <span className="font-medium">{analytics.transport_analysis?.public_transport_coverage || 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Загруженность дорог:</span>
                        <span className="font-medium">{analytics.transport_analysis?.traffic_congestion || 'N/A'}</span>
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
                          analytics.economic_factors?.investment_priority === 'high' ? 'text-red-600' :
                          analytics.economic_factors?.investment_priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {analytics.economic_factors?.investment_priority || 'medium'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Затраты на обслуживание:</span>
                        <span className="font-medium">{analytics.economic_factors?.maintenance_cost || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Социальное влияние:</span>
                        <span className="font-medium text-green-600">{analytics.economic_factors?.social_impact || 'высокое'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Заглушки для неподдерживаемых типов учреждений
                <div className="space-y-4">
                  {(['polyclinic', 'police_station', 'post_office'].includes(facility.type)) ? (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-yellow-800">Данные в разработке</span>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Аналитика для {typeNames[facility.type]?.toLowerCase()} находится в стадии разработки. 
                          В будущих версиях здесь будет доступна подробная статистика.
                        </p>
                      </div>
                      
                      {/* Заглушки для демографических данных */}
                      <div className="bg-gray-50 rounded-lg p-4 opacity-60">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Демография района <span className="text-xs text-orange-500 ml-2">🔄 Заглушка</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">28%</div>
                            <div className="text-gray-600">Дети</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">58%</div>
                            <div className="text-gray-600">Взрослые</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">14%</div>
                            <div className="text-gray-600">Пожилые</div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          Рост населения: +1.2% в год
                        </div>
                      </div>

                      {/* Заглушки для транспортного анализа */}
                      <div className="bg-gray-50 rounded-lg p-4 opacity-60">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Car className="w-4 h-4 mr-2" />
                          Транспортная доступность <span className="text-xs text-orange-500 ml-2">🔄 Заглушка</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Плотность дорог:</span>
                            <span className="font-medium">Средняя</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Общественный транспорт:</span>
                            <span className="font-medium">68%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Загруженность дорог:</span>
                            <span className="font-medium">Умеренная</span>
                          </div>
                        </div>
                      </div>

                      {/* Заглушки для экономических факторов */}
                      <div className="bg-gray-50 rounded-lg p-4 opacity-60">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          Экономические показатели <span className="text-xs text-orange-500 ml-2">🔄 Заглушка</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Инвестиционный приоритет:</span>
                            <span className="font-medium text-yellow-600">Средний</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Затраты на обслуживание:</span>
                            <span className="font-medium">2.5М сом/год</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Социальное влияние:</span>
                            <span className="font-medium text-green-600">Высокое</span>
                          </div>
                        </div>
                      </div>

                      {/* Дополнительные заглушки специфичные для каждого типа */}
                      {facility.type === 'polyclinic' && (
                        <div className="bg-gray-50 rounded-lg p-4 opacity-60">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Медицинская статистика <span className="text-xs text-orange-500 ml-2">🔄 Заглушка</span>
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Среднее время ожидания:</span>
                              <span className="font-medium">25 минут</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Удовлетворенность пациентов:</span>
                              <span className="font-medium text-green-600">78%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Загрузка врачей:</span>
                              <span className="font-medium text-orange-600">85%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {facility.type === 'police_station' && (
                        <div className="bg-gray-50 rounded-lg p-4 opacity-60">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Криминальная статистика <span className="text-xs text-orange-500 ml-2">🔄 Заглушка</span>
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Уровень безопасности:</span>
                              <span className="font-medium text-green-600">Хороший</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Время реагирования:</span>
                              <span className="font-medium">8-12 минут</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Раскрываемость преступлений:</span>
                              <span className="font-medium text-blue-600">72%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {facility.type === 'post_office' && (
                        <div className="bg-gray-50 rounded-lg p-4 opacity-60">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Статистика обслуживания <span className="text-xs text-orange-500 ml-2">🔄 Заглушка</span>
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Пик загрузки:</span>
                              <span className="font-medium">10:00-14:00</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Качество обслуживания:</span>
                              <span className="font-medium text-green-600">4.2/5</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Загрузка отделения:</span>
                              <span className="font-medium text-orange-600">75%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Для поддерживаемых типов - показываем что данные реальные но могут быть неполными
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-800">Аналитические данные недоступны</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Для полной аналитики этого объекта требуется дополнительный сбор данных. 
                          Базовая информация отображается в левой части.
                        </p>
                      </div>
                      
                      {/* Минимальные заглушки для поддерживаемых типов */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Краткая сводка
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• Тип учреждения: {typeNames[facility.type]}</p>
                          <p>• Статус: {facility.isMock ? '🔄 Демонстрационные данные' : 'Реальные данные'}</p>
                          <p>• Район: {facility.district || facility.address}</p>
                          {facility.coordinates && (
                            <p>• Координаты: {facility.coordinates[0].toFixed(4)}, {facility.coordinates[1].toFixed(4)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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