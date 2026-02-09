"""
enrich_hollywood.py
───────────────────
Adds derived Fun/Meta columns to hollywood_enriched.csv.

Reads  : data/hollywood_enriched.csv
Writes : data/hollywood_enriched.csv (in-place update)
"""

import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
CSV_PATH = DATA_DIR / "hollywood_enriched.csv"


def main():
    print("Loading Hollywood CSV ...")
    df = pd.read_csv(CSV_PATH)
    print(f"  {len(df)} rows, {len(df.columns)} columns")

    # Fun/Meta: title_word_count — number of words in movie title (split by space)
    print("\nComputing title_word_count ...")
    df["title_word_count"] = df["Title"].str.strip().str.split().apply(len)

    dist = df["title_word_count"].value_counts().sort_index()
    print(f"  title_word_count distribution:")
    for val, count in dist.items():
        print(f"    {val} words:{'.' * (25 - len(f'{val} words'))} {count:>3} movies")

    # Write
    df.to_csv(CSV_PATH, index=False)
    print(f"\nDone — wrote {len(df)} rows x {len(df.columns)} cols to {CSV_PATH}")


if __name__ == "__main__":
    main()
