import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

// Исправляем проблему с иконками маркеров в Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Функция для расчета радиуса покрытия в метрах на основе времени доезда
const calculateCoverageRadius = (travelTimeMinutes, facilityType, transportMode = 'default') => {
  const speeds = {
    school: {
      default: 4, // км/ч - пешком (дети и родители)
      walking: 4,
      cycling: 12,
      public_transport: 15
    },
    hospital: {
      default: 20, // км/ч - скорая помощь с учетом городских условий и пробок
      ambulance: 20,
      emergency: 25,
      car: 18
    },
    polyclinic: {
      default: 8, // км/ч - общественный транспорт/пешком
      walking: 5,
      public_transport: 12,
      car: 20
    },
    clinic: {
      default: 6, // км/ч - пешком/общественный транспорт
      walking: 5,
      public_transport: 10,
      car: 18
    },
    fire_station: {
      default: 25, // км/ч - пожарная машина (реалистично для города с пробками)
      emergency: 25,
      normal_traffic: 15,
      heavy_traffic: 12
    },
    police_station: {
      default: 28, // км/ч - полицейская машина (немного быстрее пожарной)
      emergency: 30,
      patrol: 25,
      normal_traffic: 18
    },
    post_office: {
      default: 5, // км/ч - пешком, немного быстрее
      walking: 4,
      public_transport: 12,
      car: 20
    }
  };
  
  const facilitySpeed = speeds[facilityType] || { default: 15 };
  const speed = facilitySpeed[transportMode] || facilitySpeed.default || 15;
  
  const distanceKm = (speed * travelTimeMinutes) / 60;
  return distanceKm * 1000; // конвертируем в метры
};

const InteractiveMap = ({ 
  facilities, 
  recommendations, 
  populationData, 
  selectedFacilityType,
  activeLayers,
  maxTravelTime = 30,
  showCoverageZones = true,
  onShowFacilityDetails,
  darkMode = false,
  selectedFacilityForMap = null
}) => {
  // Логирование props для диагностики
  console.log('🗺️ INTERACTIVEMAP PROPS:');
  console.log('  - facilities.length:', facilities?.length || 0);
  console.log('  - recommendations.length:', recommendations?.length || 0);
  console.log('  - populationData.length:', populationData?.length || 0);
  console.log('  - selectedFacilityType:', selectedFacilityType);
  console.log('  - activeLayers:', activeLayers);
  console.log('  - showCoverageZones:', showCoverageZones);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    facilities: null,
    recommendations: null,
    heatmap: null,
    coverage: null,
    individualCoverage: null,
    districts: null
  });
  
  // Состояние для индивидуального показа радиуса
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  // Состояние для показа полной легенды
  const [showFullLegend, setShowFullLegend] = useState(false);

  // Устанавливаем глобальные функции для обработки кликов
  useEffect(() => {
    console.log('🔧 УСТАНОВКА ГЛОБАЛЬНЫХ ФУНКЦИЙ...');
    console.log('  - facilities.length:', facilities.length);
    console.log('  - onShowFacilityDetails exists:', !!onShowFacilityDetails);
    
    // Тестируем установленные функции
    console.log('🧪 ТЕСТИРОВАНИЕ ГЛОБАЛЬНЫХ ФУНКЦИЙ:');
    console.log('  - window.showFacilityDetails:', typeof window.showFacilityDetails);
    console.log('  - window.toggleFacilityCoverage:', typeof window.toggleFacilityCoverage);
    console.log('  - window.showDetailedPlacementAnalysis:', typeof window.showDetailedPlacementAnalysis);
    
    // Функция для показа деталей учреждения
    window.showFacilityDetails = (facilityIdStr) => {
      console.log('🔍 showFacilityDetails вызвана для ID:', facilityIdStr, 'type:', typeof facilityIdStr);
      try {
        // Поддерживаем как числовые, так и строковые ID
        let facilityId = facilityIdStr;
        
        // Если это строка с числом, пытаемся преобразовать
        if (typeof facilityIdStr === 'string' && !isNaN(facilityIdStr) && !facilityIdStr.includes('_')) {
          facilityId = parseInt(facilityIdStr);
          console.log('  - Преобразованный в число ID:', facilityId);
        } else {
          console.log('  - Используем строковый ID:', facilityId);
        }
        
        console.log('  - Доступные учреждения:', facilities.map(f => ({ id: f.id, name: f.name, type: typeof f.id })));
        
        const facility = facilities.find(f => {
          // Сравниваем и как строки и как числа для надежности
          return f.id === facilityId || 
                 f.id === facilityIdStr || 
                 String(f.id) === String(facilityId) ||
                 String(f.id) === String(facilityIdStr);
        });
        
        console.log('  - Найденное учреждение:', facility?.name);
        
        if (facility) {
          console.log('  - Вызываем onShowFacilityDetails для:', facility.name);
          if (onShowFacilityDetails && typeof onShowFacilityDetails === 'function') {
            onShowFacilityDetails(facility);
          } else {
            console.error('❌ onShowFacilityDetails не является функцией:', typeof onShowFacilityDetails);
          }
        } else {
          console.warn('❌ Учреждение не найдено для ID:', facilityId);
          console.log('   Доступные IDs:', facilities.map(f => f.id));
        }
      } catch (error) {
        console.error('❌ Ошибка в showFacilityDetails:', error);
      }
    };

    // Функция для переключения радиуса покрытия
    window.toggleFacilityCoverage = (facilityIdStr) => {
      console.log('🎯 toggleFacilityCoverage вызвана для ID:', facilityIdStr, 'type:', typeof facilityIdStr);
      try {
        // Поддерживаем как числовые, так и строковые ID
        let facilityId = facilityIdStr;
        
        // Если это строка с числом, пытаемся преобразовать
        if (typeof facilityIdStr === 'string' && !isNaN(facilityIdStr) && !facilityIdStr.includes('_')) {
          facilityId = parseInt(facilityIdStr);
          console.log('  - Преобразованный в число ID:', facilityId);
        } else {
          console.log('  - Используем строковый ID:', facilityId);
        }
        
        console.log('  - Текущий selectedFacilityId:', selectedFacilityId);
        
        // Проверяем, что учреждение с таким ID существует
        const facility = facilities.find(f => {
          return f.id === facilityId || 
                 f.id === facilityIdStr || 
                 String(f.id) === String(facilityId) ||
                 String(f.id) === String(facilityIdStr);
        });
        
        if (!facility) {
          console.warn('❌ Учреждение с ID', facilityId, 'не найдено');
          return;
        }
        
        console.log('  - Найденное учреждение:', facility.name);
        
        setSelectedFacilityId(prevId => {
          // Сравниваем правильно с учетом типов ID
          const isSameId = prevId === facility.id || 
                          String(prevId) === String(facility.id);
          const newId = isSameId ? null : facility.id;
          console.log('  - Переключение радиуса:', prevId, '->', newId);
          return newId;
        });
      } catch (error) {
        console.error('❌ Ошибка в toggleFacilityCoverage:', error);
      }
    };

    // Функция для подробного анализа размещения
    window.showDetailedPlacementAnalysis = (recommendationData) => {
      console.log('📊 showDetailedPlacementAnalysis вызвана:', typeof recommendationData);
      try {
        const analysis = typeof recommendationData === 'string' 
          ? JSON.parse(recommendationData) 
          : recommendationData;
        
        console.log('  - Parsed analysis:', analysis);
        
        // Создаем модальное окно с подробным анализом
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        `;
        
        modal.innerHTML = createDetailedAnalysisModal(analysis);
        document.body.appendChild(modal);
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });
        
        // Закрытие по клавише Escape
        const handleEscape = (e) => {
          if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);
        
      } catch (error) {
        console.error('❌ Ошибка в showDetailedPlacementAnalysis:', error);
        alert('Ошибка при открытии подробного анализа: ' + error.message);
      }
    };

    // Отладочная информация
    console.log('Глобальные функции установлены. Facilities:', facilities.length, 'Selected ID:', selectedFacilityId);

    return () => {
      console.log('🗑️ ОЧИСТКА ГЛОБАЛЬНЫХ ФУНКЦИЙ');
      delete window.showFacilityDetails;
      delete window.toggleFacilityCoverage;
      delete window.showDetailedPlacementAnalysis;
    };
  }, [facilities, onShowFacilityDetails]); // Правильные зависимости без selectedFacilityId

  // Инициализация карты
  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Центр карты - Бишкек
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([42.8746, 74.5698], 12);
      
      // Используем стабильный OpenStreetMap слой
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Добавляем контролы
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      L.control.scale({
        position: 'bottomright',
        metric: true,
        imperial: false
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Обновление слоя учреждений
  useEffect(() => {
    console.log('🏢 ОБНОВЛЕНИЕ СЛОЯ УЧРЕЖДЕНИЙ:');
    console.log('  - mapInstanceRef.current:', !!mapInstanceRef.current);
    console.log('  - facilities.length:', facilities.length);
    console.log('  - activeLayers.facilities:', activeLayers.facilities);
    console.log('  - selectedFacilityType:', selectedFacilityType);
    
    if (!mapInstanceRef.current) {
      console.log('❌ Карта не инициализирована, пропускаем');
      return;
    }

    // Удаляем предыдущие слои
    if (layersRef.current.facilities) {
      console.log('🗑️ Удаляем предыдущий слой facilities');
      mapInstanceRef.current.removeLayer(layersRef.current.facilities);
    }
    if (layersRef.current.coverage) {
      console.log('🗑️ Удаляем предыдущий слой coverage');
      mapInstanceRef.current.removeLayer(layersRef.current.coverage);
    }
    if (layersRef.current.individualCoverage) {
      console.log('🗑️ Удаляем предыдущий слой individualCoverage');
      mapInstanceRef.current.removeLayer(layersRef.current.individualCoverage);
    }

    if (activeLayers.facilities && facilities.length > 0) {
      console.log('✅ Создаем новые слои для учреждений');
      const facilitiesLayer = L.layerGroup();
      const coverageLayer = L.layerGroup();

      // Фильтруем учреждения по выбранному типу
      const filteredFacilities = facilities.filter(facility => 
        selectedFacilityType === 'all' || facility.type === selectedFacilityType
      );
      
      console.log('📊 ФИЛЬТРАЦИЯ УЧРЕЖДЕНИЙ:');
      console.log('  - Всего учреждений:', facilities.length);
      console.log('  - После фильтрации:', filteredFacilities.length);
      console.log('  - Фильтр по типу:', selectedFacilityType);

      filteredFacilities.forEach((facility, index) => {
        console.log(`🏢 Обрабатываем учреждение ${index + 1}:`, {
          id: facility.id,
          name: facility.name,
          type: facility.type,
          coordinates: facility.coordinates
        });
        
        try {
          // Проверяем валидность координат
          if (!facility.coordinates || !Array.isArray(facility.coordinates) || facility.coordinates.length < 2) {
            console.warn(`❌ Некорректные координаты для учреждения: ${facility.name}`, facility.coordinates);
            return;
          }

          console.log(`✅ Координаты валидны: [${facility.coordinates[0]}, ${facility.coordinates[1]}]`);

          // Создаем маркер учреждения
          const icon = createFacilityIcon(facility.type);
          const popup = createFacilityPopup(facility);
          
          const marker = L.marker(facility.coordinates, { icon })
            .bindPopup(popup, {
              maxWidth: 450,
              minWidth: 320,
              closeButton: true,
              autoPan: true
            });
          
          // Добавляем событие для отладки
          marker.on('popupopen', () => {
            console.log('Popup открыт для учреждения:', facility.name, 'ID:', facility.id);
            // Небольшая задержка для инициализации DOM элементов
            setTimeout(() => {
              const detailsBtn = document.querySelector(`button[onclick*="showFacilityDetails(${facility.id})"]`);
              const radiusBtn = document.querySelector(`#coverage-btn-${facility.id}`);
              console.log('Кнопки найдены:', { detailsBtn: !!detailsBtn, radiusBtn: !!radiusBtn });
            }, 100);
          });
          
          facilitiesLayer.addLayer(marker);
          console.log(`✅ Маркер добавлен в слой facilities`);
        } catch (error) {
          console.error(`❌ Ошибка создания маркера для учреждения: ${facility.name}`, error);
        }

        // Добавляем зону покрытия - мягкие круги
        if (showCoverageZones && activeLayers.facilities) {
          try {
            const radius = calculateCoverageRadius(maxTravelTime, facility.type);
            const config = getFacilityIconConfig(facility.type);
            
            const coverageCircle = L.circle(facility.coordinates, {
              radius: radius,
              fillColor: config.color,
              fillOpacity: 0.1,
              color: config.color,
              weight: 1,
              opacity: 0.3,
              interactive: false
            });
            
            coverageLayer.addLayer(coverageCircle);
            console.log(`✅ Круг покрытия добавлен для ${facility.name}`);
          } catch (error) {
            console.error(`❌ Ошибка создания зоны покрытия для: ${facility.name}`, error);
          }
        }
      });

      const facilitiesCount = facilitiesLayer.getLayers().length;
      const coverageCount = coverageLayer.getLayers().length;
      
      console.log('📍 ИТОГИ СОЗДАНИЯ СЛОЕВ:');
      console.log(`  - Маркеров в facilitiesLayer: ${facilitiesCount}`);
      console.log(`  - Кругов в coverageLayer: ${coverageCount}`);

      if (facilitiesCount > 0) {
        facilitiesLayer.addTo(mapInstanceRef.current);
        layersRef.current.facilities = facilitiesLayer;
        console.log('✅ Слой facilities добавлен на карту');
      } else {
        console.warn('⚠️ Слой facilities пуст, не добавляем на карту');
      }

      if (showCoverageZones && coverageCount > 0) {
        coverageLayer.addTo(mapInstanceRef.current);
        layersRef.current.coverage = coverageLayer;
        console.log('✅ Слой coverage добавлен на карту');
      }
    } else {
      console.log('❌ Слой facilities не отображается:');
      console.log('  - activeLayers.facilities:', activeLayers.facilities);
      console.log('  - facilities.length:', facilities.length);
    }
  }, [facilities, activeLayers.facilities, selectedFacilityType, maxTravelTime, showCoverageZones]);

  // Обновление индивидуального радиуса покрытия
  useEffect(() => {
    console.log('🎯 ОБНОВЛЕНИЕ ИНДИВИДУАЛЬНОГО РАДИУСА:');
    console.log('  - mapInstanceRef.current:', !!mapInstanceRef.current);
    console.log('  - selectedFacilityId:', selectedFacilityId);
    console.log('  - facilities.length:', facilities.length);
    console.log('  - maxTravelTime:', maxTravelTime);

    if (!mapInstanceRef.current) {
      console.log('❌ Карта не инициализирована');
      return;
    }

    console.log('Обновление индивидуального радиуса. selectedFacilityId:', selectedFacilityId);

    // Удаляем предыдущий индивидуальный радиус
    if (layersRef.current.individualCoverage) {
      mapInstanceRef.current.removeLayer(layersRef.current.individualCoverage);
      layersRef.current.individualCoverage = null;
      console.log('Предыдущий радиус удален');
    }

    if (selectedFacilityId && facilities.length > 0) {
      const facility = facilities.find(f => f.id === selectedFacilityId);
      console.log('Поиск учреждения с ID:', selectedFacilityId);
      console.log('Найдено учреждение:', facility?.name);
      console.log('Координаты учреждения:', facility?.coordinates);
      
      if (facility && facility.coordinates && Array.isArray(facility.coordinates) && facility.coordinates.length >= 2) {
        try {
          const individualCoverageLayer = L.layerGroup();
          const config = getFacilityIconConfig(facility.type);
          
          // Создаем более заметный индивидуальный радиус
          const radius = calculateCoverageRadius(maxTravelTime, facility.type);
          console.log('Рассчитанный радиус покрытия:', radius, 'метров для', facility.type, 'с временем', maxTravelTime, 'мин');
          
          const coverageCircle = L.circle(facility.coordinates, {
            radius: radius,
            fillColor: config.color,
            fillOpacity: 0.25,
            color: config.color,
            weight: 4,
            opacity: 0.9,
            interactive: false,
            dashArray: '10, 5'
          });
          
          // Добавляем стильную подпись
          const label = L.marker(facility.coordinates, {
            icon: L.divIcon({
              html: `<div class="coverage-info-card" style="
                background: white;
                border: 2px solid ${config.color};
                border-radius: 12px;
                padding: 8px 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: system-ui, sans-serif;
                white-space: nowrap;
                transform: translateY(-10px);
              ">
                <div class="coverage-header" style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 4px;
                ">
                  <span class="coverage-icon" style="font-size: 16px;">${config.symbol}</span>
                  <span class="coverage-title" style="
                    font-weight: 600;
                    color: #374151;
                    font-size: 13px;
                  ">${facility.name}</span>
                </div>
                <div class="coverage-stats" style="
                  display: flex;
                  gap: 12px;
                  font-size: 11px;
                  color: #6b7280;
                ">
                  <span class="coverage-distance" style="display: flex; align-items: center; gap: 2px;">
                    🎯 ${(radius/1000).toFixed(1)} км
                  </span>
                  <span class="coverage-time" style="display: flex; align-items: center; gap: 2px;">
                    ⏱️ ${maxTravelTime} мин
                  </span>
                </div>
              </div>`,
              iconSize: [220, 70],
              iconAnchor: [110, 85]
            })
          });
          
          individualCoverageLayer.addLayer(coverageCircle);
          individualCoverageLayer.addLayer(label);
          
          individualCoverageLayer.addTo(mapInstanceRef.current);
          layersRef.current.individualCoverage = individualCoverageLayer;
          
          // Центрируем карту на учреждении с правильным зумом
          const currentZoom = mapInstanceRef.current.getZoom();
          const targetZoom = Math.max(currentZoom, 13);
          mapInstanceRef.current.setView(facility.coordinates, targetZoom, { animate: true, duration: 0.5 });
          
          console.log('✅ Индивидуальный радиус успешно создан для:', facility.name);
          console.log('  - Радиус:', radius, 'метров');
          console.log('  - Цвет:', config.color);
          console.log('  - Координаты:', facility.coordinates);
        } catch (error) {
          console.error('❌ Ошибка создания индивидуального радиуса:', error);
        }
      } else {
        console.warn('❌ Учреждение не найдено или некорректные координаты:', {
          facility: !!facility,
          coordinates: facility?.coordinates,
          coordinatesType: Array.isArray(facility?.coordinates),
          coordinatesLength: facility?.coordinates?.length
        });
      }
    } else {
      console.log('ℹ️ Индивидуальный радиус не отображается:', {
        selectedFacilityId,
        facilitiesCount: facilities.length
      });
    }
  }, [selectedFacilityId, facilities, maxTravelTime]); // Добавил facilities в зависимости

  // Обновление слоя рекомендаций
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущий слой
    if (layersRef.current.recommendations) {
      mapInstanceRef.current.removeLayer(layersRef.current.recommendations);
      layersRef.current.recommendations = null;
    }

    console.log('🔄 ОБНОВЛЕНИЕ СЛОЯ РЕКОМЕНДАЦИЙ:');
    console.log('activeLayers.recommendations:', activeLayers.recommendations);
    console.log('recommendations length:', recommendations?.length);
    console.log('selectedFacilityType:', selectedFacilityType);
    console.log('recommendations:', recommendations);

    if (activeLayers.recommendations && recommendations && recommendations.length > 0) {
      const recommendationsLayer = L.layerGroup();

      // Фильтруем рекомендации по выбранному типу учреждения
      let filteredRecommendations = recommendations;
      
      console.log('🔍 ФИЛЬТРАЦИЯ РЕКОМЕНДАЦИЙ:');
      console.log('selectedFacilityType:', selectedFacilityType);
      console.log('Всего рекомендаций до фильтрации:', recommendations.length);
      
      if (selectedFacilityType !== 'all') {
        filteredRecommendations = recommendations.filter(rec => {
          // Проверяем разные варианты типов
          const recType = rec.type || rec.facility_type;
          console.log(`🔍 Рекомендация ${rec.id}:`);
          console.log(`   - rec.type: "${rec.type}"`);
          console.log(`   - rec.facility_type: "${rec.facility_type}"`);
          console.log(`   - rec.recommendation_type: "${rec.recommendation_type}"`);
          console.log(`   - selectedFacilityType: "${selectedFacilityType}"`);
          
          // Для рекомендаций провальных зон проверяем базовый тип
          if (rec.recommendation_type === 'gap_zone') {
            // Упрощенная логика для clinic_gap
            if (selectedFacilityType === 'clinic') {
              const isClinicGap = (rec.type === 'clinic_gap' || rec.facility_type === 'clinic');
              console.log(`   ✅ clinic check: type="${rec.type}", facility_type="${rec.facility_type}" -> ${isClinicGap}`);
              return isClinicGap;
            }
            
            // Для школ
            if (selectedFacilityType === 'school') {
              const isSchoolGap = (rec.type === 'school_gap' || rec.facility_type === 'school');
              console.log(`   ✅ school check: type="${rec.type}", facility_type="${rec.facility_type}" -> ${isSchoolGap}`);
              return isSchoolGap;
            }
            
            // Для других типов медицинских учреждений также показываем clinic_gap
            if ((selectedFacilityType === 'hospital' || selectedFacilityType === 'polyclinic')) {
              const isClinicRelated = (rec.type === 'clinic_gap' || rec.facility_type === 'clinic');
              console.log(`   ✅ medical check: type="${rec.type}", facility_type="${rec.facility_type}" -> ${isClinicRelated}`);
              return isClinicRelated;
            }
          }
          
          // Стандартная проверка типа для остальных рекомендаций
          const matches = recType === selectedFacilityType;
          console.log(`   ✅ standard check: "${recType}" === "${selectedFacilityType}" -> ${matches}`);
          return matches;
        });
      }

      console.log('📊 РЕЗУЛЬТАТ ФИЛЬТРАЦИИ:');
      console.log('Отфильтрованных рекомендаций:', filteredRecommendations.length);
      console.log('Детали отфильтрованных рекомендаций:', filteredRecommendations.map(r => ({
        id: r.id,
        type: r.type,
        facility_type: r.facility_type,
        coordinates: r.coordinates
      })));

      filteredRecommendations.forEach((rec, index) => {
        console.log(`🎯 Обрабатываем рекомендацию ${index + 1}:`, rec);
        
        if (rec.coordinates && Array.isArray(rec.coordinates) && rec.coordinates.length >= 2) {
          console.log(`   ✅ Координаты валидны: [${rec.coordinates[0]}, ${rec.coordinates[1]}]`);
          
          const icon = createRecommendationIcon(rec);
          const marker = L.marker(rec.coordinates, { icon })
            .bindPopup(createRecommendationPopup(rec));
          
          recommendationsLayer.addLayer(marker);
          console.log(`   ✅ Маркер добавлен в слой`);
        } else {
          console.warn(`   ❌ Некорректные координаты для рекомендации:`, rec.coordinates);
        }
      });

      const layersCount = recommendationsLayer.getLayers().length;
      console.log(`📍 Всего маркеров в слое рекомендаций: ${layersCount}`);

      if (layersCount > 0) {
        recommendationsLayer.addTo(mapInstanceRef.current);
        layersRef.current.recommendations = recommendationsLayer;
        console.log('✅ Слой рекомендаций добавлен на карту');
      } else {
        console.warn('⚠️ Слой рекомендаций пуст, не добавляем на карту');
      }
    } else {
      console.log('❌ Рекомендации не отображаются:');
      console.log('  - activeLayers.recommendations:', activeLayers.recommendations);
      console.log('  - recommendations exists:', !!recommendations);
      console.log('  - recommendations.length:', recommendations?.length);
    }
  }, [recommendations, activeLayers.recommendations, selectedFacilityType]);

  // Обновление тепловой карты
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущий слой
    if (layersRef.current.heatmap) {
      mapInstanceRef.current.removeLayer(layersRef.current.heatmap);
      layersRef.current.heatmap = null; // Очищаем ссылку
    }

    if (activeLayers.population && populationData.length > 0) {
      // Увеличиваем интенсивность данных для лучшей видимости
      const enhancedData = populationData.map(([lat, lng, intensity]) => [
        lat, lng, Math.min(intensity * 2.5, 1.0) // Увеличиваем интенсивность в 2.5 раза
      ]);

      const heatmapLayer = L.heatLayer(enhancedData, {
        radius: 40,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.2,
        gradient: {
          0.0: 'rgba(0, 0, 255, 0)',
          0.1: 'rgba(0, 100, 255, 0.2)',
          0.2: 'rgba(0, 255, 255, 0.4)',
          0.4: 'rgba(0, 255, 0, 0.6)',
          0.6: 'rgba(255, 255, 0, 0.8)',
          0.8: 'rgba(255, 165, 0, 0.9)',
          1.0: 'rgba(255, 0, 0, 1.0)'
        }
      });

      heatmapLayer.addTo(mapInstanceRef.current);
      layersRef.current.heatmap = heatmapLayer;
    }
  }, [populationData, activeLayers.population]);

  // Обновление маркеров районов с данными популяции
  useEffect(() => {
    console.log('🔄 useEffect для маркеров районов:', {
      hasMap: !!mapInstanceRef.current,
      populationActive: activeLayers.population,
      allActiveLayers: activeLayers
    });
    
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущий слой районов
    if (layersRef.current.districts) {
      console.log('🗑️ Удаляем существующие маркеры районов через слой');
      mapInstanceRef.current.removeLayer(layersRef.current.districts);
      layersRef.current.districts = null; // Очищаем ссылку
    }

    // Если слой населения отключен, не создаем маркеры районов
    if (!activeLayers.population) {
      console.log('🚫 Слой населения отключен, маркеры районов не отображаются');
      return;
    }

    console.log('✅ Слой населения включен, создаем маркеры районов');

    // Получаем данные о районах из apiService (если они доступны через глобальную переменную)
    const addDistrictMarkers = async () => {
      try {
        console.log('📡 Запрашиваем данные для маркеров районов...');
        // Запрашиваем данные популяции для получения информации о районах
        const populationEstimate = await window.apiService?.getPopulationEstimate();
        
        if (populationEstimate && populationEstimate.districts) {
          const districtsLayer = L.layerGroup();
          
          // Обновленные точные координаты центров районов
          const districtCenters = {
            'Октябрьский район': { lat: 42.8391489, lon: 74.6141665 },
            'Октябрьский': { lat: 42.8391489, lon: 74.6141665 },
            'Свердловский район': { lat: 42.8780000, lon: 74.6050000 },
            'Свердловский': { lat: 42.8780000, lon: 74.6050000 },
            'Ленинский район': { lat: 42.8590000, lon: 74.5820000 },
            'Ленинский': { lat: 42.8590000, lon: 74.5820000 },
            'Первомайский район': { lat: 42.8746000, lon: 74.6122000 },
            'Первомайский': { lat: 42.8746000, lon: 74.6122000 }
          };

          populationEstimate.districts.forEach(district => {
            const center = districtCenters[district.district];
            if (center) {
              const marker = L.marker([center.lat, center.lon], {
                icon: L.divIcon({
                  className: 'district-marker',
                  html: `
                    <div style="
                      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                      color: white;
                      padding: 8px 12px;
                      border-radius: 12px;
                      border: 2px solid white;
                      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
                      text-align: center;
                      font-size: 12px;
                      font-weight: bold;
                      min-width: 100px;
                      animation: districtPulse 3s infinite;
                    ">
                      <div style="font-size: 14px; margin-bottom: 2px;">📊</div>
                      <div>${district.district.replace(' район', '')}</div>
                      <div style="font-size: 10px; opacity: 0.9;">
                        ${(district.estimated_population / 1000).toFixed(0)}k чел.
                      </div>
                    </div>
                  `,
                  iconSize: [120, 50],
                  iconAnchor: [60, 25]
                })
              }).bindPopup(`
                <div style="padding: 0; min-width: 280px; font-family: system-ui, sans-serif;">
                  <div style="padding: 12px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; margin: 0;">
                    <h3 style="margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px;">🏘️</span>
                      ${district.district}
                    </h3>
                  </div>
                  
                  <div style="padding: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                      <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #1d4ed8;">
                          ${district.estimated_population.toLocaleString()}
                        </div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                          👥 Население
                        </div>
                      </div>
                      
                      <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #059669;">
                          ${district.num_buildings}
                        </div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                          🏢 Зданий
                        </div>
                      </div>
                    </div>
                    
                    <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                      <div style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px;">
                        📈 Плотность населения
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                          <div style="
                            height: 100%;
                            background: linear-gradient(90deg, #10b981, #059669);
                            width: ${Math.min((district.estimated_population / 600000) * 100, 100)}%;
                            transition: width 0.3s ease;
                          "></div>
                        </div>
                        <span style="font-size: 12px; color: #64748b; font-weight: 600;">
                          ${((district.estimated_population / district.num_buildings) | 0)} чел/здание
                        </span>
                      </div>
                    </div>
                    
                    <div style="font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                      💡 Данные основаны на анализе жилых зданий
                    </div>
                  </div>
                </div>
              `, {
                maxWidth: 300,
                closeButton: true,
                autoPan: true
              });

              districtsLayer.addLayer(marker);
            }
          });

          if (districtsLayer.getLayers().length > 0) {
            districtsLayer.addTo(mapInstanceRef.current);
            layersRef.current.districts = districtsLayer;
            console.log('✅ Маркеры районов добавлены на карту');
          }
        }
      } catch (error) {
        console.warn('Не удалось загрузить данные районов для маркеров:', error.message);
      }
    };

    // Выставляем apiService в глобальную область для доступа
    if (!window.apiService && window.apiService !== null) {
      import('../services/apiService').then(module => {
        window.apiService = module.apiService;
        addDistrictMarkers();
      });
    } else {
      addDistrictMarkers();
    }
  }, [activeLayers.population]);

  // Эффект для центрирования карты на выбранном учреждении из умного поиска
  useEffect(() => {
    console.log('🎯 ЭФФЕКТ ЦЕНТРИРОВАНИЯ КАРТЫ:');
    console.log('  - mapInstanceRef.current:', !!mapInstanceRef.current);
    console.log('  - selectedFacilityForMap:', selectedFacilityForMap);
    
    if (!mapInstanceRef.current || !selectedFacilityForMap) {
      console.log('❌ Карта не инициализирована или учреждение не выбрано');
      return;
    }

    // Проверяем, есть ли у учреждения корректные координаты
    if (!selectedFacilityForMap.coordinates || 
        !Array.isArray(selectedFacilityForMap.coordinates) || 
        selectedFacilityForMap.coordinates.length < 2) {
      console.warn('❌ У выбранного учреждения некорректные координаты:', selectedFacilityForMap.coordinates);
      return;
    }

    console.log('✅ Центрируем карту на учреждении:', {
      name: selectedFacilityForMap.name,
      coordinates: selectedFacilityForMap.coordinates,
      type: selectedFacilityForMap.type
    });

    // Центрируем карту на выбранном учреждении с плавной анимацией
    const targetZoom = 15; // Подходящий зум для детального просмотра
    mapInstanceRef.current.setView(
      selectedFacilityForMap.coordinates, 
      targetZoom, 
      { 
        animate: true, 
        duration: 1.0, // Длительность анимации в секундах
        easeLinearity: 0.25 // Плавность анимации
      }
    );

    console.log('🎯 Карта центрирована на:', selectedFacilityForMap.name);
  }, [selectedFacilityForMap]);

  // Состояние для слоя подсветки выбранного учреждения
  const [highlightLayer, setHighlightLayer] = useState(null);

  // Эффект для подсветки выбранного учреждения
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущую подсветку
    if (highlightLayer) {
      mapInstanceRef.current.removeLayer(highlightLayer);
      setHighlightLayer(null);
    }

    if (selectedFacilityForMap && selectedFacilityForMap.coordinates) {
      console.log('✨ Добавляем подсветку для учреждения:', selectedFacilityForMap.name);
      
      // Создаем пульсирующий круг вокруг выбранного учреждения
      const highlight = L.circle(selectedFacilityForMap.coordinates, {
        radius: 200, // Радиус подсветки в метрах
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        color: '#1d4ed8',
        weight: 3,
        opacity: 0.8,
        interactive: false, // Не блокируем клики на учреждение
        className: 'facility-highlight' // Для CSS анимации
      });

      // Добавляем CSS для анимации пульсации
      const style = document.createElement('style');
      style.textContent = `
        .facility-highlight {
          animation: facilityPulse 2s infinite;
        }
        @keyframes facilityPulse {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);

      highlight.addTo(mapInstanceRef.current);
      setHighlightLayer(highlight);

      // Автоматически убираем подсветку через 5 секунд
      setTimeout(() => {
        if (highlight && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(highlight);
          setHighlightLayer(null);
          document.head.removeChild(style);
        }
      }, 5000);
    }
  }, [selectedFacilityForMap, highlightLayer]);

  // Создание иконки для учреждения
  const createFacilityIcon = (type) => {
    const iconConfig = getFacilityIconConfig(type);
    
    return L.divIcon({
      className: 'custom-marker facility-marker',
      html: `
        <div style="
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, ${iconConfig.color}, ${iconConfig.color}dd); 
          border: 3px solid white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          animation: bounceIn 0.6s ease-out;
        ">
          ${iconConfig.symbol}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Создание иконки для рекомендации
  const createRecommendationIcon = (recommendation) => {
    const config = getFacilityIconConfig(recommendation.type);
    const priorityColors = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#10b981'
    };
    
    // Специальная иконка для провальных зон школ
    if (recommendation.recommendation_type === 'gap_zone' && recommendation.type === 'school_gap') {
      return L.divIcon({
        className: 'custom-marker recommendation-marker new-school-marker',
        html: `
          <div style="
            width: 55px; 
            height: 55px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #10b981, #059669); 
            border: 4px solid #d1fae5; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 20px;
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
            position: relative;
            animation: recommendationPulse 2s infinite, float 3s ease-in-out infinite;
          ">
            🏫
            <div style="
              position: absolute;
              top: -10px;
              right: -10px;
              width: 24px;
              height: 24px;
              background: ${priorityColors[recommendation.priority] || '#10b981'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: white;
              font-weight: bold;
              border: 2px solid white;
              animation: priorityBadgePulse 1.5s infinite;
            ">
              ✨
            </div>
            <div style="
              position: absolute;
              bottom: -12px;
              left: 50%;
              transform: translateX(-50%);
              background: #10b981;
              color: white;
              padding: 2px 6px;
              border-radius: 8px;
              font-size: 9px;
              font-weight: bold;
              border: 1px solid white;
              white-space: nowrap;
            ">
              НОВАЯ
            </div>
          </div>
        `,
        iconSize: [55, 55],
        iconAnchor: [27.5, 27.5],
        popupAnchor: [0, -27.5]
      });
    }
    
    // Специальная иконка для провальных зон клиник
    if (recommendation.recommendation_type === 'gap_zone' && recommendation.type === 'clinic_gap') {
      return L.divIcon({
        className: 'custom-marker recommendation-marker new-clinic-marker',
        html: `
          <div style="
            width: 55px; 
            height: 55px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #7c3aed, #5b21b6); 
            border: 4px solid #ede9fe; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 20px;
            box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
            position: relative;
            animation: recommendationPulse 2s infinite, float 3s ease-in-out infinite;
          ">
            ⚕️
            <div style="
              position: absolute;
              top: -10px;
              right: -10px;
              width: 24px;
              height: 24px;
              background: ${priorityColors[recommendation.priority] || '#7c3aed'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: white;
              font-weight: bold;
              border: 2px solid white;
              animation: priorityBadgePulse 1.5s infinite;
            ">
              💊
            </div>
            <div style="
              position: absolute;
              bottom: -12px;
              left: 50%;
              transform: translateX(-50%);
              background: #7c3aed;
              color: white;
              padding: 2px 6px;
              border-radius: 8px;
              font-size: 9px;
              font-weight: bold;
              border: 1px solid white;
              white-space: nowrap;
            ">
              НОВАЯ
            </div>
          </div>
        `,
        iconSize: [55, 55],
        iconAnchor: [27.5, 27.5],
        popupAnchor: [0, -27.5]
      });
    }
    
    // Стандартная иконка для обычных рекомендаций
    return L.divIcon({
      className: 'custom-marker recommendation-marker',
      html: `
        <div style="
          width: 50px; 
          height: 50px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, ${config.color}, ${config.color}dd); 
          border: 4px solid ${priorityColors[recommendation.priority] || '#f59e0b'}; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          position: relative;
          animation: recommendationPulse 3s infinite, float 4s ease-in-out infinite;
        ">
          ${config.symbol}
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            background: ${priorityColors[recommendation.priority] || '#f59e0b'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
            border: 2px solid white;
            animation: priorityBadgePulse 2s infinite;
          ">
            ⚡
          </div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    });
  };

  // Конфигурация иконок
  const getFacilityIconConfig = (type) => {
    const configs = {
      school: { 
        color: '#10b981',
        symbol: '🏫',
        name: 'Школа'
      },
      school_gap: { 
        color: '#10b981',
        symbol: '🏫',
        name: 'Новая школа'
      },
      hospital: { 
        color: '#dc2626',
        symbol: '🏥',
        name: 'Больница'
      },
      polyclinic: { 
        color: '#2563eb',
        symbol: '🏨',
        name: 'Поликлиника'
      },
      clinic: { 
        color: '#7c3aed',
        symbol: '⚕️',
        name: 'Клиника'
      },
      clinic_gap: { 
        color: '#7c3aed',
        symbol: '⚕️',
        name: 'Новая клиника'
      },
      fire_station: { 
        color: '#ea580c',
        symbol: '🚒',
        name: 'Пожарная станция'
      },
      police_station: { 
        color: '#1f2937',
        symbol: '🚔',
        name: 'Полицейский участок'
      },
      post_office: { 
        color: '#059669',
        symbol: '📮',
        name: 'Почтовое отделение'
      }
    };
    
    return configs[type] || { 
      color: '#6b7280',
      symbol: '📍',
      name: 'Учреждение'
    };
  };

  // Создание попапа для учреждения
  const createFacilityPopup = (facility) => {
    const iconConfig = getFacilityIconConfig(facility.type);
    
    // Функция для создания звездочек рейтинга
    const renderStars = (rating) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(i <= rating ? '⭐' : '☆');
      }
      return stars.join('');
    };

    // Специфичная статистика в зависимости от типа учреждения
    let specificStats = '';
    if (facility.type === 'school') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ПОСЕЩАЕМОСТЬ</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${facility.statistics?.attendanceRate || '-'}%</div>
            </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕВАЕМОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.passRate || '-'}%</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">УЧЕНИКОВ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.currentStudents || '-'}/${facility.capacity || '-'}</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">УЧИТЕЛЕЙ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.teachers || '-'}</div>
          </div>
        </div>
        
        ${facility.languages && Array.isArray(facility.languages) && facility.languages.length > 0 ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ЯЗЫКИ ОБУЧЕНИЯ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.languages.map(language => 
              `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${language}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'hospital' || facility.type === 'clinic' || facility.type === 'polyclinic') {
      // Статистика для медицинских учреждений
      const isHospital = facility.type === 'hospital';
      const typeColors = {
        hospital: { bg: '#fef2f2', text: '#dc2626', accent: '#991b1b' },
        clinic: { bg: '#f3e8ff', text: '#7c3aed', accent: '#5b21b6' },
        polyclinic: { bg: '#eff6ff', text: '#2563eb', accent: '#1d4ed8' }
      };
      const colors = typeColors[facility.type] || typeColors.clinic;
      
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          ${isHospital ? `
          <div style="background: ${colors.bg}; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: ${colors.text}; font-weight: 600;">КОЙКИ</div>
            <div style="font-size: 16px; color: ${colors.accent}; font-weight: bold;">${facility.beds || '-'}</div>
            </div>
          ` : `
          <div style="background: ${colors.bg}; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: ${colors.text}; font-weight: 600;">ПАЦИЕНТЫ/ДЕНЬ</div>
            <div style="font-size: 16px; color: ${colors.accent}; font-weight: bold;">${facility.currentLoad || '-'}</div>
          </div>
          `}
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.doctors || '-'}</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ЗАГРУЗКА</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.currentLoad ? Math.round((facility.currentLoad / facility.capacity) * 100) : '-'}%</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">РЕЖИМ</div>
            <div style="font-size: 13px; color: #9d174d; font-weight: bold; line-height: 1;">${facility.workingHours || 'Круглосуточно'}</div>
          </div>
        </div>
        
        ${facility.departments && Array.isArray(facility.departments) && facility.departments.length > 0 ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОТДЕЛЕНИЯ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.departments.slice(0, 4).map(dept => 
              `<span style="background: ${colors.bg}; color: ${colors.accent}; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${dept}</span>`
            ).join('')}
            ${facility.departments.length > 4 ? `<span style="background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 12px; font-size: 11px;">+${facility.departments.length - 4}</span>` : ''}
          </div>
        </div>
        ` : ''}
      `;
    }
    
    return `
      <div style="padding: 0; min-width: 320px; max-width: 420px; font-family: system-ui, sans-serif;">
        <!-- Заголовок -->
        <div style="padding: 16px; background: ${iconConfig.color}; color: white; margin: 0;">
          <div style="display: flex; align-items: center; justify-content: between;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; line-height: 1.2;">
                ${iconConfig.symbol} ${facility.name}
              </h3>
              <div style="font-size: 12px; opacity: 0.9;">${iconConfig.name}</div>
              ${facility.rating ? `
              <div style="margin-top: 6px; font-size: 14px;">
                ${renderStars(facility.rating)} <span style="font-size: 12px; opacity: 0.9;">(${facility.rating})</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Основная информация -->
        <div style="padding: 16px; background: white;">
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 2px;">АДРЕС</div>
            <div style="font-size: 14px; color: #374151; font-weight: 500;">${facility.address || 'Не указан'}</div>
          </div>
          
          ${specificStats}
          
          <!-- Бюджет, покрытие и радиус доступности -->
          ${facility.statistics ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 12px 0; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">БЮДЖЕТ/ГОД</div>
              <div style="font-size: 13px; color: #374151; font-weight: bold;">${facility.statistics?.yearlyBudget ? (facility.statistics.yearlyBudget / 1000000).toFixed(1) + 'М' : 'Не указан'}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">ПОКРЫТИЕ</div>
              <div style="font-size: 13px; color: #374151; font-weight: bold;">${facility.statistics?.coverageArea ? facility.statistics.coverageArea.toFixed(1) + ' км²' : 'Не указано'}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">РАДИУС (30м)</div>
              <div style="font-size: 13px; color: ${iconConfig.color}; font-weight: bold;">${(calculateCoverageRadius(30, facility.type) / 1000).toFixed(1)} км</div>
            </div>
          </div>
          ` : ''}
          
          <!-- Информация об обновлении -->
          <div style="margin: 8px 0; padding: 6px; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; text-align: center;">
            📊 Данные обновлены: ${facility.lastUpdate || 'Недавно'} | Тренд: ${facility.trendValue || 0}% за месяц
          </div>
          
          <!-- Кнопки действий -->
          <div style="display: flex; gap: 6px; margin-top: 12px;">
            <button 
              onclick="console.log('Кнопка Подробности нажата для ID:', '${facility.id}'); if(window.showFacilityDetails) { window.showFacilityDetails('${facility.id}'); } else { alert('Функция не найдена'); }"
              style="flex: 1; background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='#059669'"
              onmouseout="this.style.background='#10b981'"
            >
              📊 Подробности
            </button>
            <button 
              onclick="console.log('Кнопка Радиус нажата для ID:', '${facility.id}'); if(window.toggleFacilityCoverage) { window.toggleFacilityCoverage('${facility.id}'); } else { alert('Функция не найдена'); }"
              style="flex: 1; background: ${iconConfig.color}; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.opacity='0.8'"
              onmouseout="this.style.opacity='1'"
              id="coverage-btn-${facility.id}"
            >
              🎯 Радиус
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Создание попапа для рекомендации
  const createRecommendationPopup = (recommendation) => {
    const score = Math.round((recommendation.score || 0.85) * 100);
    const config = getFacilityIconConfig(recommendation.type);
    const priorityColors = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#10b981'
    };
    const priorityLabels = {
      high: 'Критический',
      medium: 'Средний',
      low: 'Низкий'
    };
    
    // Специальная обработка для провальных зон школ
    if (recommendation.recommendation_type === 'gap_zone' && recommendation.type === 'school_gap') {
      return `
        <div style="padding: 0; min-width: 320px; max-width: 400px; font-family: system-ui, sans-serif;">
          <!-- Заголовок для новых школ -->
          <div style="padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🏫</span>
                <div>
                  <h3 style="margin: 0; font-size: 16px; font-weight: bold; line-height: 1.2;">
                    Новая школа №${recommendation.facility_number || ''}
                  </h3>
                  <div style="font-size: 11px; opacity: 0.9;">${recommendation.district || 'Район не указан'}</div>
                </div>
              </div>
              <div style="background: ${priorityColors[recommendation.priority || 'high']}; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">
                ${priorityLabels[recommendation.priority || 'high']}
              </div>
            </div>
          </div>
          
          <!-- Основная информация для новой школы -->
          <div style="padding: 12px; background: white;">
            <div style="margin-bottom: 12px; padding: 8px; background: #ecfdf5; border-radius: 6px; border-left: 3px solid #10b981;">
              <div style="font-size: 11px; color: #059669; font-weight: 600; margin-bottom: 3px;">РАЙОН И ПОЗИЦИЯ:</div>
              <div style="font-size: 12px; color: #047857; font-weight: 600; line-height: 1.3;">
                ${recommendation.description || `Школа ${recommendation.district_facility_number || 1} из ${recommendation.district_facilities_needed || 1} в ${recommendation.district || 'районе'}`}
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
              <div style="background: #fef3c7; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #92400e; font-weight: 600;">ПРИОРИТЕТ В РАЙОНЕ</div>
                <div style="font-size: 14px; color: #78350f; font-weight: bold;">
                  ${recommendation.district_facility_number || 1} из ${recommendation.district_facilities_needed || 1}
                </div>
                <div style="font-size: 9px; color: #451a03;">школ района</div>
              </div>
              <div style="background: #ecfdf5; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #059669; font-weight: 600;">ОБЩИЙ ПЛАН</div>
                <div style="font-size: 14px; color: #047857; font-weight: bold;">
                  ${recommendation.facility_number || 1} из ${recommendation.total_needed || 1}
                </div>
                <div style="font-size: 9px; color: #065f46;">всего школ</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
              <div style="background: #ddd6fe; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #6d28d9; font-weight: 600;">ОХВАТ</div>
                <div style="font-size: 14px; color: #5b21b6; font-weight: bold;">
                  ${recommendation.estimated_capacity || 300}
                </div>
                <div style="font-size: 9px; color: #4c1d95;">учеников</div>
              </div>
              <div style="background: #fed7d7; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #c53030; font-weight: 600;">РАЙОН</div>
                <div style="font-size: 11px; color: #9c2929; font-weight: bold; line-height: 1;">
                  ${recommendation.district ? recommendation.district.replace(' район', '').replace(', город Бишкек, Киргизия', '') : 'Не указан'}
                </div>
                <div style="font-size: 9px; color: #742a2a;">район</div>
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОБОСНОВАНИЕ:</div>
              <div style="font-size: 12px; color: #374151; line-height: 1.4;">
                Анализ показал необходимость строительства школы в ${recommendation.district || 'данном районе'} для обеспечения оптимального покрытия образовательными услугами
              </div>
            </div>
            
            <!-- Дополнительная информация -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
              <div style="font-size: 10px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">📊 АНАЛИЗ ЛОКАЦИИ:</div>
              
              <div style="display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 8px;">
                <div style="background: #ecfdf5; padding: 4px; border-radius: 3px;">
                  <div style="font-size: 9px; color: #059669; font-weight: 600;">СТАТУС ПРОЕКТА</div>
                  <div style="font-size: 10px; color: #047857;">
                    ${recommendation.priority === 'high' ? 'Первоочередная - срочная реализация' :
                      recommendation.priority === 'medium' ? 'Среднесрочная - планирование в течение 2-3 лет' :
                      'Долгосрочная - перспективное развитие'}
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 8px;">
                <div style="font-size: 10px; color: #059669; font-weight: 600; margin-bottom: 4px;">✅ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:</div>
                <div style="font-size: 10px; color: #047857; line-height: 1.3;">
                  • Улучшение доступности образования в ${recommendation.district || 'районе'}<br>
                  • Снижение нагрузки на существующие школы<br>
                  • Развитие инфраструктуры района
                </div>
              </div>
            </div>
            
            <!-- Кнопка действия -->
            <div style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              <button 
                onclick="console.log('Анализ рекомендации новой школы в районе:', '${recommendation.district}', 'школа №${recommendation.facility_number}');"
                style="width: 100%; background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                📋 План строительства в ${recommendation.district ? recommendation.district.replace(' район', '').replace(', город Бишкек, Киргизия', '') : 'районе'}
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    // Специальная обработка для провальных зон клиник
    if (recommendation.recommendation_type === 'gap_zone' && recommendation.type === 'clinic_gap') {
      return `
        <div style="padding: 0; min-width: 320px; max-width: 400px; font-family: system-ui, sans-serif;">
          <!-- Заголовок для новых клиник -->
          <div style="padding: 12px; background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">⚕️</span>
                <div>
                  <h3 style="margin: 0; font-size: 16px; font-weight: bold; line-height: 1.2;">
                    Новая клиника №${recommendation.facility_number || ''}
                  </h3>
                  <div style="font-size: 11px; opacity: 0.9;">${recommendation.district ? recommendation.district.replace(', город Бишкек, Киргизия', '') : 'Район не указан'}</div>
                </div>
              </div>
              <div style="background: ${priorityColors[recommendation.priority || 'high']}; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">
                ${priorityLabels[recommendation.priority || 'high']}
              </div>
            </div>
          </div>
          
          <!-- Основная информация для новой клиники -->
          <div style="padding: 12px; background: white;">
            <div style="margin-bottom: 12px; padding: 8px; background: #f3e8ff; border-radius: 6px; border-left: 3px solid #7c3aed;">
              <div style="font-size: 11px; color: #6d28d9; font-weight: 600; margin-bottom: 3px;">РАЙОН И ПОЗИЦИЯ:</div>
              <div style="font-size: 12px; color: #5b21b6; font-weight: 600; line-height: 1.3;">
                ${recommendation.description || `Клиника ${recommendation.district_facility_number || 1} из ${recommendation.district_facilities_needed || 1} в ${recommendation.district || 'районе'}`}
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
              <div style="background: #fef3c7; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #92400e; font-weight: 600;">ПРИОРИТЕТ В РАЙОНЕ</div>
                <div style="font-size: 14px; color: #78350f; font-weight: bold;">
                  ${recommendation.district_facility_number || 1} из ${recommendation.district_facilities_needed || 1}
                </div>
                <div style="font-size: 9px; color: #451a03;">клиник района</div>
              </div>
              <div style="background: #f3e8ff; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #7c3aed; font-weight: 600;">ОБЩИЙ ПЛАН</div>
                <div style="font-size: 14px; color: #5b21b6; font-weight: bold;">
                  ${recommendation.facility_number || 1} из ${recommendation.total_needed || 1}
                </div>
                <div style="font-size: 9px; color: #4c1d95;">всего клиник</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
              <div style="background: #ddd6fe; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #6d28d9; font-weight: 600;">ОХВАТ</div>
                <div style="font-size: 14px; color: #5b21b6; font-weight: bold;">
                  ${recommendation.estimated_capacity || 200}
                </div>
                <div style="font-size: 9px; color: #4c1d95;">пациентов/день</div>
              </div>
              <div style="background: #fed7d7; padding: 6px; border-radius: 4px; text-align: center;">
                <div style="font-size: 10px; color: #c53030; font-weight: 600;">РАЙОН</div>
                <div style="font-size: 11px; color: #9c2929; font-weight: bold; line-height: 1;">
                  ${recommendation.district ? recommendation.district.replace(' район', '').replace(', город Бишкек, Киргизия', '') : 'Не указан'}
                </div>
                <div style="font-size: 9px; color: #742a2a;">район</div>
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОБОСНОВАНИЕ:</div>
              <div style="font-size: 12px; color: #374151; line-height: 1.4;">
                Анализ показал необходимость размещения клиники в ${recommendation.district || 'данном районе'} для улучшения доступности медицинских услуг
              </div>
            </div>
            
            <!-- Дополнительная информация -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
              <div style="font-size: 10px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">📊 АНАЛИЗ ЛОКАЦИИ:</div>
              
              <div style="display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 8px;">
                <div style="background: #f3e8ff; padding: 4px; border-radius: 3px;">
                  <div style="font-size: 9px; color: #7c3aed; font-weight: 600;">СТАТУС ПРОЕКТА</div>
                  <div style="font-size: 10px; color: #5b21b6;">
                    ${recommendation.priority === 'high' ? 'Первоочередная - срочная реализация' :
                      recommendation.priority === 'medium' ? 'Среднесрочная - планирование в течение 2-3 лет' :
                      'Долгосрочная - перспективное развитие'}
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 8px;">
                <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">✅ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:</div>
                <div style="font-size: 10px; color: #5b21b6; line-height: 1.3;">
                  • Улучшение доступности медицинских услуг в ${recommendation.district || 'районе'}<br>
                  • Снижение нагрузки на существующие медицинские учреждения<br>
                  • Повышение качества медицинского обслуживания населения
                </div>
              </div>
            </div>
            
            <!-- Кнопка действия -->
            <div style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              <button 
                onclick="console.log('Анализ рекомендации новой клиники в районе:', '${recommendation.district}', 'клиника №${recommendation.facility_number}');"
                style="width: 100%; background: #7c3aed; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                📋 План размещения в ${recommendation.district ? recommendation.district.replace(' район', '').replace(', город Бишкек, Киргизия', '') : 'районе'}
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    // Стандартная обработка для обычных рекомендаций
    return `
      <div style="padding: 0; min-width: 300px; max-width: 380px; font-family: system-ui, sans-serif;">
        <!-- Заголовок -->
        <div style="padding: 12px; background: ${config.color}; color: white; margin: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${config.symbol}</span>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: bold; line-height: 1.2;">
                  Рекомендация
                </h3>
                <div style="font-size: 11px; opacity: 0.9;">${config.name}</div>
              </div>
            </div>
            <div style="background: ${priorityColors[recommendation.priority || 'medium']}; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">
              ${priorityLabels[recommendation.priority || 'medium']}
            </div>
          </div>
        </div>
        
        <!-- Основная информация -->
        <div style="padding: 12px; background: white;">
          ${recommendation.recommendation ? `
          <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid ${config.color};">
            <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 3px;">ПРЕДЛОЖЕНИЕ:</div>
            <div style="font-size: 12px; color: #374151; font-weight: 600; line-height: 1.3;">${recommendation.recommendation}</div>
          </div>
          ` : ''}
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
            <div style="background: #ecfdf5; padding: 6px; border-radius: 4px; text-align: center;">
              <div style="font-size: 10px; color: #059669; font-weight: 600;">ОХВАТ</div>
              <div style="font-size: 14px; color: #047857; font-weight: bold;">${(recommendation.estimated_coverage || 15000).toLocaleString()}</div>
              <div style="font-size: 9px; color: #065f46;">чел.</div>
            </div>
            <div style="background: #eff6ff; padding: 6px; border-radius: 4px; text-align: center;">
              <div style="font-size: 10px; color: #2563eb; font-weight: 600;">ЭФФЕКТ</div>
              <div style="font-size: 14px; color: #1e40af; font-weight: bold;">${score}%</div>
              <div style="font-size: 9px; color: #1e3a8a;">оценка</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОБОСНОВАНИЕ:</div>
            <div style="font-size: 12px; color: #374151; line-height: 1.4;">${recommendation.reason || 'Анализ показал необходимость размещения объекта'}</div>
          </div>
          
          <!-- Ключевые метрики -->
          ${recommendation.detailedAnalysis ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
            <div style="font-size: 10px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">📊 КЛЮЧЕВЫЕ ДАННЫЕ:</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
              <div style="background: #fef3c7; padding: 4px; border-radius: 3px;">
                <div style="font-size: 9px; color: #92400e; font-weight: 600;">ПЛОТНОСТЬ</div>
                <div style="font-size: 10px; color: #78350f;">${recommendation.detailedAnalysis.populationDensity}</div>
              </div>
              <div style="background: #fde2e8; padding: 4px; border-radius: 3px;">
                <div style="font-size: 9px; color: #be185d; font-weight: 600;">БЛИЖАЙШИЙ</div>
                <div style="font-size: 10px; color: #9d174d;">${
                  recommendation.detailedAnalysis.nearestSchool || 
                  recommendation.detailedAnalysis.nearestHospital || 
                  recommendation.detailedAnalysis.nearestPolyclinic ||
                  recommendation.detailedAnalysis.nearestClinic ||
                  recommendation.detailedAnalysis.nearestFireStation ||
                  recommendation.detailedAnalysis.nearestPoliceStation ||
                  recommendation.detailedAnalysis.nearestPostOffice ||
                  'Нет данных'
                }</div>
              </div>
            </div>
            
            ${recommendation.detailedAnalysis.benefits && recommendation.detailedAnalysis.benefits.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 10px; color: #059669; font-weight: 600; margin-bottom: 4px;">✅ ГЛАВНЫЕ ПРЕИМУЩЕСТВА:</div>
              <div style="font-size: 10px; color: #047857; line-height: 1.3;">
                • ${recommendation.detailedAnalysis.benefits.slice(0, 2).join('<br>• ')}
                ${recommendation.detailedAnalysis.benefits.length > 2 ? '<br>• И другие...' : ''}
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <!-- Кнопка действия -->
          <div style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <button 
              onclick="console.log('Подробный анализ рекомендации:', '${recommendation.id}'); if(window.showDetailedPlacementAnalysis) { window.showDetailedPlacementAnalysis(${JSON.stringify(recommendation.detailedAnalysis)}); } else { console.error('showDetailedPlacementAnalysis не найдена'); }"
              style="width: 100%; background: ${config.color}; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.opacity='0.8'"
              onmouseout="this.style.opacity='1'"
            >
              📊 Подробный анализ размещения
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Создание модального окна подробного анализа
  const createDetailedAnalysisModal = (analysis) => {
    const config = getFacilityIconConfig(analysis.type || 'school');

    return `
      <div style="
        background: white;
        border-radius: 16px;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: slideIn 0.3s ease-out;
      ">
        <!-- Header -->
        <div style="
          background: ${config.color};
          color: white;
          padding: 20px 24px;
          border-radius: 16px 16px 0 0;
          position: relative;
          overflow: hidden;
        ">
          <div style="position: relative; z-index: 2;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h2 style="margin: 0; font-size: 20px; font-weight: bold;">
                  ${config.symbol} Детальный анализ размещения
                </h2>
                <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">
                  Комплексная оценка локации для ${config.name.toLowerCase()}
                </p>
            </div>
            <button 
              onclick="this.closest('[style*=\"position: fixed\"]').remove()"
              style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                  border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                "
              >×</button>
          </div>
          </div>
          <div style="
            position: absolute;
            top: -50%;
            right: -20%;
            width: 200px;
            height: 200px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
          "></div>
        </div>

        <div style="padding: 24px;">
          <!-- Краткая сводка -->
          <div style="
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border-left: 4px solid ${config.color};
          ">
            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">
              📋 Резюме анализа
            </h3>
            <p style="margin: 0; color: #4b5563; line-height: 1.6; font-size: 14px;">
              ${analysis.recommendation || 'Рекомендуется размещение объекта в данной локации на основе комплексного анализа демографических, экономических и инфраструктурных факторов.'}
            </p>
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 16px;
              margin-top: 16px;
            ">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: ${config.color};">
                  ${Math.round((analysis.score || 0.85) * 100)}%
                </div>
                <div style="font-size: 12px; color: #6b7280;">Общая оценка</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">
                  ${analysis.estimated_coverage?.toLocaleString() || 'Не указано'}
                </div>
                <div style="font-size: 12px; color: #6b7280;">Охват населения</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">
                  ${analysis.priority === 'high' ? 'Высокий' : analysis.priority === 'medium' ? 'Средний' : 'Низкий'}
                </div>
                <div style="font-size: 12px; color: #6b7280;">Приоритет</div>
              </div>
            </div>
          </div>

          <!-- Основные разделы анализа -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            <!-- Демографический анализ -->
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; display: flex; align-items: center;">
              👥 Демографический анализ
            </h3>
              
              <div style="space-y: 12px;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Плотность населения: ${analysis.population_density || 'Не указано'} чел/км²
                  </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Целевая аудитория: ${analysis.target_audience || 'Общая популяция'}
                  </div>
                  </div>
                </div>
              </div>
              
            <!-- Инфраструктурный анализ -->
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; display: flex; align-items: center;">
                🏗️ Инфраструктура
              </h3>
              
              <div style="space-y: 12px;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Транспортная доступность: ${analysis.transport_access || 'Оценивается'}
                  </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Ближайшие объекты: ${analysis.nearby_facilities || 'Анализируется'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Итоговые рекомендации -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">
              ✅ Итоговые рекомендации
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.6;">
              <li>Размещение объекта в данной локации экономически обосновано</li>
              <li>Высокий уровень транспортной доступности обеспечит хороший трафик</li>
              <li>Демографические показатели соответствуют целевой аудитории</li>
              <li>Рекомендуется учесть особенности местной инфраструктуры при проектировании</li>
              <li>Необходимо провести дополнительную экологическую экспертизу</li>
            </ul>
          </div>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;
  };

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Компактная интерактивная статистика */}
      <div className={`absolute bottom-4 right-4 backdrop-blur-md rounded-xl shadow-xl border p-3 z-[1000] transition-all duration-300 transform hover:scale-105 ${
        showFullLegend ? 'max-w-80' : 'max-w-60'
      } ${
        darkMode 
          ? 'bg-gray-900/95 border-gray-700 text-white' 
          : 'bg-white/95 border-gray-200 text-gray-900'
      }`}>
        {/* Компактный заголовок */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-600/20' : 'bg-blue-50'}`}>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs">📊</span>
              </div>
            </div>
            <div>
              <h4 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Статистика
              </h4>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center space-x-1`}>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>{facilities.length} объектов</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowFullLegend(!showFullLegend)}
            className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title={showFullLegend ? "Свернуть" : "Развернуть"}
          >
            <div className={`transform transition-transform duration-300 ${showFullLegend ? 'rotate-180' : ''}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>
        
        {showFullLegend ? (
          // Компактная полная статистика
          <div className="space-y-2 animate-fadeIn">
            {/* Основные категории - более компактные */}
            <div className="space-y-1.5">
              {[
                { type: 'school', name: 'Школы', icon: '🏫', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
                { type: 'hospital', name: 'Больницы', icon: '🏥', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700' },
                { type: 'polyclinic', name: 'Поликлиники', icon: '🏨', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
                { type: 'clinic', name: 'Клиники', icon: '⚕️', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
                { type: 'fire_station', name: 'Пожарные', icon: '🚒', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
                { type: 'police_station', name: 'Полиция', icon: '🚔', color: 'from-gray-600 to-gray-700', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
                { type: 'post_office', name: 'Почта', icon: '📮', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700' }
              ].map((category) => {
                const count = facilities.filter(f => f.type === category.type).length;
                const percentage = facilities.length > 0 ? (count / facilities.length) * 100 : 0;
                
                return (
                  <div 
                    key={category.type}
                    className={`relative overflow-hidden rounded-lg p-2 transition-all duration-300 hover:scale-102 cursor-pointer ${
                      darkMode ? 'bg-gray-800/50 hover:bg-gray-800/70' : `${category.bgColor} hover:shadow-sm`
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center shadow-sm`}>
                          <span className="text-white text-sm">{category.icon}</span>
                        </div>
                        <div>
                          <div className={`text-xs font-semibold ${darkMode ? 'text-white' : category.textColor}`}>
                            {category.name}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {percentage.toFixed(1)}% от общего
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${darkMode ? 'text-white' : category.textColor}`}>
                          {count}
                        </div>
                      </div>
                    </div>
                    
                    {/* Мини прогресс-бар */}
                    <div className={`mt-1 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-white/50'}`}>
                      <div 
                        className={`h-full bg-gradient-to-r ${category.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Рекомендации - компактно */}
            {recommendations && recommendations.length > 0 && (
              <div className={`rounded-lg p-2 border border-dashed transition-all duration-300 hover:scale-102 ${
                darkMode 
                  ? 'border-purple-600/50 bg-purple-900/20' 
                  : 'border-purple-300 bg-purple-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-sm animate-pulse">
                      <span className="text-white text-sm">⭐</span>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        Рекомендации
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-lg font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    {recommendations.length}
                  </div>
                </div>
              </div>
            )}
            
            {/* Компактная аналитика */}
            <div className={`rounded-lg p-2 ${
              darkMode ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50' : 'bg-gradient-to-r from-gray-50 to-gray-100'
            }`}>
              <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                📈 Аналитика
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className={`font-bold text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.round(facilities.reduce((sum, f) => sum + (f.rating || 4.2), 0) / facilities.length * 20)}%
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Качество</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {facilities.length > 0 ? Math.round(facilities.length / 10 * 100) : 0}%
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Покрытие</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Ультра-компактная версия
          <div className="animate-fadeIn">
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'school', icon: '🏫', color: 'from-emerald-500 to-emerald-600' },
                { type: 'hospital', icon: '🏥', color: 'from-red-500 to-red-600' },
                { type: 'polyclinic', icon: '🏨', color: 'from-blue-500 to-blue-600' },
                { type: 'clinic', icon: '⚕️', color: 'from-purple-500 to-purple-600' },
                { type: 'fire_station', icon: '🚒', color: 'from-orange-500 to-orange-600' },
                { type: 'police_station', icon: '🚔', color: 'from-gray-600 to-gray-700' }
              ].map((category) => {
                const count = facilities.filter(f => f.type === category.type).length;
                
                return (
                  <div 
                    key={category.type}
                    className="text-center group cursor-pointer"
                    onClick={() => setShowFullLegend(true)}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mx-auto mb-1 shadow-sm transform transition-all duration-300 group-hover:scale-110`}>
                      <span className="text-white text-sm">{category.icon}</span>
                    </div>
                    <div className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Мини-индикатор для развертывания */}
            <div className={`mt-2 text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center space-x-1">
                <span>Подробнее</span>
                <svg className="w-2 h-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* Индикатор выбранного объекта - компактный */}
        {selectedFacilityId && (
          <div className={`border-t pt-2 mt-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-orange-400 animate-ping opacity-75"></div>
                </div>
                <span className={`text-xs font-medium truncate max-w-24 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                  {facilities.find(f => f.id === selectedFacilityId)?.name || 'Выбран'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedFacilityId(null)}
                className={`p-0.5 rounded transition-all duration-200 hover:scale-110 ${
                  darkMode 
                    ? 'text-red-400 hover:bg-red-900/20' 
                    : 'text-red-500 hover:bg-red-50'
                }`}
                title="Скрыть радиус"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap; 