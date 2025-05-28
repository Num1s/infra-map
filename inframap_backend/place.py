import osmnx as ox
import geopandas as gpd
from shapely.geometry import Point, box
from scipy.spatial import KDTree
import numpy as np

# Радиус действия школы в метрах
RADIUS = 800  # можно изменить по твоим требованиям

# Пример района
district_name = "Октябрьский район, город Бишкек, Киргизия"
tags = {'amenity': 'school'}

# Получаем школы
gdf = ox.features_from_place(district_name, tags)
names = gdf['name'].fillna('').str.lower()
schools = gdf[
    names.str.contains('школа') &
    ~names.str.contains('авто|муз|спорт|искусств|центр|дополн')
]

# Координаты школ
school_points = []
for _, row in schools.iterrows():
    geom = row.geometry
    point = geom if geom.geom_type == 'Point' else geom.centroid
    school_points.append((point.x, point.y))

# Преобразуем в метры (UTM)
schools_gdf = gpd.GeoDataFrame(geometry=[Point(x, y) for x, y in school_points], crs="EPSG:4326").to_crs(32643)
school_coords = [(p.x, p.y) for p in schools_gdf.geometry]

# Строим KD-дерево для быстрого поиска ближайшей школы
tree = KDTree(school_coords)

# Получаем границу района
district_boundary = ox.geocode_to_gdf(district_name).to_crs(32643)
bounds = district_boundary.total_bounds
minx, miny, maxx, maxy = bounds

# Строим сетку точек
x_vals = np.arange(minx, maxx, 300)
y_vals = np.arange(miny, maxy, 300)
grid_points = [Point(x, y) for x in x_vals for y in y_vals]
grid_gdf = gpd.GeoDataFrame(geometry=grid_points, crs=district_boundary.crs)

# Фильтруем точки, попадающие внутрь района
grid_gdf = grid_gdf[grid_gdf.geometry.within(district_boundary.unary_union)]

# Считаем расстояние до ближайшей школы
grid_coords = [(p.x, p.y) for p in grid_gdf.geometry]
distances, _ = tree.query(grid_coords)

# Отбираем точки, у которых расстояние до школы больше радиуса
prov_zones = grid_gdf[distances > RADIUS]

# Вывод количества и пример координат
print(f"Количество провальных точек: {len(prov_zones)}")
print(prov_zones.head())

# Можно сохранить в GeoJSON или отобразить на карте
prov_zones.to_crs(4326).to_file("fail_zones.geojson", driver="GeoJSON")
