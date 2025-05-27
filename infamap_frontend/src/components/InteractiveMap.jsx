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
const calculateCoverageRadius = (travelTimeMinutes, facilityType) => {
  const speeds = {
    school: 3, // км/ч - пешком (более реалистично)
    hospital: 25, // км/ч - средняя скорость с учетом пробок
    polyclinic: 8, // км/ч - общественный транспорт/пешком
    clinic: 6, // км/ч - пешком/общественный транспорт
    fire_station: 30, // км/ч - пожарная машина с учетом городских условий
    police_station: 35, // км/ч - полицейская машина
    post_office: 4 // км/ч - пешком
  };
  
  const speed = speeds[facilityType] || 15;
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
  onShowFacilityDetails
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

    // Отладочная информация
    console.log('Глобальные функции установлены. Facilities:', facilities.length, 'Selected ID:', selectedFacilityId);

    return () => {
      delete window.showFacilityDetails;
      delete window.toggleFacilityCoverage;
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

    // Специфичная статистика в зависимости от типа учреждения
    let specificStats = '';
    if (facility.type === 'school') {
      specificStats = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ПОСЕЩАЕМОСТЬ</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${facility.statistics?.attendanceRate || 'N/A'}%</div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕВАЕМОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.passRate || 'N/A'}%</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">УЧЕНИКОВ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.currentStudents || 'N/A'}/${facility.capacity}</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">УЧИТЕЛЕЙ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.teachers || 'N/A'}</div>
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
          <div style="background: #fef2f2; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #dc2626; font-weight: 600;">ПАЦИЕНТОВ/МЕСЯЦ</div>
            <div style="font-size: 16px; color: #b91c1c; font-weight: bold;">${facility.statistics?.monthlyPatients?.toLocaleString() || 'N/A'}</div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕШНОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.successRate || 'N/A'}%</div>
          </div>
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${facility.statistics?.doctorsCount || 'N/A'}</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ВРЕМЯ ОТКЛИКА</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.statistics?.emergencyResponse || 'N/A'} мин</div>
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
          <div style="background: #fff7ed; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #ea580c; font-weight: 600;">ВЫЗОВОВ/МЕСЯЦ</div>
            <div style="font-size: 16px; color: #dc2626; font-weight: bold;">${facility.statistics?.monthlyCallouts || 'N/A'}</div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">УСПЕШНОСТЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.successRate || 'N/A'}%</div>
          </div>
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #0369a1; font-weight: 600;">ВРЕМЯ ОТКЛИКА</div>
            <div style="font-size: 16px; color: #0c4a6e; font-weight: bold;">${facility.statistics?.averageResponse || 'N/A'} мин</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">ПЕРСОНАЛ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.personnel || 'N/A'}</div>
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
          <div style="background: #eff6ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #2563eb; font-weight: 600;">ПАЦИЕНТОВ/ДЕНЬ</div>
            <div style="font-size: 16px; color: #1e40af; font-weight: bold;">${facility.statistics?.dailyPatients || 'N/A'}</div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.doctorsCount || 'N/A'}</div>
          </div>
          <div style="background: #fef3c7; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ВРЕМЯ ЗАПИСИ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.statistics?.appointmentTime || 'N/A'} дн</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">КАБИНЕТОВ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.statistics?.offices || 'N/A'}</div>
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
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #7c3aed; font-weight: 600;">ПАЦИЕНТОВ/ДЕНЬ</div>
            <div style="font-size: 16px; color: #6d28d9; font-weight: bold;">${facility.statistics?.dailyPatients || 'N/A'}</div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРАЧЕЙ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.doctorsCount || 'N/A'}</div>
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
          <div style="background: #f9fafb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #1f2937; font-weight: 600;">ОБРАЩЕНИЙ/МЕСЯЦ</div>
            <div style="font-size: 16px; color: #111827; font-weight: bold;">${facility.statistics?.monthlyCalls || 'N/A'}</div>
          </div>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ВРЕМЯ ОТКЛИКА</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.responseTime || 'N/A'} мин</div>
          </div>
          <div style="background: #eff6ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #2563eb; font-weight: 600;">СОТРУДНИКОВ</div>
            <div style="font-size: 16px; color: #1e40af; font-weight: bold;">${facility.personnel || 'N/A'}</div>
          </div>
          <div style="background: #fef3c7; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">ПАТРУЛЬНЫХ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.statistics?.patrols || 'N/A'}</div>
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
          <div style="background: #ecfdf5; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #059669; font-weight: 600;">ОТПРАВЛЕНИЙ/ДЕНЬ</div>
            <div style="font-size: 16px; color: #047857; font-weight: bold;">${facility.statistics?.dailyPackages || 'N/A'}</div>
          </div>
          <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #2563eb; font-weight: 600;">ВРЕМЯ ОБСЛУЖИВАНИЯ</div>
            <div style="font-size: 16px; color: #1e40af; font-weight: bold;">${facility.statistics?.serviceTime || 'N/A'} мин</div>
          </div>
          <div style="background: #fffbeb; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #d97706; font-weight: 600;">СОТРУДНИКОВ</div>
            <div style="font-size: 16px; color: #b45309; font-weight: bold;">${facility.personnel || 'N/A'}</div>
          </div>
          <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #be185d; font-weight: 600;">ПОЧТ. ЯЩИКОВ</div>
            <div style="font-size: 16px; color: #9d174d; font-weight: bold;">${facility.statistics?.postBoxes || 'N/A'}</div>
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
      <div style="padding: 0; min-width: 320px; max-width: 400px; font-family: system-ui, sans-serif;">
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
              <div style="font-size: 13px; color: #374151; font-weight: bold;">${(facility.statistics.yearlyBudget / 1000000).toFixed(1)}М</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">ПОКРЫТИЕ</div>
              <div style="font-size: 13px; color: #374151; font-weight: bold;">${facility.statistics.coverageArea || 'N/A'} км²</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 600;">РАДИУС (30м)</div>
              <div style="font-size: 13px; color: ${iconConfig.color}; font-weight: bold;">${(calculateCoverageRadius(30, facility.type) / 1000).toFixed(1)} км</div>
            </div>
          </div>
          ` : ''}
          
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
              onclick="console.log('Подробный анализ рекомендации:', '${recommendation.id}'); alert('Функция подробного анализа рекомендации будет добавлена в следующих версиях. ID: ${recommendation.id}');"
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

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Компактная мини-легенда */}
      <div className={`absolute bottom-4 right-4 backdrop-blur-sm rounded-xl shadow-lg border p-3 z-[1000] transition-all duration-300 ${
        showFullLegend ? 'max-w-80' : 'max-w-64'
      } bg-white/90 dark:bg-gray-800/90 dark:border-gray-600`}>
        <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200">Статистика</h4>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">всего: {facilities.length}</span>
            <button
              onClick={() => setShowFullLegend(!showFullLegend)}
              className="text-xs text-blue-500 hover:text-blue-700 font-bold"
              title={showFullLegend ? "Свернуть" : "Развернуть легенду"}
            >
              {showFullLegend ? '▼' : '◀'}
            </button>
          </div>
        </div>
        
        {showFullLegend ? (
          // Полная легенда
          <div className="space-y-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">🏫</div>
                <span>Школы ({facilities.filter(f => f.type === 'school').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white text-xs">🏥</div>
                <span>Больницы ({facilities.filter(f => f.type === 'hospital').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">🏨</div>
                <span>Поликлиники ({facilities.filter(f => f.type === 'polyclinic').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">⚕️</div>
                <span>Клиники ({facilities.filter(f => f.type === 'clinic').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs">🚒</div>
                <span>Пожарные ({facilities.filter(f => f.type === 'fire_station').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs">🚔</div>
                <span>Полиция ({facilities.filter(f => f.type === 'police_station').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">📮</div>
                <span>Почта ({facilities.filter(f => f.type === 'post_office').length})</span>
              </div>
              {recommendations && recommendations.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">⭐</div>
                  <span>Рекомендации ({recommendations.length})</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Компактная версия
          <div className="grid grid-cols-4 gap-1 text-xs">
            <div className="text-center">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs mx-auto mb-1">🏫</div>
              <div className="font-bold text-emerald-600">{facilities.filter(f => f.type === 'school').length}</div>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs mx-auto mb-1">🏥</div>
              <div className="font-bold text-red-600">{facilities.filter(f => f.type === 'hospital').length}</div>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mx-auto mb-1">🏨</div>
              <div className="font-bold text-blue-600">{facilities.filter(f => f.type === 'polyclinic').length}</div>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs mx-auto mb-1">🚒</div>
              <div className="font-bold text-orange-600">{facilities.filter(f => f.type === 'fire_station').length}</div>
            </div>
          </div>
        )}
        
        {selectedFacilityId && (
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full border border-orange-500 bg-orange-200 animate-pulse"></div>
                <span className="text-xs font-medium truncate">
                  {facilities.find(f => f.id === selectedFacilityId)?.name || 'неизвестно'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedFacilityId(null)}
                className="text-xs text-red-500 hover:text-red-700 font-bold ml-1"
                title="Скрыть радиус"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {!showFullLegend && recommendations && recommendations.length > 0 && (
          <div className="border-t pt-1 mt-1">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center text-white" style={{fontSize: '6px'}}>⭐</div>
              <span className="text-xs font-medium text-purple-600">Рекомендации: {recommendations.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap; 