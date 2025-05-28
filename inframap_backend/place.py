import osmnx as ox
import geopandas as gpd
import pandas as pd
from shapely.geometry import Polygon
import matplotlib.pyplot as plt

# Название района
district_name = "Свердловский район, Бишкек, Кыргызстан"

# Получаем геометрию района
print("⏳ Загружаем границы района...")
district = ox.geocode_to_gdf(district_name)
district_polygon = district.geometry.iloc[0]

# Получаем здания
print("⏳ Загружаем здания...")
buildings = ox.features_from_place(district_name, {'building': True})
buildings = gpd.clip(buildings, district)

# Получаем дороги
print("⏳ Загружаем дороги...")
roads_graph = ox.graph_from_place(district_name, network_type='drive')
roads = ox.graph_to_gdfs(roads_graph, nodes=False)

# Получаем парки, природные зоны и воду
print("⏳ Загружаем зеленые зоны и воду...")
landuse = ox.features_from_place(district_name, {'landuse': True})
natural = ox.features_from_place(district_name, {'natural': ['water', 'wood']})
parks = ox.features_from_place(district_name, {'leisure': 'park'})

# Объединяем все занятые участки
print("🛠️ Объединяем занятые территории...")
all_geoms = pd.concat([
    buildings[['geometry']],
    roads[['geometry']],
    landuse[['geometry']],
    natural[['geometry']],
    parks[['geometry']]
], ignore_index=True)

used = all_geoms.geometry.union_all()

# Вычитаем занятые территории из района
print("📐 Вычисляем свободные участки...")
free_space = district_polygon.difference(used)

# Отбираем участки подходящего размера
print("🧹 Фильтруем мелкие участки...")
if free_space.is_empty:
    free_areas = []
elif free_space.geom_type == 'MultiPolygon':
    free_areas = [poly for poly in free_space.geoms if poly.area > 5000]
elif free_space.geom_type == 'Polygon':
    free_areas = [free_space] if free_space.area > 5000 else []
else:
    free_areas = []

# Формируем GeoDataFrame
free_gdf = gpd.GeoDataFrame(geometry=free_areas, crs=district.crs)

# Визуализация
if not free_gdf.empty and free_gdf.is_valid.all():
    print(f"✅ Найдено свободных участков: {len(free_gdf)}")
    ax = district.plot(edgecolor='black', facecolor='none', figsize=(8, 8))
    free_gdf.plot(ax=ax, color='green', alpha=0.5)
    plt.title("Свободные участки под застройку")
    plt.show()
else:
    print("❗ Нет подходящих свободных участков для отображения.")
