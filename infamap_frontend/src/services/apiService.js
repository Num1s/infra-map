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
  // Получить список учреждений (школ)
  async getFacilities(type = null) {
    try {
      console.log('Запрашиваем школы с API...');
      console.log('Полный URL:', `${API_BASE_URL}/get-schools/`);
      
      const response = await api.get('/get-schools/');
      console.log('Ответ API успешен:', response.status);
      console.log('Заголовки ответа:', response.headers);
      console.log('Данные от API:', response.data);
      
      // Проверяем структуру ответа - может быть объект с total_count и данными
      let schoolsData = response.data;
      
      console.log('Тип данных от API:', typeof schoolsData);
      console.log('schoolsData:', schoolsData);
      console.log('schoolsData.districts:', schoolsData?.districts);
      console.log('Тип districts:', typeof schoolsData?.districts);
      
      // Если данные в объекте с полями total_count и districts/schools
      if (schoolsData && typeof schoolsData === 'object' && !Array.isArray(schoolsData)) {
        if (schoolsData.schools) {
          schoolsData = schoolsData.schools;
        } else if (schoolsData.districts && typeof schoolsData.districts === 'object') {
          // Если данные организованы по районам - это наш случай
          console.log('Обрабатываем districts...');
          const districtsData = schoolsData.districts; // Сохраняем ссылку на districts
          schoolsData = []; // Теперь безопасно переопределяем schoolsData
          
          try {
            Object.entries(districtsData).forEach(([districtName, district]) => {
              console.log('Обрабатываем район:', districtName, district);
              if (district && district.coordinates && Array.isArray(district.coordinates)) {
                // Каждая школа в координатах имеет lat, lon, name
                district.coordinates.forEach((school, schoolIndex) => {
                  console.log(`Школа ${schoolIndex} в районе ${districtName}:`, school);
                  schoolsData.push({
                    ...school,
                    district: districtName, // Добавляем название района
                    district_count: district.count // Добавляем количество школ в районе
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
        } else if (schoolsData.data && Array.isArray(schoolsData.data)) {
          schoolsData = schoolsData.data;
        }
      }
      
      if (!Array.isArray(schoolsData)) {
        console.error('API вернуло не массив после обработки:', typeof schoolsData, schoolsData);
        console.log('Попробуем использовать пустой массив для начала');
        schoolsData = [];
      }
      
      // Преобразуем данные в нужный формат для карты
      const schools = schoolsData.map((school, index) => {
        console.log(`Обрабатываем школу ${index}:`, school);
        
        // Определяем координаты
        let coordinates = null;
        if (school.coordinates) {
          coordinates = school.coordinates;
          console.log(`Координаты из school.coordinates:`, coordinates);
        } else if (school.lat !== undefined && school.lon !== undefined) {
          // Проверяем, что это валидные числа
          const lat = parseFloat(school.lat);
          const lon = parseFloat(school.lon);
          
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            coordinates = [lat, lon];
            console.log(`Координаты из lat/lon: lat=${school.lat}, lon=${school.lon} -> [${coordinates}]`);
          } else {
            console.warn(`Некорректные lat/lon для школы ${index}: lat=${school.lat}, lon=${school.lon}`);
          }
        } else if (school.latitude !== undefined && school.longitude !== undefined) {
          const lat = parseFloat(school.latitude);
          const lon = parseFloat(school.longitude);
          
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            coordinates = [lat, lon];
            console.log(`Координаты из latitude/longitude:`, coordinates);
          } else {
            console.warn(`Некорректные latitude/longitude для школы ${index}: lat=${school.latitude}, lon=${school.longitude}`);
          }
        } else if (school.location && school.location.coordinates) {
          coordinates = school.location.coordinates;
          console.log(`Координаты из location.coordinates:`, coordinates);
        }
        
        // Если координаты не найдены или некорректные, используем координаты Бишкека
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
          coordinates = [42.8746, 74.5698]; // Центр Бишкека
          console.warn(`Нет валидных координат для школы ${index} (${school.name}), используем центр Бишкека:`, coordinates);
        }
        
        // Финальная проверка координат
        console.log(`Финальные координаты для школы ${index} (${school.name}):`, coordinates);
        
        const processedSchool = {
          id: school.id || school.school_id || `school_${index}`,
          name: school.name || school.school_name || school.title || school.facility_name || 'Школа без названия',
          type: 'school',
          coordinates: coordinates,
          address: school.address || school.location || school.addr || school.full_address || '',
          capacity: school.capacity || school.student_count || school.max_students || school.total_capacity || 500,
          currentLoad: school.current_load || school.current_students || school.students || school.enrolled || 0,
          rating: school.rating || school.score || 4.0,
          // Дополнительные поля если есть
          district: school.district || school.region || school.area || '',
          phone: school.phone || school.telephone || school.contact_phone || '',
          website: school.website || school.url || school.site || '',
          established: school.established || school.founded || school.year_opened || null,
          languages: school.languages || school.study_languages || [],
          specializations: school.specializations || school.programs || school.subjects || []
        };
        
        console.log(`Обработанная школа ${index}:`, {
          id: processedSchool.id,
          name: processedSchool.name,
          coordinates: processedSchool.coordinates,
          district: processedSchool.district
        });
        
        return processedSchool;
      });
      
      console.log(`Обработано школ: ${schools.length}`);
      console.log('Обработанные школы:', schools.slice(0, 3)); // Показываем первые 3 для проверки
      return schools;
    } catch (error) {
      console.error('Детали ошибки загрузки школ:');
      console.error('- Тип ошибки:', error.constructor.name);
      console.error('- Сообщение:', error.message);
      console.error('- Код ответа:', error.response?.status);
      console.error('- Данные ответа:', error.response?.data);
      console.error('- URL запроса:', error.config?.url);
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