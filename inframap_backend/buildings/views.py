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