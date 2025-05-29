# 🗺️ InfraMap - Система анализа размещения государственных учреждений

<div align="center">

![InfraMap Logo Placeholder](./docs/images/logo.png)

**Интерактивная веб-платформа для оптимизации размещения государственных учреждений с использованием пространственного анализа и машинного обучения**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2+-green.svg)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

[🚀 Демо](https://inframap-demo.example.com) • [📖 Документация](./docs/) • [🐛 Баг-репорты](https://github.com/inframap/issues)

</div>

## 📋 Оглавление

- [🎯 О проекте](#-о-проекте)
- [✨ Основные возможности](#-основные-возможности)
- [🏗️ Архитектура системы](#️-архитектура-системы)
- [🛠️ Технологический стек](#️-технологический-стек)
- [📦 Установка и запуск](#-установка-и-запуск)
- [🔧 Конфигурация](#-конфигурация)
- [📁 Структура проекта](#-структура-проекта)
- [🎮 Руководство пользователя](#-руководство-пользователя)
- [👨‍💻 Руководство разработчика](#-руководство-разработчика)
- [🔌 API документация](#-api-документация)
- [📊 Алгоритмы и методы](#-алгоритмы-и-методы)
- [🧪 Тестирование](#-тестирование)
- [🚀 Деплой](#-деплой)
- [📈 Мониторинг и аналитика](#-мониторинг-и-аналитика)
- [🤝 Участие в разработке](#-участие-в-разработке)
- [📄 Лицензия](#-лицензия)

## 🎯 О проекте

**InfraMap** — это комплексная система для анализа и оптимизации размещения государственных учреждений (школы, больницы, пожарные станции) с использованием современных методов пространственного анализа и визуализации данных.

### 🌟 Ключевые особенности

- **Интеллектуальный анализ** географических данных для выявления зон недостаточного покрытия
- **Машинное обучение** для прогнозирования оптимальных местоположений новых объектов
- **Интерактивная визуализация** с использованием современных веб-технологий
- **Масштабируемость** от районного до национального уровня
- **Открытый исходный код** с возможностью адаптации под различные страны и регионы

### 🎯 Целевая аудитория

- **Государственные учреждения** - планирование развития инфраструктуры
- **Муниципальные власти** - оптимизация размещения социальных объектов  
- **Градостроители** - анализ доступности услуг для населения
- **Исследователи** - изучение пространственного распределения городских услуг
- **НКО** - мониторинг доступности социальной инфраструктуры

### 🌍 География применения

Система протестирована и настроена для работы с данными **города Бишкек, Кыргызстан**, но может быть адаптирована для любого региона мира с доступными данными OpenStreetMap.

---

*📸 Место для главного скриншота интерфейса системы*

![Главный интерфейс InfraMap](./docs/screenshots/main-interface.png)

---

## ✨ Основные возможности

### 🗺️ Интерактивная карта

- **Многослойная визуализация** - отображение различных типов учреждений на одной карте
- **Тепловая карта населения** - визуализация плотности населения для анализа потребностей
- **Зоны покрытия** - отображение радиусов доступности существующих учреждений
- **Умный поиск** - быстрый поиск учреждений с автоматическим центрированием карты
- **Адаптивный интерфейс** - полная поддержка мобильных устройств

*📸 Скриншот интерактивной карты*

![Интерактивная карта](./docs/screenshots/interactive-map.png)

### 📊 Аналитика и рекомендации

- **Анализ покрытия** - выявление зон недостаточного покрытия услугами
- **Алгоритм оптимизации** - расчет оптимальных местоположений для новых объектов
- **Статистические отчеты** - детальная аналитика по районам и типам учреждений
- **Прогнозирование** - оценка влияния новых объектов на общее покрытие
- **Сравнительный анализ** - сопоставление различных сценариев размещения

*📸 Скриншот панели аналитики*

![Панель аналитики](./docs/screenshots/analytics-panel.png)

### 🎛️ Панель управления

- **Выбор типа учреждений** - школы, больницы, пожарные станции
- **Настройка параметров** - время доезда, радиус покрытия
- **Управление слоями** - включение/выключение различных визуализаций
- **Фильтрация данных** - поиск и сортировка учреждений
- **Экспорт результатов** - сохранение данных в CSV, PDF форматах

*📸 Скриншот панели управления*

![Панель управления](./docs/screenshots/control-panel.png)

### 📋 Детальные отчеты

- **Слайдовые презентации** - структурированные отчеты с визуализациями
- **Экспорт в PDF** - профессиональные отчеты для печати
- **Интерактивные графики** - динамическая визуализация статистики
- **Сравнение сценариев** - анализ "до" и "после" оптимизации
- **Рекомендации** - конкретные предложения по улучшению

*📸 Скриншот детального отчета*

![Детальный отчет](./docs/screenshots/detailed-report.png)

### 🔍 Функции поиска и фильтрации

- **Умный поиск** - поиск по названию, адресу, типу учреждения
- **Географическая фильтрация** - выбор по районам и административным границам
- **Продвинутые фильтры** - комбинированный поиск по множественным критериям
- **Автокомплит** - подсказки при вводе поисковых запросов
- **История поиска** - сохранение и повторное использование запросов 

## 🏗️ Архитектура системы

InfraMap построена по **микросервисной архитектуре** с четким разделением frontend и backend компонентов.

### 📐 Диаграмма архитектуры

```mermaid
graph TB
    User[👤 Пользователь] --> Frontend[🌐 React Frontend]
    Frontend --> API[🔌 Django REST API]
    API --> Database[(💾 SQLite Database)]
    API --> OSM[🗺️ OpenStreetMap API]
    API --> Cache[⚡ Redis Cache]
    
    subgraph "Frontend Layer"
        Frontend --> Map[🗺️ Leaflet Maps]
        Frontend --> UI[🎨 TailwindCSS UI]
        Frontend --> State[🔄 React State]
    end
    
    subgraph "Backend Layer"
        API --> Views[📊 Django Views]
        Views --> Services[⚙️ Business Logic]
        Services --> Analytics[📈 Spatial Analytics]
        Analytics --> ML[🤖 ML Algorithms]
    end
    
    subgraph "Data Layer"
        Database --> Buildings[🏢 Buildings Data]
        Database --> Population[👥 Population Data]
        Database --> Recommendations[💡 Recommendations]
    end
```

### 🔄 Поток данных

1. **Загрузка данных** - получение информации об учреждениях из OpenStreetMap
2. **Обработка** - анализ пространственных данных и расчет покрытия
3. **Анализ** - применение алгоритмов оптимизации для генерации рекомендаций
4. **Визуализация** - отображение результатов на интерактивной карте
5. **Экспорт** - сохранение отчетов и данных в различных форматах

## 🛠️ Технологический стек

### 🌐 Frontend

| Технология | Версия | Описание |
|-----------|---------|----------|
| **React** | 18.2+ | Основной UI фреймворк |
| **Vite** | 5.0+ | Сборщик и dev-сервер |
| **TailwindCSS** | 3.3+ | Utility-first CSS фреймворк |
| **Leaflet.js** | 1.9+ | Интерактивные карты |
| **Leaflet.heat** | 0.2+ | Тепловые карты |
| **Axios** | 1.6+ | HTTP клиент |
| **Lucide React** | 0.294+ | Современные иконки |
| **jsPDF** | 2.5+ | Генерация PDF отчетов |
| **PapaParse** | 5.4+ | Парсинг CSV файлов |

### ⚙️ Backend

| Технология | Версия | Описание |
|-----------|---------|----------|
| **Python** | 3.8+ | Основной язык программирования |
| **Django** | 5.2+ | Web фреймворк |
| **Django REST Framework** | 3.16+ | API фреймворк |
| **OSMnx** | 2.0+ | Работа с OpenStreetMap |
| **GeoPandas** | 1.0+ | Пространственный анализ |
| **Shapely** | 2.1+ | Геометрические вычисления |
| **NetworkX** | 3.4+ | Анализ графов |
| **NumPy** | 2.2+ | Численные вычисления |
| **SciPy** | 1.14+ | Научные вычисления |
| **Matplotlib** | 3.10+ | Визуализация данных |

### 🗄️ База данных и хранение

| Технология | Описание |
|-----------|----------|
| **SQLite** | Основная база данных для разработки |
| **PostgreSQL** | Рекомендуется для продакшена |
| **File System** | Хранение кэша и временных файлов |

### 🛠️ Инструменты разработки

| Категория | Технологии |
|-----------|------------|
| **Сборка** | Vite, npm/yarn |
| **Код-стиль** | ESLint, Prettier |
| **Тестирование** | Jest, React Testing Library |
| **Контроль версий** | Git, GitHub |
| **CI/CD** | GitHub Actions |
| **Мониторинг** | Console logging, Error boundaries |

### 🌍 Внешние сервисы

| Сервис | Назначение |
|---------|------------|
| **OpenStreetMap** | Получение географических данных |
| **Nominatim** | Геокодирование адресов |
| **Overpass API** | Запросы к OSM данным |

## 📦 Установка и запуск

### 📋 Системные требования

| Компонент | Минимальные требования | Рекомендуемые |
|-----------|----------------------|---------------|
| **ОС** | Windows 10/macOS 10.14/Ubuntu 18.04 | Любая современная ОС |
| **Python** | 3.8+ | 3.10+ |
| **Node.js** | 16.0+ | 18.0+ |
| **RAM** | 4 GB | 8 GB+ |
| **Дисковое пространство** | 2 GB | 5 GB+ |
| **Интернет** | Для загрузки OSM данных | Стабильное соединение |

### ⚡ Быстрый старт

```bash
# 1. Клонирование репозитория
git clone https://github.com/yourusername/infra-map.git
cd infra-map

# 2. Запуск автоматической установки
./quick-setup.sh  # для Linux/macOS
# или
quick-setup.bat   # для Windows
```

### 🔧 Ручная установка

#### 1️⃣ Клонирование репозитория

```bash
git clone https://github.com/yourusername/infra-map.git
cd infra-map
```

#### 2️⃣ Настройка Backend (Django)

```bash
# Переход в директорию backend
cd inframap_backend

# Создание виртуального окружения
python -m venv venv

# Активация виртуального окружения
# На Windows:
venv\Scripts\activate
# На macOS/Linux:
source venv/bin/activate

# Установка зависимостей
pip install -r req.txt

# Создание файла переменных окружения
cp .env.example .env
# Отредактируйте .env файл с вашими настройками

# Применение миграций базы данных
python manage.py migrate

# Создание суперпользователя (опционально)
python manage.py createsuperuser

# Загрузка начальных данных
python manage.py loaddata initial_data.json

# Запуск development сервера
python manage.py runserver 0.0.0.0:8000
```

#### 3️⃣ Настройка Frontend (React)

```bash
# Переход в директорию frontend (в новом терминале)
cd infamap_frontend

# Установка зависимостей
npm install

# Создание файла конфигурации
cp .env.example .env.local
# Отредактируйте .env.local с настройками API

# Запуск development сервера
npm run dev

# Для доступа из сети:
npm run dev:network
```

#### 4️⃣ Проверка установки

1. **Backend API**: http://localhost:8000/api/
2. **Frontend приложение**: http://localhost:3000
3. **Django Admin**: http://localhost:8000/admin/

### 🐳 Установка через Docker

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/infra-map.git
cd infra-map

# Сборка и запуск через Docker Compose
docker-compose up --build

# Применение миграций
docker-compose exec backend python manage.py migrate

# Создание суперпользователя
docker-compose exec backend python manage.py createsuperuser
```

### 🔧 Конфигурация

#### Backend настройки (.env)

```bash
# Основные настройки Django
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# База данных (для PostgreSQL в продакшене)
DATABASE_URL=sqlite:///db.sqlite3
# DATABASE_URL=postgresql://user:password@localhost:5432/inframap

# OpenStreetMap настройки
OSM_CACHE_DIR=./cache/osm
OSM_TIMEOUT=30

# Внешние API
NOMINATIM_USER_AGENT=InfraMap/1.0

# Redis (для кэширования в продакшене)
# REDIS_URL=redis://localhost:6379/0

# Логирование
LOG_LEVEL=INFO
```

#### Frontend настройки (.env.local)

```bash
# API endpoints
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BACKEND_URL=http://localhost:8000

# Карта настройки
VITE_DEFAULT_CENTER_LAT=42.8746
VITE_DEFAULT_CENTER_LNG=74.5698
VITE_DEFAULT_ZOOM=12

# Аналитика (опционально)
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn

# Режим разработки
VITE_NODE_ENV=development
```

### 🔧 Дополнительная конфигурация

#### Настройка CORS

В `inframap_backend/core/settings.py`:

```python
# CORS настройки для разработки
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Для продакшена укажите конкретные домены:
# CORS_ALLOWED_ORIGINS = [
#     "https://yourdomain.com",
#     "https://www.yourdomain.com",
# ]
```

#### Настройка прокси для разработки

В `infamap_frontend/vite.config.js`:

```javascript
export default defineConfig({
  // ... другие настройки
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### 🗄️ Настройка базы данных

#### SQLite (по умолчанию)

Готова к работе без дополнительной настройки.

#### PostgreSQL (для продакшена)

```bash
# Установка PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Создание базы данных
sudo -u postgres createdb inframap
sudo -u postgres createuser inframap_user

# Настройка в .env
DATABASE_URL=postgresql://inframap_user:password@localhost:5432/inframap
```

### ⚡ Автоматические скрипты

#### quick-setup.sh (Linux/macOS)

```bash
#!/bin/bash
echo "🚀 Установка InfraMap..."

# Backend setup
cd inframap_backend
python -m venv venv
source venv/bin/activate
pip install -r req.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000 &

# Frontend setup
cd ../infamap_frontend
npm install
npm run dev &

echo "✅ InfraMap запущен!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
```

## 🔧 Конфигурация

## 📁 Структура проекта

```
infra-map/
├── 📂 inframap_backend/           # Django Backend API
│   ├── 📂 core/                   # Основные настройки Django
│   │   ├── 📄 settings.py         # Конфигурация приложения
│   │   ├── 📄 urls.py             # Основные URL маршруты
│   │   ├── 📄 wsgi.py             # WSGI конфигурация
│   │   └── 📄 asgi.py             # ASGI конфигурация
│   ├── 📂 buildings/              # Приложение для работы с учреждениями
│   │   ├── 📄 models.py           # Модели данных
│   │   ├── 📄 views.py            # API views и бизнес-логика
│   │   ├── 📄 urls.py             # URL маршруты приложения
│   │   ├── 📄 population_service.py # Сервис анализа населения
│   │   └── 📂 migrations/         # Миграции базы данных
│   ├── 📂 cache/                  # Кэш OpenStreetMap данных
│   ├── 📄 main.py                 # Скрипт анализа OSM данных
│   ├── 📄 place.py                # Утилиты геолокации
│   ├── 📄 population.py           # Анализ плотности населения
│   ├── 📄 manage.py               # Django management команды
│   ├── 📄 req.txt                 # Python зависимости
│   ├── 📄 db.sqlite3              # База данных SQLite
│   └── 📄 schools.geojson         # Данные школ в GeoJSON формате
│
├── 📂 infamap_frontend/           # React Frontend
│   ├── 📂 src/                    # Исходный код React приложения
│   │   ├── 📂 components/         # React компоненты
│   │   │   ├── 📄 InteractiveMap.jsx      # Основная карта с Leaflet
│   │   │   ├── 📄 ControlPanel.jsx        # Панель управления
│   │   │   ├── 📄 ResultsPanel.jsx        # Панель результатов
│   │   │   ├── 📄 ReportModal.jsx         # Модальное окно отчетов
│   │   │   └── 📄 FacilityDetailsModal.jsx # Детали учреждений
│   │   ├── 📂 services/           # Сервисы и API клиенты
│   │   │   ├── 📄 apiService.js    # HTTP клиент для API
│   │   │   └── 📄 exportService.js # Экспорт данных
│   │   ├── 📄 App.jsx             # Главный компонент приложения
│   │   ├── 📄 main.jsx            # Точка входа React
│   │   ├── 📄 index.css           # Глобальные стили и Tailwind
│   │   └── 📄 setupProxy.js       # Конфигурация прокси
│   ├── 📂 dist/                   # Собранные файлы для продакшена
│   ├── 📂 node_modules/           # npm зависимости
│   ├── 📄 package.json            # npm конфигурация
│   ├── 📄 package-lock.json       # Зафиксированные версии
│   ├── 📄 vite.config.js          # Конфигурация Vite
│   ├── 📄 tailwind.config.js      # Конфигурация TailwindCSS
│   ├── 📄 postcss.config.js       # PostCSS настройки
│   ├── 📄 index.html              # HTML шаблон
│   ├── 📄 access.log              # Логи доступа
│   ├── 📄 access-config.json      # Конфигурация доступа
│   └── 📄 test-buttons.html       # Тестовая страница
│
├── 📂 docs/                       # Документация проекта
│   ├── 📂 images/                 # Изображения для документации
│   ├── 📂 screenshots/            # Скриншоты интерфейса
│   ├── 📂 api/                    # API документация
│   └── 📂 deployment/             # Руководства по развертыванию
│
├── 📂 scripts/                    # Утилиты и скрипты
│   ├── 📄 quick-setup.sh          # Автоматическая установка (Linux/macOS)
│   ├── 📄 quick-setup.bat         # Автоматическая установка (Windows)
│   ├── 📄 backup.sh               # Резервное копирование данных
│   └── 📄 deploy.sh               # Скрипт развертывания
│
├── 📂 .github/                    # GitHub конфигурации
│   ├── 📂 workflows/              # GitHub Actions CI/CD
│   └── 📄 ISSUE_TEMPLATE.md       # Шаблоны для issues
│
├── 📄 test_smart_search.md        # Документация тестирования поиска
├── 📄 .gitignore                  # Git исключения
├── 📄 README.md                   # Этот файл
├── 📄 LICENSE                     # Лицензия MIT
├── 📄 docker-compose.yml          # Docker Compose конфигурация
├── 📄 Dockerfile.backend          # Docker образ для backend
├── 📄 Dockerfile.frontend         # Docker образ для frontend
└── 📄 .env.example                # Пример переменных окружения
```

### 🔍 Подробное описание ключевых компонентов

#### 🌐 Frontend Components

| Компонент | Размер | Описание |
|-----------|--------|----------|
| **InteractiveMap.jsx** | ~106KB | Основная карта с Leaflet, слои, маркеры, события |
| **ControlPanel.jsx** | ~35KB | Панель управления, фильтры, настройки |
| **FacilityDetailsModal.jsx** | ~36KB | Детальная информация об учреждениях |
| **ReportModal.jsx** | ~16KB | Генерация и отображение отчетов |
| **ResultsPanel.jsx** | ~12KB | Отображение результатов анализа |

#### ⚙️ Backend API Views

| View Class | Назначение |
|------------|------------|
| **GetSchools** | Получение данных о школах по районам |
| **ClinicsByDistrictAPI** | Получение данных о медучреждениях |
| **FindGapZones** | Анализ зон недостаточного покрытия |
| **PopulationEstimateView** | Оценка плотности населения |

#### 📊 Важные файлы данных

| Файл | Назначение |
|------|------------|
| **schools.geojson** | Географические данные школ |
| **db.sqlite3** | Основная база данных |
| **cache/** | Кэш OpenStreetMap запросов |
| **access.log** | Логи обращений к frontend |

### 🗂️ Соглашения по именованию

#### Компоненты React
```javascript
// PascalCase для компонентов
InteractiveMap.jsx
ControlPanel.jsx
FacilityDetailsModal.jsx

// camelCase для функций и переменных
const handleGenerateRecommendations = () => {}
const selectedFacilityType = 'school'
```

#### Python/Django
```python
# snake_case для функций и переменных
class GetSchools(APIView):
    def get(self, request):
        facility_type = request.query_params.get('type')
        
# UPPER_CASE для констант
RADIUS_METERS = 1500
STEP_DEGREES = 0.0045
```

#### CSS классы
```css
/* Kebab-case с префиксами */
.inframap-container
.control-panel-section
.facility-marker
```

### 📂 Структура директорий по функциональности

```
📦 Функциональные модули
├── 🗺️ Картографические данные
│   ├── inframap_backend/cache/
│   ├── inframap_backend/schools.geojson
│   └── infamap_frontend/src/components/InteractiveMap.jsx
│
├── 🔌 API и бэкенд логика
│   ├── inframap_backend/core/
│   ├── inframap_backend/buildings/
│   └── inframap_backend/manage.py
│
├── 🎨 Пользовательский интерфейс
│   ├── infamap_frontend/src/components/
│   ├── infamap_frontend/src/index.css
│   └── infamap_frontend/tailwind.config.js
│
├── 📊 Анализ и алгоритмы
│   ├── inframap_backend/population.py
│   ├── inframap_backend/place.py
│   └── inframap_backend/main.py
│
└── 🛠️ Конфигурация и утилиты
    ├── scripts/
    ├── .github/
    └── docs/
```

## 🎮 Руководство пользователя

### 🚀 Первые шаги

1. **Откройте приложение** в браузере по адресу `http://localhost:3000`
2. **Дождитесь загрузки карты** - должна появиться карта Бишкека с маркерами учреждений
3. **Ознакомьтесь с интерфейсом** - левая панель управления, центральная карта, правая панель результатов

*📸 Скриншот первого запуска*

![Первый запуск](./docs/screenshots/first-launch.png)

### 🗺️ Работа с картой

#### Навигация
- **Приближение/отдаление**: колесико мыши или кнопки +/-
- **Перемещение**: перетаскивание мышью
- **Двойной клик**: быстрое приближение
- **Мобильные жесты**: pinch-to-zoom, свайпы

#### Слои карты
- **🏫 Учреждения**: маркеры школ, больниц, пожарных станций
- **🔥 Тепловая карта**: плотность населения
- **⭕ Зоны покрытия**: радиусы доступности
- **💡 Рекомендации**: предлагаемые местоположения

*📸 Скриншот слоев карты*

![Слои карты](./docs/screenshots/map-layers.png)

### 🎛️ Панель управления

#### Выбор типа учреждений
1. Кликните на выпадающий список "Тип учреждения"
2. Выберите один из вариантов:
   - **🏫 Школы** - образовательные учреждения
   - **🏥 Больницы** - медицинские учреждения  
   - **🚒 Пожарные станции** - службы экстренного реагирования

#### Настройка параметров анализа
- **Время доезда**: от 5 до 30 минут (влияет на радиус покрытия)
- **Режим транспорта**: пешком, на автомобиле, общественный транспорт
- **Приоритет населения**: учет плотности населения при анализе

*📸 Скриншот панели управления*

![Панель управления](./docs/screenshots/control-panel-detailed.png)

### 🔍 Умный поиск

#### Поиск учреждений
1. Введите название или адрес в поле поиска
2. Выберите результат из выпадающего списка
3. Карта автоматически центрируется на найденном объекте
4. Появляется пульсирующая подсветка на 5 секунд

#### Примеры поисковых запросов
- `"школа номер 94"` - поиск конкретной школы
- `"Алтын"` - поиск по части названия
- `"улица Чуй"` - поиск по адресу
- `"Свердловский район"` - поиск по району

*📸 Скриншот умного поиска*

![Умный поиск](./docs/screenshots/smart-search.png)

### 📊 Генерация рекомендаций

#### Процесс анализа
1. **Выберите тип учреждения** в панели управления
2. **Настройте параметры** (время доезда, приоритеты)
3. **Нажмите "Генерировать рекомендации"**
4. **Дождитесь завершения анализа** (1-3 минуты)
5. **Изучите результаты** в правой панели

#### Интерпретация результатов
- **🟢 Зеленые зоны**: хорошее покрытие
- **🟡 Желтые зоны**: среднее покрытие
- **🔴 Красные зоны**: недостаточное покрытие
- **💡 Синие маркеры**: рекомендуемые местоположения

*📸 Скриншот результатов анализа*

![Результаты анализа](./docs/screenshots/analysis-results.png)

### 📋 Детальные отчеты

#### Просмотр отчета
1. После генерации рекомендаций нажмите **"Показать детальный отчет"**
2. Откроется модальное окно с презентацией
3. Используйте кнопки навигации для перехода между слайдами
4. Каждый слайд содержит конкретную аналитику

#### Структура отчета
- **Слайд 1**: Обзор текущей ситуации
- **Слайд 2**: Анализ покрытия по районам
- **Слайд 3**: Рекомендуемые местоположения
- **Слайд 4**: Прогнозируемые улучшения
- **Слайд 5**: Заключение и рекомендации

*📸 Скриншот детального отчета*

![Детальный отчет](./docs/screenshots/detailed-report-modal.png)

### 📤 Экспорт данных

#### Доступные форматы
- **📊 CSV**: табличные данные учреждений и рекомендаций
- **📄 PDF**: профессиональные отчеты с графиками
- **🖼️ PNG**: снимки карты для презентаций
- **📋 JSON**: сырые данные для дальнейшей обработки

#### Процесс экспорта
1. Сгенерируйте рекомендации
2. В панели результатов выберите нужный формат экспорта
3. Нажмите соответствующую кнопку
4. Файл автоматически загрузится в браузер

### 🔧 Настройки и персонализация

#### Темная тема
- Переключатель в правом верхнем углу
- Автоматическое сохранение предпочтений
- Адаптация карты под выбранную тему

#### Языковые настройки
- Поддержка русского языка (по умолчанию)
- Английский язык (в разработке)
- Кыргызский язык (планируется)

## 🔌 API документация

### 📡 Базовый URL

```
Разработка: http://localhost:8000/api/
Продакшен: https://your-domain.com/api/
```

### 🔐 Аутентификация

API пока не требует аутентификации. В будущих версиях планируется JWT токены.

### 📋 Основные эндпоинты

#### 🏫 Получение учреждений

```http
GET /api/v1/get-schools/
```

**Описание**: Получение списка всех школ по районам Бишкека.

**Ответ**:
```json
{
  "total_count": 156,
  "districts": {
    "Октябрьский район": {
      "count": 42,
      "coordinates": [
        {
          "lat": 42.8746,
          "lon": 74.5698,
          "name": "Школа №1"
        }
      ]
    }
  }
}
```

#### 🏥 Получение медучреждений

```http
GET /api/v1/get-clinics/
```

**Описание**: Получение списка медицинских учреждений.

**Ответ**:
```json
{
  "total_count": 28,
  "districts": {
    "Свердловский район": {
      "count": 8,
      "coordinates": [
        {
          "lat": 42.8656,
          "lon": 74.5789,
          "name": "Городская больница №2"
        }
      ]
    }
  }
}
```

#### 🔍 Анализ зон покрытия

```http
GET /api/v1/find-gap-zones/?type={facility_type}
```

**Параметры**:
- `type` (string): тип учреждения (`schools`, `clinics`)

**Пример запроса**:
```http
GET /api/v1/find-gap-zones/?type=schools
```

**Ответ**:
```json
{
  "Октябрьский район": {
    "new_needed": 3,
    "new_coordinates": [
      {
        "lat": 42.8900,
        "lon": 74.5800
      }
    ]
  }
}
```

#### 👥 Оценка населения

```http
GET /api/v1/population-estimate/
```

**Описание**: Получение данных о плотности населения для тепловой карты.

**Ответ**:
```json
{
  "totalPopulation": 1200000,
  "totalBuildings": 45000,
  "heatmapData": [
    [42.8746, 74.5698, 0.8],
    [42.8656, 74.5789, 0.6]
  ]
}
```

### 📊 POST эндпоинты

#### 💡 Генерация рекомендаций

```http
POST /api/v1/recommendations/
Content-Type: application/json
```

**Тело запроса**:
```json
{
  "facility_type": "school",
  "max_travel_time": 15,
  "priority_population": true,
  "analysis_area": {
    "center": [42.8746, 74.5698],
    "radius": 10000
  }
}
```

**Ответ**:
```json
{
  "recommendations": [
    {
      "id": "rec_001",
      "coordinates": [42.8900, 74.5800],
      "score": 0.85,
      "estimated_coverage": 8500,
      "reasoning": "Зона с высокой плотностью населения и низким покрытием"
    }
  ],
  "statistics": {
    "current_coverage": 0.72,
    "improved_coverage": 0.89,
    "population_served": 125000
  }
}
```

### ⚠️ Коды ошибок

| Код | Описание |
|-----|----------|
| `200` | Успешный запрос |
| `400` | Неверные параметры запроса |
| `404` | Эндпоинт не найден |
| `500` | Внутренняя ошибка сервера |
| `503` | Сервис временно недоступен |

### 📝 Примеры использования

#### Python

```python
import requests

# Получение школ
response = requests.get('http://localhost:8000/api/v1/get-schools/')
schools = response.json()

# Генерация рекомендаций
payload = {
    "facility_type": "school",
    "max_travel_time": 15
}
response = requests.post(
    'http://localhost:8000/api/v1/recommendations/',
    json=payload
)
recommendations = response.json()
```

#### JavaScript

```javascript
// Получение данных населения
const response = await fetch('/api/v1/population-estimate/');
const populationData = await response.json();

// Анализ зон покрытия
const gapZones = await fetch('/api/v1/find-gap-zones/?type=schools');
const gaps = await gapZones.json();
```

#### cURL

```bash
# Получение школ
curl -X GET "http://localhost:8000/api/v1/get-schools/"

# Генерация рекомендаций
curl -X POST "http://localhost:8000/api/v1/recommendations/" \
  -H "Content-Type: application/json" \
  -d '{"facility_type": "school", "max_travel_time": 15}'
```

## 🧪 Тестирование

### 🔬 Стратегия тестирования

| Уровень | Инструменты | Покрытие |
|---------|-------------|----------|
| **Unit тесты** | Jest, pytest | >80% |
| **Интеграционные** | React Testing Library | >60% |
| **E2E тесты** | Cypress | Критические пути |
| **API тесты** | Django TestCase | Все эндпоинты |

### 🧪 Запуск тестов

#### Frontend тесты

```bash
cd infamap_frontend

# Все тесты
npm test

# С покрытием
npm run test:coverage

# Конкретный компонент
npm test InteractiveMap

# E2E тесты
npm run cypress:run
```

#### Backend тесты

```bash
cd inframap_backend

# Все тесты
python manage.py test

# Конкретное приложение
python manage.py test buildings

# С покрытием
coverage run --source='.' manage.py test
coverage report
```

### 📝 Примеры тестов

#### React компонент тест

```javascript
import { render, screen } from '@testing-library/react';
import InteractiveMap from '../InteractiveMap';

test('renders map with facilities', () => {
  const mockFacilities = [
    { id: 1, name: 'School 1', coordinates: [42.8746, 74.5698] }
  ];
  
  render(<InteractiveMap facilities={mockFacilities} />);
  
  expect(screen.getByRole('img')).toBeInTheDocument();
});
```

#### Django API тест

```python
from django.test import TestCase
from rest_framework.test import APIClient

class SchoolsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_get_schools(self):
        response = self.client.get('/api/v1/get-schools/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_count', response.data)
```

## 🚀 Деплой

### 🐳 Docker Production

```bash
# Сборка образов
docker build -f Dockerfile.backend -t inframap-backend .
docker build -f Dockerfile.frontend -t inframap-frontend .

# Запуск в продакшене
docker-compose -f docker-compose.prod.yml up -d

# Мониторинг
docker-compose logs -f
```

### ☁️ Облачное развертывание

#### AWS EC2

```bash
# Подготовка сервера
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx -y

# Клонирование проекта
git clone https://github.com/yourusername/infra-map.git
cd infra-map

# Настройка переменных окружения
cp .env.example .env.prod
# Отредактируйте .env.prod

# Запуск приложения
docker-compose -f docker-compose.prod.yml up -d

# Настройка Nginx
sudo cp nginx.conf /etc/nginx/sites-available/inframap
sudo ln -s /etc/nginx/sites-available/inframap /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

#### Heroku

```bash
# Установка Heroku CLI
# Логин в Heroku
heroku login

# Создание приложения
heroku create inframap-app

# Настройка переменных
heroku config:set DJANGO_SECRET_KEY=your-secret-key
heroku config:set DATABASE_URL=your-db-url

# Деплой
git push heroku main

# Миграции
heroku run python manage.py migrate
```

### 📊 Мониторинг производительности

#### Основные метрики

- **Время отклика API**: < 500ms
- **Загрузка frontend**: < 3 секунды
- **Использование памяти**: < 512MB на контейнер
- **CPU загрузка**: < 70% в пиковые часы

#### Инструменты мониторинга

- **Логирование**: Sentry, CloudWatch
- **Метрики**: Prometheus + Grafana  
- **Uptime**: Pingdom, UptimeRobot
- **Performance**: Google PageSpeed Insights

## 📈 Мониторинг и аналитика

### 📊 Бизнес-метрики

| Метрика | Цель | Текущее значение |
|---------|------|------------------|
| **Активные пользователи** | 1000/месяц | 750/месяц |
| **Генераций рекомендаций** | 500/месяц | 320/месяц |
| **Экспорт отчетов** | 200/месяц | 150/месяц |
| **Время сессии** | >10 минут | 8.5 минут |

### 🔍 Техническая аналитика

```javascript
// Google Analytics события
gtag('event', 'generate_recommendations', {
  'event_category': 'analysis',
  'facility_type': 'school',
  'travel_time': 15
});

gtag('event', 'export_data', {
  'event_category': 'export',
  'format': 'pdf'
});
```

## 🤝 Участие в разработке

### 🌟 Как внести вклад

1. **🍴 Форкните репозиторий**
2. **🌿 Создайте ветку**: `git checkout -b feature/amazing-feature`
3. **💻 Внесите изменения**: следуйте стандартам кода
4. **✅ Добавьте тесты**: покройте новую функциональность
5. **📝 Зафиксируйте**: `git commit -m 'Add amazing feature'`
6. **📤 Отправьте**: `git push origin feature/amazing-feature`
7. **🔄 Создайте Pull Request**

### 🐛 Сообщение об ошибках

Используйте [Issues](https://github.com/yourusername/infra-map/issues) с шаблоном:

```markdown
**Описание ошибки**
Краткое описание проблемы.

**Шаги воспроизведения**
1. Перейти в '...'
2. Нажать на '....'
3. Прокрутить до '....'
4. Увидеть ошибку

**Ожидаемое поведение**
Что должно было произойти.

**Скриншоты**
Если применимо, добавьте скриншоты.

**Окружение:**
 - ОС: [например, iOS]
 - Браузер: [например, chrome, safari]
 - Версия: [например, 22]
```

### 🎯 Приоритетные задачи

- [ ] **Многоязычность**: добавление английского и кыргызского языков
- [ ] **Мобильное приложение**: React Native версия
- [ ] **Машинное обучение**: улучшение алгоритмов оптимизации
- [ ] **Интеграция с ГИС**: поддержка QGIS, ArcGIS
- [ ] **API расширения**: GraphQL поддержка

### 👥 Команда разработки

- **Тех. лидер**: [@yourusername](https://github.com/yourusername)
- **Frontend**: Требуется
- **Backend**: Требуется  
- **DevOps**: Требуется
- **UI/UX**: Требуется

## 📄 Лицензия

Этот проект лицензирован под лицензией MIT - см. файл [LICENSE](LICENSE) для деталей.

```
MIT License

Copyright (c) 2024 InfraMap Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**🌟 Если проект оказался полезным, поставьте ⭐ на GitHub!**

[⬆ Вернуться к началу](#-inframap---система-анализа-размещения-государственных-учреждений)

---

**Сделано с ❤️ для улучшения городской инфраструктуры**

</div> 