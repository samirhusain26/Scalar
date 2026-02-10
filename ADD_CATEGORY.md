# Adding a New Category to Scalar

This guide contains everything needed to add a new category to the Scalar guessing game. It is written for LLM consumption — follow each step precisely and reference the exact file formats, naming conventions, and patterns described below.

---

## Overview

Adding a new category requires **3 files** and **1 registry edit**. No React/TypeScript code changes are needed — the UI auto-discovers categories from `gameData.json`.

| Step | File | Purpose |
|------|------|---------|
| 1 | `data/{category}_enriched.csv` | Entity data (one row per guessable item) |
| 2 | `data/{category}_schema_config.csv` | Schema definition (field types, logic, display) |
| 3 | `data/clean_{category}.py` | Data cleaning + enrichment + range categories |
| 4 | `fetch_data.py` (edit) | Register the new category in `CATEGORY_MAP` |
| 5 | `python fetch_data.py` | Regenerate `src/assets/data/gameData.json` |

After step 5, `npm run dev` will show the new category in the dropdown. No component code changes needed.

---

## Step 1: Create the Enriched Data CSV

### File: `data/{category}_enriched.csv`

This is the final CSV consumed by `fetch_data.py`. It contains one row per entity with all attribute columns.

### Required Columns

Every enriched CSV **must** have:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | STRING | Unique identifier (e.g., alpha-3 code, numeric ID). If absent, the entity name is used as ID. |
| `{name_column}` | STRING | Entity name — the guessable target (e.g., `Animal`, `Title`, `Name`, `name`). This column's `attribute_key` must have `logic_type=TARGET` in the schema. |

### Column Naming Conventions

- **Display attributes**: Use descriptive names matching what you want in the schema (e.g., `weight_kg`, `release_year`, `top_speed`). Use snake_case.
- **Category/range columns** (hidden support columns for HIGHER_LOWER tolerance matching): Name them `{attribute}_cat`, `{attribute}_category`, `{attribute}_class`, or `{attribute}_range`. These are hidden from the UI.
- **Boolean columns**: Values should be `TRUE`/`FALSE` (case-insensitive; parsed by `fetch_data.py`).
- **List columns**: Comma-separated values (e.g., `"Action, Adventure, Sci-Fi"`). Used with `SET_INTERSECTION` logic.

### Missing Value Conventions

| Data Type | Missing Sentinel |
|-----------|-----------------|
| Numeric (INT, FLOAT, CURRENCY) | `-1` or empty string |
| String | Empty string or omitted |
| Boolean | `FALSE` (default) |
| List | Empty string |

### Example Entity Row (animals)

```csv
Animal,class,skin_type,diet,weight_kg,height_cm,speed_kmh,lifespan_years,conservation_status,weight_class,height_class,speed_class,lifespan_class
African Elephant,Mammalia,Leathery,Herbivore,6000,400,40,65,VU,Massive,Tall,Moderate,Long
```

### Data Quality Requirements

- **Minimum ~30 entities** for a playable category (50-200 is ideal).
- **No duplicate names** — each entity name must be unique.
- **Consistent data types** — don't mix strings and numbers in numeric columns.
- **UTF-8 encoding** — required for non-ASCII characters (accents, special chars).

---

## Step 2: Create the Schema Config CSV

### File: `data/{category}_schema_config.csv`

This CSV defines how each field is processed, displayed, and colored in the UI.

### CSV Header (exact column names required)

```csv
category,attribute_key,display_label,data_type,logic_type,display_format,is_folded,is_virtual,linked_category_col,ui_color_logic
```

> **Note**: The `ui_color_logic` column is optional. If your category doesn't need it, you can omit it from the header (like `hollywood`, `chemicals`, and `animals` do). If any field needs `DISTANCE_GRADIENT` coloring (geographic text fields), you must include it.

### Column Definitions

| Column | Required | Values | Description |
|--------|----------|--------|-------------|
| `category` | Yes | Your category key (e.g., `"music"`) | Same value for every row |
| `attribute_key` | Yes | Column name in enriched CSV | Must exactly match a CSV column header |
| `display_label` | Yes | Human-readable label | Shown as the cell header in the guess card UI |
| `data_type` | Yes | `INT`, `FLOAT`, `STRING`, `CURRENCY`, `BOOLEAN`, `LIST` | How `fetch_data.py` parses the raw CSV value |
| `logic_type` | Yes | See table below | How feedback is computed for this field |
| `display_format` | Yes | See table below | How the cell value renders in the UI |
| `is_folded` | Yes | `True` / `False` | `True` = hidden in "More clues" expandable section |
| `is_virtual` | Yes | `True` / `False` | `True` = computed at runtime (not in CSV). Only used for `distance_km` in countries. Almost always `False`. |
| `linked_category_col` | No | Column name of hidden category column | Required for HIGHER_LOWER fields that need HOT (gold) status when in the same bucket |
| `ui_color_logic` | No | `DISTANCE_GRADIENT`, `CATEGORY_MATCH`, `STANDARD`, or blank | Override for cell background color strategy |

### Logic Types Reference

| LogicType | When to Use | Feedback | Status Rules |
|-----------|-------------|----------|-------------|
| `TARGET` | Entity name column | N/A (hidden) | N/A |
| `NONE` | Hidden support columns (category ranges, lat/lon) | N/A (hidden) | N/A |
| `EXACT_MATCH` | Binary discrete attributes (boolean, enum with few values) | Equal or not | EXACT if equal, MISS if not |
| `CATEGORY_MATCH` | Categorical strings (genre, region, type) | String equality | EXACT if equal, MISS if not. Colored by `uiColorLogic`. |
| `HIGHER_LOWER` | Numeric attributes (year, count, measurement) | Direction (↑/↓) + tier | EXACT if equal, HOT if linked category matches, MISS otherwise |
| `GEO_DISTANCE` | Geographic distance (virtual field) | Haversine km | EXACT/HOT/NEAR/MISS by distance thresholds |
| `SET_INTERSECTION` | Comma-separated lists (genres, tags, cast) | Overlap ratio | EXACT/HOT/NEAR/MISS by intersection-over-union ratio |

### Display Formats Reference

| DisplayFormat | Renders As | Use With |
|---------------|-----------|----------|
| `HIDDEN` | Not shown in grid | TARGET, NONE, and category range columns |
| `TEXT` | Raw string value | EXACT_MATCH, CATEGORY_MATCH |
| `NUMBER` | Raw numeric value with direction arrow | HIGHER_LOWER (counts, years, raw values) |
| `PERCENTAGE_DIFF` | Direction arrow + tier (e.g., "↑ ~25%") | HIGHER_LOWER (large-range numerics like population, area) |
| `RELATIVE_PERCENTAGE` | Direction arrow + relative % (e.g., "↑ +34%") | HIGHER_LOWER (physical measurements like weight, height) |
| `CURRENCY` | Direction arrow + $-prefixed value | HIGHER_LOWER (monetary values) |
| `DISTANCE` | Formatted km (e.g., "1,234 km") | GEO_DISTANCE only |
| `LIST` | Comma-separated with per-item match coloring | SET_INTERSECTION only |
| `ALPHA_POSITION` | Letter A-Z with horizontal arrows | HIGHER_LOWER (alphabet position) |

### UI Color Logic Reference

| UIColorLogic | Effect | When to Use |
|-------------|--------|-------------|
| (blank/omitted) | Default: STANDARD thermal colors for HIGHER_LOWER; binary for EXACT_MATCH | Most fields |
| `STANDARD` | Green (EXACT) / Orange (HOT) / Amber-dashed (NEAR) / White (MISS) | Explicitly force thermal coloring |
| `DISTANCE_GRADIENT` | Green if text matches, white if not. Attaches haversine distance for proximity info. | Geographic text fields (continent, subregion, hemisphere) — requires Latitude/Longitude in entity data |
| `CATEGORY_MATCH` | Green (exact) / Gold (category match) / White (miss) | Categorical fields where you want gold for close matches |

### Schema Row Types (Template)

Every schema needs these row types. Copy and adapt:

#### 1. TARGET Row (required, exactly one)
```csv
{category},{name_column},Display Label,STRING,TARGET,HIDDEN,False,False,,
```

#### 2. Display Attribute Rows (the visible game fields)
```csv
{category},{attr_key},{Label},{data_type},{logic_type},{display_format},{is_folded},False,{linked_col},{ui_color}
```

#### 3. Hidden Category Range Rows (support columns for HIGHER_LOWER)
```csv
{category},{attr}_cat,{Label} Cat,STRING,NONE,HIDDEN,False,False,,
```

### Complete Schema Template

Here is a template for a new category. Adapt field names and types:

```csv
category,attribute_key,display_label,data_type,logic_type,display_format,is_folded,is_virtual,linked_category_col
{cat},{name_col},{Name Label},STRING,TARGET,HIDDEN,False,False,
{cat},{string_attr},String Label,STRING,EXACT_MATCH,TEXT,False,False,
{cat},{category_attr},Category Label,STRING,CATEGORY_MATCH,TEXT,False,False,
{cat},{numeric_attr},Numeric Label,INT,HIGHER_LOWER,NUMBER,False,False,{numeric_attr}_cat
{cat},{big_numeric},Big Numeric,INT,HIGHER_LOWER,PERCENTAGE_DIFF,False,False,{big_numeric}_cat
{cat},{money_attr},Money Label,CURRENCY,HIGHER_LOWER,CURRENCY,False,False,{money_attr}_cat
{cat},{list_attr},List Label,LIST,SET_INTERSECTION,LIST,False,False,
{cat},{bool_attr},Boolean Label,BOOLEAN,EXACT_MATCH,TEXT,False,False,
{cat},{folded_attr},Folded Label,INT,HIGHER_LOWER,NUMBER,True,False,{folded_attr}_cat
{cat},{numeric_attr}_cat,Numeric Cat,STRING,NONE,HIDDEN,False,False,
{cat},{big_numeric}_cat,Big Numeric Cat,STRING,NONE,HIDDEN,False,False,
{cat},{money_attr}_cat,Money Cat,STRING,NONE,HIDDEN,False,False,
{cat},{folded_attr}_cat,Folded Cat,STRING,NONE,HIDDEN,False,False,
```

### Schema Design Guidelines

1. **Field ordering matters**: Rows render in schema order (top-to-bottom = left-to-right, top-to-bottom in the grid). Put the most informative/distinguishing fields first.
2. **5-8 non-folded display fields** is the sweet spot. More than 8 makes the card feel cluttered.
3. **3-6 folded fields** for depth. These go in the "More clues" expandable section.
4. **At least 2-3 HIGHER_LOWER fields** with linked category columns. These provide the gold "HOT" status that helps players narrow down ranges.
5. **At least 1-2 EXACT_MATCH fields** for binary/enum clues.
6. **SET_INTERSECTION fields** (if applicable) render full-width (col-span-2). Good for lists like genres, tags, ingredients.
7. **Every HIGHER_LOWER field should have a linked category column** unless the range is very small (e.g., period 1-7 in chemicals). Category columns provide the "warm" feedback that makes the game more forgiving.

---

## Step 3: Create the Cleaning/Enrichment Script

### File: `data/clean_{category}.py`

This script transforms raw data into the final enriched CSV. It runs once during data preparation (not at app runtime).

### Script Structure Template

```python
#!/usr/bin/env python3
"""Clean and enrich {category} data for Scalar.

Tasks:
1. Remove duplicate/corrupted entries
2. Fix known data issues (wrong units, typos, outliers)
3. Add computed enrichment columns
4. Add categorical range columns for HIGHER_LOWER tolerance matching
5. Add fun/meta fields (scrabble score, word count, etc.)
"""

import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, '{category}_enriched.csv')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, '{category}_enriched.csv')

# ============================================================
# 1. ENTRIES TO REMOVE (duplicates, corrupted, too generic)
# ============================================================
REMOVE_ENTRIES = {
    # "Bad Entry Name",  # reason for removal
}

# ============================================================
# 2. VALUE CORRECTIONS (known data issues)
# ============================================================
# Example: weights in wrong units, typos, outliers
VALUE_CORRECTIONS = {
    # "Entity Name": corrected_value,
}

# ============================================================
# 3. RANGE CLASSIFICATION FUNCTIONS
#    These create the hidden category columns used by
#    HIGHER_LOWER fields for "HOT" (gold) tolerance matching.
#
#    Guidelines:
#    - 5-8 buckets per field (fewer = too easy, more = rarely HOT)
#    - Buckets should roughly have equal entity counts
#    - Use descriptive labels players can intuit
#    - Return empty string for missing/null values
# ============================================================

def classify_example_attr(value):
    """N buckets for example_attr."""
    if value is None or value < 0:
        return ""
    if value < 10:
        return "Very Low"
    if value < 50:
        return "Low"
    if value < 100:
        return "Medium"
    if value < 500:
        return "High"
    return "Very High"


# ============================================================
# 4. SCRABBLE SCORING (optional fun/meta field)
# ============================================================
SCRABBLE_SCORES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10,
}

def calculate_scrabble_score(word):
    return sum(SCRABBLE_SCORES.get(ch, 0) for ch in word.upper() if ch.isalpha())


# ============================================================
# HELPERS
# ============================================================

def parse_float(val):
    if val is None or str(val).strip() == "":
        return None
    try:
        return float(val)
    except ValueError:
        return None

def parse_int(val):
    if val is None or str(val).strip() == "":
        return None
    try:
        return int(float(val))
    except ValueError:
        return None

def fmt(val):
    """Format numeric value for CSV: drop trailing .0, empty for None."""
    if val is None:
        return ""
    if isinstance(val, float) and val == int(val) and val >= 0:
        return str(int(val))
    return str(val)


# ============================================================
# MAIN
# ============================================================

def main():
    # --- Read ---
    rows = []
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    print(f"Read {len(rows)} rows")

    # --- Remove bad entries ---
    name_col = '{name_column}'  # e.g., 'Animal', 'Title', 'Name'
    cleaned = [r for r in rows if r[name_col].strip() not in REMOVE_ENTRIES]
    print(f"Removed {len(rows) - len(cleaned)} entries, {len(cleaned)} remaining")

    # --- Process each row ---
    output = []
    for row in cleaned:
        entity_name = row[name_col].strip()

        # Apply value corrections
        # ...

        # Parse numeric fields
        # example_val = parse_float(row.get('example_attr'))

        # Add computed enrichment columns
        # row['computed_field'] = some_function(row)

        # Add range categories (MUST match linked_category_col in schema)
        # row['example_attr_cat'] = classify_example_attr(example_val)

        # Add fun/meta fields
        # row['scrabble_score'] = fmt(calculate_scrabble_score(entity_name))
        # row['name_word_count'] = fmt(len(entity_name.split()))

        output.append(row)

    # --- Write ---
    fieldnames = [
        # List ALL columns in desired order
        # name_col, 'attr1', 'attr2', ..., 'cat1', 'cat2', ...
    ]

    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(output)
    print(f"Wrote {len(output)} rows -> {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
```

### Range Category Design Rules

Linked category columns are the most important enrichment step. They control when HIGHER_LOWER fields show gold "HOT" feedback (meaning "you're in the right ballpark").

1. **Aim for 5-8 buckets** per numeric field. Too few (3-4) makes HOT too easy; too many (10+) makes it useless.
2. **Roughly equal entity distribution** across buckets. Don't create a bucket that contains 80% of entities.
3. **Use intuitive labels** — players see these in raw data. Labels like `"Light (1-5)"` are clearer than `"Bucket 3"`.
4. **Missing values** → return empty string `""`, not a bucket label.
5. **Verify distributions** after running the script. Print a summary like:
   ```python
   for col in range_columns:
       dist = {}
       for r in output:
           v = r.get(col, '')
           dist[v] = dist.get(v, 0) + 1
       print(f"\n{col}:")
       for k, c in sorted(dist.items(), key=lambda x: -x[1]):
           print(f"  {k or '(empty)':20s} {c}")
   ```

### Alternative: Pandas-Based Script

For simpler datasets, you can use pandas (see `data/clean_chemicals.py`):

```python
import pandas as pd

df = pd.read_csv("data/{category}_enriched.csv")

# Clean
df["numeric_col"] = pd.to_numeric(df["numeric_col"], errors="coerce").fillna(-1).astype(int)

# Enrich
df["derived_col"] = df.apply(some_function, axis=1)

# Add range categories
df["numeric_col_cat"] = df["numeric_col"].apply(classify_function)

# Write
df.to_csv("data/{category}_enriched.csv", index=False)
```

---

## Step 4: Register in fetch_data.py

### File: `fetch_data.py` (edit existing)

Add an entry to the `CATEGORY_MAP` dictionary:

```python
CATEGORY_MAP = {
    "countries": { ... },
    "hollywood": { ... },
    "chemicals": { ... },
    "animals": { ... },
    # ADD THIS:
    "{category}": {
        "schema": "{category}_schema_config.csv",
        "data": "{category}_enriched.csv",
    },
}
```

The key (e.g., `"music"`) becomes the category ID used throughout the app. It appears in:
- The category dropdown selector in the UI
- The localStorage state
- Challenge URLs
- Analytics events

**Choose a short, lowercase, single-word key.**

---

## Step 5: Generate gameData.json

```bash
python fetch_data.py
```

This reads all schema configs and enriched CSVs from `data/`, and writes the unified `src/assets/data/gameData.json`.

Verify the output:
```bash
python -c "
import json
with open('src/assets/data/gameData.json') as f:
    data = json.load(f)
cat = '{category}'
print(f'Schema fields: {len(data[\"schemaConfig\"][cat])}')
print(f'Entities: {len(data[\"categories\"][cat])}')
print(f'Sample entity: {json.dumps(data[\"categories\"][cat][0], indent=2)[:500]}')
"
```

Then run the dev server:
```bash
npm run dev
```

The new category should appear in the dropdown. Play a few rounds to verify feedback colors, direction arrows, hints, and folded sections all work correctly.

---

## Checklist

Use this checklist to verify everything is wired up correctly:

### Data Files
- [ ] `data/{category}_enriched.csv` exists with UTF-8 encoding
- [ ] Has `id` column (or entity name used as ID)
- [ ] Has a name column matching the TARGET `attribute_key` in schema
- [ ] Missing numerics use `-1` or empty string (not `N/A`, `null`, `None`)
- [ ] Boolean columns use `TRUE`/`FALSE`
- [ ] List columns use comma-separated values
- [ ] No duplicate entity names
- [ ] At least 30 entities (50-200 ideal)

### Schema Config
- [ ] `data/{category}_schema_config.csv` exists
- [ ] Exactly one row with `logic_type=TARGET` and `display_format=HIDDEN`
- [ ] Every `attribute_key` matches a column in the enriched CSV (except virtual fields)
- [ ] Every `linked_category_col` value matches a `attribute_key` of a HIDDEN/NONE row
- [ ] HIDDEN support columns have `logic_type=NONE` and `display_format=HIDDEN`
- [ ] `is_folded` is `True` only for supplementary clue fields (not primary identifiers)
- [ ] `data_type` matches the actual CSV data (INT for integers, FLOAT for decimals, etc.)
- [ ] `category` column has the same value in every row

### Cleaning Script
- [ ] `data/clean_{category}.py` exists and runs without errors
- [ ] Produces the enriched CSV with all required columns
- [ ] Range category columns have 5-8 roughly-equal-sized buckets
- [ ] Missing values handled (empty string for categories, -1 for numerics)
- [ ] Prints distribution summary for range categories

### Pipeline
- [ ] `fetch_data.py` has the new category in `CATEGORY_MAP`
- [ ] `python fetch_data.py` runs without errors
- [ ] Output shows correct field count and entity count
- [ ] `npm run dev` shows the new category in the dropdown
- [ ] `npm run build` succeeds (no TypeScript errors)

### Gameplay Verification
- [ ] Guessing works — autocomplete suggests entities
- [ ] Feedback colors render correctly (green/orange/amber/white)
- [ ] HIGHER_LOWER fields show direction arrows (↑/↓)
- [ ] Linked category columns produce gold HOT status when in same bucket
- [ ] Folded "More clues" section expands/collapses
- [ ] Eye icon hints reveal correct target values
- [ ] Win condition triggers when all attributes match
- [ ] Game Over modal shares correctly

---

## Special Rendering Features

The `GuessCard.tsx` component has special rendering logic triggered by specific `attribute_key` names, `display_format` values, or `logic_type` values. Be aware of these if your category uses similar patterns:

### Automatic Behaviors (triggered by schema config, no code changes needed)

| Trigger | Behavior |
|---------|----------|
| `display_format: ALPHA_POSITION` | Renders number (1-26) as letter (A-Z) with horizontal arrows (←/→) |
| `display_format: LIST` | Full-width cell (col-span-2) with per-item match coloring |
| `display_format: CURRENCY` | Dollar-sign prefix on values |
| `display_format: RELATIVE_PERCENTAGE` | Shows +/- percentage relative to guess |
| `display_format: PERCENTAGE_DIFF` | Shows bucketed tier (~10%, ~25%, etc.) |
| `data_type: BOOLEAN` | Renders as "Yes"/"No" |
| `logic_type: HIGHER_LOWER` + year-like values | Auto-detects year fields and uses year-diff tiers instead of percentage |
| `logic_type: SET_INTERSECTION` | Shows intersection count "X/Y" with per-item highlighting |
| `ui_color_logic: DISTANCE_GRADIENT` | Binary green/white based on text match (requires Lat/Lon in data) |

### Hardcoded Key-Specific Behaviors

These behaviors are triggered by specific `attribute_key` values in `GuessCard.tsx`. If your new category happens to use these same keys, the behavior applies automatically. If you want similar behavior for different keys, you'd need to modify `GuessCard.tsx`.

| Key | Behavior |
|-----|----------|
| `continent`, `subregion`, `hemisphere` | Merged into a single "Location" cell (Hemisphere . Continent . Subregion) |
| `olympics_hosted_count` + `olympics_latest_year` | Merged display: "3 (2020)" with custom amber coloring |
| `conservation_status` | IUCN codes expanded to full labels (LC -> Least Concern, etc.) |
| `scrabble_score` | Shows "14 pts" or "14 pts . 2w" format |
| `Credits` | Cast & Crew mode: only shows matched items, hidden if no matches |
| `weight_kg`, `height_cm`, `lifespan_years`, `speed_kmh` | Unit suffixes: "kg", "cm", "yrs", "km/h" |

> **Important**: If you want unit suffixes on numeric fields in your new category, either reuse the exact keys above, or add new cases in `GuessCard.tsx`'s `renderAttributeValue` function.

---

## Example: Adding a "Music" Category

Here's a concrete example of adding a music/bands category.

### 1. Schema: `data/music_schema_config.csv`

```csv
category,attribute_key,display_label,data_type,logic_type,display_format,is_folded,is_virtual,linked_category_col
music,Artist,Artist,STRING,TARGET,HIDDEN,False,False,
music,genre,Genre,LIST,SET_INTERSECTION,LIST,False,False,
music,decade_active,Era,STRING,CATEGORY_MATCH,TEXT,False,False,
music,origin_country,Origin,STRING,CATEGORY_MATCH,TEXT,False,False,
music,members_count,Members,INT,HIGHER_LOWER,NUMBER,False,False,members_cat
music,grammy_wins,Grammys,INT,HIGHER_LOWER,NUMBER,False,False,grammy_cat
music,albums_count,Albums,INT,HIGHER_LOWER,NUMBER,False,False,albums_cat
music,is_active,Still Active?,BOOLEAN,EXACT_MATCH,TEXT,False,False,
music,debut_year,Debut Year,INT,HIGHER_LOWER,NUMBER,True,False,debut_cat
music,top_chart_hits,Chart Hits,INT,HIGHER_LOWER,NUMBER,True,False,chart_cat
music,record_label,Label,STRING,CATEGORY_MATCH,TEXT,True,False,
music,scrabble_score,Name Score,INT,HIGHER_LOWER,NUMBER,False,False,
music,members_cat,Members Cat,STRING,NONE,HIDDEN,False,False,
music,grammy_cat,Grammy Cat,STRING,NONE,HIDDEN,False,False,
music,albums_cat,Albums Cat,STRING,NONE,HIDDEN,False,False,
music,debut_cat,Debut Cat,STRING,NONE,HIDDEN,False,False,
music,chart_cat,Chart Cat,STRING,NONE,HIDDEN,False,False,
```

### 2. Enriched CSV snippet: `data/music_enriched.csv`

```csv
id,Artist,genre,decade_active,origin_country,members_count,grammy_wins,albums_count,is_active,debut_year,top_chart_hits,record_label,scrabble_score,members_cat,grammy_cat,albums_cat,debut_cat,chart_cat
1,The Beatles,"Rock, Pop",1960s,United Kingdom,4,7,13,FALSE,1960,22,Apple Records,14,Small,Award-Winning,Prolific,Classic,Hit Machine
2,Radiohead,"Alternative, Rock, Electronic",1990s,United Kingdom,5,3,9,TRUE,1992,5,XL Recordings,17,Small,Acclaimed,Moderate,Modern,Moderate
```

### 3. Cleaning script: `data/clean_music.py`

```python
#!/usr/bin/env python3
import csv, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, 'music_enriched.csv')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'music_enriched.csv')

def classify_members(n):
    if n is None or n < 1: return ""
    if n == 1: return "Solo"
    if n <= 3: return "Small"
    if n <= 6: return "Medium"
    return "Large"

def classify_grammys(n):
    if n is None or n < 0: return ""
    if n == 0: return "None"
    if n <= 2: return "Some"
    if n <= 5: return "Acclaimed"
    if n <= 15: return "Award-Winning"
    return "Legendary"

def classify_albums(n):
    if n is None or n < 0: return ""
    if n <= 3: return "Few"
    if n <= 6: return "Moderate"
    if n <= 12: return "Prolific"
    return "Extensive"

def classify_debut(year):
    if year is None or year < 1900: return ""
    if year < 1970: return "Classic"
    if year < 1985: return "Vintage"
    if year < 2000: return "Modern"
    if year < 2010: return "Contemporary"
    return "Recent"

def classify_chart_hits(n):
    if n is None or n < 0: return ""
    if n == 0: return "None"
    if n <= 3: return "Few"
    if n <= 8: return "Moderate"
    if n <= 20: return "Hit Machine"
    return "Legend"

# ... main() reads CSV, applies classifiers, writes output
```

### 4. Register in `fetch_data.py`

```python
CATEGORY_MAP = {
    # ... existing categories ...
    "music": {
        "schema": "music_schema_config.csv",
        "data": "music_enriched.csv",
    },
}
```

### 5. Run pipeline

```bash
cd data && python clean_music.py && cd ..
python fetch_data.py
npm run dev
```

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Entity not appearing in autocomplete | Check that the TARGET column name in schema matches the actual CSV column header exactly |
| "NaN" showing in cells | Ensure missing numerics are `-1` or empty, not `NaN`, `null`, or `None` in the CSV |
| No gold (HOT) feedback on HIGHER_LOWER fields | Verify `linked_category_col` in schema points to a valid hidden column, and that column has range values in the enriched CSV |
| Fields showing in wrong order | Schema CSV row order = display order. Reorder rows in the schema config. |
| Folded fields not appearing | Check `is_folded=True` in schema and that the field has a visible `display_format` (not HIDDEN) |
| Category not in dropdown | Verify the key in `CATEGORY_MAP` and that `fetch_data.py` ran without errors |
| Build fails after adding category | Run `npm run build` — likely a data issue in `gameData.json` (invalid JSON, missing fields) |
| All feedback showing as MISS | Check that `data_type` matches actual values. E.g., `INT` for integers, not `STRING`. |
| Direction arrows missing | Only `HIGHER_LOWER` logic type shows direction arrows. Check `logic_type` in schema. |
| Boolean showing "true"/"false" instead of "Yes"/"No" | Ensure `data_type` is `BOOLEAN` in schema (not `STRING`) |

---

## No Code Changes Needed (Auto-Discovery)

The following parts of the codebase are **fully data-driven** and require zero modifications for a new category:

- **App.tsx**: Derives `CATEGORIES` from `Object.keys(gameData.categories)` — auto-discovers new categories
- **gameStore.ts**: `setActiveCategory(cat)` works with any category key present in `gameData`
- **gameLogic.ts**: `getFeedback()` dispatches by `logicType` from schema — no category-specific code
- **feedbackColors.ts**: Color logic dispatches by `uiColorLogic` from schema — no category-specific code
- **GameGrid.tsx**: Uses `getDisplayColumns()` from schema — adapts to any field set
- **GameInput.tsx**: Uses `getSuggestions()` which works with any entity list
- **GameOverModal.tsx**: Shares results generically
- **Scoreboard.tsx**: Displays moves/credits generically

The only category-specific rendering in `GuessCard.tsx` is triggered by specific `attribute_key` values (listed in "Hardcoded Key-Specific Behaviors" above), not by category name. Your new category will work perfectly without touching any TypeScript.
