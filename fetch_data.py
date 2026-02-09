import gspread
import json
import os

# --- CONFIGURATION ---
# --- CONFIGURATION ---
SHEET_KEY = "1XhZ66tFCbJhcIN5CgObzcVc8J3WkXoz5B0-R4V6O3h0" # Sheet ID from URL
OUTPUT_FILE = "./src/assets/data/gameData.json" # Where to save game data
CREDENTIALS_FILE = "credentials.json"

# Map the internal category keys to your specific Tab Names
TAB_MAP = {
    "countries": "Data_countries",
    "hollywood": "Data_hollywood",
    "chemicals": "Data_chemicals",
    "animals": "Data_animals"
}

def clean_number(value, is_int=False):
    """Parses numeric values, handling commas and currency symbols."""
    if value == "" or value is None:
        return None
    
    # Convert to string, strip whitespace, remove $, commas, and k/M suffixes if accidentally added
    s_val = str(value).strip().replace("$", "").replace(",", "").replace("k", "").replace("M", "")
    
    try:
        if is_int:
            return int(float(s_val)) # Handle "1990.0" as 1990
        return float(s_val)
    except ValueError:
        return None # Return None if data is bad (e.g. "Unknown")

def main():
    print(f"🔌 Connecting to Google Sheet via ID: '{SHEET_KEY}'...")
    
    try:
        gc = gspread.service_account(filename=CREDENTIALS_FILE)
        sh = gc.open_by_key(SHEET_KEY)
    except Exception as e:
        import traceback
        print(f"❌ Error: Could not connect to Google Sheet.")
        print(f"Make sure you have shared the sheet with client_email from credentials.json")
        print(f"Details: {e}")
        traceback.print_exc()
        return

    full_payload = {
        "schema": {},
        "categories": {}
    }

    # --- PART A: FETCH SCHEMA CONFIG ---
    print("📋 Fetching Schema Rules...")
    try:
        ws_schema = sh.worksheet("schema_config")
        schema_rows = ws_schema.get_all_records()
        
        # Transform schema into a lookup object for the App
        for row in schema_rows:
            cat = row['category']
            if cat not in full_payload["schema"]:
                full_payload["schema"][cat] = {}
            
            # Build proximityConfig object from sheet columns
            thermal_type = str(row.get('thermal_type', '')).strip().upper()
            thermal_value = clean_number(row.get('thermal_value', ''))
            warm_multiplier = clean_number(row.get('heat_multiplier', ''))

            proximity_config = None
            if thermal_type in ('PERCENT', 'RANGE') and thermal_value is not None:
                proximity_config = {
                    "type": thermal_type,
                    "value": thermal_value,
                    "warmMultiplier": warm_multiplier if warm_multiplier is not None else 1.0
                }

            full_payload["schema"][cat][row['attribute_key']] = {
                "label": row['display_label'],
                "type": row['data_type'],
                "unitPrefix": row.get('unit_prefix', ''),
                "unitSuffix": row.get('unit_suffix', ''),
                "proximityConfig": proximity_config
            }
    except Exception as e:
        print(f"⚠️ Warning: Could not process schema_config. {e}")

    # --- PART B: FETCH CATEGORY DATA ---
    for cat_key, tab_name in TAB_MAP.items():
        print(f"📥 Fetching {cat_key} from '{tab_name}'...")
        
        try:
            ws = sh.worksheet(tab_name)
            raw_records = ws.get_all_records()
            
            clean_records = []
            
            # Get type rules for this category to clean data correctly
            cat_schema = full_payload["schema"].get(cat_key, {})
            
            for i, item in enumerate(raw_records):
                clean_item = {}
                # Always keep ID and Name strings
                clean_item['id'] = str(item.get('id', '')).strip()
                clean_item['name'] = str(item.get('name', '')).strip()
                
                # If row has no ID or Name, skip it (empty row)
                if not clean_item['id'] or not clean_item['name']:
                    continue

                # Process fields based on the Schema we just fetched
                for attr, rules in cat_schema.items():
                    raw_val = item.get(attr)
                    
                    if rules['type'] in ['INT', 'FLOAT', 'CURRENCY']:
                        # It's a number, clean it
                        is_int = (rules['type'] == 'INT')
                        clean_item[attr] = clean_number(raw_val, is_int)
                    else:
                        # It's a string
                        clean_item[attr] = str(raw_val).strip()

                clean_records.append(clean_item)
            
            full_payload["categories"][cat_key] = clean_records
            print(f"   ✅ Loaded {len(clean_records)} items for {cat_key}")

        except gspread.WorksheetNotFound:
            print(f"   ⚠️ Tab '{tab_name}' not found. Skipping.")
        except Exception as e:
            print(f"   ❌ Error processing {tab_name}: {e}")

    # --- PART C: SAVE TO FILE ---
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(full_payload, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Done! Data saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()