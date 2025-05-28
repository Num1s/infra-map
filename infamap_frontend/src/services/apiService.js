import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
// В development используем proxy, в production - прямое подключение
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://192.168.1.93:8000/api/v1'
  : '/api/v1'; // Используем proxy в development

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

  // Получить список учреждений (школ и клиник вместе)
  async getFacilities(type = null) {
    try {
      console.log('Начинаем загрузку всех учреждений...');
      
      const [schools, clinics] = await Promise.all([
        this.getSchools().catch(error => {
          console.warn('Ошибка загрузки школ:', error.message);
          return [];
        }),
        this.getClinics().catch(error => {
          console.warn('Ошибка загрузки клиник:', error.message);
          return [];
        })
      ]);
      
      console.log(`Загружено школ: ${schools.length}, клиник: ${clinics.length}`);
      
      // Объединяем все учреждения
      let allFacilities = [...schools, ...clinics];
      
      // Фильтруем по типу если указан
      if (type && type !== 'all') {
        allFacilities = allFacilities.filter(facility => facility.type === type);
        console.log(`После фильтрации по типу "${type}": ${allFacilities.length} учреждений`);
      }
      
      console.log(`Итого учреждений: ${allFacilities.length}`);
      return allFacilities;
    } catch (error) {
      console.error('Детали ошибки загрузки учреждений:');
      console.error('- Тип ошибки:', error.constructor.name);
      console.error('- Сообщение:', error.message);
      console.error('- Полная ошибка:', error);
      
      throw new Error(`Ошибка загрузки учреждений: ${error.message}`);
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

  // Получить рекомендации по размещению
  async getRecommendations(params) {
    try {
      console.log('Запрашиваем рекомендации с параметрами:', params);
      // Попробуем получить рекомендации с API
      try {
        const response = await api.post('/get-recommendations/', params);
      return response.data;
      } catch (error) {
        // Если эндпоинта нет, возвращаем базовые рекомендации
        console.warn('Эндпоинт для рекомендаций не найден, используем заглушку');
        return {
          recommendations: [],
          statistics: {
            total_facilities: 0,
            coverage_percentage: 0,
            average_distance: 0,
            recommendations_count: 0
          }
        };
      }
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
  }
}; 