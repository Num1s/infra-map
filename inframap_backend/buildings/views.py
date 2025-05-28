from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
import osmnx as ox

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
