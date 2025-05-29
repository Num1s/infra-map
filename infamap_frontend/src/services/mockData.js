// Заглушки для типов учреждений, которые не поддерживаются сервером
export const MOCK_FACILITY_TYPES = {
  polyclinic: {
    name: 'Поликлиника',
    icon: '🏨',
    supported: false,
    mockData: {
      capacity: '250-300 пациентов в день',
      departments: ['Терапия', 'Кардиология', 'Педиатрия', 'Неврология'],
      workingHours: '8:00-20:00 (пн-пт), 9:00-15:00 (сб)',
      staff: '25-35 специалистов'
    }
  },
  clinic: {
    name: 'Клиника',
    icon: '⚕️',
    supported: false,
    mockData: {
      rooms: '8-12 кабинетов',
      workingHours: '8:00-20:00 (пн-пт)',
      services: ['Первичная помощь', 'Диагностика', 'Профилактика'],
      staff: '15-20 сотрудников'
    }
  },
  police_station: {
    name: 'Полицейский участок',
    icon: '🚔',
    supported: false,
    mockData: {
      personnel: '25-40 сотрудников',
      vehicles: '5-8 патрульных машин',
      workingHours: '24/7',
      coverage: 'район 10-15 км²'
    }
  },
  post_office: {
    name: 'Почтовое отделение',
    icon: '📮',
    supported: false,
    mockData: {
      workingHours: '9:00-18:00 (пн-сб)',
      dailyPackages: '150-250 отправлений',
      services: ['Почта', 'Посылки', 'Платежи', 'Пенсии'],
      staff: '3-5 сотрудников'
    }
  }
};

// Генераторы фейковых данных
const generateMockFacilities = () => {
  // Координаты границ Бишкека (правильные)
  const BISHKEK_BOUNDS = {
    north: 42.9200,
    south: 42.8000,
    east: 74.6500,
    west: 74.5000
  };

  // Базовые названия улиц Бишкека
  const STREETS = [
    'ул. Чуй', 'ул. Манаса', 'ул. Токтогула', 'ул. Киевская', 
    'ул. Фрунзе', 'ул. Исанова', 'ул. Боконбаева', 'ул. Московская',
    'ул. Горького', 'ул. Абдрахманова', 'ул. Юнусалиева', 'ул. Ахунбаева',
    'ул. Тыныстанова', 'ул. Льва Толстого', 'ул. Панфилова', 'ул. Джантошева'
  ];

  // Районы Бишкека
  const DISTRICTS = [
    'Первомайский', 'Ленинский', 'Октябрьский', 'Свердловский'
  ];

  const randomCoordinate = (min, max) => {
    return (Math.random() * (max - min) + min).toFixed(6);
  };

  const randomFromArray = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Генерация пожарных станций (0 объектов, создадим несколько для демонстрации)
  const fireStations = Array.from({ length: 8 }, (_, index) => ({
    id: `fire_mock_${index + 1}`,
    name: `🔄 Пожарная часть №${index + 1}`,
    type: 'fire_station',
    address: `🔄 ${randomFromArray(STREETS)}, ${randomNumber(1, 100)}`,
    coordinates: [
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.south, BISHKEK_BOUNDS.north)),
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.west, BISHKEK_BOUNDS.east))
    ],
    district: randomFromArray(DISTRICTS),
    vehicles: randomNumber(3, 8),
    personnel: randomNumber(15, 35),
    responseTime: `${randomNumber(3, 8)} мин`,
    coverage: `${randomNumber(8, 15)} км²`,
    contact: `🔄 +996 (312) ${randomNumber(100, 999)}-${randomNumber(100, 999)}`,
    isMock: true
  }));

  // Генерация полицейских участков
  const policeStations = Array.from({ length: 12 }, (_, index) => ({
    id: `police_mock_${index + 1}`,
    name: `🔄 ОП №${index + 1} УМВД`,
    type: 'police_station',
    address: `🔄 ${randomFromArray(STREETS)}, ${randomNumber(1, 150)}`,
    coordinates: [
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.south, BISHKEK_BOUNDS.north)),
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.west, BISHKEK_BOUNDS.east))
    ],
    district: randomFromArray(DISTRICTS),
    personnel: randomNumber(20, 45),
    vehicles: randomNumber(4, 10),
    coverage: `${randomNumber(10, 25)} км²`,
    workingHours: '24/7',
    contact: `🔄 +996 (312) ${randomNumber(100, 999)}-${randomNumber(100, 999)}`,
    isMock: true
  }));

  // Генерация почтовых отделений
  const postOffices = Array.from({ length: 25 }, (_, index) => ({
    id: `post_mock_${index + 1}`,
    name: `🔄 Почта России ${426000 + index}`,
    type: 'post_office',
    address: `🔄 ${randomFromArray(STREETS)}, ${randomNumber(1, 180)}`,
    coordinates: [
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.south, BISHKEK_BOUNDS.north)),
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.west, BISHKEK_BOUNDS.east))
    ],
    district: randomFromArray(DISTRICTS),
    postcode: `426${String(index).padStart(3, '0')}`,
    dailyPackages: randomNumber(100, 300),
    staff: randomNumber(2, 8),
    workingHours: index % 7 === 0 ? '9:00-21:00' : '9:00-18:00', // Некоторые работают дольше
    services: ['Почта', 'Посылки', 'Платежи', 'Пенсии', 'Переводы'].slice(0, randomNumber(3, 5)),
    contact: `🔄 +996 (312) ${randomNumber(100, 999)}-${randomNumber(100, 999)}`,
    isMock: true
  }));

  // Генерация поликлиник
  const polyclinics = Array.from({ length: 15 }, (_, index) => ({
    id: `polyclinic_mock_${index + 1}`,
    name: `🔄 Поликлиника №${index + 1}`,
    type: 'polyclinic',
    address: `🔄 ${randomFromArray(STREETS)}, ${randomNumber(1, 120)}`,
    coordinates: [
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.south, BISHKEK_BOUNDS.north)),
      parseFloat(randomCoordinate(BISHKEK_BOUNDS.west, BISHKEK_BOUNDS.east))
    ],
    district: randomFromArray(DISTRICTS),
    dailyPatients: randomNumber(200, 400),
    staff: randomNumber(25, 50),
    departments: ['Терапия', 'Кардиология', 'Педиатрия', 'Неврология', 'Хирургия', 'Офтальмология'].slice(0, randomNumber(3, 6)),
    workingHours: '8:00-20:00',
    emergencyHours: 'круглосуточно',
    contact: `🔄 +996 (312) ${randomNumber(100, 999)}-${randomNumber(100, 999)}`,
    isMock: true
  }));

  return {
    fire_station: fireStations,
    police_station: policeStations,
    post_office: postOffices,
    polyclinic: polyclinics
  };
};

// Генерируем и экспортируем фейковые данные
console.log('🔄 Генерируем фейковые данные...');
export const MOCK_FACILITIES = generateMockFacilities();
console.log('🔄 Фейковые данные сгенерированы:', MOCK_FACILITIES);
console.log('🔄 Статистика фейковых данных:');
console.log(`  - Пожарные станции: ${MOCK_FACILITIES.fire_station?.length || 0}`);
console.log(`  - Полицейские участки: ${MOCK_FACILITIES.police_station?.length || 0}`);
console.log(`  - Почтовые отделения: ${MOCK_FACILITIES.post_office?.length || 0}`);
console.log(`  - Поликлиники: ${MOCK_FACILITIES.polyclinic?.length || 0}`);

// Заглушки для аналитики
export const MOCK_ANALYTICS = {
  demographic_analysis: {
    age_groups: {
      children: 28,
      adults: 58,
      elderly: 14
    },
    population_growth: 1.2
  },
  transport_analysis: {
    road_density: 'Средняя',
    public_transport_coverage: 72,
    traffic_congestion: 'Умеренная'
  },
  economic_factors: {
    investment_priority: 'medium',
    maintenance_cost: 'Средние',
    social_impact: 'Высокое'
  }
};

// Заглушки для статистики
export const MOCK_STATISTICS = {
  coverage_improvement: 2.5,
  new_points_count: 4,
  people_covered: 15000,
  current_coverage: 68.5
};

// Функция для получения заглушек учреждений
export const getMockFacilityData = (type) => {
  return MOCK_FACILITY_TYPES[type] || null;
};

// Функция для получения фейковых учреждений по типу
export const getMockFacilities = (type) => {
  console.log(`🔄 getMockFacilities вызвана для типа: ${type}`);
  console.log('🔄 Доступные типы в MOCK_FACILITIES:', Object.keys(MOCK_FACILITIES));
  
  if (type === 'all') {
    const allMockFacilities = Object.values(MOCK_FACILITIES).flat();
    console.log(`🔄 Возвращаем все фейковые учреждения: ${allMockFacilities.length}`);
    return allMockFacilities;
  }
  
  const facilitiesForType = MOCK_FACILITIES[type] || [];
  console.log(`🔄 Возвращаем фейковые учреждения для ${type}: ${facilitiesForType.length}`);
  
  return facilitiesForType;
};

// Функция для проверки поддержки типа учреждения
export const isFacilityTypeSupported = (type) => {
  const supportedTypes = ['school', 'hospital'];
  return supportedTypes.includes(type);
};

// Функция для получения информационного сообщения о неподдерживаемом типе
export const getUnsupportedTypeMessage = (type) => {
  const mockData = getMockFacilityData(type);
  if (!mockData) return null;
  
  return {
    title: 'Функция в разработке',
    message: `Анализ для ${mockData.name.toLowerCase()} находится в стадии разработки. В будущих версиях здесь будет доступна полная функциональность.`,
    features: [
      'Анализ текущего размещения',
      'Выявление проблемных зон', 
      'Рекомендации по оптимизации',
      'Детальная статистика'
    ]
  };
};

// Функция для получения количества фейковых учреждений
export const getMockFacilityCount = (type) => {
  const counts = {
    fire_station: 8,
    police_station: 12,
    post_office: 25,
    polyclinic: 15
  };
  return counts[type] || 0;
}; 