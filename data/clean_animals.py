#!/usr/bin/env python3
"""Clean and enrich animals.csv with biological stats and range categories.

Tasks:
1. Remove duplicate/corrupted entries
2. Fix weight values (grams → kg) and gestation values (years → days)
3. Add daily_sleep_hours and bite_force_psi columns
4. Add categorical range columns for weight, height, speed, lifespan, sleep, bite force
5. Add body_size column (tiny/small/medium/big/large/gigantic)
"""

import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, 'animals.csv')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'animals.csv')

# ============================================================
# ENTRIES TO REMOVE (duplicates, corrupted, or too generic)
# ============================================================
REMOVE_ANIMALS = {
    "GalÃ¡pagos Penguin",    # Corrupted encoding duplicate of Galápagos Penguin
    "Galliformes",            # Order name, not a species; no usable data
    "Sumatran Rhino",         # Duplicate of Sumatran Rhinoceros
    "Vulture",                # Too generic; no usable data
}

# ============================================================
# WEIGHT CORRECTIONS (values clearly in grams, not kg)
# ============================================================
WEIGHT_CORRECTIONS = {
    "Atlantic Puffin": 0.56,
    "Axolotl": 0.3,
    "Bearded Dragon": 0.6,
    "Blue Whale": 150000,
    "Clownfish": 0.175,
    "Emperor Tamarin": 0.35,
    "Fire Salamander": 0.055,
    "Leaf-tailed Gecko": 0.25,
    "Naked Mole Rat": 0.035,
    "Pink Fairy Armadillo": 0.12,
    "Thorny Devil": 0.085,
    "Toco Toucan": 0.62,
}

# ============================================================
# GESTATION CORRECTIONS: values < 5 are in years, convert to days
# ============================================================
GESTATION_YEAR_THRESHOLD = 5  # below this → multiply by 365

# ============================================================
# LIFESPAN CORRECTIONS (clearly corrupted values)
# ============================================================
LIFESPAN_CORRECTIONS = {
    "Glass Frog": 12.0,  # Was 0.033 (12/365); glass frogs live 10-14 years
}

# ============================================================
# DAILY SLEEP HOURS — class defaults + animal-specific overrides
# ============================================================
DEFAULT_SLEEP_BY_CLASS = {
    "Mammalia": 10.0,
    "Aves": 10.0,
    "Reptilia": 12.0,
    "Amphibia": 12.0,
    "Actinopterygii": 8.0,
    "Chondrichthyes": 6.0,
    "Insecta": -1,
    "Arachnida": -1,
    "Cephalopoda": 8.0,
    "Gastropoda": -1,
    "Malacostraca": -1,
    "Merostomata": -1,
    "Myxini": -1,
    "Sarcopterygii": 8.0,
}

SLEEP_OVERRIDES = {
    "Aardvark": 16.0,
    "Aardwolf": 8.0,
    "African Elephant": 3.5,
    "African Lion": 18.0,
    "African Wild Dog": 10.0,
    "Alpine Ibex": 5.0,
    "American Bison": 7.0,
    "Anteater": 15.0,
    "Arabian Horse": 3.0,
    "Arabian Oryx": 6.0,
    "Arctic Fox": 12.5,
    "Asian Elephant": 4.0,
    "Aye-Aye": 16.0,
    "Baird's Tapir": 12.0,
    "Barbary Macaque": 10.0,
    "Bengal Tiger": 16.0,
    "Black Rhinoceros": 8.0,
    "Blue Whale": 10.5,
    "Bonobo": 10.0,
    "Bornean Orangutan": 12.0,
    "Bottlenose Dolphin": 8.0,
    "Boxer Dog": 12.0,
    "Brown Bear": 14.0,
    "Burmese Python": 18.0,
    "Capybara": 10.0,
    "Cheetah": 12.0,
    "Chimpanzee": 9.5,
    "Common Dolphin": 8.0,
    "Dalmatian Dog": 12.0,
    "Dingo": 10.0,
    "Dugong": 12.0,
    "Eastern Gorilla": 12.0,
    "Echidna": 12.0,
    "Emperor Penguin": 10.5,
    "European Hedgehog": 18.0,
    "Fennec Fox": 12.0,
    "Flying Fox": 14.0,
    "Fossa": 12.0,
    "Galápagos Penguin": 10.0,
    "Galápagos Tortoise": 16.0,
    "Gaur": 6.0,
    "Gerenuk": 6.0,
    "Gharial": 16.0,
    "Giant Panda": 10.0,
    "Gila Monster": 16.0,
    "Green Anaconda": 18.0,
    "Grevy's Zebra": 6.0,
    "Harp Seal": 6.0,
    "Hippopotamus": 16.0,
    "Humpback Whale": 10.5,
    "Iberian Lynx": 14.0,
    "Indri": 10.0,
    "Japanese Macaque": 10.0,
    "Kakapo": 12.0,
    "King Cobra": 18.0,
    "Kiwi": 12.0,
    "Komodo Dragon": 12.0,
    "Lemur": 16.0,
    "Manatee": 12.0,
    "Mandrill": 10.0,
    "Maned Wolf": 10.0,
    "Markhor": 6.0,
    "Meerkat": 10.0,
    "Mountain Gorilla": 12.0,
    "Narwhal": 6.0,
    "Numbat": 15.0,
    "Okapi": 5.0,
    "Orangutan": 12.0,
    "Pangolin": 12.0,
    "Patagonian Mara": 6.0,
    "Platypus": 14.0,
    "Polar Bear": 8.0,
    "Pronghorn": 6.0,
    "Quokka": 12.0,
    "Red Fox": 10.0,
    "Red Kangaroo": 6.0,
    "Red Panda": 13.0,
    "Rottweiler": 12.0,
    "Saola": 8.0,
    "Serval": 14.0,
    "Siberian Husky": 12.0,
    "Sloth": 15.0,
    "Slow Loris": 16.0,
    "Snow Leopard": 12.0,
    "Sperm Whale": 7.0,
    "Spotted Hyena": 12.0,
    "Sumatran Orangutan": 12.0,
    "Sumatran Rhinoceros": 8.0,
    "Sumatran Tiger": 16.0,
    "Sun Bear": 10.0,
    "Tapir": 12.0,
    "Tarsier": 16.0,
    "Tasmanian Devil": 12.0,
    "Tasmanian Tiger": 12.0,
    "Three-Toed Sloth": 15.0,
    "Tibetan Mastiff": 12.0,
    "Tiger": 16.0,
    "Titanoboa": 18.0,
    "Tree Kangaroo": 14.0,
    "Vampire Bat": 20.0,
    "Walrus": 19.5,
    "Warthog": 7.0,
    "Water Buffalo": 5.0,
    "Western Gorilla": 12.0,
    "Western Lowland Gorilla": 12.0,
    "White Rhinoceros": 8.0,
    "White Tiger": 16.0,
    "Wild Boar": 7.0,
    "Wildebeest": 6.0,
    "Wolf": 10.0,
    "Wolverine": 10.0,
    "Wombat": 16.0,
    "Woolly Mammoth": 4.0,
    "Yak": 5.0,
    "Zebra": 5.0,
}

# ============================================================
# BITE FORCE (PSI) — only well-documented values; default is -1
# ============================================================
BITE_FORCE = {
    "African Elephant": 2175,
    "African Lion": 650,
    "African Wild Dog": 340,
    "American Bison": 700,
    "Asian Elephant": 2175,
    "Bengal Tiger": 1050,
    "Black Rhinoceros": 1000,
    "Bottlenose Dolphin": 500,
    "Boxer Dog": 230,
    "Brown Bear": 975,
    "Capybara": 300,
    "Cheetah": 475,
    "Chimpanzee": 1300,
    "Common Dolphin": 400,
    "Common Snapping Turtle": 210,
    "Dalmatian Dog": 200,
    "Dhole": 180,
    "Dingo": 200,
    "Eastern Gorilla": 1300,
    "Gaur": 500,
    "Gharial": 900,
    "Great White Shark": 4000,
    "Hippopotamus": 1800,
    "Iberian Lynx": 200,
    "Komodo Dragon": 600,
    "Mountain Gorilla": 1300,
    "Polar Bear": 1200,
    "Red Fox": 92,
    "Rottweiler": 328,
    "Serval": 75,
    "Shortfin Mako Shark": 3000,
    "Siberian Husky": 320,
    "Snow Leopard": 500,
    "Spotted Hyena": 1100,
    "Sumatran Tiger": 1050,
    "Sun Bear": 325,
    "Tasmanian Devil": 200,
    "Tibetan Mastiff": 550,
    "Tiger": 1050,
    "Walrus": 800,
    "Western Gorilla": 1300,
    "Western Lowland Gorilla": 1300,
    "White Tiger": 1050,
    "Wild Boar": 300,
    "Wolf": 400,
    "Wolverine": 50,
}


# ============================================================
# RANGE CLASSIFICATION FUNCTIONS
# ============================================================

def classify_weight(kg):
    """8 categories for weight_kg."""
    if kg is None:
        return ""
    if kg < 0.1:
        return "Feather"
    if kg < 1:
        return "Light"
    if kg < 10:
        return "Below Average"
    if kg < 50:
        return "Average"
    if kg < 200:
        return "Above Average"
    if kg < 1000:
        return "Heavy"
    if kg < 10000:
        return "Massive"
    return "Colossal"


def classify_height(cm):
    """8 categories for height_cm."""
    if cm is None:
        return ""
    if cm < 5:
        return "Minuscule"
    if cm < 20:
        return "Very Short"
    if cm < 50:
        return "Short"
    if cm < 100:
        return "Below Average"
    if cm < 200:
        return "Average"
    if cm < 500:
        return "Tall"
    if cm < 1000:
        return "Very Tall"
    return "Towering"


def classify_speed(kmh):
    """7 categories for speed_kmh."""
    if kmh is None:
        return ""
    if kmh < 1:
        return "Sessile"
    if kmh < 10:
        return "Very Slow"
    if kmh < 25:
        return "Slow"
    if kmh < 45:
        return "Moderate"
    if kmh < 65:
        return "Fast"
    if kmh < 90:
        return "Very Fast"
    return "Blazing"


def classify_lifespan(years):
    """7 categories for lifespan_years."""
    if years is None:
        return ""
    if years < 1:
        return "Ephemeral"
    if years < 5:
        return "Very Short"
    if years < 12:
        return "Short"
    if years < 25:
        return "Average"
    if years < 50:
        return "Long"
    if years < 100:
        return "Very Long"
    return "Ancient"


def classify_sleep(hours):
    """6 categories for daily_sleep_hours."""
    if hours is None or hours < 0:
        return ""
    if hours < 4:
        return "Minimal"
    if hours < 8:
        return "Light"
    if hours < 12:
        return "Moderate"
    if hours < 16:
        return "Heavy"
    if hours < 20:
        return "Very Heavy"
    return "Extreme"


def classify_bite_force(psi):
    """6 categories for bite_force_psi."""
    if psi is None or psi < 0:
        return ""
    if psi < 100:
        return "Weak"
    if psi < 500:
        return "Moderate"
    if psi < 1000:
        return "Strong"
    if psi < 2000:
        return "Very Strong"
    return "Devastating"


def classify_body_size(kg):
    """6 categories: tiny, small, medium, big, large, gigantic."""
    if kg is None:
        return ""
    if kg < 0.1:
        return "Tiny"
    if kg < 5:
        return "Small"
    if kg < 100:
        return "Medium"
    if kg < 500:
        return "Big"
    if kg < 5000:
        return "Large"
    return "Gigantic"


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


def fmt(val):
    """Format a numeric value for CSV: drop trailing .0, empty for None."""
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
    cleaned = [r for r in rows if r['Animal'].strip() not in REMOVE_ANIMALS]
    removed = [r['Animal'].strip() for r in rows if r['Animal'].strip() in REMOVE_ANIMALS]
    print(f"Removed {len(removed)}: {removed}")
    print(f"Remaining: {len(cleaned)} rows")

    # --- Process each row ---
    output = []
    for row in cleaned:
        animal = row['Animal'].strip()
        animal_class = row.get('class', '').strip()

        # Fix weight
        weight = parse_float(row.get('weight_kg'))
        if animal in WEIGHT_CORRECTIONS:
            old = weight
            weight = WEIGHT_CORRECTIONS[animal]
            row['weight_kg'] = fmt(weight)
            print(f"  Weight fix: {animal}: {old} → {weight} kg")

        # Fix gestation (years → days)
        gest = parse_float(row.get('gestation_days'))
        if gest is not None and 0 < gest < GESTATION_YEAR_THRESHOLD:
            old_gest = gest
            gest = round(gest * 365)
            row['gestation_days'] = fmt(gest)
            print(f"  Gestation fix: {animal}: {old_gest} → {gest} days")

        # Fix lifespan
        lifespan = parse_float(row.get('lifespan_years'))
        if animal in LIFESPAN_CORRECTIONS:
            old_ls = lifespan
            lifespan = LIFESPAN_CORRECTIONS[animal]
            row['lifespan_years'] = fmt(lifespan)
            print(f"  Lifespan fix: {animal}: {old_ls} → {lifespan} years")

        # Parse remaining numerics
        height = parse_float(row.get('height_cm'))
        speed = parse_float(row.get('speed_kmh'))

        # --- Enrich: daily_sleep_hours ---
        if animal in SLEEP_OVERRIDES:
            sleep = SLEEP_OVERRIDES[animal]
        elif animal_class in DEFAULT_SLEEP_BY_CLASS:
            sleep = DEFAULT_SLEEP_BY_CLASS[animal_class]
        else:
            sleep = -1
        row['daily_sleep_hours'] = fmt(sleep)

        # --- Enrich: bite_force_psi ---
        bite = BITE_FORCE.get(animal, -1)
        row['bite_force_psi'] = fmt(bite)

        # --- Range categories ---
        row['weight_class'] = classify_weight(weight)
        row['height_class'] = classify_height(height)
        row['speed_class'] = classify_speed(speed)
        row['lifespan_class'] = classify_lifespan(lifespan)
        row['sleep_class'] = classify_sleep(sleep)
        row['bite_force_class'] = classify_bite_force(bite)
        row['body_size'] = classify_body_size(weight)

        output.append(row)

    # --- Write ---
    fieldnames = [
        'Animal', 'class', 'skin_type', 'diet', 'conservation_status',
        'weight_kg', 'height_cm', 'lifespan_years', 'speed_kmh',
        'gestation_days', 'activity_cycle',
        'daily_sleep_hours', 'bite_force_psi',
        'weight_class', 'height_class', 'speed_class', 'lifespan_class',
        'sleep_class', 'bite_force_class', 'body_size',
    ]

    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(output)
    print(f"\nWrote {len(output)} rows → {OUTPUT_FILE}")
    print(f"Columns ({len(fieldnames)}): {', '.join(fieldnames)}")

    # --- Summary stats ---
    print("\n=== Distribution Summary ===")

    def dist(label, key):
        d = {}
        for r in output:
            v = r.get(key, '')
            d[v] = d.get(v, 0) + 1
        print(f"\n{label}:")
        for k, c in sorted(d.items(), key=lambda x: -x[1]):
            print(f"  {k or '(empty)':20s} {c}")

    dist("Body Size", "body_size")
    dist("Weight Class", "weight_class")
    dist("Height Class", "height_class")
    dist("Speed Class", "speed_class")
    dist("Lifespan Class", "lifespan_class")
    dist("Sleep Class", "sleep_class")
    dist("Bite Force Class", "bite_force_class")
    dist("Diet", "diet")

    known_sleep = sum(1 for r in output if (parse_float(r['daily_sleep_hours']) or -1) > 0)
    known_bite = sum(1 for r in output if (parse_float(r['bite_force_psi']) or -1) > 0)
    print(f"\nSleep coverage: {known_sleep}/{len(output)} ({100*known_sleep/len(output):.0f}%)")
    print(f"Bite force coverage: {known_bite}/{len(output)} ({100*known_bite/len(output):.0f}%)")


if __name__ == '__main__':
    main()
