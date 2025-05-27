import osmnx as ox

# Уточни район — можно город, район или конкретный адрес
place_name = "Первомайский район, город Бишкек, Киргизия"

# Подробный тег-фильтр
tags = {
    'amenity': 'school',
    'building': 'school',
}

# Получаем объекты по тегам
gdf = ox.features_from_place(place_name, tags)

# Объединяем все возможные школы
names = gdf['name'].fillna('').str.lower()

schools = gdf[
    names.str.contains('школа') &
    ~names.str.contains('авто|муз|спорт|искусств|центр|дополн')
]

print(schools[['name', 'geometry']])
