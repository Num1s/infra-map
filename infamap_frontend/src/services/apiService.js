import axios from 'axios';

const API_BASE_URL = '/api';
const USE_MOCK_DATA = true; // Флаг для использования заглушек

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Симуляция задержки API
const simulateDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Заглушки данных
const mockData = {
  facilities: [
    // Школы
    {
      id: 1,
      type: 'school',
      name: 'Гимназия №1 им. А.С. Пушкина',
      coordinates: [42.8746, 74.5698],
      address: 'ул. Чуй, 123',
      capacity: 1200,
      established: 1965,
      contact: '+996 312 123456'
    },
    {
      id: 2,
      type: 'school',
      name: 'СОШ №45',
      coordinates: [42.8856, 74.5898],
      address: 'ул. Токтогула, 89',
      capacity: 800,
      established: 1978,
      contact: '+996 312 789012'
    },
    {
      id: 3,
      type: 'school',
      name: 'Лицей "Илим"',
      coordinates: [42.8546, 74.5398],
      address: 'микрорайон Джал, 15',
      capacity: 950,
      established: 1995,
      contact: '+996 312 345678'
    },
    {
      id: 4,
      type: 'school',
      name: 'СОШ №62',
      coordinates: [42.8646, 74.6098],
      address: 'ул. Ахунбаева, 201',
      capacity: 600,
      established: 1982,
      contact: '+996 312 567890'
    },
    // Больницы
    {
      id: 5,
      type: 'hospital',
      name: 'Национальный госпиталь',
      coordinates: [42.8656, 74.5789],
      address: 'ул. Киевская, 45',
      beds: 400,
      specialties: ['Кардиология', 'Хирургия', 'Неврология'],
      contact: '+996 312 654321'
    },
    {
      id: 6,
      type: 'hospital',
      name: 'Городская больница №3',
      coordinates: [42.8756, 74.5489],
      address: 'проспект Манаса, 156',
      beds: 250,
      specialties: ['Терапия', 'Педиатрия', 'Гинекология'],
      contact: '+996 312 987654'
    },
    {
      id: 7,
      type: 'hospital',
      name: 'Клиника "Эне-Сай"',
      coordinates: [42.8456, 74.5989],
      address: 'ул. Исанова, 42',
      beds: 120,
      specialties: ['Родильное отделение', 'Педиатрия'],
      contact: '+996 312 111222'
    },
    // Пожарные станции
    {
      id: 8,
      type: 'fire_station',
      name: 'ПЧ №1 МЧС КР',
      coordinates: [42.8796, 74.5598],
      address: 'ул. Манаса, 67',
      vehicles: 8,
      personnel: 45,
      contact: '+996 312 333444'
    },
    {
      id: 9,
      type: 'fire_station',
      name: 'ПЧ №3 "Ала-Тоо"',
      coordinates: [42.8696, 74.6198],
      address: 'ул. Горького, 234',
      vehicles: 6,
      personnel: 32,
      contact: '+996 312 555666'
    },
    {
      id: 10,
      type: 'fire_station',
      name: 'ПЧ №5 "Свердловский"',
      coordinates: [42.8596, 74.5298],
      address: 'ул. Фрунзе, 178',
      vehicles: 5,
      personnel: 28,
      contact: '+996 312 777888'
    }
  ],

  populationHeatmap: [
    // Центр города (высокая плотность)
    [42.8746, 74.5698, 0.9],
    [42.8756, 74.5708, 0.85],
    [42.8766, 74.5718, 0.88],
    [42.8736, 74.5688, 0.82],
    
    // Жилые районы
    [42.8656, 74.5789, 0.7],
    [42.8666, 74.5799, 0.68],
    [42.8646, 74.5779, 0.72],
    [42.8676, 74.5809, 0.65],
    
    // Микрорайоны
    [42.8856, 74.5898, 0.75],
    [42.8866, 74.5908, 0.73],
    [42.8846, 74.5888, 0.77],
    [42.8876, 74.5918, 0.71],
    
    // Спальные районы
    [42.8546, 74.5398, 0.6],
    [42.8556, 74.5408, 0.58],
    [42.8536, 74.5388, 0.62],
    [42.8566, 74.5418, 0.55],
    
    // Окраины
    [42.8796, 74.5598, 0.5],
    [42.8806, 74.5608, 0.48],
    [42.8786, 74.5588, 0.52],
    [42.8816, 74.5618, 0.45],
    
    // Промышленные зоны
    [42.8696, 74.6198, 0.4],
    [42.8596, 74.5298, 0.42],
    [42.8496, 74.5998, 0.38],
    
    // Новые районы
    [42.8946, 74.5798, 0.65],
    [42.8446, 74.5498, 0.55],
    [42.8896, 74.6098, 0.48]
  ],

  generateRecommendations: (facilityType) => {
    const recommendations = {
      school: [
        {
          id: 'rec_school_1',
          type: 'school',
          coordinates: [42.8900, 74.5800],
          score: 0.89,
          estimated_coverage: 12500,
          reason: 'Высокая плотность детского населения',
          priority: 'high'
        },
        {
          id: 'rec_school_2',
          type: 'school',
          coordinates: [42.8400, 74.5300],
          score: 0.76,
          estimated_coverage: 8900,
          reason: 'Недостаток школ в районе',
          priority: 'medium'
        }
      ],
      hospital: [
        {
          id: 'rec_hospital_1',
          type: 'hospital',
          coordinates: [42.8850, 74.5750],
          score: 0.92,
          estimated_coverage: 18500,
          reason: 'Критический недостаток медучреждений',
          priority: 'high'
        }
      ],
      fire_station: [
        {
          id: 'rec_fire_1',
          type: 'fire_station',
          coordinates: [42.8750, 74.6050],
          score: 0.85,
          estimated_coverage: 22000,
          reason: 'Превышение времени доезда',
          priority: 'high'
        }
      ]
    };

    if (facilityType === 'all') {
      return [
        ...recommendations.school.slice(0, 1),
        ...recommendations.hospital.slice(0, 1),
        ...recommendations.fire_station.slice(0, 1)
      ];
    }

    return recommendations[facilityType] || [];
  },

  generateStatistics: (facilityType, recommendations) => {
    const baseStats = {
      school: {
        new_points_count: recommendations.length,
        coverage_improvement: 22.5,
        people_covered: 28900,
        current_coverage: 67.8,
        target_coverage: 90.3,
        investment_needed: 45000000
      },
      hospital: {
        new_points_count: recommendations.length,
        coverage_improvement: 31.2,
        people_covered: 45200,
        current_coverage: 58.1,
        target_coverage: 89.3,
        investment_needed: 120000000
      },
      fire_station: {
        new_points_count: recommendations.length,
        coverage_improvement: 18.7,
        people_covered: 67500,
        current_coverage: 74.2,
        target_coverage: 92.9,
        investment_needed: 35000000
      }
    };

    return baseStats[facilityType] || baseStats.school;
  }
};

export const apiService = {
  // Получить список учреждений
  async getFacilities(type = null) {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      let facilities = mockData.facilities;
      if (type && type !== 'all') {
        facilities = facilities.filter(f => f.type === type);
      }
      return facilities;
    }

    try {
      const params = type ? { type } : {};
      const response = await api.get('/objects', { params });
      return response.data;
    } catch (error) {
      throw new Error('Ошибка загрузки учреждений');
    }
  },

  // Получить данные для тепловой карты населения
  async getPopulationHeatmap() {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      return mockData.populationHeatmap;
    }

    try {
      const response = await api.get('/population_heatmap');
      return response.data;
    } catch (error) {
      throw new Error('Ошибка загрузки данных о населении');
    }
  },

  // Получить рекомендации по размещению
  async getRecommendations(params) {
    if (USE_MOCK_DATA) {
      await simulateDelay(1500); // Имитируем более долгий расчет
      const recommendations = mockData.generateRecommendations(params.facility_type);
      const statistics = mockData.generateStatistics(params.facility_type, recommendations);
      
      return {
        recommendations,
        statistics,
        analysis_time: '1.2s',
        algorithm_version: '2.1.4'
      };
    }

    try {
      const response = await api.post('/recommendations', params);
      return response.data;
    } catch (error) {
      throw new Error('Ошибка генерации рекомендаций');
    }
  },

  // Получить статистику покрытия
  async getCoverageStats(facilityType, travelTime) {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return {
        current_coverage: 68.5,
        uncovered_population: 89500,
        average_travel_time: 18.3,
        max_travel_time: travelTime,
        facilities_count: mockData.facilities.filter(f => 
          facilityType === 'all' || f.type === facilityType
        ).length
      };
    }

    try {
      const response = await api.get('/coverage_stats', {
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
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      // Возвращаем заглушку для экспорта
      const csvContent = `ID,Type,Coordinates,Score,Coverage\n${
        data.map(item => 
          `${item.id},${item.type},"${item.coordinates.join(', ')}",${item.score},${item.estimated_coverage}`
        ).join('\n')
      }`;
      
      return new Blob([csvContent], { type: 'text/csv' });
    }

    try {
      const response = await api.post('/export', {
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

  // Получить дополнительную аналитику
  async getAnalytics(facilityType) {
    if (USE_MOCK_DATA) {
      await simulateDelay(700);
      return {
        demographic_analysis: {
          age_groups: {
            children: 23.4,
            adults: 62.1,
            elderly: 14.5
          },
          population_growth: 2.3
        },
        transport_analysis: {
          road_density: 'high',
          public_transport_coverage: 78.5,
          traffic_congestion: 'moderate'
        },
        economic_factors: {
          investment_priority: facilityType === 'hospital' ? 'high' : 'medium',
          maintenance_cost: facilityType === 'school' ? 'low' : 'medium',
          social_impact: 'high'
        }
      };
    }

    try {
      const response = await api.get(`/analytics/${facilityType}`);
      return response.data;
    } catch (error) {
      throw new Error('Ошибка получения аналитики');
    }
  }
}; 