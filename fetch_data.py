import csv
import json
import os

# --- CONFIGURATION ---
OUTPUT_FILE = "./src/assets/data/gameData.json"
DATA_DIR = "./data"

# Map category keys to their CSV files
CATEGORY_MAP = {
    "countries": {
        "schema": "countries_schema_config.csv",
        "data": "countries_enriched.csv",
    },
    "hollywood": {
        "schema": "hollywood_schema_config.csv",
        "data": "hollywood_enriched.csv",
    },
    "chemicals": {
        "schema": "chemicals_schema_config.csv",
        "data": "chemicals_enriched.csv",
    },
    "animals": {
        "schema": "animals_schema_config.csv",
        "data": "animals_enriched.csv",
    },
}


def clean_value(value, data_type):
    """Parse a CSV value based on its declared data_type."""
    if value is None or value == "" or value == "-1":
        return None

    s = str(value).strip()

    if data_type == "INT":
        s = s.replace("$", "").replace(",", "")
        try:
            return int(float(s))
        except (ValueError, TypeError):
            return None

    if data_type == "FLOAT":
        s = s.replace("$", "").replace(",", "")
        try:
            return round(float(s), 6)
        except (ValueError, TypeError):
            return None

    if data_type == "CURRENCY":
        s = s.replace("$", "").replace(",", "")
        try:
            return round(float(s), 2)
        except (ValueError, TypeError):
            return None

    if data_type == "BOOLEAN":
        return s.lower() in ("true", "1", "yes")

    # STRING, LIST, etc.
    return s


def parse_schema_config(csv_path):
    """Read a schema_config CSV and return a list of SchemaField objects."""
    schema = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            field = {
                "attributeKey": row["attribute_key"].strip(),
                "displayLabel": row["display_label"].strip(),
                "dataType": row["data_type"].strip(),
                "logicType": row["logic_type"].strip(),
                "displayFormat": row["display_format"].strip(),
                "isFolded": row["is_folded"].strip().lower() == "true",
                "isVirtual": row["is_virtual"].strip().lower() == "true",
            }

            linked = row.get("linked_category_col", "").strip()
            if linked:
                field["linkedCategoryCol"] = linked

            ui_color = row.get("ui_color_logic", "").strip()
            if ui_color:
                field["uiColorLogic"] = ui_color

            schema.append(field)
    return schema


def parse_entity_data(csv_path, schema):
    """Read an enriched CSV and return entity records with all columns."""
    # Build a lookup: column_name -> data_type from schema
    type_lookup = {}
    for field in schema:
        type_lookup[field["attributeKey"]] = field["dataType"]

    # Find the TARGET column (entity name) — defaults to "name" if not found
    name_col = "name"
    for field in schema:
        if field["logicType"] == "TARGET":
            name_col = field["attributeKey"]
            break

    entities = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # Find the actual id column name (case-insensitive), or None if absent
        id_col = None
        if reader.fieldnames:
            for fn in reader.fieldnames:
                if fn.strip().lower() == "id":
                    id_col = fn.strip()
                    break

        for row in reader:
            entity = {}

            # Always keep id and name as strings
            entity_name = row.get(name_col, "").strip()
            entity_id = row.get(id_col, "").strip() if id_col else entity_name

            if not entity_id or not entity_name:
                continue

            entity["id"] = entity_id
            entity["name"] = entity_name

            # Process all columns from the CSV
            skip_cols = {name_col}
            if id_col:
                skip_cols.add(id_col)
            for col, raw_val in row.items():
                if col in skip_cols:
                    continue

                # Use schema data type if known, otherwise keep as string
                data_type = type_lookup.get(col, "STRING")
                cleaned = clean_value(raw_val, data_type)

                if cleaned is not None:
                    entity[col] = cleaned

            entities.append(entity)

    return entities


def main():
    payload = {
        "schemaConfig": {},
        "categories": {},
    }

    for cat_key, files in CATEGORY_MAP.items():
        schema_path = os.path.join(DATA_DIR, files["schema"])
        data_path = os.path.join(DATA_DIR, files["data"])

        if not os.path.exists(schema_path):
            print(f"  Warning: Schema config not found: {schema_path}. Skipping {cat_key}.")
            continue
        if not os.path.exists(data_path):
            print(f"  Warning: Data file not found: {data_path}. Skipping {cat_key}.")
            continue

        print(f"Processing {cat_key}...")

        # Parse schema
        schema = parse_schema_config(schema_path)
        payload["schemaConfig"][cat_key] = schema
        print(f"  Schema: {len(schema)} fields")

        # Parse entity data
        entities = parse_entity_data(data_path, schema)
        payload["categories"][cat_key] = entities
        print(f"  Entities: {len(entities)} records")

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Data saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
