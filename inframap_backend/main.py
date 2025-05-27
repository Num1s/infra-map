# import osmnx as ox
#
# # Уточни район — можно город, район или конкретный адрес
# place_name = "Первомайский район, город Бишкек, Киргизия"
#
# # Подробный тег-фильтр
# tags = {
#     'amenity': 'school',
#     'building': 'school',
# }
#
# # Получаем объекты по тегам
# gdf = ox.features_from_place(place_name, tags)
#
# # Объединяем все возможные школы
# names = gdf['name'].fillna('').str.lower()
#
# schools = gdf[
#     names.str.contains('школа') &
#     ~names.str.contains('авто|муз|спорт|искусств|центр|дополн')
# ]
#
# print(schools[['name', 'geometry']])

import osmnx as ox
import geopandas as gpd
from rasterstats import zonal_stats

# 1. Район, в котором ищем
place_name = "Свердловский район, город Бишкек, Киргизия"

# 2. Скачиваем границу района как полигон
boundary = ox.geocode_to_gdf(place_name)

# 3. Загружаем школы в районе
tags = {'amenity': 'school'}
gdf = ox.features_from_place(place_name, tags)

# 4. Фильтрация: только обычные школы
names = gdf['name'].fillna('').str.lower()
schools = gdf[
    names.str.contains('школа') &
    ~names.str.contains('авто|муз|спорт|искусств|центр|дополн')
]

print("Школы:")
print(schools[['name', 'geometry']])

print(gdf.columns)
print(gdf[['name', 'population']])
