import React, { useState, useEffect } from 'react';
import InteractiveMap from './components/InteractiveMap';
import ControlPanel from './components/ControlPanel';
import ResultsPanel from './components/ResultsPanel';
import ReportModal from './components/ReportModal';
import FacilityDetailsModal from './components/FacilityDetailsModal';
import NotificationToast from './components/NotificationToast';
import { apiService } from './services/apiService';
import { Settings, Info, Bell, Wifi, WifiOff, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, Moon, Sun } from 'lucide-react';

// Функция генерации тестовых рекомендаций
const generateTestRecommendations = (facilityType) => {
  const recommendations = {
    school: [
      {
        id: 'rec_school_1',
        type: 'school',
        coordinates: [42.8900, 74.5800],
        score: 0.89,
        estimated_coverage: 12500,
        reason: 'Высокая плотность детского населения',
        priority: 'high',
        recommendation: 'Общеобразовательная школа на 800-1000 учеников',
        detailedAnalysis: {
          populationDensity: 'Очень высокая (450 детей/км²)',
          nearestSchool: '2.1 км (СОШ №45)',
          walkingTime: '25-30 минут пешком',
          demographics: '1,250 детей школьного возраста в радиусе 1 км',
          infrastructure: 'Развитая транспортная сеть, наличие коммуникаций',
          benefits: ['Сократит переполненность соседних школ', 'Улучшит доступность образования', 'Снизит нагрузку на транспорт']
        }
      },
      {
        id: 'rec_school_2',
        type: 'school',
        coordinates: [42.8400, 74.5300],
        score: 0.76,
        estimated_coverage: 8900,
        reason: 'Недостаток школ в районе',
        priority: 'medium',
        recommendation: 'Средняя школа на 600-700 учеников',
        detailedAnalysis: {
          populationDensity: 'Средняя (280 детей/км²)',
          nearestSchool: '3.5 км (Лицей "Илим")',
          walkingTime: '40-45 минут пешком',
          demographics: '890 детей школьного возраста в радиусе 1.5 км',
          infrastructure: 'Частично развитая инфраструктура',
          benefits: ['Обеспечит местное население школьным образованием', 'Сократит дальние поездки детей']
        }
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
        priority: 'high',
        recommendation: 'Многопрофильная больница на 150-200 коек',
        detailedAnalysis: {
          populationDensity: 'Критически высокая (850 чел/км²)',
          nearestHospital: '4.2 км (Национальный госпиталь)',
          responseTime: 'Превышает норму на 8-12 минут',
          demographics: '18,500 жителей в зоне обслуживания',
          medicalLoad: 'Перегрузка существующих больниц на 40%',
          benefits: ['Снизит нагрузку на существующие больницы', 'Улучшит время реагирования скорой помощи', 'Обеспечит специализированную помощь']
        }
      }
    ],
    polyclinic: [
      {
        id: 'rec_polyclinic_1',
        type: 'polyclinic',
        coordinates: [42.8650, 74.5450],
        score: 0.87,
        estimated_coverage: 15000,
        reason: 'Нехватка амбулаторной помощи',
        priority: 'high',
        recommendation: 'Районная поликлиника на 25-30 кабинетов',
        detailedAnalysis: {
          populationDensity: 'Высокая (620 чел/км²)',
          nearestPolyclinic: '2.8 км (Поликлиника "Дордой")',
          appointmentWaitTime: '7-10 дней (превышает норму)',
          demographics: '15,000 жителей, включая 3,200 пенсионеров',
          currentLoad: 'Существующие поликлиники перегружены на 65%',
          benefits: ['Сократит очереди на приём к врачам', 'Улучшит профилактическое обслуживание', 'Снизит нагрузку на больницы']
        }
      }
    ],
    clinic: [
      {
        id: 'rec_clinic_1',
        type: 'clinic',
        coordinates: [42.8950, 74.5950],
        score: 0.79,
        estimated_coverage: 8500,
        reason: 'Потребность в специализированной помощи',
        priority: 'medium',
        recommendation: 'Специализированная клиника (кардиология, эндокринология)',
        detailedAnalysis: {
          populationDensity: 'Средняя (380 чел/км²)',
          nearestClinic: '3.1 км (Медцентр "Здоровье+")',
          specializedServices: 'Отсутствуют в радиусе 5 км',
          demographics: '8,500 жителей, 35% старше 40 лет',
          medicalNeeds: 'Высокая потребность в кардиологии и диабетологии',
          benefits: ['Обеспечит специализированную помощь на месте', 'Снизит нагрузку на центральные клиники']
        }
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
        priority: 'high',
        recommendation: 'Пожарно-спасательная часть с 2-3 машинами',
        detailedAnalysis: {
          populationDensity: 'Высокая (490 чел/км²)',
          nearestFireStation: '6.8 км (ПЧ №1 МЧС КР)',
          currentResponseTime: '18-22 минуты (норма: 10 минут)',
          riskFactors: 'Много деревянных построек, узкие улицы',
          callFrequency: '15-20 вызовов в месяц в данном районе',
          benefits: ['Сократит время реагирования до 8-10 минут', 'Повысит безопасность населения', 'Снизит материальный ущерб от пожаров']
        }
      }
    ],
    police_station: [
      {
        id: 'rec_police_1',
        type: 'police_station',
        coordinates: [42.8500, 74.5650],
        score: 0.83,
        estimated_coverage: 25000,
        reason: 'Недостаточное покрытие патрулирования',
        priority: 'high',
        recommendation: 'Участковый пункт полиции с 15-20 сотрудниками',
        detailedAnalysis: {
          populationDensity: 'Очень высокая (680 чел/км²)',
          nearestPoliceStation: '4.5 км (ОВД Первомайского района)',
          currentResponseTime: '20-25 минут (норма: 15 минут)',
          crimeRate: 'Средний уровень, рост на 12% за год',
          patrolCoverage: 'Недостаточное (1 патруль на 8,000 жителей)',
          benefits: ['Улучшит время реагирования на вызовы', 'Усилит профилактическую работу', 'Повысит безопасность района']
        }
      }
    ],
    post_office: [
      {
        id: 'rec_post_1',
        type: 'post_office',
        coordinates: [42.8350, 74.5850],
        score: 0.74,
        estimated_coverage: 12000,
        reason: 'Большие расстояния до почтовых услуг',
        priority: 'medium',
        recommendation: 'Почтовое отделение с полным спектром услуг',
        detailedAnalysis: {
          populationDensity: 'Средняя (420 чел/км²)',
          nearestPostOffice: '2.9 км (Почта Кыргызстана №720010)',
          walkingTime: '35-40 минут пешком',
          demographics: '12,000 жителей, 28% пенсионеры',
          serviceNeeds: 'Высокая потребность в пенсионных и социальных услугах',
          benefits: ['Улучшит доступность почтовых услуг', 'Сократит время на получение пенсий и пособий', 'Поддержит пожилое население']
        }
      }
    ]
  };

  if (facilityType === 'all') {
    return [
      ...recommendations.school.slice(0, 1),
      ...recommendations.hospital.slice(0, 1),
      ...recommendations.polyclinic.slice(0, 1),
      ...recommendations.clinic.slice(0, 1),
      ...recommendations.fire_station.slice(0, 1),
      ...recommendations.police_station.slice(0, 1),
      ...recommendations.post_office.slice(0, 1)
    ];
  }

  return recommendations[facilityType] || [];
};

function App() {
  const [facilities, setFacilities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState('all');
  const [maxTravelTime, setMaxTravelTime] = useState(30);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showCoverageZones, setShowCoverageZones] = useState(false);
  const [showFacilityDetails, setShowFacilityDetails] = useState(false);
  const [selectedFacilityForDetails, setSelectedFacilityForDetails] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    facilities: true,
    heatmap: true,
    recommendations: false
  });
  
  // Новые состояния
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Состояния для управления панелями
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showResultsPanel, setShowResultsPanel] = useState(true);
  
  // Состояние темной темы
  const [darkMode, setDarkMode] = useState(false);

  // Отслеживание онлайн статуса
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification({
        type: 'success',
        title: 'Соединение восстановлено',
        message: 'Синхронизация данных возобновлена'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification({
        type: 'warning',
        title: 'Нет соединения',
        message: 'Работаем в автономном режиме'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Функция добавления уведомления
  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Загрузка начальных данных
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Временно всегда используем тестовые данные для демонстрации
      loadTestData();
      
      // Попытка загрузки через API (закомментирована для стабильной работы)
      /*
      const facilitiesData = await apiService.getFacilities();
      if (facilitiesData && facilitiesData.length > 0) {
        setFacilities(facilitiesData);
      } else {
        loadTestData();
      }
      
      const heatmapData = await apiService.getPopulationHeatmap();
      if (heatmapData && heatmapData.length > 0) {
        setPopulationData(heatmapData);
      }
      */
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Используем тестовые данные в случае ошибки
      loadTestData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestData = () => {
    // Расширенные тестовые данные для демонстрации (координаты Бишкека)
    const testFacilities = [
      // Школы
      {
        id: 1,
        type: 'school',
        name: 'Гимназия №1 им. А.С. Пушкина',
        coordinates: [42.8746, 74.5698],
        address: 'ул. Чуй, 123',
        capacity: 1200,
        established: 1965,
        currentStudents: 1150,
        teachers: 68,
        languages: ['Кыргызский', 'Русский', 'Английский'],
        rating: 4.5,
        statistics: {
          attendanceRate: 94.2,
          passRate: 87.5,
          avgGrade: 4.1,
          olympiadWinners: 12,
          sportsTrophies: 8,
          coverageArea: 2.3,
          yearlyBudget: 850000
        },
        facilities: ['Спортзал', 'Библиотека', 'Компьютерный класс', 'Столовая', 'Медпункт']
      },
      {
        id: 2,
        type: 'school',
        name: 'СОШ №45',
        coordinates: [42.8856, 74.5898],
        address: 'ул. Токтогула, 89',
        capacity: 800,
        established: 1978,
        currentStudents: 760,
        teachers: 42,
        languages: ['Кыргызский', 'Русский'],
        rating: 4.1,
        statistics: {
          attendanceRate: 91.8,
          passRate: 82.3,
          avgGrade: 3.9,
          olympiadWinners: 5,
          sportsTrophies: 3,
          coverageArea: 1.8,
          yearlyBudget: 620000
        },
        facilities: ['Спортзал', 'Библиотека', 'Столовая']
      },
      {
        id: 3,
        type: 'school',
        name: 'Лицей "Илим"',
        coordinates: [42.8546, 74.5398],
        address: 'микрорайон Джал, 15',
        capacity: 950,
        established: 1995,
        currentStudents: 920,
        teachers: 58,
        languages: ['Кыргызский', 'Русский', 'Английский', 'Турецкий'],
        rating: 4.7,
        statistics: {
          attendanceRate: 96.1,
          passRate: 92.8,
          avgGrade: 4.3,
          olympiadWinners: 18,
          sportsTrophies: 12,
          coverageArea: 2.1,
          yearlyBudget: 1200000
        },
        facilities: ['Спортзал', 'Библиотека', 'Компьютерный класс', 'Столовая', 'Медпункт', 'Лаборатория']
      },
      {
        id: 4,
        type: 'school',
        name: 'СОШ №62',
        coordinates: [42.8646, 74.6098],
        address: 'ул. Ахунбаева, 201',
        capacity: 600,
        established: 1982,
        currentStudents: 580,
        teachers: 35,
        languages: ['Кыргызский', 'Русский'],
        rating: 3.8,
        statistics: {
          attendanceRate: 89.5,
          passRate: 78.9,
          avgGrade: 3.7,
          olympiadWinners: 3,
          sportsTrophies: 2,
          coverageArea: 1.5,
          yearlyBudget: 450000
        },
        facilities: ['Спортзал', 'Библиотека', 'Столовая']
      },
      // Больницы
      {
        id: 5,
        type: 'hospital',
        name: 'Национальный госпиталь',
        coordinates: [42.8656, 74.5789],
        address: 'ул. Киевская, 45',
        beds: 400,
        specialties: ['Кардиология', 'Хирургия', 'Неврология', 'Онкология'],
        rating: 4.6,
        statistics: {
          monthlyPatients: 8500,
          doctorsCount: 85,
          nursesCount: 180,
          emergencyResponse: 12.5,
          successRate: 94.2,
          averageStay: 6.8,
          coverageArea: 45.2,
          yearlyBudget: 15000000
        },
        equipment: ['МРТ', 'КТ', 'УЗИ', 'Рентген', 'Лаборатория', 'Реанимация'],
        workingHours: '24/7'
      },
      {
        id: 6,
        type: 'hospital',
        name: 'Городская больница №3',
        coordinates: [42.8756, 74.5489],
        address: 'проспект Манаса, 156',
        beds: 250,
        specialties: ['Терапия', 'Педиатрия', 'Гинекология'],
        rating: 4.2,
        statistics: {
          monthlyPatients: 5200,
          doctorsCount: 45,
          nursesCount: 95,
          emergencyResponse: 15.2,
          successRate: 89.7,
          averageStay: 7.2,
          coverageArea: 28.5,
          yearlyBudget: 8500000
        },
        equipment: ['УЗИ', 'Рентген', 'Лаборатория'],
        workingHours: '24/7'
      },
      {
        id: 7,
        type: 'hospital',
        name: 'Клиника "Эне-Сай"',
        coordinates: [42.8456, 74.5989],
        address: 'ул. Исанова, 42',
        beds: 120,
        specialties: ['Родильное отделение', 'Педиатрия'],
        rating: 4.4,
        statistics: {
          monthlyPatients: 2800,
          doctorsCount: 25,
          nursesCount: 55,
          emergencyResponse: 18.0,
          successRate: 92.1,
          averageStay: 4.5,
          coverageArea: 18.7,
          yearlyBudget: 4200000
        },
        equipment: ['УЗИ', 'Кардиотокограф', 'Инкубаторы'],
        workingHours: '24/7'
      },
      // Поликлиники
      {
        id: 8,
        type: 'polyclinic',
        name: 'Городская поликлиника №1',
        coordinates: [42.8650, 74.5950],
        address: 'ул. Абдрахманова, 89',
        rating: 4.1,
        statistics: {
          dailyPatients: 450,
          doctorsCount: 35,
          appointmentTime: 2.5,
          offices: 28,
          coverageArea: 18.5,
          yearlyBudget: 4500000
        },
        specialties: ['Терапия', 'Кардиология', 'Неврология', 'Дерматология', 'Эндокринология'],
        workingHours: '8:00-20:00'
      },
      {
        id: 9,
        type: 'polyclinic',
        name: 'Поликлиника "Дордой"',
        coordinates: [42.8950, 74.5450],
        address: 'микрорайон Дордой, 45',
        rating: 3.8,
        statistics: {
          dailyPatients: 320,
          doctorsCount: 28,
          appointmentTime: 3.2,
          offices: 22,
          coverageArea: 15.2,
          yearlyBudget: 3200000
        },
        specialties: ['Терапия', 'Педиатрия', 'Хирургия'],
        workingHours: '8:00-18:00'
      },
      // Клиники
      {
        id: 10,
        type: 'clinic',
        name: 'Медцентр "Здоровье+"',
        coordinates: [42.8750, 74.5750],
        address: 'ул. Токтогула, 156',
        rating: 4.5,
        statistics: {
          dailyPatients: 120,
          doctorsCount: 12,
          coverageArea: 8.5,
          yearlyBudget: 1800000
        },
        services: ['УЗИ', 'Лабораторная диагностика', 'Консультации специалистов'],
        workingHours: '9:00-19:00'
      },
      {
        id: 11,
        type: 'clinic',
        name: 'Стоматология "Дент Плюс"',
        coordinates: [42.8850, 74.5350],
        address: 'ул. Льва Толстого, 45',
        rating: 4.2,
        statistics: {
          dailyPatients: 80,
          doctorsCount: 8,
          coverageArea: 6.2,
          yearlyBudget: 1200000
        },
        services: ['Лечение зубов', 'Протезирование', 'Отбеливание'],
        workingHours: '9:00-18:00'
      },
      // Полицейские участки
      {
        id: 12,
        type: 'police_station',
        name: 'ОВД Первомайского района',
        coordinates: [42.8696, 74.5896],
        address: 'ул. Киевская, 112',
        personnel: 85,
        rating: 4.0,
        statistics: {
          monthlyCalls: 450,
          responseTime: 12.5,
          patrols: 15,
          coverageArea: 42.3,
          yearlyBudget: 3500000
        },
        services: ['Участковые', 'Патрульная служба', 'Дежурная часть', 'ГИБДД'],
        workingHours: '24/7'
      },
      {
        id: 13,
        type: 'police_station',
        name: 'ОВД Ленинского района',
        coordinates: [42.8396, 74.5596],
        address: 'ул. Панфилова, 78',
        personnel: 72,
        rating: 3.8,
        statistics: {
          monthlyCalls: 380,
          responseTime: 15.2,
          patrols: 12,
          coverageArea: 38.7,
          yearlyBudget: 3200000
        },
        services: ['Участковые', 'Патрульная служба', 'Дежурная часть'],
        workingHours: '24/7'
      },
      // Почтовые отделения
      {
        id: 14,
        type: 'post_office',
        name: 'Почта Кыргызстана №720010',
        coordinates: [42.8646, 74.5698],
        address: 'ул. Чуй, 45',
        personnel: 12,
        rating: 3.9,
        statistics: {
          dailyPackages: 280,
          serviceTime: 8.5,
          postBoxes: 450,
          coverageArea: 12.8,
          yearlyBudget: 850000
        },
        services: ['Отправка посылок', 'Почтовые переводы', 'Подписка', 'Интернет-платежи'],
        workingHours: '9:00-18:00'
      },
      {
        id: 15,
        type: 'post_office',
        name: 'Почтовое отделение "Ала-Тоо"',
        coordinates: [42.8896, 74.5398],
        address: 'микрорайон Ала-Тоо, 23',
        personnel: 8,
        rating: 3.6,
        statistics: {
          dailyPackages: 150,
          serviceTime: 12.2,
          postBoxes: 220,
          coverageArea: 8.5,
          yearlyBudget: 620000
        },
        services: ['Отправка посылок', 'Почтовые переводы', 'Подписка'],
        workingHours: '9:00-17:00'
      },
      // Дополнительные поликлиники
      {
        id: 19,
        type: 'polyclinic',
        name: 'Центральная районная поликлиника',
        coordinates: [42.8350, 74.5750],
        address: 'ул. Московская, 234',
        rating: 4.3,
        statistics: {
          dailyPatients: 520,
          doctorsCount: 42,
          appointmentTime: 1.8,
          offices: 35,
          coverageArea: 25.3,
          yearlyBudget: 5800000
        },
        specialties: ['Терапия', 'Хирургия', 'Гинекология', 'Офтальмология', 'ЛОР', 'Травматология'],
        workingHours: '7:30-20:00'
      },
      {
        id: 20,
        type: 'polyclinic',
        name: 'Поликлиника "Жылдыз"',
        coordinates: [42.8550, 74.6150],
        address: 'микрорайон Жылдыз, 67',
        rating: 3.9,
        statistics: {
          dailyPatients: 280,
          doctorsCount: 24,
          appointmentTime: 4.1,
          offices: 18,
          coverageArea: 12.7,
          yearlyBudget: 2800000
        },
        specialties: ['Терапия', 'Педиатрия', 'Стоматология'],
        workingHours: '8:00-17:00'
      },
      // Дополнительные клиники
      {
        id: 21,
        type: 'clinic',
        name: 'Диагностический центр "МедПлюс"',
        coordinates: [42.8450, 74.5450],
        address: 'ул. Боконбаева, 89',
        rating: 4.6,
        statistics: {
          dailyPatients: 180,
          doctorsCount: 15,
          coverageArea: 12.3,
          yearlyBudget: 2500000
        },
        services: ['МРТ', 'КТ', 'УЗИ', 'Лабораторная диагностика', 'Кардиология', 'Эндокринология'],
        workingHours: '8:00-20:00'
      },
      {
        id: 22,
        type: 'clinic',
        name: 'Офтальмологическая клиника "Зрение"',
        coordinates: [42.8650, 74.5250],
        address: 'проспект Чуй, 178',
        rating: 4.4,
        statistics: {
          dailyPatients: 95,
          doctorsCount: 10,
          coverageArea: 8.9,
          yearlyBudget: 1650000
        },
        services: ['Офтальмология', 'Лазерная коррекция', 'Контактные линзы', 'Диагностика зрения'],
        workingHours: '9:00-18:00'
      },
      {
        id: 23,
        type: 'clinic',
        name: 'Детская клиника "Балапан"',
        coordinates: [42.8950, 74.5650],
        address: 'ул. Ахунбаева, 156',
        rating: 4.7,
        statistics: {
          dailyPatients: 140,
          doctorsCount: 18,
          coverageArea: 15.2,
          yearlyBudget: 2200000
        },
        services: ['Педиатрия', 'Детская хирургия', 'Вакцинация', 'Развитие ребенка'],
        workingHours: '8:00-19:00'
      },
      // Дополнительные полицейские участки
      {
        id: 24,
        type: 'police_station',
        name: 'ОВД Октябрьского района',
        coordinates: [42.8250, 74.5250],
        address: 'ул. Ибраимова, 201',
        personnel: 95,
        rating: 4.1,
        statistics: {
          monthlyCalls: 520,
          responseTime: 11.8,
          patrols: 18,
          coverageArea: 48.5,
          yearlyBudget: 4200000
        },
        services: ['Участковые', 'Патрульная служба', 'Дежурная часть', 'ГИБДД', 'Криминальная полиция'],
        workingHours: '24/7'
      },
      {
        id: 25,
        type: 'police_station',
        name: 'Пост ДПС "Южный"',
        coordinates: [42.8150, 74.5850],
        address: 'ул. Южная магистраль, 45',
        personnel: 25,
        rating: 3.7,
        statistics: {
          monthlyCalls: 180,
          responseTime: 8.5,
          patrols: 6,
          coverageArea: 15.2,
          yearlyBudget: 1500000
        },
        services: ['ГИБДД', 'Контроль дорожного движения'],
        workingHours: '24/7'
      },
      // Дополнительные почтовые отделения
      {
        id: 26,
        type: 'post_office',
        name: 'Центральное почтовое отделение',
        coordinates: [42.8746, 74.5598],
        address: 'ул. Эркиндик, 12',
        personnel: 18,
        rating: 4.2,
        statistics: {
          dailyPackages: 450,
          serviceTime: 6.8,
          postBoxes: 850,
          coverageArea: 22.5,
          yearlyBudget: 1800000
        },
        services: ['Отправка посылок', 'Почтовые переводы', 'Подписка', 'Интернет-платежи', 'EMS', 'Банковские услуги'],
        workingHours: '8:00-19:00'
      },
      {
        id: 27,
        type: 'post_office',
        name: 'Почтовое отделение "Восток-5"',
        coordinates: [42.8550, 74.6250],
        address: 'микрорайон Восток-5, 134',
        personnel: 6,
        rating: 3.5,
        statistics: {
          dailyPackages: 95,
          serviceTime: 15.5,
          postBoxes: 180,
          coverageArea: 6.8,
          yearlyBudget: 480000
        },
        services: ['Отправка посылок', 'Почтовые переводы', 'Подписка'],
        workingHours: '9:00-16:00'
      },
      {
        id: 28,
        type: 'post_office',
        name: 'Почта "Арча-Бешик"',
        coordinates: [42.8050, 74.5050],
        address: 'с. Арча-Бешик, ул. Центральная, 67',
        personnel: 4,
        rating: 3.8,
        statistics: {
          dailyPackages: 65,
          serviceTime: 18.2,
          postBoxes: 120,
          coverageArea: 35.0,
          yearlyBudget: 350000
        },
        services: ['Отправка посылок', 'Почтовые переводы', 'Подписка'],
        workingHours: '9:00-15:00'
      },
      // Пожарные станции
      {
        id: 16,
        type: 'fire_station',
        name: 'ПЧ №1 МЧС КР',
        coordinates: [42.8796, 74.5598],
        address: 'ул. Манаса, 67',
        vehicles: 8,
        personnel: 45,
        rating: 4.3,
        statistics: {
          monthlyCallouts: 78,
          averageResponse: 8.5,
          successRate: 96.8,
          firesSuppressed: 245,
          rescueOperations: 89,
          coverageArea: 35.8,
          yearlyBudget: 2800000
        },
        equipment: ['Пожарные машины', 'Лестницы', 'Спасательное снаряжение', 'Радиосвязь'],
        workingHours: '24/7'
      },
      {
        id: 17,
        type: 'fire_station',
        name: 'ПЧ №3 "Ала-Тоо"',
        coordinates: [42.8696, 74.6198],
        address: 'ул. Горького, 234',
        vehicles: 6,
        personnel: 32,
        rating: 4.1,
        statistics: {
          monthlyCallouts: 52,
          averageResponse: 10.2,
          successRate: 94.5,
          firesSuppressed: 168,
          rescueOperations: 45,
          coverageArea: 28.3,
          yearlyBudget: 1950000
        },
        equipment: ['Пожарные машины', 'Лестницы', 'Спасательное снаряжение'],
        workingHours: '24/7'
      },
      {
        id: 18,
        type: 'fire_station',
        name: 'ПЧ №5 "Свердловский"',
        coordinates: [42.8596, 74.5298],
        address: 'ул. Фрунзе, 178',
        vehicles: 5,
        personnel: 28,
        rating: 3.9,
        statistics: {
          monthlyCallouts: 38,
          averageResponse: 12.8,
          successRate: 91.2,
          firesSuppressed: 125,
          rescueOperations: 32,
          coverageArea: 22.1,
          yearlyBudget: 1650000
        },
        equipment: ['Пожарные машины', 'Лестницы'],
        workingHours: '24/7'
      },
      {
        id: 29,
        type: 'fire_station',
        name: 'ПЧ №7 "Восточная"',
        coordinates: [42.8950, 74.6350],
        address: 'ул. Жукеева-Пудовкина, 67',
        vehicles: 4,
        personnel: 24,
        rating: 4.0,
        statistics: {
          monthlyCallouts: 42,
          averageResponse: 11.5,
          successRate: 93.8,
          firesSuppressed: 156,
          rescueOperations: 38,
          coverageArea: 18.9,
          yearlyBudget: 1750000
        },
        equipment: ['Пожарные машины', 'Лестницы', 'Спасательное снаряжение'],
        workingHours: '24/7'
      }
    ];

    // Более детализированная тепловая карта населения для Бишкека
    const testHeatmapData = [
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
    ];

    setFacilities(testFacilities);
    setPopulationData(testHeatmapData);
  };

  const handleGenerateRecommendations = async () => {
    try {
      setIsLoading(true);
      
      addNotification({
        type: 'info',
        title: 'Анализ запущен',
        message: 'Генерируем рекомендации на основе текущих параметров...'
      });
      
      const params = {
        facility_type: selectedFacilityType,
        max_travel_time: maxTravelTime
      };
      
      const result = await apiService.getRecommendations(params);
      
      setRecommendations(result.recommendations || []);
      setStatistics(result.statistics || null);
      setShowRecommendations(true);
      setActiveLayers(prev => ({ ...prev, recommendations: true }));
      setLastUpdateTime(new Date());
      
      addNotification({
        type: 'success',
        title: 'Анализ завершен',
        message: `Найдено ${result.recommendations?.length || 0} оптимальных мест для размещения`,
        action: {
          label: 'Посмотреть отчет',
          onClick: () => setShowReport(true)
        }
      });
      
    } catch (error) {
      console.error('Ошибка генерации рекомендаций:', error);
      
      addNotification({
        type: 'warning',
        title: 'Ошибка анализа',
        message: 'Используем тестовые данные для демонстрации'
      });
      
      // Более реалистичные тестовые рекомендации
      const testRecommendations = generateTestRecommendations(selectedFacilityType);
      
      setRecommendations(testRecommendations);
      setStatistics({
        new_points_count: testRecommendations.length,
        coverage_improvement: 15.3,
        people_covered: 14700,
        current_coverage: 68.5 + Math.random() * 10
      });
      setShowRecommendations(true);
      setActiveLayers(prev => ({ ...prev, recommendations: true }));
      setLastUpdateTime(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMap = () => {
    setRecommendations([]);
    setShowRecommendations(false);
    setStatistics(null);
    setActiveLayers(prev => ({ ...prev, recommendations: false }));
    
    addNotification({
      type: 'info',
      title: 'Карта очищена',
      message: 'Все рекомендации удалены с карты'
    });
  };

  const handleLayerToggle = (layerName) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const handleToggleCoverageZones = () => {
    setShowCoverageZones(prev => !prev);
  };

  const handleShowFacilityDetails = (facility) => {
    setSelectedFacilityForDetails(facility);
    setShowFacilityDetails(true);
  };

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
              <header className={`shadow-sm border-b px-6 py-4 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                InfraMap
              </h1>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Анализ размещения госучреждений
                {!isOnline && <span className="text-red-500 ml-2">• Офлайн режим</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Переключатель темной темы */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? "Светлая тема" : "Темная тема"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Управление панелями */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setShowControlPanel(!showControlPanel)}
                className={`p-2 rounded transition-colors ${
                  showControlPanel 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Панель управления"
              >
                {showControlPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowResultsPanel(!showResultsPanel)}
                className={`p-2 rounded transition-colors ${
                  showResultsPanel && statistics
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Панель результатов"
                disabled={!statistics}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Статус соединения */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
            </div>

            {/* Уведомления */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => {
                console.log('Кнопка отчёта нажата. Statistics:', !!statistics);
                if (statistics) {
                  setShowReport(true);
                } else {
                  addNotification({
                    type: 'warning',
                    title: 'Отчёт недоступен',
                    message: 'Сначала выполните анализ для получения рекомендаций'
                  });
                }
              }}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                statistics 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } font-medium py-2 px-4 rounded-lg`}
              disabled={!statistics}
            >
              <Info className="w-4 h-4" />
              <span>{statistics ? 'Показать отчёт' : 'Отчёт недоступен'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Control Panel */}
        {showControlPanel && (
          <div className={`w-96 shadow-xl border-r flex flex-col h-full transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <ControlPanel
              selectedFacilityType={selectedFacilityType}
              setSelectedFacilityType={setSelectedFacilityType}
              maxTravelTime={maxTravelTime}
              setMaxTravelTime={setMaxTravelTime}
              onGenerateRecommendations={handleGenerateRecommendations}
              onClearMap={handleClearMap}
              isLoading={isLoading}
              activeLayers={activeLayers}
              onLayerToggle={handleLayerToggle}
              showCoverageZones={showCoverageZones}
              onToggleCoverageZones={handleToggleCoverageZones}
              facilities={facilities}
              statistics={statistics}
              recommendations={recommendations}
              darkMode={darkMode}
            />
            
            {statistics && showResultsPanel && (
              <div className="border-t border-gray-200">
                <ResultsPanel
                  statistics={statistics}
                  recommendations={recommendations}
                  facilityType={selectedFacilityType}
                />
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative h-full">
          <InteractiveMap
            facilities={facilities}
            recommendations={recommendations}
            populationData={populationData}
            selectedFacilityType={selectedFacilityType}
            activeLayers={activeLayers}
            maxTravelTime={maxTravelTime}
            showCoverageZones={showCoverageZones}
            onShowFacilityDetails={handleShowFacilityDetails}
          />
          
          {/* Плавающая мини-панель управления когда основная скрыта */}
          {!showControlPanel && (
            <div className={`absolute top-4 left-4 backdrop-blur-sm rounded-xl shadow-lg border p-4 z-[1000] min-w-64 transition-all duration-300 animate-slideInUp ${
              darkMode 
                ? 'bg-gray-800/95 border-gray-600' 
                : 'bg-white/95 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Быстрое управление</h3>
                <button
                  onClick={() => setShowControlPanel(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Тип учреждения</label>
                  <select
                    value={selectedFacilityType}
                    onChange={(e) => setSelectedFacilityType(e.target.value)}
                    className="w-full mt-1 text-sm border border-gray-300 rounded-lg px-2 py-1"
                  >
                    <option value="all">Все учреждения</option>
                    <option value="school">Школы</option>
                    <option value="hospital">Больницы</option>
                    <option value="fire_station">Пожарные станции</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Время доезда: {maxTravelTime} мин
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={maxTravelTime}
                    onChange={(e) => setMaxTravelTime(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
                
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                  className="w-full btn-primary text-sm py-2"
                >
                  {isLoading ? 'Анализируем...' : 'Анализ'}
                </button>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[1000] backdrop-blur-sm">
              <div className={`rounded-xl p-6 shadow-2xl border animate-bounceIn ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-ping"></div>
                  </div>
                  <div>
                    <div className={`font-medium transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Анализируем данные...</div>
                    <div className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>Это может занять несколько секунд</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Информация о последнем обновлении */}
          {lastUpdateTime && statistics && (
            <div className={`absolute top-4 right-4 backdrop-blur-sm rounded-lg p-3 text-xs shadow-md z-[1000] animate-fadeInUp ${
              darkMode 
                ? 'bg-gray-800/90 text-gray-300 border border-gray-600' 
                : 'bg-white/90 text-gray-600 border border-gray-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Последнее обновление:</span>
              </div>
              <div className="mt-1 font-mono text-xs opacity-75">
                {lastUpdateTime.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <NotificationToast 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          statistics={statistics}
          recommendations={recommendations}
          facilityType={selectedFacilityType}
        />
      )}

      {/* Facility Details Modal */}
      {showFacilityDetails && (
        <FacilityDetailsModal
          isOpen={showFacilityDetails}
          onClose={() => setShowFacilityDetails(false)}
          facility={selectedFacilityForDetails}
          facilityType={selectedFacilityForDetails?.type}
        />
      )}
    </div>
  );
}

export default App; 