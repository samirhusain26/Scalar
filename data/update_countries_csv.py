#!/usr/bin/env python3
"""
Adds government_type and border_countries_count columns to countries_enriched.csv.
Data verified via research (corrections applied vs initial AI draft).
"""

import csv

# Maps ISO-3 country code → (government_type, border_countries_count)
# Government types (8 categories):
#   Republic, Federal Republic, Constitutional Monarchy, Absolute Monarchy,
#   Communist State, Military Junta, Islamic Republic, Theocracy
#
# Border counts = number of sovereign land-border countries.
# Key notes:
#  - Bahrain: island, King Fahd Causeway is a bridge not land border → 0
#  - Cyprus: island nation → 0
#  - Singapore: Johor-Singapore Causeway is a land connection → 1
#  - Israel: counts Palestine (PSE is in game data) → 5
#  - Jordan: counts Palestine (West Bank border) → 5
#  - France: metropolitan France only (8), not French Guiana overseas dept
#  - Saudi Arabia: 7 (excl. Bahrain causeway)
#  - Kosovo counted for Serbia/N.Macedonia/Montenegro/Albania
#  - Sweden: Norway + Finland only (Oresund bridge ≠ land border) → 2
#  - Indonesia: Malaysia + PNG + Timor-Leste → 3
#  - Cambodia: Thailand + Laos + Vietnam → 3
#  - Thailand: Myanmar + Laos + Cambodia + Malaysia → 4
#  - Laos: China + Vietnam + Cambodia + Thailand + Myanmar → 5
#  - Tuvalu: still a Commonwealth realm as of 2026 → Constitutional Monarchy
#  - Cambodia: Constitutional Monarchy (King Norodom Sihamoni)
#  - Syria: Republic (transitional govt after Assad fell Dec 2024)
#  - Chad: Republic (civilian elections completed 2024-2025)
#  - Gabon: Republic (Oligui Nguema won civilian election Apr 2025)
#  - Guinea: Republic (Doumbouya won presidential election Dec 2025)
#  - Sudan: Military Junta (Burhan military council ongoing 2026)
#  - Niger: Military Junta (5-year extension March 2025)
#  - Mali: Military Junta (Goita extended rule indefinitely July 2025)
#  - Burkina Faso: Military Junta (Traore extended 5 years)
#  - Myanmar: Military Junta (SAC→SSPC, still military dictatorship 2026)
#  - COG borders: Gabon, Cameroon, CAR, DRC, Angola/Cabinda → 5
#  - Libya: Tunisia, Algeria, Niger, Chad, Sudan, Egypt → 6
#  - Iran: Turkey, Iraq, Azerbaijan, Armenia, Turkmenistan, Afghanistan, Pakistan → 7

DATA = {
    'IND': ('Federal Republic',        6),
    'CHN': ('Communist State',         14),
    'USA': ('Federal Republic',        2),
    'IDN': ('Republic',                3),
    'PAK': ('Islamic Republic',        4),
    'NGA': ('Federal Republic',        4),
    'BRA': ('Federal Republic',        10),
    'BGD': ('Republic',                2),
    'RUS': ('Federal Republic',        14),
    'MEX': ('Federal Republic',        3),
    'ETH': ('Federal Republic',        6),
    'JPN': ('Constitutional Monarchy', 0),
    'PHL': ('Republic',                0),
    'COD': ('Republic',                9),
    'EGY': ('Republic',                4),
    'VNM': ('Communist State',         3),
    'IRN': ('Islamic Republic',        7),
    'TUR': ('Republic',                8),
    'DEU': ('Federal Republic',        9),
    'THA': ('Constitutional Monarchy', 4),
    'GBR': ('Constitutional Monarchy', 1),
    'FRA': ('Republic',                8),
    'TZA': ('Republic',                8),
    'ZAF': ('Republic',                6),
    'ITA': ('Republic',                6),
    'KEN': ('Republic',                5),
    'MMR': ('Military Junta',          5),
    'COL': ('Republic',                5),
    'KOR': ('Republic',                1),
    'UGA': ('Republic',                5),
    'ESP': ('Republic',                4),
    'SDN': ('Military Junta',          7),
    'ARG': ('Federal Republic',        5),
    'DZA': ('Republic',                6),
    'IRQ': ('Federal Republic',        6),
    'AFG': ('Theocracy',               6),
    'CAN': ('Constitutional Monarchy', 1),
    'MAR': ('Constitutional Monarchy', 3),
    'UKR': ('Republic',                7),
    'SAU': ('Absolute Monarchy',       7),
    'POL': ('Republic',                7),
    'AGO': ('Republic',                4),
    'UZB': ('Republic',                5),
    'YEM': ('Republic',                2),
    'PER': ('Republic',                5),
    'MYS': ('Constitutional Monarchy', 3),
    'GHA': ('Republic',                3),
    'MOZ': ('Republic',                6),
    'CIV': ('Republic',                5),
    'NPL': ('Federal Republic',        2),
    'MDG': ('Republic',                0),
    'CMR': ('Republic',                6),
    'VEN': ('Federal Republic',        3),
    'NER': ('Military Junta',          7),
    'AUS': ('Constitutional Monarchy', 0),
    'PRK': ('Communist State',         3),
    'SYR': ('Republic',                5),
    'MLI': ('Military Junta',          7),
    'BFA': ('Military Junta',          6),
    'LKA': ('Republic',                0),
    'MWI': ('Republic',                3),
    'ZMB': ('Republic',                8),
    'KAZ': ('Republic',                5),
    'CHL': ('Republic',                3),
    'ROU': ('Republic',                5),
    'TCD': ('Republic',                6),
    'ECU': ('Republic',                2),
    'SOM': ('Federal Republic',        3),
    'NLD': ('Constitutional Monarchy', 2),
    'SEN': ('Republic',                5),
    'GTM': ('Republic',                4),
    'KHM': ('Constitutional Monarchy', 3),
    'ZWE': ('Republic',                4),
    'SSD': ('Republic',                6),
    'GIN': ('Republic',                6),
    'RWA': ('Republic',                4),
    'BEN': ('Republic',                4),
    'BDI': ('Republic',                3),
    'TUN': ('Republic',                2),
    'BOL': ('Republic',                5),
    'BEL': ('Constitutional Monarchy', 4),
    'HTI': ('Republic',                1),
    'JOR': ('Constitutional Monarchy', 5),
    'DOM': ('Republic',                1),
    'ARE': ('Absolute Monarchy',       2),
    'CZE': ('Republic',                4),
    'HND': ('Republic',                3),
    'SWE': ('Constitutional Monarchy', 2),
    'PRT': ('Republic',                1),
    'GRC': ('Republic',                4),
    'PNG': ('Constitutional Monarchy', 1),
    'TJK': ('Republic',                4),
    'AZE': ('Republic',                5),
    'ISR': ('Republic',                5),
    'CUB': ('Communist State',         0),
    'HUN': ('Republic',                7),
    'BLR': ('Republic',                5),
    'AUT': ('Federal Republic',        8),
    'TGO': ('Republic',                3),
    'CHE': ('Federal Republic',        5),
    'SLE': ('Republic',                2),
    'LAO': ('Communist State',         5),
    'KGZ': ('Republic',                4),
    'NIC': ('Republic',                2),
    'LBY': ('Republic',                6),
    'PRY': ('Republic',                3),
    'SRB': ('Republic',                8),
    'TKM': ('Republic',                4),
    'BGR': ('Republic',                5),
    'SLV': ('Republic',                2),
    'COG': ('Republic',                5),
    'DNK': ('Constitutional Monarchy', 1),
    'SGP': ('Republic',                1),
    'CAF': ('Republic',                6),
    'FIN': ('Republic',                3),
    'NOR': ('Constitutional Monarchy', 3),
    'LBN': ('Republic',                2),
    'PSE': ('Republic',                3),
    'IRL': ('Republic',                1),
    'LBR': ('Republic',                3),
    'SVK': ('Republic',                5),
    'NZL': ('Constitutional Monarchy', 0),
    'CRI': ('Republic',                2),
    'MRT': ('Islamic Republic',        4),
    'OMN': ('Absolute Monarchy',       3),
    'PAN': ('Republic',                2),
    'KWT': ('Constitutional Monarchy', 2),
    'HRV': ('Republic',                5),
    'GEO': ('Republic',                4),
    'ERI': ('Republic',                3),
    'MNG': ('Republic',                2),
    'URY': ('Republic',                2),
    'BIH': ('Republic',                3),
    'QAT': ('Absolute Monarchy',       1),
    'LTU': ('Republic',                4),
    'JAM': ('Constitutional Monarchy', 0),
    'ARM': ('Republic',                4),
    'ALB': ('Republic',                4),
    'BWA': ('Republic',                4),
    'NAM': ('Republic',                4),
    'MDA': ('Republic',                2),
    'GAB': ('Republic',                3),
    'GMB': ('Republic',                1),
    'LSO': ('Constitutional Monarchy', 1),
    'SVN': ('Republic',                4),
    'LVA': ('Republic',                4),
    'MKD': ('Republic',                5),
    'GNB': ('Republic',                2),
    'GNQ': ('Republic',                2),
    'TTO': ('Republic',                0),
    'BHR': ('Constitutional Monarchy', 0),
    'TLS': ('Republic',                1),
    'EST': ('Republic',                2),
    'MUS': ('Republic',                0),
    'CYP': ('Republic',                0),
    'SWZ': ('Absolute Monarchy',       2),
    'DJI': ('Republic',                3),
    'FJI': ('Republic',                0),
    'COM': ('Republic',                0),
    'GUY': ('Republic',                3),
    'BTN': ('Constitutional Monarchy', 2),
    'SLB': ('Republic',                0),
    'LUX': ('Constitutional Monarchy', 3),
    'SUR': ('Republic',                3),
    'MNE': ('Republic',                5),
    'MLT': ('Republic',                0),
    'MDV': ('Republic',                0),
    'CPV': ('Republic',                0),
    'BRN': ('Absolute Monarchy',       1),
    'BLZ': ('Constitutional Monarchy', 2),
    'BHS': ('Constitutional Monarchy', 0),
    'ISL': ('Republic',                0),
    'VUT': ('Republic',                0),
    'BRB': ('Republic',                0),
    'WSM': ('Republic',                0),
    'STP': ('Republic',                0),
    'LCA': ('Constitutional Monarchy', 0),
    'KIR': ('Republic',                0),
    'GRD': ('Constitutional Monarchy', 0),
    'SYC': ('Republic',                0),
    'VCT': ('Constitutional Monarchy', 0),
    'FSM': ('Republic',                0),
    'TON': ('Constitutional Monarchy', 0),
    'ATG': ('Constitutional Monarchy', 0),
    'AND': ('Constitutional Monarchy', 2),
    'DMA': ('Republic',                0),
    'KNA': ('Constitutional Monarchy', 0),
    'MHL': ('Republic',                0),
    'LIE': ('Constitutional Monarchy', 2),
    'MCO': ('Constitutional Monarchy', 1),
    'SMR': ('Republic',                1),
    'PLW': ('Republic',                0),
    'NRU': ('Republic',                0),
    'TUV': ('Constitutional Monarchy', 0),
    'VAT': ('Theocracy',               1),
}

INPUT_FILE  = '/Users/samirhusain/Personal/code_projects/Scalar/data/countries_enriched.csv'
OUTPUT_FILE = '/Users/samirhusain/Personal/code_projects/Scalar/data/countries_enriched.csv'


def main():
    with open(INPUT_FILE, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    header = rows[0]

    # Remove existing columns if re-running
    for col_name in ['government_type', 'border_countries_count']:
        if col_name in header:
            idx = header.index(col_name)
            for row in rows:
                if idx < len(row):
                    del row[idx]
            print(f"Removed existing column '{col_name}' at index {idx}")
            header = rows[0]

    # Find driving_side column index
    try:
        ds_idx = header.index('driving_side')
    except ValueError:
        print("ERROR: 'driving_side' column not found in header!")
        return

    insert_at = ds_idx + 1  # insert right after driving_side

    # Update header
    rows[0].insert(insert_at,     'government_type')
    rows[0].insert(insert_at + 1, 'border_countries_count')

    missing = []
    for row in rows[1:]:
        country_id = row[0]
        if country_id not in DATA:
            missing.append(country_id)
            row.insert(insert_at,     'Unknown')
            row.insert(insert_at + 1, '-1')
        else:
            gov_type, border_cnt = DATA[country_id]
            row.insert(insert_at,     gov_type)
            row.insert(insert_at + 1, str(border_cnt))

    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"\nDone! Updated {len(rows) - 1} country rows.")
    if missing:
        print(f"WARNING — no data for IDs: {missing}")
    else:
        print("All country IDs matched successfully.")

    # Quick sample
    print("\n--- Sample (first 10 rows) ---")
    for row in rows[1:11]:
        print(f"  {row[0]}: gov={row[insert_at]}, borders={row[insert_at + 1]}")


if __name__ == '__main__':
    main()
