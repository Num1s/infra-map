from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
import osmnx as ox
import numpy as np

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
