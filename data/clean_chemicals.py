import pandas as pd
import numpy as np

df = pd.read_csv("data/chemicals.csv")

# =============================================================================
# 1. DATA CLEANING
# =============================================================================

# Fix YearDiscovered: "Ancient" or text -> 0, ensure integer
df["YearDiscovered"] = pd.to_numeric(df["YearDiscovered"], errors="coerce").fillna(0).astype(int)

# Standardize StandardState to: Solid, Liquid, Gas
state_map = {
    "solid": "Solid",
    "liquid": "Liquid",
    "gas": "Gas",
    "expected to be a solid": "Solid",
    "expected to be a liquid": "Liquid",
    "expected to be a gas": "Gas",
    "expected to be solid": "Solid",
    "expected to be liquid": "Liquid",
    "expected to be gas": "Gas",
}
df["StandardState"] = df["StandardState"].str.strip().str.lower().map(state_map).fillna(df["StandardState"])

# Handle nulls: fill missing Density and MeltingPoint with -1
df["Density"] = pd.to_numeric(df["Density"], errors="coerce").fillna(-1)
df["MeltingPoint"] = pd.to_numeric(df["MeltingPoint"], errors="coerce").fillna(-1)
df["BoilingPoint"] = pd.to_numeric(df["BoilingPoint"], errors="coerce").fillna(-1)

# =============================================================================
# 2. DATA ENRICHMENT
# =============================================================================

# --- rarity_category ---
# Synthetic: is_synthetic == TRUE or transuranic (Z >= 95)
# Common: abundant elements in Earth's crust/atmosphere/ocean
# Rare: everything else
common_elements = {
    "H", "He", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S",
    "Cl", "Ar", "K", "Ca", "Ti", "Mn", "Fe", "Ni", "Cu", "Zn", "Br", "Kr",
    "Sr", "Zr", "Mo", "Sn", "I", "Ba", "W", "Pb", "U",
}

def classify_rarity(row):
    if str(row["is_synthetic"]).upper() == "TRUE" or row["AtomicNumber"] >= 95:
        return "Synthetic"
    if row["Id"] in common_elements:
        return "Common"
    return "Rare"

df["rarity_category"] = df.apply(classify_rarity, axis=1)

# --- conductivity_type ---
conductors = {
    "Alkali metal", "Alkaline earth metal", "Transition metal",
    "Post-transition metal", "Lanthanide", "Actinide",
}
semiconductors = {"Metalloid"}
insulators = {"Nonmetal", "Noble gas", "Halogen"}

def classify_conductivity(row):
    gb = row["GroupBlock"]
    if gb in conductors:
        return "Conductor"
    if gb in semiconductors:
        return "Semiconductor"
    if gb in insulators:
        return "Insulator"
    return "Insulator"

df["conductivity_type"] = df.apply(classify_conductivity, axis=1)

# --- period and group already exist, ensure int ---
df["period"] = pd.to_numeric(df["period"], errors="coerce").fillna(-1).astype(int)
df["group"] = pd.to_numeric(df["group"], errors="coerce").fillna(-1).astype(int)

# --- is_radioactive already exists, ensure consistent ---
df["is_radioactive"] = df["is_radioactive"].astype(str).str.upper().map({"TRUE": True, "FALSE": False}).fillna(False)
df["is_synthetic"] = df["is_synthetic"].astype(str).str.upper().map({"TRUE": True, "FALSE": False}).fillna(False)

# =============================================================================
# 3. RANGE CALCULATIONS (categorical columns, 3-7 categories each)
# =============================================================================

# --- atomic_mass_range ---
def classify_atomic_mass(m):
    if m <= 10:
        return "Very Light (<10)"
    elif m <= 40:
        return "Light (10-40)"
    elif m <= 100:
        return "Medium (40-100)"
    elif m <= 200:
        return "Heavy (100-200)"
    else:
        return "Very Heavy (>200)"

df["atomic_mass_range"] = df["AtomicMass"].apply(classify_atomic_mass)

# --- density_range ---
# Density in g/cm³; -1 or 0 means unknown/gas
def classify_density(d):
    if d <= 0:
        return "Unknown/Gas"
    elif d < 1:
        return "Ultra Light (<1)"
    elif d < 5:
        return "Light (1-5)"
    elif d < 10:
        return "Medium (5-10)"
    elif d < 15:
        return "Dense (10-15)"
    elif d < 20:
        return "Very Dense (15-20)"
    else:
        return "Super Dense (>20)"

df["density_range"] = df["Density"].apply(classify_density)

# --- melting_point_range (Kelvin) ---
def classify_melting_point(mp):
    if mp <= 0:
        return "Unknown"
    elif mp < 100:
        return "Cryogenic (<100K)"
    elif mp < 500:
        return "Very Low (100-500K)"
    elif mp < 1000:
        return "Low (500-1000K)"
    elif mp < 1500:
        return "Moderate (1000-1500K)"
    elif mp < 2500:
        return "High (1500-2500K)"
    else:
        return "Extreme (>2500K)"

df["melting_point_range"] = df["MeltingPoint"].apply(classify_melting_point)

# --- boiling_point_range (Kelvin) ---
def classify_boiling_point(bp):
    if bp <= 0:
        return "Unknown"
    elif bp < 100:
        return "Cryogenic (<100K)"
    elif bp < 500:
        return "Very Low (100-500K)"
    elif bp < 1500:
        return "Low (500-1500K)"
    elif bp < 3000:
        return "Moderate (1500-3000K)"
    elif bp < 5000:
        return "High (3000-5000K)"
    else:
        return "Extreme (>5000K)"

df["boiling_point_range"] = df["BoilingPoint"].apply(classify_boiling_point)

# --- year_discovered_range ---
def classify_year(y):
    if y == 0:
        return "Ancient"
    elif y < 1700:
        return "Pre-1700"
    elif y < 1800:
        return "1700s"
    elif y < 1850:
        return "Early 1800s"
    elif y < 1900:
        return "Late 1800s"
    elif y < 1950:
        return "Early 1900s"
    else:
        return "Modern (1950+)"

df["year_discovered_range"] = df["YearDiscovered"].apply(classify_year)

# =============================================================================
# OUTPUT
# =============================================================================
df.to_csv("data/chemicals.csv", index=False)
print(f"Wrote {len(df)} rows to data/chemicals.csv")

# Quick summary
print("\n--- Range distributions ---")
for col in ["atomic_mass_range", "density_range", "melting_point_range", "boiling_point_range", "year_discovered_range"]:
    print(f"\n{col}:")
    print(df[col].value_counts().to_string())

print("\n--- Enrichment distributions ---")
for col in ["rarity_category", "conductivity_type"]:
    print(f"\n{col}:")
    print(df[col].value_counts().to_string())
