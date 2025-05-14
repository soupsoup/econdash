import openpyxl
import json

months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
wb = openpyxl.load_workbook('SeriesReport-20250513091745_6c2722.xlsx')
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
data = []
for row in rows:
    if isinstance(row[0], (int, float)) and 1900 < row[0] < 2100:
        year = int(row[0])
        for i, m in enumerate(months):
            val = row[i+1]
            if val is not None:
                date = f'{year}-{str(i+1).zfill(2)}-01'
                data.append({'date': date, 'value': float(val)})
with open('cpi_local_data.json','w') as f:
    json.dump(data, f, indent=2) 