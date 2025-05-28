import osmnx as ox
import geopandas as gpd
from rasterstats import zonal_stats

place_name = "Свердловский район, город Бишкек, Киргизия"

boundary = ox.geocode_to_gdf(place_name)

gdf = ox.features_from_place(place_name, tags)

# 4. Фильтрация: только обычные школы
names = gdf['name'].fillna('').str.lower()
schools = gdf[
    names.str.contains('школа') &
    ~names.str.contains('авто|муз|спорт|искусств|центр|дополн')
]

print("Школы:")
print(schools[['name', 'geometry']])

