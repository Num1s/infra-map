import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
// Временно используем прямое подключение для отладки
const API_BASE_URL = 'http://localhost:8000/api/v1';

console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Добавляем поддержку CORS
  withCredentials: false,
  // Следуем редиректам
  maxRedirects: 5,
  // Принудительно используем HTTP для предотвращения HTTPS проблем
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Принимаем 3xx коды как успешные
  }
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.code === 'ERR_NETWORK') {
      console.error('Ошибка сети: Проверьте подключение к серверу', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Получить список школ
  async getSchools() {
    try {
      console.log('Запрашиваем школы с API...');
      console.log('Полный URL:', `${API_BASE_URL}/get-schools/`);
      
      const response = await api.get('/get-schools/');
      console.log('Ответ API успешен:', response.status);
      console.log('Заголовки ответа:', response.headers);
      console.log('Данные от API:', response.data);
      
      return this.parseDistrictsData(response.data, 'school');
    } catch (error) {
      console.error('Ошибка загрузки школ:', error);
      throw new Error(`Ошибка загрузки школ: ${error.message}`);
    }
  },

  // Получить список клиник и больниц
  async getClinics() {
    try {
      console.log('Запрашиваем клиники с API...');
      console.log('Полный URL:', `${API_BASE_URL}/get-clinics/`);
      
      const response = await api.get('/get-clinics/');
      console.log('Ответ API успешен:', response.status);
      console.log('Заголовки ответа:', response.headers);
      console.log('Данные от API:', response.data);
      
      return this.parseDistrictsData(response.data, 'clinic'); // Будем определять тип позже
    } catch (error) {
      console.error('Ошибка загрузки клиник:', error);
      throw new Error(`Ошибка загрузки клиник: ${error.message}`);
    }
  },

  // Универсальная функция для парсинга данных районов
  parseDistrictsData(data, defaultType) {
    let facilitiesData = data;
    
    console.log('Тип данных от API:', typeof facilitiesData);
    console.log('facilitiesData:', facilitiesData);
    console.log('facilitiesData.districts:', facilitiesData?.districts);
    console.log('Тип districts:', typeof facilitiesData?.districts);
    
    // Если данные в объекте с полями total_count и districts
    if (facilitiesData && typeof facilitiesData === 'object' && !Array.isArray(facilitiesData)) {
      if (facilitiesData.districts && typeof facilitiesData.districts === 'object') {
        // Если данные организованы по районам
        console.log('Обрабатываем districts...');
        const districtsData = facilitiesData.districts; // Сохраняем ссылку на districts
        facilitiesData = []; // Теперь безопасно переопределяем facilitiesData
        
        try {
          Object.entries(districtsData).forEach(([districtName, district]) => {
            console.log('Обрабатываем район:', districtName, district);
            if (district && district.coordinates && Array.isArray(district.coordinates)) {
              // Каждое учреждение в координатах имеет lat, lon, name
              district.coordinates.forEach((facility, facilityIndex) => {
                console.log(`Учреждение ${facilityIndex} в районе ${districtName}:`, facility);
                
                // Определяем тип учреждения на основе названия
                let facilityType = defaultType;
                if (facility.name) {
                  const name = facility.name.toLowerCase();
                  if (name.includes('больниц') || name.includes('hospital')) {
                    facilityType = 'hospital';
                  } else if (name.includes('поликлиник') || name.includes('polyclinic')) {
                    facilityType = 'polyclinic';
                  } else if (name.includes('клиник') || name.includes('clinic')) {
                    facilityType = 'clinic';
                  } else if (name.includes('школ') || name.includes('school')) {
                    facilityType = 'school';
                  }
                }
                
                facilitiesData.push({
                  ...facility,
                  type: facilityType,
                  district: districtName, // Добавляем название района
                  district_count: district.count // Добавляем количество учреждений в районе
                });
              });
            } else {
              console.warn('Район не содержит coordinates или coordinates не массив:', districtName, district);
            }
          });
        } catch (error) {
          console.error('Ошибка при обработке districts:', error);
          console.error('districtsData:', districtsData);
        }
      }
    }
    
    if (!Array.isArray(facilitiesData)) {
      console.error('API вернуло не массив после обработки:', typeof facilitiesData, facilitiesData);
      console.log('Попробуем использовать пустой массив для начала');
      facilitiesData = [];
    }
    
    return this.processAndTransformData(facilitiesData);
  },

  // Обработка и трансформация данных в нужный формат
  processAndTransformData(facilitiesData) {
    const facilities = facilitiesData.map((facility, index) => {
      console.log(`Обрабатываем учреждение ${index}:`, facility);
      
      // Определяем координаты
      let coordinates = null;
      if (facility.coordinates) {
        coordinates = facility.coordinates;
        console.log(`Координаты из facility.coordinates:`, coordinates);
      } else if (facility.lat !== undefined && facility.lon !== undefined) {
        // Проверяем, что это валидные числа
        const lat = parseFloat(facility.lat);
        const lon = parseFloat(facility.lon);
        
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          coordinates = [lat, lon];
          console.log(`Координаты из lat/lon: lat=${facility.lat}, lon=${facility.lon} -> [${coordinates}]`);
        } else {
          console.warn(`Некорректные lat/lon для учреждения ${index}: lat=${facility.lat}, lon=${facility.lon}`);
        }
      } else if (facility.latitude !== undefined && facility.longitude !== undefined) {
        const lat = parseFloat(facility.latitude);
        const lon = parseFloat(facility.longitude);
        
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          coordinates = [lat, lon];
          console.log(`Координаты из latitude/longitude:`, coordinates);
        } else {
          console.warn(`Некорректные latitude/longitude для учреждения ${index}: lat=${facility.latitude}, lon=${facility.longitude}`);
        }
      } else if (facility.location && facility.location.coordinates) {
        coordinates = facility.location.coordinates;
        console.log(`Координаты из location.coordinates:`, coordinates);
      }
      
      // Если координаты не найдены или некорректные, используем координаты Бишкека
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
        coordinates = [42.8746, 74.5698]; // Центр Бишкека
        console.warn(`Нет валидных координат для учреждения ${index} (${facility.name}), используем центр Бишкека:`, coordinates);
      }
      
      // Финальная проверка координат
      console.log(`Финальные координаты для учреждения ${index} (${facility.name}):`, coordinates);
      
      const processedFacility = {
        id: facility.id || facility.facility_id || `facility_${index}`,
        name: facility.name || facility.facility_name || facility.title || 'Учреждение без названия',
        type: facility.type || 'clinic', // По умолчанию клиника
        coordinates: coordinates,
        address: facility.address || facility.location || facility.addr || facility.full_address || '',
        capacity: facility.capacity || facility.patient_count || facility.max_patients || facility.total_capacity || 100,
        currentLoad: facility.current_load || facility.current_patients || facility.patients || facility.enrolled || 0,
        rating: facility.rating || facility.score || 4.0,
        // Дополнительные поля если есть
        district: facility.district || facility.region || facility.area || '',
        phone: facility.phone || facility.telephone || facility.contact_phone || '',
        website: facility.website || facility.url || facility.site || '',
        established: facility.established || facility.founded || facility.year_opened || null,
        services: facility.services || facility.specializations || facility.departments || [],
        // Специфичные поля для медицинских учреждений
        departments: facility.departments || facility.services || [],
        doctors: facility.doctors || facility.staff_count || 0,
        beds: facility.beds || facility.bed_count || 0,
        workingHours: facility.working_hours || facility.schedule || 'Круглосуточно'
      };
      
      console.log(`Обработанное учреждение ${index}:`, {
        id: processedFacility.id,
        name: processedFacility.name,
        type: processedFacility.type,
        coordinates: processedFacility.coordinates,
        district: processedFacility.district
      });
      
      return processedFacility;
    });
    
    console.log(`Обработано учреждений: ${facilities.length}`);
    console.log('Обработанные учреждения:', facilities.slice(0, 3)); // Показываем первые 3 для проверки
    return facilities;
  },

  // Получить все учреждения
  async getFacilities() {
    try {
      console.log('🏢 ЗАПРОС УЧРЕЖДЕНИЙ:');
      console.log('Запрашиваем школы и клиники...');
      console.log('🔧 КОНФИГУРАЦИЯ API:');
      console.log('  - API_BASE_URL:', API_BASE_URL);
      console.log('  - NODE_ENV:', process.env.NODE_ENV);
      console.log('  - Полный URL школ:', `${API_BASE_URL}/get-schools/`);
      console.log('  - Полный URL клиник:', `${API_BASE_URL}/get-clinics/`);

      // Получаем школы
      console.log('📡 Запрос школ...');
      const schoolsResponse = await api.get('/get-schools/');
      console.log('📊 Ответ школ:');
      console.log('  - Status:', schoolsResponse.status);
      console.log('  - StatusText:', schoolsResponse.statusText);
      console.log('  - Headers:', schoolsResponse.headers);
      
      const schoolsData = schoolsResponse.data;
      console.log('📊 Полученные данные школ:');
      console.log('  - Тип данных:', typeof schoolsData);
      console.log('  - Структура:', schoolsData);

      // Получаем клиники
      console.log('📡 Запрос клиник...');
      const clinicsResponse = await api.get('/get-clinics/');
      console.log('📊 Ответ клиник:');
      console.log('  - Status:', clinicsResponse.status);
      console.log('  - StatusText:', clinicsResponse.statusText);
      console.log('  - Headers:', clinicsResponse.headers);
      
      const clinicsData = clinicsResponse.data;
      console.log('📊 Полученные данные клиник:');
      console.log('  - Тип данных:', typeof clinicsData);
      console.log('  - Структура:', clinicsData);

      // Преобразуем данные школ
      const schools = [];
      if (schoolsData && schoolsData.districts) {
        console.log('🏫 Обрабатываем районы школ:', Object.keys(schoolsData.districts));
        Object.entries(schoolsData.districts).forEach(([district, info]) => {
          console.log(`📍 Район ${district}: ${info.count} школ, координат: ${info.coordinates?.length}`);
          if (info.coordinates && Array.isArray(info.coordinates)) {
            info.coordinates.forEach((school, index) => {
              const schoolObj = {
                id: `school_${district}_${index}`,
                name: school.name || `Школа ${index + 1}`,
                type: 'school',
                coordinates: [school.lat, school.lon],
                address: district,
                district: district,
                // Дополнительные поля для школ
                capacity: Math.floor(Math.random() * 500) + 300, // 300-800
                currentStudents: Math.floor(Math.random() * 400) + 200, // 200-600
                teachers: Math.floor(Math.random() * 30) + 15, // 15-45
                rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
                languages: ['Кыргызский', 'Русский'],
                statistics: {
                  attendanceRate: Math.floor(Math.random() * 20) + 80, // 80-100%
                  passRate: Math.floor(Math.random() * 30) + 70, // 70-100%
                  yearlyBudget: Math.floor(Math.random() * 5000000) + 2000000,
                  coverageArea: Math.random() * 2 + 1
                },
                lastUpdate: 'Недавно',
                trendValue: Math.floor(Math.random() * 10) - 5 // -5 до +5
              };
              schools.push(schoolObj);
              console.log(`✅ Школа добавлена: ${schoolObj.name} [${schoolObj.coordinates[0]}, ${schoolObj.coordinates[1]}]`);
            });
          }
        });
      }

      // Преобразуем данные клиник
      const clinics = [];
      if (clinicsData && clinicsData.districts) {
        console.log('🏥 Обрабатываем районы клиник:', Object.keys(clinicsData.districts));
        Object.entries(clinicsData.districts).forEach(([district, info]) => {
          console.log(`📍 Район ${district}: ${info.count} клиник, координат: ${info.coordinates?.length}`);
          if (info.coordinates && Array.isArray(info.coordinates)) {
            info.coordinates.forEach((clinic, index) => {
              // Определяем тип медицинского учреждения по названию
              const name = clinic.name || `Клиника ${index + 1}`;
              let facilityType = 'clinic'; // по умолчанию
              
              if (name.toLowerCase().includes('больница') || name.toLowerCase().includes('hospital')) {
                facilityType = 'hospital';
              } else if (name.toLowerCase().includes('поликлиника')) {
                facilityType = 'polyclinic';
              }

              const clinicObj = {
                id: `${facilityType}_${district}_${index}`,
                name: name,
                type: facilityType,
                coordinates: [clinic.lat, clinic.lon],
                address: district,
                district: district,
                // Дополнительные поля для медицинских учреждений
                capacity: Math.floor(Math.random() * 200) + 100, // 100-300
                currentLoad: Math.floor(Math.random() * 150) + 50, // 50-200
                doctors: Math.floor(Math.random() * 20) + 5, // 5-25
                rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
                departments: facilityType === 'hospital' ? 
                  ['Терапия', 'Хирургия', 'Педиатрия', 'Кардиология'] :
                  ['Терапия', 'Стоматология', 'Офтальмология'],
                workingHours: facilityType === 'hospital' ? 'Круглосуточно' : '8:00-18:00',
                beds: facilityType === 'hospital' ? Math.floor(Math.random() * 100) + 50 : 0,
                statistics: {
                  yearlyBudget: Math.floor(Math.random() * 10000000) + 5000000,
                  coverageArea: Math.random() * 3 + 2
                },
                lastUpdate: 'Недавно',
                trendValue: Math.floor(Math.random() * 10) - 5 // -5 до +5
              };
              clinics.push(clinicObj);
              console.log(`✅ ${facilityType} добавлена: ${clinicObj.name} [${clinicObj.coordinates[0]}, ${clinicObj.coordinates[1]}]`);
            });
          }
        });
      }

      // Объединяем все учреждения
      const allFacilities = [...schools, ...clinics];
      console.log('📈 ИТОГОВАЯ СТАТИСТИКА:');
      console.log(`  - Всего школ: ${schools.length}`);
      console.log(`  - Всего клиник: ${clinics.length}`);
      console.log(`  - Больниц: ${clinics.filter(c => c.type === 'hospital').length}`);
      console.log(`  - Поликлиник: ${clinics.filter(c => c.type === 'polyclinic').length}`);
      console.log(`  - Общих клиник: ${clinics.filter(c => c.type === 'clinic').length}`);
      console.log(`  - ИТОГО учреждений: ${allFacilities.length}`);
      
      console.log('✅ Данные учреждений обработаны и готовы для отображения');
      return allFacilities;

    } catch (error) {
      console.error('❌ Ошибка при получении учреждений:', error);
      throw error;
    }
  },

  // Получить данные тепловой карты населения
  async getPopulationHeatmap() {
    try {
      console.log('Запрашиваем данные населения...');
      // Попробуем получить данные с API, если такой эндпоинт есть
      try {
        const response = await api.get('/get-population-data/');
      return response.data;
      } catch (error) {
        // Если эндпоинта нет, возвращаем пустой массив или базовые данные
        console.warn('Эндпоинт для данных населения не найден, используем заглушку');
        return [];
      }
    } catch (error) {
      console.error('Ошибка загрузки данных населения:', error);
      return []; // Возвращаем пустой массив если ошибка
    }
  },

  // Получить оценку популяции по районам
  async getPopulationEstimate() {
    try {
      console.log('Запрашиваем оценку популяции по районам...');
      console.log('Полный URL:', `${API_BASE_URL}/estimate-population/`);
      
      const response = await api.get('/estimate-population/');
      console.log('Ответ API успешен:', response.status);
      console.log('Данные о популяции по районам:', response.data);
      
      // Обрабатываем данные для создания тепловой карты
      const populationData = this.processPopulationData(response.data);
      
      return {
        districts: response.data,
        heatmapData: populationData,
        totalPopulation: response.data.reduce((sum, district) => sum + district.estimated_population, 0),
        totalBuildings: response.data.reduce((sum, district) => sum + district.num_buildings, 0)
      };
    } catch (error) {
      console.error('Ошибка загрузки оценки популяции:', error);
      
      // В случае ошибки возвращаем пустые данные
      console.warn('Возвращаем пустые данные для плотности населения из-за ошибки API');
      return {
        districts: [],
        heatmapData: [],
        totalPopulation: 0,
        totalBuildings: 0
      };
    }
  },

  // Обработка данных популяции для тепловой карты
  processPopulationData(districtsData) {
    // Обновленные точные координаты центров районов Бишкека
    const districtCenters = {
      'Октябрьский район': { 
        lat: 42.8391489, 
        lon: 74.6141665, 
        bounds: [[42.82, 74.59], [42.86, 74.64]]
      },
      'Октябрьский': { 
        lat: 42.8391489, 
        lon: 74.6141665, 
        bounds: [[42.82, 74.59], [42.86, 74.64]]
      },
      'Свердловский район': { 
        lat: 42.8780000, 
        lon: 74.6050000, 
        bounds: [[42.86, 74.58], [42.90, 74.63]]
      },
      'Свердловский': { 
        lat: 42.8780000, 
        lon: 74.6050000, 
        bounds: [[42.86, 74.58], [42.90, 74.63]]
      },
      'Ленинский район': { 
        lat: 42.8590000, 
        lon: 74.5820000, 
        bounds: [[42.84, 74.56], [42.88, 74.61]]
      },
      'Ленинский': { 
        lat: 42.8590000, 
        lon: 74.5820000, 
        bounds: [[42.84, 74.56], [42.88, 74.61]]
      },
      'Первомайский район': { 
        lat: 42.8746000, 
        lon: 74.6122000, 
        bounds: [[42.85, 74.59], [42.90, 74.64]]
      },
      'Первомайский': { 
        lat: 42.8746000, 
        lon: 74.6122000, 
        bounds: [[42.85, 74.59], [42.90, 74.64]]
      }
    };

    const heatmapData = [];
    
    console.log('🏘️ Обрабатываем данные популяции районов:', districtsData);
    
    // Проверяем структуру данных
    if (!Array.isArray(districtsData) || districtsData.length === 0) {
      console.warn('⚠️ Данные районов пусты или неверного формата');
      return heatmapData;
    }
    
    // Находим максимальную популяцию для нормализации
    let maxPopulation = 0;
    districtsData.forEach(district => {
      // Поддерживаем разные форматы данных
      const population = district.estimated_population || district.population || district.pop || 0;
      if (population > maxPopulation) {
        maxPopulation = population;
      }
    });
    
    console.log('📊 Максимальная популяция для нормализации:', maxPopulation);
    
    districtsData.forEach((district, index) => {
      console.log(`🏘️ Обрабатываем район ${index + 1}:`, district);
      
      // Поддерживаем разные форматы названий районов
      const districtName = district.district || district.name || district.region;
      const population = district.estimated_population || district.population || district.pop || 0;
      
      console.log(`   Название: ${districtName}, Население: ${population}`);
      
      // Ищем координаты района (сначала по точному названию, потом по частичному)
      let center = districtCenters[districtName];
      if (!center && districtName) {
        // Пробуем найти по частичному совпадению
        const foundKey = Object.keys(districtCenters).find(key => 
          key.includes(districtName) || districtName.includes(key)
        );
        if (foundKey) {
          center = districtCenters[foundKey];
          console.log(`   Найдены координаты по частичному совпадению: ${foundKey}`);
        }
      }
      
      if (center && maxPopulation > 0) {
        // Рассчитываем интенсивность на основе популяции
        const intensity = population / maxPopulation;
        
        console.log(`   Координаты: lat=${center.lat}, lon=${center.lon}, интенсивность=${intensity}`);
        
        // Добавляем центральную точку района
        heatmapData.push([center.lat, center.lon, intensity]);
        
        // Добавляем дополнительные точки для создания области покрытия
        const bounds = center.bounds;
        const steps = 5; // Количество точек по каждой оси
        
        for (let i = 0; i < steps; i++) {
          for (let j = 0; j < steps; j++) {
            const lat = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (i / (steps - 1));
            const lon = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * (j / (steps - 1));
            
            // Уменьшаем интенсивность для краевых точек
            const edgeIntensity = intensity * (0.3 + 0.7 * Math.random());
            heatmapData.push([lat, lon, edgeIntensity]);
          }
        }
      } else {
        console.warn(`⚠️ Не найдены координаты для района "${districtName}" или нулевая популяция`);
      }
    });

    console.log('🔥 Обработанные данные для тепловой карты:', heatmapData.length, 'точек');
    return heatmapData;
  },

  // Получить рекомендации по размещению
  async getRecommendations(params) {
    try {
      console.log('🚀 ЗАПРОС РЕКОМЕНДАЦИЙ:');
      console.log('Запрашиваем рекомендации с параметрами:', params);
      
      let recommendations = [];
      let statistics = {
        total_facilities: 0,
        coverage_percentage: 0,
        average_distance: 0,
        recommendations_count: 0,
        gap_zones_count: 0
      };

      // Если запрашиваются рекомендации для школ или клиник, получаем провальные зоны
      if (params.facility_type === 'school' || params.facility_type === 'clinic') {
        try {
          console.log(`📍 Получаем провальные зоны для ${params.facility_type}...`);
          const gapData = await this.getGapZones(params.facility_type, true);
          
          console.log('📊 Получены данные провальных зон:', gapData);
          console.log(`🏫 Количество рекомендаций:`, gapData.gap_recommendations?.length);
          
          recommendations = gapData.gap_recommendations || [];
          statistics = {
            ...statistics,
            recommendations_count: recommendations.length,
            gap_zones_count: gapData.total_gaps || 0,
            total_facilities: recommendations.length,
            coverage_percentage: Math.max(0, 100 - (gapData.total_gaps * 2)), // Примерная оценка покрытия
            average_distance: recommendations.length > 0 
              ? Math.round(recommendations.reduce((sum, rec) => sum + rec.distance_to_nearest, 0) / recommendations.length)
              : 0
          };
          
          console.log(`✅ Получены рекомендации по провальным зонам ${params.facility_type}:`, recommendations.length);
          console.log('📈 Статистика:', statistics);
          
          const result = {
            recommendations,
            statistics
          };
          
          console.log('🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ getRecommendations:', result);
          
          return result;
        } catch (gapError) {
          console.warn(`❌ Ошибка получения провальных зон для ${params.facility_type}:`, gapError.message);
          console.error('❌ Детали ошибки:', gapError);
          // Возвращаем пустой результат если провальные зоны недоступны
          return {
            recommendations: [],
            statistics: {
              total_facilities: 0,
              coverage_percentage: 0,
              average_distance: 0,
              recommendations_count: 0,
              gap_zones_count: 0
            }
          };
        }
      }

      // Для других типов учреждений пока возвращаем пустой результат
      console.log(`Рекомендации для типа "${params.facility_type}" пока не реализованы`);
      return {
        recommendations: [],
        statistics: {
          total_facilities: 0,
          coverage_percentage: 0,
          average_distance: 0,
          recommendations_count: 0
        }
      };
    } catch (error) {
      console.error('Ошибка получения рекомендаций:', error);
      throw new Error('Ошибка получения рекомендаций: ' + error.message);
    }
  },

  // Получить статистику покрытия
  async getCoverageStats(facilityType, travelTime) {
    try {
      const response = await api.get('/coverage_stats/', {
        params: {
          facility_type: facilityType,
          max_travel_time: travelTime
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Ошибка получения статистики');
    }
  },

  // Экспорт рекомендаций
  async exportRecommendations(format = 'csv', data) {
    try {
      const response = await api.post('/export/', {
        format,
        data
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Ошибка экспорта данных');
    }
  },

  // Получить аналитику
  async getAnalytics(facilityType) {
    try {
      const response = await api.get(`/analytics/${facilityType}/`);
      return response.data;
    } catch (error) {
      throw new Error('Ошибка получения аналитики');
    }
  },

  // Получить провальные зоны для учреждений (школ или клиник)
  async getGapZones(facilityType = 'schools', userInitiated = false) {
    try {
      // Защита от автоматических вызовов - разрешаем только если это инициировано пользователем
      if (!userInitiated) {
        console.warn('🚫 ЗАБЛОКИРОВАН АВТОМАТИЧЕСКИЙ ЗАПРОС getGapZones:');
        console.warn(`  - facilityType: ${facilityType}`);
        console.warn(`  - userInitiated: ${userInitiated}`);
        console.warn('  - Запросы рекомендаций должны инициироваться только пользователем!');
        
        // Логируем stack trace чтобы понять откуда идет вызов
        console.warn('📍 STACK TRACE автоматического вызова:');
        console.trace();
        
        // Возвращаем пустой результат для автоматических вызовов
        return {
          total_gaps: 0,
          gap_recommendations: [],
          districts_data: {},
          districts_count: 0
        };
      }
      
      console.log('✅ АВТОРИЗОВАННЫЙ ЗАПРОС getGapZones (пользователь нажал кнопку)');
      
      // Поддерживаем разные типы учреждений
      const typeMap = {
        'school': 'schools',
        'schools': 'schools',
        'clinic': 'clinics',
        'clinics': 'clinics',
        'polyclinic': 'clinics',
        'hospital': 'clinics'
      };
      
      const apiType = typeMap[facilityType] || 'schools';
      
      console.log(`Запрашиваем координаты для новых ${apiType} с API...`);
      console.log('Полный URL:', `${API_BASE_URL}/find-gaps/?type=${apiType}`);
      
      const response = await api.get('/find-gaps/', {
        params: {
          type: apiType
        }
      });
      console.log('Ответ API успешен:', response.status);
      console.log(`Данные о новых ${apiType} по районам:`, response.data);
      
      // Извлекаем данные из поля result
      const rawData = response.data;
      const districtsData = rawData.result || rawData; // Берем из result или сами данные
      
      // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ для диагностики
      console.log('🔍 ДЕТАЛЬНЫЙ АНАЛИЗ ДАННЫХ:');
      console.log('Исходные данные:', rawData);
      console.log('Данные районов:', districtsData);
      console.log('Тип данных:', typeof districtsData);
      console.log('Является ли объектом:', typeof districtsData === 'object');
      console.log('Является ли массивом:', Array.isArray(districtsData));
      console.log('Ключи объекта:', Object.keys(districtsData || {}));
      
      // Проверяем структуру каждого района
      if (districtsData && typeof districtsData === 'object') {
        Object.entries(districtsData).forEach(([districtName, districtData]) => {
          console.log(`🏘️ Район "${districtName}":`, districtData);
          console.log(`  - new_needed:`, districtData?.new_needed);
          console.log(`  - new_coordinates:`, districtData?.new_coordinates);
          console.log(`  - Тип coordinates:`, typeof districtData?.new_coordinates);
          console.log(`  - Длина coordinates:`, districtData?.new_coordinates?.length);
        });
      }
      
      // Обрабатываем данные по районам
      const gapRecommendations = [];
      let totalFacilitiesNeeded = 0;
      let facilityCounter = 1; // Общий счетчик учреждений
      
      // Определяем конфигурацию типа учреждения
      const facilityConfig = {
        schools: {
          type: 'school_gap',
          name: 'школы',
          nameUnit: 'школа',
          icon: '🏫',
          estimatedCapacity: 300,
          priority: ['high', 'medium', 'low'],
          description: (districtIndex, districtSchoolsNeeded, districtName, facilityCounter) => 
            `Школа ${districtIndex + 1} из ${districtSchoolsNeeded} в ${districtName} (№${facilityCounter} общего плана)`
        },
        clinics: {
          type: 'clinic_gap',
          name: 'клиники',
          nameUnit: 'клиника',
          icon: '⚕️',
          estimatedCapacity: 200,
          priority: ['high', 'medium', 'low'],
          description: (districtIndex, districtClinicsNeeded, districtName, facilityCounter) => 
            `Клиника ${districtIndex + 1} из ${districtClinicsNeeded} в ${districtName} (№${facilityCounter} общего плана)`
        }
      };
      
      const config = facilityConfig[apiType] || facilityConfig.schools;
      
      // Проходим по каждому району
      Object.entries(districtsData).forEach(([districtName, districtData]) => {
        console.log(`🔄 Обрабатываем район: ${districtName}`);
        console.log(`📊 Данные района:`, districtData);
        
        // Обновляем поля под новую структуру API
        const new_facilities_needed = districtData.new_needed;
        const new_facility_coordinates = districtData.new_coordinates;
        
        console.log(`📍 Нужно ${config.name}: ${new_facilities_needed}`);
        console.log(`🗺️ Координаты:`, new_facility_coordinates);
        
        if (!new_facility_coordinates || !Array.isArray(new_facility_coordinates)) {
          console.warn(`⚠️ Некорректные координаты для района ${districtName}:`, new_facility_coordinates);
          return;
        }
        
        totalFacilitiesNeeded += new_facilities_needed;
        
        console.log(`Обрабатываем район: ${districtName}, нужно ${config.name}: ${new_facilities_needed}`);
        
        // Обрабатываем координаты учреждений для текущего района
        new_facility_coordinates.forEach((coords, districtIndex) => {
          console.log(`${config.icon} Обрабатываем ${config.nameUnit} ${districtIndex + 1} в районе ${districtName}:`, coords);
          
          const lat = parseFloat(coords.lat);
          const lon = parseFloat(coords.lon);
          
          console.log(`   Координаты: lat=${lat}, lon=${lon}`);
          
          if (isNaN(lat) || isNaN(lon)) {
            console.error(`❌ Некорректные координаты для ${config.nameUnit} ${districtIndex + 1} в районе ${districtName}: lat=${lat}, lon=${lon}`);
            return;
          }
          
          // Определяем приоритет на основе номера учреждения в районе
          let priority = 'high'; // По умолчанию высокий приоритет
          if (districtIndex % 3 === 0) priority = 'high';
          else if (districtIndex % 3 === 1) priority = 'medium';
          else priority = 'low';
          
          const recommendation = {
            id: `new_${apiType.slice(0, -1)}_${facilityCounter}`,
            coordinates: [lat, lon],
            type: config.type,
            priority: priority,
            reason: `Рекомендуемое место для новой ${config.nameUnit} в ${districtName}`,
            description: config.description(districtIndex, new_facilities_needed, districtName, facilityCounter),
            distance_to_nearest: 1000 + (districtIndex * 100), // Примерное расстояние
            estimated_capacity: Math.max(config.estimatedCapacity, Math.round(config.estimatedCapacity + (districtIndex * 50))), // Примерная оценка вместимости
            recommendation_type: 'gap_zone',
            facility_type: apiType.slice(0, -1), // убираем 's' в конце
            facility_number: facilityCounter,
            total_needed: totalFacilitiesNeeded, // Будет обновлено после обработки всех районов
            district: districtName,
            district_facility_number: districtIndex + 1,
            district_facilities_needed: new_facilities_needed
          };
          
          console.log(`✅ Создана рекомендация:`, recommendation);
          gapRecommendations.push(recommendation);
          
          facilityCounter++;
        });
      });
      
      // Обновляем общее количество для всех рекомендаций
      gapRecommendations.forEach(rec => {
        rec.total_needed = totalFacilitiesNeeded;
      });
      
      console.log(`🎯 ИТОГОВЫЕ РЕКОМЕНДАЦИИ ДЛЯ ${apiType.toUpperCase()}:`);
      console.log(`Обработанные рекомендации для новых ${config.name}:`, gapRecommendations);
      console.log(`Всего районов: ${Object.keys(districtsData).length}, всего ${config.name}: ${totalFacilitiesNeeded}`);
      console.log('Количество созданных рекомендаций:', gapRecommendations.length);
      
      const result = {
        total_gaps: totalFacilitiesNeeded,
        gap_recommendations: gapRecommendations,
        districts_data: districtsData, // Сохраняем исходные данные по районам
        districts_count: Object.keys(districtsData).length
      };
      
      console.log(`🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ getGapZones для ${apiType}:`, result);
      
      return result;
    } catch (error) {
      console.error(`Ошибка загрузки данных о новых ${facilityType}:`, error);
      throw new Error(`Ошибка загрузки данных о новых ${facilityType}: ${error.message}`);
    }
  }
}; 