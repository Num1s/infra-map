import osmnx as ox
import geopandas as gpd

# Общая численность населения
total_population = 1_300_000

# Названия районов Бишкека (можно расширить)
districts = [
    "Октябрьский район, Бишкек, Кыргызстан",
    "Ленинский район, Бишкек, Кыргызстан",
    "Первомайский район, Бишкек, Кыргызстан",
    "Свердловский район, Бишкек, Кыргызстан"
]

results = []

for district in districts:
    # Граница района
    boundary = ox.geocode_to_gdf(district)

    # Жилые здания
    tags = {'building': 'residential'}
    buildings = ox.features_from_place(district, tags)

    # Ограничим здания только этим районом
    buildings = gpd.clip(buildings, boundary)

    results.append({
        "district": district.split(",")[0],
        "num_buildings": len(buildings)
    })

# Считаем общее число зданий
total_buildings = sum(d['num_buildings'] for d in results)

# Распределяем население
for d in results:
    d['estimated_population'] = int((d['num_buildings'] / total_buildings) * total_population)

# Печать результатов
for d in results:
    print(f"{d['district']}: {d['estimated_population']:,} чел. (по {d['num_buildings']} зданиям)")
