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
  darkMode = false
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    facilities: null,
    recommendations: null,
    heatmap: null,
    coverage: null,
    individualCoverage: null
  });
  
  // Состояние для индивидуального показа радиуса
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  // Состояние для показа полной легенды
  const [showFullLegend, setShowFullLegend] = useState(false);

  // Устанавливаем глобальные функции для обработки кликов
  useEffect(() => {
    // Функция для показа деталей учреждения
    window.showFacilityDetails = (facilityId) => {
      console.log('showFacilityDetails вызвана для ID:', facilityId);
      try {
        const facility = facilities.find(f => f.id === parseInt(facilityId));
        if (facility && onShowFacilityDetails) {
          onShowFacilityDetails(facility);
        } else {
          console.warn('Учреждение не найдено или отсутствует обработчик:', facilityId);
        }
      } catch (error) {
        console.error('Ошибка в showFacilityDetails:', error);
      }
    };

    // Функция для переключения радиуса покрытия
    window.toggleFacilityCoverage = (facilityId) => {
      console.log('toggleFacilityCoverage вызвана для ID:', facilityId);
      try {
        const id = parseInt(facilityId);
        setSelectedFacilityId(prevId => {
          const newId = prevId === id ? null : id;
          console.log('Переключение радиуса:', prevId, '->', newId);
          return newId;
        });
      } catch (error) {
        console.error('Ошибка в toggleFacilityCoverage:', error);
      }
    };

    // Функция для подробного анализа размещения
    window.showDetailedPlacementAnalysis = (recommendationData) => {
      console.log('Подробный анализ размещения:', recommendationData);
      try {
        const analysis = typeof recommendationData === 'string' 
          ? JSON.parse(recommendationData) 
          : recommendationData;
        
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
        console.error('Ошибка в showDetailedPlacementAnalysis:', error);
        alert('Ошибка при открытии подробного анализа');
      }
    };

    // Отладочная информация
    console.log('Глобальные функции установлены. Facilities:', facilities.length, 'Selected ID:', selectedFacilityId);

    return () => {
      delete window.showFacilityDetails;
      delete window.toggleFacilityCoverage;
      delete window.showDetailedPlacementAnalysis;
    };
  }, [facilities, onShowFacilityDetails]); // Убрал selectedFacilityId из зависимостей!

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
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущие слои
    if (layersRef.current.facilities) {
      mapInstanceRef.current.removeLayer(layersRef.current.facilities);
    }
    if (layersRef.current.coverage) {
      mapInstanceRef.current.removeLayer(layersRef.current.coverage);
    }
    if (layersRef.current.individualCoverage) {
      mapInstanceRef.current.removeLayer(layersRef.current.individualCoverage);
    }

    if (activeLayers.facilities && facilities.length > 0) {
      const facilitiesLayer = L.layerGroup();
      const coverageLayer = L.layerGroup();

      // Фильтруем учреждения по выбранному типу
      const filteredFacilities = facilities.filter(facility => 
        selectedFacilityType === 'all' || facility.type === selectedFacilityType
      );

      filteredFacilities.forEach(facility => {
        try {
          // Проверяем валидность координат
          if (!facility.coordinates || !Array.isArray(facility.coordinates) || facility.coordinates.length < 2) {
            console.warn('Некорректные координаты для учреждения:', facility.name);
            return;
          }

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
        } catch (error) {
          console.error('Ошибка создания маркера для учреждения:', facility.name, error);
        }

        // Добавляем зону покрытия - мягкие круги
        if (showCoverageZones && activeLayers.facilities) {
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
        }
      });

      facilitiesLayer.addTo(mapInstanceRef.current);
      layersRef.current.facilities = facilitiesLayer;

      if (showCoverageZones) {
        coverageLayer.addTo(mapInstanceRef.current);
        layersRef.current.coverage = coverageLayer;
      }
    }
  }, [facilities, activeLayers.facilities, selectedFacilityType, maxTravelTime, showCoverageZones]);

  // Обработка индивидуального радиуса покрытия
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.log('Карта ещё не инициализирована');
      return;
    }

    console.log('Обновление индивидуального радиуса. selectedFacilityId:', selectedFacilityId);

    // Удаляем предыдущий индивидуальный радиус
    if (layersRef.current.individualCoverage) {
      mapInstanceRef.current.removeLayer(layersRef.current.individualCoverage);
      layersRef.current.individualCoverage = null;
      console.log('Предыдущий радиус удален');
    }

    if (selectedFacilityId) {
      const facility = facilities.find(f => f.id === selectedFacilityId);
      console.log('Найдено учреждение:', facility?.name);
      
      if (facility && facility.coordinates) {
        try {
          const individualCoverageLayer = L.layerGroup();
          const config = getFacilityIconConfig(facility.type);
          
          // Создаем более заметный индивидуальный радиус
          const radius = calculateCoverageRadius(maxTravelTime, facility.type);
          console.log('Радиус покрытия:', radius, 'метров для', facility.type);
          
          const coverageCircle = L.circle(facility.coordinates, {
            radius: radius,
            fillColor: config.color,
            fillOpacity: 0.2,
            color: config.color,
            weight: 3,
            opacity: 0.8,
            interactive: false,
            dashArray: '10, 5'
          });
          
          // Добавляем центральную точку с пульсацией
          const centerMarker = L.circleMarker(facility.coordinates, {
            radius: 8,
            fillColor: config.color,
            fillOpacity: 0.9,
            color: 'white',
            weight: 3,
            opacity: 1,
            className: 'individual-coverage-center'
          });
          
          // Добавляем стильную подпись
          const label = L.marker(facility.coordinates, {
            icon: L.divIcon({
              className: 'individual-coverage-label',
              html: `<div class="coverage-info-card">
                <div class="coverage-header">
                  <span class="coverage-icon">${config.symbol}</span>
                  <span class="coverage-title">${facility.name}</span>
                </div>
                <div class="coverage-stats">
                  <span class="coverage-distance">🎯 ${(radius/1000).toFixed(1)} км</span>
                  <span class="coverage-time">⏱️ ${maxTravelTime} мин</span>
                </div>
              </div>`,
              iconSize: [200, 60],
              iconAnchor: [100, 80]
            })
          });
          
          individualCoverageLayer.addLayer(coverageCircle);
          individualCoverageLayer.addLayer(centerMarker);
          individualCoverageLayer.addLayer(label);
          
          individualCoverageLayer.addTo(mapInstanceRef.current);
          layersRef.current.individualCoverage = individualCoverageLayer;
          
          // Центрируем карту на учреждении
          mapInstanceRef.current.setView(facility.coordinates, 14, { animate: true });
          
          console.log('Индивидуальный радиус создан для:', facility.name);
        } catch (error) {
          console.error('Ошибка создания индивидуального радиуса:', error);
        }
      }
    }
  }, [selectedFacilityId, facilities, maxTravelTime]);

  // Обновление слоя рекомендаций
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущий слой
    if (layersRef.current.recommendations) {
      mapInstanceRef.current.removeLayer(layersRef.current.recommendations);
      layersRef.current.recommendations = null;
    }

    if (activeLayers.recommendations && recommendations && recommendations.length > 0) {
      const recommendationsLayer = L.layerGroup();

      recommendations.forEach((rec, index) => {
        if (rec.coordinates && Array.isArray(rec.coordinates) && rec.coordinates.length >= 2) {
          const icon = createRecommendationIcon(rec);
          const marker = L.marker(rec.coordinates, { icon })
            .bindPopup(createRecommendationPopup(rec));
          
          recommendationsLayer.addLayer(marker);
        }
      });

      if (recommendationsLayer.getLayers().length > 0) {
        recommendationsLayer.addTo(mapInstanceRef.current);
        layersRef.current.recommendations = recommendationsLayer;
      }
    }
  }, [recommendations, activeLayers.recommendations, selectedFacilityType]);

  // Обновление тепловой карты
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущий слой
    if (layersRef.current.heatmap) {
      mapInstanceRef.current.removeLayer(layersRef.current.heatmap);
    }

    if (activeLayers.heatmap && populationData.length > 0) {
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
  }, [populationData, activeLayers.heatmap]);

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

    // Генерация случайных данных для демонстрации (в реальном приложении данные приходят с сервера)
    const generateAnalytics = (type) => {
      const baseData = {
        monthlyTrend: Math.random() > 0.5 ? 'up' : 'down',
        trendValue: (Math.random() * 20 + 5).toFixed(1),
        efficiency: (Math.random() * 30 + 70).toFixed(0),
        satisfaction: (Math.random() * 20 + 80).toFixed(0),
        utilization: (Math.random() * 40 + 60).toFixed(0),
        lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
      };
      
      if (type === 'school') {
        return {
          ...baseData,
          attendanceRate: (Math.random() * 10 + 85).toFixed(1),
          passRate: (Math.random() * 15 + 80).toFixed(1),
          teacherRatio: (Math.random() * 5 + 15).toFixed(1),
          digitalScore: (Math.random() * 30 + 70).toFixed(0)
        };
      } else if (type === 'hospital') {
        return {
          ...baseData,
          emergencyResponse: (Math.random() * 10 + 5).toFixed(1),
          bedOccupancy: (Math.random() * 20 + 75).toFixed(0),
          mortalityRate: (Math.random() * 2 + 1).toFixed(2),
          equipmentStatus: Math.random() > 0.3 ? 'operational' : 'maintenance'
        };
      } else if (type === 'fire_station') {
        return {
          ...baseData,
          responseTime: (Math.random() * 5 + 3).toFixed(1),
          successRate: (Math.random() * 10 + 85).toFixed(1),
          equipmentReady: (Math.random() * 15 + 85).toFixed(0),
          trainingHours: Math.floor(Math.random() * 20 + 40)
        };
      }
      return baseData;
    };

    const analytics = generateAnalytics(facility.type);

    // Специфичная статистика в зависимости от типа учреждения
    let specificStats = '';
    if (facility.type === 'school') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ПОСЕЩАЕМОСТЬ</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${analytics.attendanceRate}%</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '📈' : '📉'}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕВАЕМОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${analytics.passRate}%</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">⭐</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">УЧЕНИКОВ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.currentStudents || Math.floor(Math.random() * 500 + 200)}/${facility.capacity || Math.floor(Math.random() * 200 + 600)}</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">СООТНОШЕНИЕ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">1:${analytics.teacherRatio}</div>
          </div>
        </div>
        
        <!-- Дополнительная аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">📊 АНАЛИТИКА ЭФФЕКТИВНОСТИ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Цифровизация</div>
              <div style="font-size: 14px; color: #3b82f6; font-weight: bold;">${analytics.digitalScore}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Удовлетворенность</div>
              <div style="font-size: 14px; color: #10b981; font-weight: bold;">${analytics.satisfaction}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Загрузка</div>
              <div style="font-size: 14px; color: #f59e0b; font-weight: bold;">${analytics.utilization}%</div>
            </div>
          </div>
        </div>
        
        ${facility.languages ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ЯЗЫКИ ОБУЧЕНИЯ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.languages.map(lang => 
              `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${lang}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        ${facility.facilities ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОБЪЕКТЫ:</div>
          <div style="font-size: 12px; color: #4b5563;">${facility.facilities.join(', ')}</div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'hospital') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #fef2f2; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #dc2626; font-weight: 600;">ПАЦИЕНТОВ/МЕСЯЦ</div>
            <div style="font-size: 16px; color: #b91c1c; font-weight: bold;">${facility.statistics?.monthlyPatients?.toLocaleString() || Math.floor(Math.random() * 5000 + 2000).toLocaleString()}</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '📈' : '📉'}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕШНОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.successRate || analytics.efficiency}%</div>
          </div>
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${facility.statistics?.doctorsCount || Math.floor(Math.random() * 50 + 20)}</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ВРЕМЯ ОТКЛИКА</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${analytics.emergencyResponse} мин</div>
          </div>
        </div>
        
        <!-- Медицинская аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">🏥 МЕДИЦИНСКИЕ ПОКАЗАТЕЛИ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Загрузка коек</div>
              <div style="font-size: 14px; color: ${analytics.bedOccupancy > 85 ? '#dc2626' : '#10b981'}; font-weight: bold;">${analytics.bedOccupancy}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Летальность</div>
              <div style="font-size: 14px; color: ${analytics.mortalityRate > 2 ? '#dc2626' : '#10b981'}; font-weight: bold;">${analytics.mortalityRate}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Оборудование</div>
              <div style="font-size: 14px; color: ${analytics.equipmentStatus === 'operational' ? '#10b981' : '#f59e0b'}; font-weight: bold;">
                ${analytics.equipmentStatus === 'operational' ? '✅' : '⚠️'}
              </div>
            </div>
          </div>
        </div>
        
        ${facility.equipment ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОБОРУДОВАНИЕ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.equipment.map(eq => 
              `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${eq}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        ${facility.specialties ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">СПЕЦИАЛИЗАЦИИ:</div>
          <div style="font-size: 12px; color: #4b5563;">${facility.specialties.join(', ')}</div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'fire_station') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #fff7ed; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #ea580c; font-weight: 600;">ВЫЗОВОВ/МЕСЯЦ</div>
            <div style="font-size: 16px; color: #dc2626; font-weight: bold;">${facility.statistics?.monthlyCallouts || Math.floor(Math.random() * 200 + 50)}</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '🔥' : '✅'}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕШНОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${analytics.successRate}%</div>
          </div>
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ВРЕМЯ ОТКЛИКА</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${analytics.responseTime} мин</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">ПЕРСОНАЛ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.personnel || Math.floor(Math.random() * 30 + 15)}</div>
          </div>
        </div>
        
        <!-- Пожарная аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">🚒 ОПЕРАЦИОННЫЕ ПОКАЗАТЕЛИ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Готовность</div>
              <div style="font-size: 14px; color: ${analytics.equipmentReady > 90 ? '#10b981' : '#f59e0b'}; font-weight: bold;">${analytics.equipmentReady}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Обучение</div>
              <div style="font-size: 14px; color: #3b82f6; font-weight: bold;">${analytics.trainingHours}ч</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Эффективность</div>
              <div style="font-size: 14px; color: #10b981; font-weight: bold;">${analytics.efficiency}%</div>
            </div>
          </div>
        </div>
        
        ${facility.equipment ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">ОБОРУДОВАНИЕ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.equipment.map(eq => 
              `<span style="background: #fed7d7; color: #c53030; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${eq}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'polyclinic') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #eff6ff; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #2563eb; font-weight: 600;">ПАЦИЕНТОВ/ДЕНЬ</div>
            <div style="font-size: 16px; color: #1e40af; font-weight: bold;">${facility.statistics?.dailyPatients || Math.floor(Math.random() * 300 + 100)}</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '📈' : '📉'}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.doctorsCount || Math.floor(Math.random() * 25 + 10)}</div>
          </div>
          <div style="background: #fef3c7; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ВРЕМЯ ЗАПИСИ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.statistics?.appointmentTime || Math.floor(Math.random() * 10 + 1)} дн</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">КАБИНЕТОВ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.statistics?.offices || Math.floor(Math.random() * 20 + 5)}</div>
          </div>
        </div>
        
        <!-- Поликлиническая аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">🏥 ПОКАЗАТЕЛИ ОБСЛУЖИВАНИЯ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Загрузка</div>
              <div style="font-size: 14px; color: ${analytics.utilization > 85 ? '#dc2626' : '#10b981'}; font-weight: bold;">${analytics.utilization}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Удовлетворенность</div>
              <div style="font-size: 14px; color: #10b981; font-weight: bold;">${analytics.satisfaction}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Эффективность</div>
              <div style="font-size: 14px; color: #3b82f6; font-weight: bold;">${analytics.efficiency}%</div>
            </div>
          </div>
        </div>
        
        ${facility.specialties ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">СПЕЦИАЛИЗАЦИИ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.specialties.map(spec => 
              `<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${spec}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'clinic') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #7c3aed; font-weight: 600;">ПАЦИЕНТОВ/ДЕНЬ</div>
            <div style="font-size: 16px; color: #6d28d9; font-weight: bold;">${facility.statistics?.dailyPatients || Math.floor(Math.random() * 100 + 30)}</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '📈' : '📉'}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.doctorsCount || Math.floor(Math.random() * 10 + 3)}</div>
          </div>
        </div>
        
        <!-- Клиническая аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">🏥 КЛИНИЧЕСКИЕ ПОКАЗАТЕЛИ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Загрузка</div>
              <div style="font-size: 14px; color: ${analytics.utilization > 85 ? '#dc2626' : '#10b981'}; font-weight: bold;">${analytics.utilization}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Удовлетворенность</div>
              <div style="font-size: 14px; color: #10b981; font-weight: bold;">${analytics.satisfaction}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Эффективность</div>
              <div style="font-size: 14px; color: #7c3aed; font-weight: bold;">${analytics.efficiency}%</div>
            </div>
          </div>
        </div>
        
        ${facility.services ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">УСЛУГИ:</div>
          <div style="font-size: 12px; color: #4b5563;">${facility.services.join(', ')}</div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'police_station') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #f9fafb; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #1f2937; font-weight: 600;">ОБРАЩЕНИЙ/МЕСЯЦ</div>
            <div style="font-size: 16px; color: #111827; font-weight: bold;">${facility.statistics?.monthlyCalls || Math.floor(Math.random() * 500 + 200)}</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '⚠️' : '✅'}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРЕМЯ ОТКЛИКА</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${analytics.responseTime} мин</div>
          </div>
          <div style="background: #eff6ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #2563eb; font-weight: 600;">СОТРУДНИКОВ</div>
            <div style="font-size: 16px; color: #1e40af; font-weight: bold;">${facility.personnel || Math.floor(Math.random() * 50 + 20)}</div>
          </div>
          <div style="background: #fef3c7; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ПАТРУЛЬНЫХ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.statistics?.patrols || Math.floor(Math.random() * 10 + 5)}</div>
          </div>
        </div>
        
        <!-- Полицейская аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">👮 ПОКАЗАТЕЛИ БЕЗОПАСНОСТИ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Раскрываемость</div>
              <div style="font-size: 14px; color: #10b981; font-weight: bold;">${analytics.efficiency}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Удовлетворенность</div>
              <div style="font-size: 14px; color: #3b82f6; font-weight: bold;">${analytics.satisfaction}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Загрузка</div>
              <div style="font-size: 14px; color: ${analytics.utilization > 85 ? '#dc2626' : '#10b981'}; font-weight: bold;">${analytics.utilization}%</div>
            </div>
          </div>
        </div>
        
        ${facility.services ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">УСЛУГИ:</div>
          <div style="font-size: 12px; color: #4b5563;">${facility.services.join(', ')}</div>
        </div>
        ` : ''}
      `;
    } else if (facility.type === 'post_office') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #ecfdf5; padding: 8px; border-radius: 6px; text-align: center; position: relative;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ОТПРАВЛЕНИЙ/ДЕНЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.dailyPackages || Math.floor(Math.random() * 200 + 50)}</div>
            <div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">
              ${analytics.monthlyTrend === 'up' ? '📈' : '📉'}
            </div>
          </div>
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #2563eb; font-weight: 600;">ВРЕМЯ ОБСЛУЖИВАНИЯ</div>
            <div style="font-size: 16px; color: #1e40af; font-weight: bold;">${facility.statistics?.serviceTime || Math.floor(Math.random() * 10 + 5)} мин</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">СОТРУДНИКОВ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.personnel || Math.floor(Math.random() * 10 + 3)}</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">ПОЧТ. ЯЩИКОВ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.statistics?.postBoxes || Math.floor(Math.random() * 50 + 10)}</div>
          </div>
        </div>
        
        <!-- Почтовая аналитика -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">📮 ПОЧТОВЫЕ ПОКАЗАТЕЛИ</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Загрузка</div>
              <div style="font-size: 14px; color: ${analytics.utilization > 85 ? '#dc2626' : '#10b981'}; font-weight: bold;">${analytics.utilization}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Удовлетворенность</div>
              <div style="font-size: 14px; color: #10b981; font-weight: bold;">${analytics.satisfaction}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #6b7280;">Эффективность</div>
              <div style="font-size: 14px; color: #059669; font-weight: bold;">${analytics.efficiency}%</div>
            </div>
          </div>
        </div>
        
        ${facility.services ? `
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">УСЛУГИ:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facility.services.map(service => 
              `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${service}</span>`
            ).join('')}
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
          ${facility.statistics || analytics ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 12px 0; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">БЮДЖЕТ/ГОД</div>
              <div style="font-size: 13px; color: #374151; font-weight: bold;">${((facility.statistics?.yearlyBudget || Math.random() * 50000000 + 10000000) / 1000000).toFixed(1)}М</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">ПОКРЫТИЕ</div>
              <div style="font-size: 13px; color: #374151; font-weight: bold;">${facility.statistics?.coverageArea || (Math.random() * 10 + 5).toFixed(1)} км²</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">РАДИУС (30м)</div>
              <div style="font-size: 13px; color: ${iconConfig.color}; font-weight: bold;">${(calculateCoverageRadius(30, facility.type) / 1000).toFixed(1)} км</div>
            </div>
          </div>
          ` : ''}
          
          <!-- Информация об обновлении -->
          <div style="margin: 8px 0; padding: 6px; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; text-align: center;">
            📊 Данные обновлены: ${analytics.lastUpdate} | Тренд: ${analytics.trendValue}% за месяц
          </div>
          
          <!-- Кнопки действий -->
          <div style="display: flex; gap: 6px; margin-top: 12px;">
            <button 
              onclick="console.log('Кнопка Подробности нажата:', ${facility.id}); if(window.showFacilityDetails) { window.showFacilityDetails(${facility.id}); } else { console.error('showFacilityDetails не найдена'); }"
              style="flex: 1; background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='#059669'"
              onmouseout="this.style.background='#10b981'"
            >
              📊 Подробности
            </button>
            <button 
              onclick="console.log('Кнопка Радиус нажата:', ${facility.id}); if(window.toggleFacilityCoverage) { window.toggleFacilityCoverage(${facility.id}); } else { console.error('toggleFacilityCoverage не найдена'); }"
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
    const config = getFacilityIconConfig(analysis.type);
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

    // Генерируем подробные данные для анализа
    const detailedData = {
      populationAnalysis: {
        totalPopulation: Math.floor(Math.random() * 50000) + 20000,
        targetDemographic: Math.floor(Math.random() * 15000) + 5000,
        growthRate: (Math.random() * 5 + 1).toFixed(1),
        density: Math.floor(Math.random() * 5000) + 1000
      },
      competitorAnalysis: {
        nearestDistance: (Math.random() * 3 + 0.5).toFixed(1),
        competitorCapacity: Math.floor(Math.random() * 1000) + 500,
        marketSaturation: Math.floor(Math.random() * 40) + 30
      },
      infrastructureAnalysis: {
        transportAccess: Math.floor(Math.random() * 30) + 70,
        roadQuality: Math.floor(Math.random() * 20) + 75,
        parkingAvailability: Math.floor(Math.random() * 40) + 50,
        publicTransport: Math.floor(Math.random() * 25) + 65
      },
      economicAnalysis: {
        constructionCost: Math.floor(Math.random() * 50000000) + 20000000,
        operationalCostYear: Math.floor(Math.random() * 5000000) + 2000000,
        roi: (Math.random() * 15 + 5).toFixed(1),
        paybackPeriod: Math.floor(Math.random() * 5) + 3
      },
      riskAnalysis: {
        environmental: Math.floor(Math.random() * 30) + 10,
        regulatory: Math.floor(Math.random() * 25) + 15,
        financial: Math.floor(Math.random() * 35) + 20,
        operational: Math.floor(Math.random() * 20) + 10
      }
    };

    return `
      <div style="
        background: white;
        border-radius: 16px;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.4s ease-out;
        font-family: system-ui, sans-serif;
      ">
        <!-- Заголовок -->
        <div style="
          padding: 20px;
          background: linear-gradient(135deg, ${config.color}, ${config.color}dd);
          color: white;
          border-radius: 16px 16px 0 0;
          position: relative;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 32px;">${config.symbol}</span>
              <div>
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">
                  Подробный анализ размещения
                </h2>
                <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
                  ${config.name} • Приоритет: ${priorityLabels[analysis.priority || 'medium']}
                </div>
              </div>
            </div>
            <button 
              onclick="this.closest('[style*=\"position: fixed\"]').remove()"
              style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'"
              onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Основной контент -->
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
                <div style="font-size: 24px; font-weight: bold; color: #059669;">
                  ${(analysis.estimated_coverage || 15000).toLocaleString()}
                </div>
                <div style="font-size: 12px; color: #6b7280;">Охват населения</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">
                  ${detailedData.economicAnalysis.paybackPeriod}
                </div>
                <div style="font-size: 12px; color: #6b7280;">Лет окупаемости</div>
              </div>
            </div>
          </div>

          <!-- Анализ населения -->
          <div style="margin-bottom: 24px;">
            <h3 style="
              margin: 0 0 16px 0;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              👥 Демографический анализ
            </h3>
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 12px;
            ">
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border: 1px solid #d1fae5;">
                <div style="font-size: 14px; color: #059669; font-weight: 600; margin-bottom: 4px;">
                  Общее население района
                </div>
                <div style="font-size: 20px; color: #047857; font-weight: bold;">
                  ${detailedData.populationAnalysis.totalPopulation.toLocaleString()} чел.
                </div>
                <div style="font-size: 12px; color: #065f46; margin-top: 4px;">
                  Рост: +${detailedData.populationAnalysis.growthRate}% в год
                </div>
              </div>
              <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border: 1px solid #dbeafe;">
                <div style="font-size: 14px; color: #2563eb; font-weight: 600; margin-bottom: 4px;">
                  Целевая аудитория
                </div>
                <div style="font-size: 20px; color: #1e40af; font-weight: bold;">
                  ${detailedData.populationAnalysis.targetDemographic.toLocaleString()} чел.
                </div>
                <div style="font-size: 12px; color: #1e3a8a; margin-top: 4px;">
                  ${Math.round((detailedData.populationAnalysis.targetDemographic / detailedData.populationAnalysis.totalPopulation) * 100)}% от общего населения
                </div>
              </div>
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fed7aa;">
                <div style="font-size: 14px; color: #d97706; font-weight: 600; margin-bottom: 4px;">
                  Плотность населения
                </div>
                <div style="font-size: 20px; color: #b45309; font-weight: bold;">
                  ${detailedData.populationAnalysis.density.toLocaleString()}
                </div>
                <div style="font-size: 12px; color: #92400e; margin-top: 4px;">
                  чел/км²
                </div>
              </div>
            </div>
          </div>

          <!-- Конкурентный анализ -->
          <div style="margin-bottom: 24px;">
            <h3 style="
              margin: 0 0 16px 0;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              🏢 Конкурентный анализ
            </h3>
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 12px;
            ">
              <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border: 1px solid #fecaca;">
                <div style="font-size: 14px; color: #dc2626; font-weight: 600; margin-bottom: 4px;">
                  Ближайший конкурент
                </div>
                <div style="font-size: 20px; color: #b91c1c; font-weight: bold;">
                  ${detailedData.competitorAnalysis.nearestDistance} км
                </div>
                <div style="font-size: 12px; color: #991b1b; margin-top: 4px;">
                  Оптимальное расстояние
                </div>
              </div>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; border: 1px solid #d1d5db;">
                <div style="font-size: 14px; color: #4b5563; font-weight: 600; margin-bottom: 4px;">
                  Загруженность рынка
                </div>
                <div style="font-size: 20px; color: #374151; font-weight: bold;">
                  ${detailedData.competitorAnalysis.marketSaturation}%
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                  ${detailedData.competitorAnalysis.marketSaturation < 60 ? 'Низкая конкуренция' : 'Высокая конкуренция'}
                </div>
              </div>
              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; border: 1px solid #bae6fd;">
                <div style="font-size: 14px; color: #0284c7; font-weight: 600; margin-bottom: 4px;">
                  Капацитет конкурентов
                </div>
                <div style="font-size: 20px; color: #0369a1; font-weight: bold;">
                  ${detailedData.competitorAnalysis.competitorCapacity.toLocaleString()}
                </div>
                <div style="font-size: 12px; color: #075985; margin-top: 4px;">
                  среднее значение
                </div>
              </div>
            </div>
          </div>

          <!-- Инфраструктурный анализ -->
          <div style="margin-bottom: 24px;">
            <h3 style="
              margin: 0 0 16px 0;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              🚗 Инфраструктурный анализ
            </h3>
            <div style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            ">
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Транспортная доступность: ${detailedData.infrastructureAnalysis.transportAccess}%
                  </div>
                  <div style="
                    background: #f3f4f6;
                    border-radius: 4px;
                    height: 8px;
                    overflow: hidden;
                  ">
                    <div style="
                      background: linear-gradient(90deg, #10b981, #059669);
                      height: 100%;
                      width: ${detailedData.infrastructureAnalysis.transportAccess}%;
                      transition: width 0.3s ease;
                    "></div>
                  </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Качество дорог: ${detailedData.infrastructureAnalysis.roadQuality}%
                  </div>
                  <div style="
                    background: #f3f4f6;
                    border-radius: 4px;
                    height: 8px;
                    overflow: hidden;
                  ">
                    <div style="
                      background: linear-gradient(90deg, #3b82f6, #2563eb);
                      height: 100%;
                      width: ${detailedData.infrastructureAnalysis.roadQuality}%;
                      transition: width 0.3s ease;
                    "></div>
                  </div>
                </div>
              </div>
              
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Наличие парковки: ${detailedData.infrastructureAnalysis.parkingAvailability}%
                  </div>
                  <div style="
                    background: #f3f4f6;
                    border-radius: 4px;
                    height: 8px;
                    overflow: hidden;
                  ">
                    <div style="
                      background: linear-gradient(90deg, #f59e0b, #d97706);
                      height: 100%;
                      width: ${detailedData.infrastructureAnalysis.parkingAvailability}%;
                      transition: width 0.3s ease;
                    "></div>
                  </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
                    Общественный транспорт: ${detailedData.infrastructureAnalysis.publicTransport}%
                  </div>
                  <div style="
                    background: #f3f4f6;
                    border-radius: 4px;
                    height: 8px;
                    overflow: hidden;
                  ">
                    <div style="
                      background: linear-gradient(90deg, #8b5cf6, #7c3aed);
                      height: 100%;
                      width: ${detailedData.infrastructureAnalysis.publicTransport}%;
                      transition: width 0.3s ease;
                    "></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Экономический анализ -->
          <div style="margin-bottom: 24px;">
            <h3 style="
              margin: 0 0 16px 0;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              💰 Экономический анализ
            </h3>
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 12px;
            ">
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fed7aa;">
                <div style="font-size: 14px; color: #d97706; font-weight: 600; margin-bottom: 4px;">
                  Стоимость строительства
                </div>
                <div style="font-size: 18px; color: #b45309; font-weight: bold;">
                  ${(detailedData.economicAnalysis.constructionCost / 1000000).toFixed(1)}М ₽
                </div>
                <div style="font-size: 12px; color: #92400e; margin-top: 4px;">
                  включая инфраструктуру
                </div>
              </div>
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border: 1px solid #d1fae5;">
                <div style="font-size: 14px; color: #059669; font-weight: 600; margin-bottom: 4px;">
                  Операционные расходы
                </div>
                <div style="font-size: 18px; color: #047857; font-weight: bold;">
                  ${(detailedData.economicAnalysis.operationalCostYear / 1000000).toFixed(1)}М ₽/год
                </div>
                <div style="font-size: 12px; color: #065f46; margin-top: 4px;">
                  включая персонал
                </div>
              </div>
              <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border: 1px solid #dbeafe;">
                <div style="font-size: 14px; color: #2563eb; font-weight: 600; margin-bottom: 4px;">
                  ROI (окупаемость)
                </div>
                <div style="font-size: 18px; color: #1e40af; font-weight: bold;">
                  ${detailedData.economicAnalysis.roi}%
                </div>
                <div style="font-size: 12px; color: #1e3a8a; margin-top: 4px;">
                  в год
                </div>
              </div>
            </div>
          </div>

          <!-- Анализ рисков -->
          <div style="margin-bottom: 24px;">
            <h3 style="
              margin: 0 0 16px 0;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              ⚠️ Анализ рисков
            </h3>
            <div style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            ">
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 12px;">
                  Экологические риски: ${detailedData.riskAnalysis.environmental}%
                </div>
                <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 12px;">
                  Регулятивные риски: ${detailedData.riskAnalysis.regulatory}%
                </div>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 12px;">
                  Финансовые риски: ${detailedData.riskAnalysis.financial}%
                </div>
                <div style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 12px;">
                  Операционные риски: ${detailedData.riskAnalysis.operational}%
                </div>
              </div>
            </div>
          </div>

          <!-- Рекомендации -->
          <div style="
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid ${config.color};
          ">
            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">
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