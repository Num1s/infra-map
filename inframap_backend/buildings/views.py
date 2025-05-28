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
import os

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
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from geopy.distance import geodesic
import numpy as np

RADIUS_METERS = 1500  # Радиус охвата
STEP_DEGREES = 0.0045  # ~500 метров

class FindGapZones(APIView):
    def get(self, request):
        object_type = request.query_params.get("type", "schools")
        if object_type not in ["schools", "clinics"]:
            return Response({"error": "Недопустимый тип. Используйте 'schools' или 'clinics'."}, status=400)

        try:
            base_url = os.getenv("INTERNAL_SERVER_URL", "http://127.0.0.1:8000")
            endpoint = f"/api/v1/get-{object_type}/"
            response = requests.get(f"{base_url}{endpoint}")
            if response.status_code != 200:
                return Response({"error": f"Не удалось получить данные о {object_type}"}, status=500)
            data = response.json()
        except requests.RequestException as e:
            return Response({"error": f"Ошибка при запросе данных: {str(e)}"}, status=500)

        all_districts_data = data.get("districts", {})
        if not all_districts_data:
            return Response({"error": f"Нет данных по районам для {object_type}"}, status=400)

        result = {}

        for district_name, district_info in all_districts_data.items():
            coords = district_info.get("coordinates", [])
            if not coords:
                result[district_name] = {
                    "message": f"Нет {object_type} для анализа"
                }
                continue

            all_coords = [(c["lat"], c["lon"]) for c in coords]

            min_lat = min(c[0] for c in all_coords)
            max_lat = max(c[0] for c in all_coords)
            min_lon = min(c[1] for c in all_coords)
            max_lon = max(c[1] for c in all_coords)

            lat_range = np.arange(min_lat, max_lat + STEP_DEGREES, STEP_DEGREES)
            lon_range = np.arange(min_lon, max_lon + STEP_DEGREES, STEP_DEGREES)

            gap_zones = []
            for lat in lat_range:
                for lon in lon_range:
                    point = (lat, lon)
                    if all(geodesic(point, school).meters > RADIUS_METERS for school in all_coords):
                        gap_zones.append({"lat": round(lat, 6), "lon": round(lon, 6)})

            new_objects = []
            covered_points = list(all_coords)

            while gap_zones:
                new_obj = gap_zones[0]
                new_objects.append(new_obj)
                covered_points.append((new_obj["lat"], new_obj["lon"]))
                gap_zones = [
                    zone for zone in gap_zones
                    if geodesic((zone["lat"], zone["lon"]), (new_obj["lat"], new_obj["lon"])).meters > RADIUS_METERS
                ]

            result[district_name] = {
                "new_needed": len(new_objects),
                "new_coordinates": new_objects
            }

        return Response({
            "type": object_type,
            "radius_m": RADIUS_METERS,
            "result": result
        })
    
from .population_service import estimate_population

class PopulationEstimateView(APIView):
    def get(self, request):
        districts = [
            "Октябрьский район, Бишкек, Кыргызстан",
            "Ленинский район, Бишкек, Кыргызстан",
            "Первомайский район, Бишкек, Кыргызстан",
            "Свердловский район, Бишкек, Кыргызстан"
        ]
        data = estimate_population(districts)
        return Response(data)
