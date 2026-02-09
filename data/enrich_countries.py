"""
enrich_countries.py
───────────────────
Pipeline: Clean → Enrich → Calculate Hit Ranges → Export CSV
Reads  : data/countries.csv
Writes : data/countries_enriched.csv
"""

import csv
import json
import math
import requests
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
INPUT_CSV = DATA_DIR / "countries.csv"
OUTPUT_CSV = DATA_DIR / "countries_enriched.csv"

# ─── Static reference data ──────────────────────────────────────────────────

# ISO-3166-1 alpha-3 codes for all 193 UN member states + 2 observers (Holy See, Palestine)
# Used to filter out territories/dependencies
SOVEREIGN_ALPHA3 = {
    "AFG", "ALB", "DZA", "AND", "AGO", "ATG", "ARG", "ARM", "AUS", "AUT",
    "AZE", "BHS", "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BTN",
    "BOL", "BIH", "BWA", "BRA", "BRN", "BGR", "BFA", "BDI", "CPV", "KHM",
    "CMR", "CAN", "CAF", "TCD", "CHL", "CHN", "COL", "COM", "COG", "COD",
    "CRI", "CIV", "HRV", "CUB", "CYP", "CZE", "DNK", "DJI", "DMA", "DOM",
    "ECU", "EGY", "SLV", "GNQ", "ERI", "EST", "SWZ", "ETH", "FJI", "FIN",
    "FRA", "GAB", "GMB", "GEO", "DEU", "GHA", "GRC", "GRD", "GTM", "GIN",
    "GNB", "GUY", "HTI", "HND", "HUN", "ISL", "IND", "IDN", "IRN", "IRQ",
    "IRL", "ISR", "ITA", "JAM", "JPN", "JOR", "KAZ", "KEN", "KIR", "PRK",
    "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY", "LIE",
    "LTU", "LUX", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT", "MHL", "MRT",
    "MUS", "MEX", "FSM", "MDA", "MCO", "MNG", "MNE", "MAR", "MOZ", "MMR",
    "NAM", "NRU", "NPL", "NLD", "NZL", "NIC", "NER", "NGA", "MKD", "NOR",
    "OMN", "PAK", "PLW", "PAN", "PNG", "PRY", "PER", "PHL", "POL", "PRT",
    "QAT", "ROU", "RUS", "RWA", "KNA", "LCA", "VCT", "WSM", "SMR", "STP",
    "SAU", "SEN", "SRB", "SYC", "SLE", "SGP", "SVK", "SVN", "SLB", "SOM",
    "ZAF", "SSD", "ESP", "LKA", "SDN", "SUR", "SWE", "CHE", "SYR", "TJK",
    "TZA", "THA", "TLS", "TGO", "TON", "TTO", "TUN", "TUR", "TKM", "TUV",
    "UGA", "UKR", "ARE", "GBR", "USA", "URY", "UZB", "VUT", "VAT", "VEN",
    "VNM", "YEM", "ZMB", "ZWE", "PSE",
}

# UNESCO World Heritage Sites count by country (2024 data)
# Source: https://whc.unesco.org/en/list/stat
UNESCO_SITES = {
    "ITA": 59, "CHN": 57, "DEU": 52, "FRA": 52, "ESP": 50, "IND": 42,
    "MEX": 35, "GBR": 34, "RUS": 32, "IRN": 28, "JPN": 26, "USA": 25,
    "BRA": 23, "CAN": 22, "TUR": 21, "AUS": 20, "GRC": 19, "POL": 18,
    "PRT": 17, "CZE": 17, "KOR": 16, "SWE": 15, "BEL": 16, "PER": 13,
    "ARG": 12, "IDN": 10, "NLD": 13, "AUT": 12, "CHE": 13, "COL": 9,
    "DNK": 10, "ETH": 11, "NOR": 8, "FIN": 7, "ISR": 9, "HUN": 8,
    "MAR": 9, "ROU": 9, "BGR": 10, "EGY": 7, "HRV": 10, "ZAF": 10,
    "PAK": 6, "UKR": 8, "DZA": 7, "NGA": 2, "SAU": 7, "VNM": 8,
    "PHL": 6, "BGD": 3, "IRQ": 6, "CUB": 9, "SRB": 5, "SVN": 5,
    "THA": 7, "KEN": 7, "KAZ": 6, "UZB": 7, "GEO": 4, "LBY": 5,
    "TZA": 7, "TUN": 9, "MYS": 4, "LKA": 8, "NPL": 4, "CHL": 7,
    "ECU": 5, "BOL": 7, "PRY": 1, "URY": 3, "VEN": 3, "PAN": 5,
    "CRI": 4, "GTM": 3, "HND": 2, "SLV": 1, "NIC": 2, "BLZ": 1,
    "DOM": 1, "HTI": 1, "JAM": 1, "TTO": 0, "BRB": 1, "ATG": 1,
    "DMA": 1, "GRD": 0, "KNA": 1, "LCA": 1, "VCT": 0, "BHS": 0,
    "SUR": 3, "GUY": 0, "NZL": 3, "FJI": 1, "PNG": 1, "SLB": 1,
    "VUT": 1, "WSM": 0, "TON": 0, "KIR": 1, "MHL": 1, "FSM": 1,
    "PLW": 1, "NRU": 0, "TUV": 0, "MMR": 2, "KHM": 3, "LAO": 3,
    "SGP": 1, "BRN": 0, "TLS": 0, "MNG": 5, "PRK": 2,
    "AFG": 2, "ARM": 3, "AZE": 5, "BHR": 3, "CYP": 3, "JOR": 6,
    "KGZ": 3, "LBN": 6, "OMN": 5, "QAT": 1, "SYR": 6, "TJK": 4,
    "TKM": 3, "YEM": 5, "KWT": 0, "ARE": 1, "PSE": 4,
    "AND": 1, "LIE": 0, "LUX": 1, "MLT": 3, "MCO": 0, "SMR": 1,
    "VAT": 2, "ISL": 3, "IRL": 2, "ALB": 4, "BIH": 4, "MKD": 2,
    "MNE": 4, "SVK": 8, "EST": 2, "LVA": 3, "LTU": 4,
    "BLR": 4, "MDA": 1, "SSD": 0,
    "BEN": 2, "BFA": 3, "BWA": 2, "BDI": 0, "CMR": 2, "CPV": 1,
    "CAF": 2, "TCD": 2, "COM": 0, "COG": 1, "COD": 5, "CIV": 5,
    "DJI": 0, "GNQ": 0, "ERI": 1, "SWZ": 0, "GAB": 2, "GMB": 2,
    "GHA": 2, "GIN": 1, "GNB": 0, "LSO": 1, "LBR": 0, "MDG": 3,
    "MWI": 2, "MLI": 4, "MRT": 2, "MUS": 2, "MOZ": 1, "NAM": 2,
    "NER": 3, "RWA": 2, "STP": 0, "SEN": 7, "SYC": 2, "SLE": 0,
    "SOM": 0, "SDN": 3, "TGO": 1, "UGA": 3, "ZMB": 1, "ZWE": 5,
}

# Summer & Winter Olympic host years by country (alpha-3)
OLYMPIC_HOST_YEARS = {
    "GRC": "1896,2004",
    "FRA": "1900,1924,1968,1992,2024",
    "USA": "1904,1932,1960,1980,1984,1996,2002,2028",
    "GBR": "1908,1948,2012",
    "SWE": "1912",
    "BEL": "1920",
    "NLD": "1928",
    "DEU": "1936,1972",
    "FIN": "1952",
    "AUS": "1956,2000",
    "ITA": "1956,1960,2006,2026",
    "JPN": "1964,1972,1998,2020",
    "MEX": "1968",
    "CAN": "1976,1988,2010",
    "RUS": "1980,2014",
    "KOR": "1988,2018",
    "ESP": "1992",
    "NOR": "1952,1994",
    "CHN": "2008,2022",
    "BRA": "2016",
    "AUT": "1964,1976",
    "CHE": "1928,1948",
    "BIH": "1984",
}

# ─── Helpers ────────────────────────────────────────────────────────────────

def fetch_restcountries_timezones() -> dict[str, int]:
    """Fetch timezone count per country from restcountries API."""
    print("  Fetching timezone data from restcountries.com ...")
    url = "https://restcountries.com/v3.1/all?fields=cca3,timezones"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    tz_map = {}
    for entry in data:
        code = entry.get("cca3", "")
        timezones = entry.get("timezones", [])
        tz_map[code] = len(timezones)
    print(f"  -> Got timezone data for {len(tz_map)} countries")
    return tz_map


def fetch_missing_countries(existing_ids: set[str]) -> list[dict]:
    """Fetch basic data for sovereign states missing from the CSV via restcountries API."""
    missing_codes = SOVEREIGN_ALPHA3 - existing_ids
    if not missing_codes:
        return []

    print(f"  Fetching data for {len(missing_codes)} missing countries ...")
    url = "https://restcountries.com/v3.1/all?fields=cca3,name,region,subregion,car,area,population,capital,latlng,landlocked"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    all_countries = resp.json()

    # Continent mapping to match CSV format
    continent_map = {
        "Africa": "Africa",
        "Europe": "Europe",
        "Asia": "Asia",
        "Oceania": "Oceania",
        "North America": "Americas",
        "South America": "Americas",
        "Antarctica": "Antarctica",
    }

    # Driving side
    side_map = {"right": "Right", "left": "Left"}

    new_rows = []
    for c in all_countries:
        code = c.get("cca3", "")
        if code not in missing_codes:
            continue

        region = c.get("region", "Unknown")
        continent = continent_map.get(region, region) if region else "Unknown"
        subregion = c.get("subregion", "Unknown") or "Unknown"
        car = c.get("car", {})
        sides = car.get("side", "right")
        driving = side_map.get(sides, "Right")
        area = c.get("area", -1) or -1
        population = c.get("population", -1) or -1
        latlng = c.get("latlng", [0, 0])
        lat = latlng[0] if len(latlng) > 0 else 0
        lng = latlng[1] if len(latlng) > 1 else 0
        capitals = c.get("capital", [])
        capital = capitals[0] if capitals else "Unknown"
        landlocked = c.get("landlocked", False)
        hemisphere = "South" if lat < 0 else "North"
        name = c.get("name", {}).get("common", code)

        new_rows.append({
            "id": code,
            "name": name,
            "continent": continent,
            "subregion": subregion,
            "driving_side": driving,
            "area": int(area) if area != -1 else -1,
            "population": int(population) if population != -1 else -1,
            "gdp_per_capita": -1,
            "Armed Forces size": -1,
            "Capital/Major City": capital,
            "GDP": -1,
            "Latitude": round(lat, 6),
            "Longitude": round(lng, 6),
            "hemisphere": hemisphere,
            "pop_density": round(population / area, 2) if area > 0 and population > 0 else -1,
            "is_landlocked": landlocked,
        })

    print(f"  -> Fetched {len(new_rows)} missing countries: {sorted([r['name'] for r in new_rows])}")
    return new_rows


def compute_hit_range(value: float, col_name: str) -> tuple[float, float]:
    """
    Compute (min_hit, max_hit) for a numeric value.
    - Large numbers (population, area, GDP, gdp_per_capita, Armed Forces size, pop_density): ±20%
    - Small numbers (timezone_count, unesco_sites): ±1 absolute
    """
    if value == -1:
        return (-1, -1)

    small_cols = {"timezone_count", "unesco_sites"}
    if col_name in small_cols:
        return (max(0, value - 1), value + 1)
    else:
        delta = abs(value) * 0.20
        return (math.floor(value - delta), math.ceil(value + delta))


# ─── Main pipeline ──────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Scalar Country Data Pipeline")
    print("=" * 60)

    # ── Step 1: Load CSV ────────────────────────────────────────────────
    print("\n[1/5] Loading CSV ...")
    df = pd.read_csv(INPUT_CSV)
    print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")

    # ── Step 2: Fix known data issues ───────────────────────────────────
    print("\n[2/5] Fixing data issues ...")

    # Fix PRK -> KOR for South Korea
    mask_prk = df["id"] == "PRK"
    if mask_prk.any():
        current_name = df.loc[mask_prk, "name"].values[0]
        if "South Korea" in str(current_name):
            df.loc[mask_prk, "id"] = "KOR"
            print("  Fixed: PRK (South Korea) -> KOR")

    # ── Step 3: Filter to sovereign states ──────────────────────────────
    print("\n[3/5] Filtering to sovereign states ...")
    before = len(df)
    df = df[df["id"].isin(SOVEREIGN_ALPHA3)].copy()
    removed = before - len(df)
    if removed > 0:
        print(f"  Removed {removed} non-sovereign entries")
    else:
        print(f"  All {len(df)} entries are sovereign states")

    # ── Step 4: Clean types ─────────────────────────────────────────────
    print("\n[4/5] Cleaning data types ...")

    # Numeric columns to ensure are proper numbers
    numeric_cols = ["area", "population", "gdp_per_capita", "Armed Forces size", "GDP", "pop_density", "Latitude", "Longitude"]
    for col in numeric_cols:
        if col in df.columns:
            # Remove $ and commas if present, convert to numeric
            df[col] = pd.to_numeric(
                df[col].astype(str).str.replace(r"[$,]", "", regex=True),
                errors="coerce"
            )

    # Fill missing numerical values with -1
    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].fillna(-1)

    # GDP as integer
    df["GDP"] = df["GDP"].astype(int)
    df["population"] = df["population"].astype(int)
    df["area"] = df["area"].astype(int)
    df["gdp_per_capita"] = df["gdp_per_capita"].astype(int)
    df["Armed Forces size"] = df["Armed Forces size"].astype(int)

    # Normalize hemisphere from Latitude
    df["hemisphere"] = df["Latitude"].apply(lambda x: "South" if x < 0 else "North")

    # Normalize is_landlocked to boolean
    df["is_landlocked"] = df["is_landlocked"].astype(str).str.upper().map({"TRUE": True, "FALSE": False})
    df["is_landlocked"] = df["is_landlocked"].fillna(False)

    print(f"  Cleaned {len(df)} rows")

    # ── Step 5: Fetch missing countries & enrich ────────────────────────
    print("\n[5/5] Enriching data ...")

    # Fetch timezone data from restcountries API
    tz_map = fetch_restcountries_timezones()

    # Fetch missing sovereign states
    existing_ids = set(df["id"].tolist())
    missing_rows = fetch_missing_countries(existing_ids)
    if missing_rows:
        missing_df = pd.DataFrame(missing_rows)
        df = pd.concat([df, missing_df], ignore_index=True)
        print(f"  Total rows after adding missing countries: {len(df)}")

    # Add timezone_count
    df["timezone_count"] = df["id"].map(tz_map).fillna(1).astype(int)

    # Add unesco_sites
    df["unesco_sites"] = df["id"].map(UNESCO_SITES).fillna(0).astype(int)

    # Add olympic_host_years
    df["olympic_host_years"] = df["id"].map(OLYMPIC_HOST_YEARS).fillna("0")

    # Re-derive hemisphere and is_landlocked for any new rows
    df["hemisphere"] = df["Latitude"].apply(lambda x: "South" if x < 0 else "North")

    # ── Step 6: Calculate hit ranges ────────────────────────────────────
    print("\n[6/6] Calculating hit ranges ...")

    range_cols = ["population", "area", "GDP", "gdp_per_capita", "timezone_count", "unesco_sites"]
    for col in range_cols:
        min_col = f"{col}_min_hit"
        max_col = f"{col}_max_hit"
        df[min_col] = df[col].apply(lambda v: compute_hit_range(v, col)[0]).astype(int)
        df[max_col] = df[col].apply(lambda v: compute_hit_range(v, col)[1]).astype(int)

    # ── Sort by population descending for readability ───────────────────
    df = df.sort_values("population", ascending=False).reset_index(drop=True)

    # ── Write output ────────────────────────────────────────────────────
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n{'=' * 60}")
    print(f"Output: {OUTPUT_CSV}")
    print(f"Rows:   {len(df)}")
    print(f"Cols:   {list(df.columns)}")
    print(f"{'=' * 60}")

    # Quick sanity checks
    print("\nSanity checks:")
    italy = df[df["id"] == "ITA"]
    if not italy.empty:
        row = italy.iloc[0]
        print(f"  Italy: unesco={row['unesco_sites']}, tz={row['timezone_count']}, "
              f"unesco_min_hit={row['unesco_sites_min_hit']}, unesco_max_hit={row['unesco_sites_max_hit']}")
    usa = df[df["id"] == "USA"]
    if not usa.empty:
        row = usa.iloc[0]
        print(f"  USA:   pop={row['population']:,}, pop_min_hit={row['population_min_hit']:,}, "
              f"pop_max_hit={row['population_max_hit']:,}")
        print(f"         olympics={row['olympic_host_years']}")
    kor = df[df["id"] == "KOR"]
    if not kor.empty:
        print(f"  South Korea: id=KOR, name={kor.iloc[0]['name']}")


if __name__ == "__main__":
    main()
