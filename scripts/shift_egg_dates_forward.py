import csv
from datetime import datetime
from dateutil.relativedelta import relativedelta

input_file = 'egg-prices-data (2).csv'
output_file = 'egg-prices-data-shifted.csv'

def shift_date(date_str):
    # Handles YYYY-MM-DD format
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    shifted = dt + relativedelta(months=1)
    # Keep day as 1 for all months (to match input style)
    return shifted.strftime('%Y-%m-%d')

with open(input_file, 'r', newline='') as infile, open(output_file, 'w', newline='') as outfile:
    reader = csv.reader(infile)
    writer = csv.writer(outfile)
    header = next(reader)
    writer.writerow(header)
    for row in reader:
        if row and row[0]:
            row[0] = shift_date(row[0])
        writer.writerow(row)

print(f"Shifted dates written to {output_file}") 