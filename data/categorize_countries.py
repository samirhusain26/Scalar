"""
categorize_countries.py
───────────────────────
Adds categorical columns to countries_enriched.csv using quantile-based
binning so each category has roughly equal country counts.

Reads  : data/countries_enriched.csv
Writes : data/countries_enriched.csv (in-place update)
"""

import math
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
CSV_PATH = DATA_DIR / "countries_enriched.csv"

# ─── Helpers ────────────────────────────────────────────────────────────────

def quantile_labels(series: pd.Series, n_bins: int, label_fn) -> pd.Series:
    """
    Bin a numeric series into n_bins quantile buckets. Returns labeled categories.
    Handles -1 as missing → "Unknown". Deduplicates bin edges.
    label_fn(low, high, i, total) -> str  produces the human label for each bin.
    """
    valid_mask = series != -1
    valid = series[valid_mask].copy()

    # Get quantile edges
    _, edges = pd.qcut(valid, q=n_bins, retbins=True, duplicates="drop")
    actual_bins = len(edges) - 1

    # Build labels
    labels = []
    for i in range(actual_bins):
        low = edges[i]
        high = edges[i + 1]
        labels.append(label_fn(low, high, i, actual_bins))

    result = pd.cut(valid, bins=edges, labels=labels, include_lowest=True)

    # Merge back with Unknown for missing
    out = pd.Series("Unknown", index=series.index, dtype="object")
    out[valid_mask] = result.astype(str)
    return out


def fmt_big(n: float) -> str:
    """Format a large number compactly: 1.2K, 3.4M, 5.6B, 7.8T"""
    abs_n = abs(n)
    if abs_n >= 1e12:
        return f"{n/1e12:.1f}T"
    if abs_n >= 1e9:
        return f"{n/1e9:.1f}B"
    if abs_n >= 1e6:
        return f"{n/1e6:.1f}M"
    if abs_n >= 1e3:
        return f"{n/1e3:.1f}K"
    return f"{n:.0f}"


def fmt_int(n: float) -> str:
    return f"{int(n):,}"


# ─── Column-specific bin configs ────────────────────────────────────────────

def categorize_population(df: pd.DataFrame) -> pd.Series:
    """7 quantile bins with compact labels."""
    return quantile_labels(
        df["population"], 7,
        lambda lo, hi, i, t: f"{fmt_big(lo)}-{fmt_big(hi)}"
    )


def categorize_area(df: pd.DataFrame) -> pd.Series:
    """7 quantile bins."""
    return quantile_labels(
        df["area"], 7,
        lambda lo, hi, i, t: f"{fmt_big(lo)}-{fmt_big(hi)} km²"
    )


def categorize_gdp(df: pd.DataFrame) -> pd.Series:
    """7 quantile bins, skip -1."""
    return quantile_labels(
        df["GDP"], 7,
        lambda lo, hi, i, t: f"${fmt_big(lo)}-${fmt_big(hi)}"
    )


def categorize_gdp_per_capita(df: pd.DataFrame) -> pd.Series:
    """6 quantile bins."""
    return quantile_labels(
        df["gdp_per_capita"], 6,
        lambda lo, hi, i, t: f"${fmt_big(lo)}-${fmt_big(hi)}"
    )


def categorize_armed_forces(df: pd.DataFrame) -> pd.Series:
    """Manual bins since many zeros and -1s."""
    s = df["Armed Forces size"]
    labels = []
    for v in s:
        if v == -1:
            labels.append("Unknown")
        elif v == 0:
            labels.append("None")
        elif v <= 10000:
            labels.append("1-10K")
        elif v <= 50000:
            labels.append("10K-50K")
        elif v <= 150000:
            labels.append("50K-150K")
        elif v <= 500000:
            labels.append("150K-500K")
        else:
            labels.append("500K+")
    return pd.Series(labels, index=df.index)


def categorize_pop_density(df: pd.DataFrame) -> pd.Series:
    """7 quantile bins."""
    return quantile_labels(
        df["pop_density"], 7,
        lambda lo, hi, i, t: f"{fmt_big(lo)}-{fmt_big(hi)} /km²"
    )


def categorize_timezone_count(df: pd.DataFrame) -> pd.Series:
    """Manual bins — 90% of countries have 1 timezone."""
    s = df["timezone_count"]
    labels = []
    for v in s:
        if v == 1:
            labels.append("1")
        elif v == 2:
            labels.append("2")
        elif v <= 5:
            labels.append("3-5")
        else:
            labels.append("6+")
    return pd.Series(labels, index=df.index)


def categorize_unesco(df: pd.DataFrame) -> pd.Series:
    """Manual bins tuned for the right-skewed distribution."""
    s = df["unesco_sites"]
    labels = []
    for v in s:
        if v == 0:
            labels.append("0")
        elif v <= 2:
            labels.append("1-2")
        elif v <= 5:
            labels.append("3-5")
        elif v <= 10:
            labels.append("6-10")
        elif v <= 25:
            labels.append("11-25")
        else:
            labels.append("26+")
    return pd.Series(labels, index=df.index)


def categorize_latitude(df: pd.DataFrame) -> pd.Series:
    """Geographic latitude bands."""
    s = df["Latitude"]
    labels = []
    for v in s:
        if v == -1:
            labels.append("Unknown")
        elif v < -30:
            labels.append("Deep South (< -30°)")
        elif v < -10:
            labels.append("Southern (-30° to -10°)")
        elif v < 10:
            labels.append("Equatorial (-10° to 10°)")
        elif v < 25:
            labels.append("Tropical (10° to 25°)")
        elif v < 40:
            labels.append("Subtropical (25° to 40°)")
        elif v < 55:
            labels.append("Temperate (40° to 55°)")
        else:
            labels.append("Northern (55°+)")
    return pd.Series(labels, index=df.index)


def categorize_longitude(df: pd.DataFrame) -> pd.Series:
    """Geographic longitude bands."""
    s = df["Longitude"]
    labels = []
    for v in s:
        if v < -100:
            labels.append("Far West (< -100°)")
        elif v < -50:
            labels.append("Americas (-100° to -50°)")
        elif v < 0:
            labels.append("Atlantic (-50° to 0°)")
        elif v < 30:
            labels.append("Europe/Africa (0° to 30°)")
        elif v < 60:
            labels.append("Middle East (30° to 60°)")
        elif v < 100:
            labels.append("Central Asia (60° to 100°)")
        elif v < 140:
            labels.append("East Asia (100° to 140°)")
        else:
            labels.append("Pacific (140°+)")
    return pd.Series(labels, index=df.index)


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    print("Loading CSV ...")
    df = pd.read_csv(CSV_PATH)
    print(f"  {len(df)} rows, {len(df.columns)} columns")

    print("\nCreating categorical columns ...")

    cats = {
        "population_cat":     categorize_population,
        "area_cat":           categorize_area,
        "GDP_cat":            categorize_gdp,
        "gdp_per_capita_cat": categorize_gdp_per_capita,
        "armed_forces_cat":   categorize_armed_forces,
        "pop_density_cat":    categorize_pop_density,
        "timezone_cat":       categorize_timezone_count,
        "unesco_cat":         categorize_unesco,
        "latitude_cat":       categorize_latitude,
        "longitude_cat":      categorize_longitude,
    }

    for col_name, fn in cats.items():
        df[col_name] = fn(df)
        counts = df[col_name].value_counts()
        print(f"\n  {col_name} ({len(counts)} categories):")
        for label, count in counts.items():
            print(f"    {label:.<40s} {count:>3} countries")

    # Write
    df.to_csv(CSV_PATH, index=False)
    print(f"\nDone — wrote {len(df)} rows × {len(df.columns)} cols to {CSV_PATH}")


if __name__ == "__main__":
    main()
