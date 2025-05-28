import osmnx as ox
import geopandas as gpd

def estimate_population(districts, total_population=1_300_000):
    results = []

    for district in districts:
        try:
            boundary = ox.geocode_to_gdf(district)
            tags = {'building': 'residential'}
            buildings = ox.features_from_place(district, tags)
            buildings = gpd.clip(buildings, boundary)

            results.append({
                "district": district.split(",")[0],
                "num_buildings": len(buildings)
            })
        except Exception as e:
            results.append({
                "district": district.split(",")[0],
                "error": str(e)
            })

    total_buildings = sum(d['num_buildings'] for d in results if 'num_buildings' in d and d['num_buildings'] > 0)

    for d in results:
        if 'num_buildings' in d and total_buildings > 0:
            d['estimated_population'] = int((d['num_buildings'] / total_buildings) * total_population)
        else:
            d['estimated_population'] = 0

    return results
