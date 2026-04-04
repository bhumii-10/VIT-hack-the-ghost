import requests
import json

# Test heatmap generation
data = {
    'incidents': [
        {'lat': 28.6139, 'lng': 77.2090, 'severity': 'critical'},
        {'lat': 28.6200, 'lng': 77.2100, 'severity': 'high'},
        {'lat': 28.6100, 'lng': 77.2050, 'severity': 'medium'}
    ],
    'grid_size': 0.1
}

print("Testing ML Hotspot Heatmap Generation...")
r = requests.post('http://localhost:8000/api/hotspot/heatmap', json=data)
print(f'Status: {r.status_code}')

if r.status_code == 200:
    result = r.json()
    print(f'✅ Heatmap cells generated: {len(result.get("heatmap_data", []))}')
    print(f'📊 Statistics: {result.get("statistics", {})}')
    
    # Show sample heatmap cell
    if result.get("heatmap_data"):
        sample_cell = result["heatmap_data"][0]
        print(f'📍 Sample cell: Zone={sample_cell.get("zone")}, Intensity={sample_cell.get("intensity")}%')
else:
    print(f'❌ Error: {r.text}')