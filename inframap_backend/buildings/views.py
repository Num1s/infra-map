from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
import osmnx as ox
import numpy as np
import math
import requests
from shapely.geometry import Point
from geopy.distance import distance as geo_distance
import numpy as np
import requests
from scipy.spatial import KDTree
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from geopy.distance import geodesic

class GetSchools(APIView):
    def get(self, request):
        districts = [
            "Октябрьский район, город Бишкек, Киргизия",
            "Свердловский район, город Бишкек, Киргизия",
            "Ленинский район, город Бишкек, Киргизия",
            "Первомайский район, город Бишкек, Киргизия"
        ]

        tags = {'amenity': 'school'}
        result = {}
        total_count = 0

        for district in districts:
            try:
                gdf = ox.features_from_place(district, tags)
                names = gdf['name'].fillna('').str.lower()
                schools = gdf[
                    names.str.contains('школа') &
                    ~names.str.contains('авто|муз|спорт|искусств|центр|дополн')
                ]

                coords = []
                for _, row in schools.iterrows():
                    try:
                        geom = row.geometry
                        if geom.geom_type == 'Point':
                            point = geom
                        else:
                            point = geom.centroid

                        coords.append({
                            'lat': point.y,
                            'lon': point.x,
                            'name': row.get('name', 'Без названия')
                        })
                    except Exception:
                        continue

                district_name = district.split(',')[0]

                result[district_name] = {
                    'count': len(coords),
                    'coordinates': coords
                }

                total_count += len(coords)

            except Exception as e:
                result[district_name] = {'error': str(e)}

        return Response({
            'total_count': total_count,
            'districts': result
        })


class ClinicsByDistrictAPI(APIView):
    def get(self, request):
        districts = [
            "Октябрьский район, город Бишкек, Киргизия",
            "Свердловский район, город Бишкек, Киргизия",
            "Ленинский район, город Бишкек, Киргизия",
            "Первомайский район, город Бишкек, Киргизия"
        ]

        tags = {'amenity': 'clinic'}
        result = {}
        total_count = 0

        for district in districts:
            try:
                gdf = ox.features_from_place(district, tags)

                coords = []
                for _, row in gdf.iterrows():
                    try:
                        point = row.geometry.centroid
                        lat, lon = point.y, point.x

                        # Пропуск NaN координат
                        if np.isnan(lat) or np.isnan(lon):
                            continue

                        name = row.get('name')
                        if name is None or isinstance(name, float) and np.isnan(name):
                            name = "Без названия"

                        coords.append({
                            'lat': lat,
                            'lon': lon,
                            'name': name
                        })
                    except Exception:
                        continue

                result[district] = {
                    'count': len(coords),
                    'coordinates': coords
                }

                total_count += len(coords)

            except Exception as e:
                result[district] = {'error': str(e)}

        return Response({
            'total_count': total_count,
            'districts': result
        })

class FindGapZones(APIView):
    RADIUS_METERS = 2500  # радиус действия школы в метрах
    GRID_STEP_METERS = 1000  # шаг сетки в метрах

    def generate_grid(self, lat_min, lat_max, lon_min, lon_max):
        """
        Генерирует сетку точек (широта, долгота) с заданным шагом в метрах
        """
        def shift_lat(lat, meters):
            return lat + (meters / 111_320)  # приблизительно: 1 градус ≈ 111.32 км

        def shift_lon(lon, lat, meters):
            return lon + (meters / (40075000 * np.cos(np.radians(lat)) / 360))

        lat_points = []
        current_lat = lat_min
        while current_lat <= lat_max:
            lat_points.append(current_lat)
            current_lat = shift_lat(current_lat, self.GRID_STEP_METERS)

        lon_points = []
        current_lon = lon_min
        while current_lon <= lon_max:
            lon_points.append(current_lon)
            current_lon = shift_lon(current_lon, lat_min, self.GRID_STEP_METERS)

        grid = [(lat, lon) for lat in lat_points for lon in lon_points]
        return grid

    def get(self, request):
        # Кэшируем ответ get-schools
        schools_data = cache.get('cached_schools')
        if not schools_data:
            response = requests.get(request.build_absolute_uri('/api/v1/get-schools/'))
            if response.status_code != 200:
                return Response({'error': 'Ошибка получения школ'})

            schools_data = response.json()
            cache.set('cached_schools', schools_data, 60 * 60)  # кэш на 1 час

        all_coords = []
        for district in schools_data.get('districts', {}).values():
            for coord in district.get('coordinates', []):
                all_coords.append((coord['lat'], coord['lon']))

        if not all_coords:
            return Response({'error': 'Нет координат школ'})

        # Создаем KD-дерево для быстрого поиска ближайших школ
        tree = KDTree(all_coords)

        # Получаем границы города Бишкек (примерные)
        lat_min, lat_max = 42.80, 42.89
        lon_min, lon_max = 74.55, 74.75

        grid = self.generate_grid(lat_min, lat_max, lon_min, lon_max)

        bad_zones = []
        for point in grid:
            dist, idx = tree.query(point)
            nearest_school = all_coords[idx]
            geo_dist = geodesic(point, nearest_school).meters
            if geo_dist > self.RADIUS_METERS:
                bad_zones.append({
                    'lat': point[0],
                    'lon': point[1],
                    'distance_to_nearest_school': int(geo_dist)
                })

        return Response({
            'gap_zone_count': len(bad_zones),
            'gap_zones': bad_zones
        })

class FindWalkingGapZones(APIView):
    WALKING_RADIUS_METERS = 900  # 10 минут ходьбы (примерно 900 метров)
    GRID_STEP_METERS = 600  # шаг сетки меньше радиуса для лучшего покрытия
    MIN_GAP_DISTANCE = 1200  # минимальное расстояние между дырами чтобы они не перекрывались

    def generate_grid(self, lat_min, lat_max, lon_min, lon_max):
        """
        Генерирует сетку точек (широта, долгота) с заданным шагом в метрах
        """
        def shift_lat(lat, meters):
            return lat + (meters / 111_320)  # приблизительно: 1 градус ≈ 111.32 км

        def shift_lon(lon, lat, meters):
            return lon + (meters / (40075000 * np.cos(np.radians(lat)) / 360))

        lat_points = []
        current_lat = lat_min
        while current_lat <= lat_max:
            lat_points.append(current_lat)
            current_lat = shift_lat(current_lat, self.GRID_STEP_METERS)

        lon_points = []
        current_lon = lon_min
        while current_lon <= lon_max:
            lon_points.append(current_lon)
            current_lon = shift_lon(current_lon, lat_min, self.GRID_STEP_METERS)

        grid = [(lat, lon) for lat in lat_points for lon in lon_points]
        return grid

    def filter_non_overlapping_gaps(self, gap_zones):
        """
        Фильтрует дыры чтобы они не перекрывались друг с другом
        """
        if not gap_zones:
            return []

        # Сортируем по расстоянию до ближайшей школы (сначала самые большие дыры)
        sorted_gaps = sorted(gap_zones, key=lambda x: x['distance_to_nearest_school'], reverse=True)
        
        filtered_gaps = []
        
        for current_gap in sorted_gaps:
            current_point = (current_gap['lat'], current_gap['lon'])
            
            # Проверяем не перекрывается ли с уже добавленными дырами
            is_overlapping = False
            for existing_gap in filtered_gaps:
                existing_point = (existing_gap['lat'], existing_gap['lon'])
                distance = geodesic(current_point, existing_point).meters
                
                if distance < self.MIN_GAP_DISTANCE:
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                filtered_gaps.append(current_gap)
        
        return filtered_gaps

    def get(self, request):
        # Получаем данные школ (кэшируем для производительности)
        schools_data = cache.get('cached_schools')
        if not schools_data:
            response = requests.get(request.build_absolute_uri('/api/v1/get-schools/'))
            if response.status_code != 200:
                return Response({'error': 'Ошибка получения данных школ'})

            schools_data = response.json()
            cache.set('cached_schools', schools_data, 60 * 60)  # кэш на 1 час

        # Собираем все координаты школ
        all_school_coords = []
        for district in schools_data.get('districts', {}).values():
            for coord in district.get('coordinates', []):
                all_school_coords.append((coord['lat'], coord['lon']))

        if not all_school_coords:
            return Response({'error': 'Нет координат школ для анализа'})

        # Создаем KD-дерево для быстрого поиска ближайших школ
        tree = KDTree(all_school_coords)

        # Границы города Бишкек
        lat_min, lat_max = 42.80, 42.89
        lon_min, lon_max = 74.55, 74.75

        # Генерируем сетку точек для анализа
        grid = self.generate_grid(lat_min, lat_max, lon_min, lon_max)

        # Находим все потенциальные дыры (точки вне радиуса ходьбы от школ)
        potential_gaps = []
        for point in grid:
            dist, idx = tree.query(point)
            nearest_school = all_school_coords[idx]
            geo_dist = geodesic(point, nearest_school).meters
            
            if geo_dist > self.WALKING_RADIUS_METERS:
                potential_gaps.append({
                    'lat': point[0],
                    'lon': point[1],
                    'distance_to_nearest_school': int(geo_dist),
                    'walking_time_minutes': round(geo_dist / 90, 1)  # примерно 90 м/мин средняя скорость ходьбы
                })

        # Фильтруем дыры чтобы они не перекрывались
        filtered_gaps = self.filter_non_overlapping_gaps(potential_gaps)

        return Response({
            'walking_radius_meters': self.WALKING_RADIUS_METERS,
            'walking_time_minutes': 10,
            'total_potential_gaps': len(potential_gaps),
            'filtered_gap_count': len(filtered_gaps),
            'gap_zones': filtered_gaps,
            'analysis_info': {
                'grid_step_meters': self.GRID_STEP_METERS,
                'min_gap_distance_meters': self.MIN_GAP_DISTANCE,
                'total_schools_analyzed': len(all_school_coords)
            }
        })