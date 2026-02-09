"""
Hollywood CSV Data Pipeline:
1. Clean & standardize studios
2. Enrich via TMDB API (source_material, box_office, mpaa_rating, oscars_won)
3. Add recent blockbusters (2018-2025)
4. Create categorical bucket columns
"""

import csv, json, time, requests, sys, os
from pathlib import Path

TMDB_API_KEY = "e5e135ca8f4f2ecfe0a67c9998a5441a"
TMDB_BASE = "https://api.themoviedb.org/3"
INPUT_CSV = "data/hollywood.csv"
OUTPUT_CSV = "data/hollywood_enriched.csv"

# ─── 1. Studio Standardization Map ───────────────────────────────────────────
STUDIO_MAP = {
    # Disney
    "disney": "Disney",
    "touchstone pictures": "Disney",
    "walt disney pictures": "Disney",
    "buena vista": "Disney",
    # Warner Bros
    "warner bros.": "Warner Bros.",
    "warner bros": "Warner Bros.",
    "warner bros. pictures": "Warner Bros.",
    "warner home video": "Warner Bros.",
    "turner entertainment": "Warner Bros.",
    "new line cinema": "Warner Bros.",
    # Fox / 20th Century
    "20th century fox": "20th Century Fox",
    "20th century studios": "20th Century Fox",
    "fox searchlight": "20th Century Fox",
    "fox 2000 pictures": "20th Century Fox",
    # Universal
    "universal pictures": "Universal Pictures",
    "universal studios": "Universal Pictures",
    "focus features": "Universal Pictures",
    # Paramount
    "paramount pictures": "Paramount Pictures",
    "paramount": "Paramount Pictures",
    # Sony / Columbia
    "sony pictures": "Sony Pictures",
    "columbia pictures": "Sony Pictures",
    "tristar pictures": "Sony Pictures",
    "screen gems": "Sony Pictures",
    # MGM
    "mgm": "MGM",
    "metro-goldwyn-mayer": "MGM",
    # Lionsgate
    "lionsgate": "Lionsgate",
    "lions gate films": "Lionsgate",
    "summit entertainment": "Lionsgate",
    # Miramax
    "miramax": "Miramax",
    "miramax films": "Miramax",
    # Weinstein
    "the weinstein company": "The Weinstein Company",
    "weinstein company": "The Weinstein Company",
}

def standardize_studio(studio):
    if not studio:
        return ""
    key = studio.strip().lower()
    return STUDIO_MAP.get(key, studio.strip())

# ─── 2. TMDB API helpers ────────────────────────────────────────────────────

def tmdb_get(endpoint, params=None):
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    url = f"{TMDB_BASE}/{endpoint}"
    for attempt in range(3):
        try:
            r = requests.get(url, params=params, timeout=15)
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", 2))
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == 2:
                print(f"  TMDB error for {endpoint}: {e}")
                return None
            time.sleep(1)
    return None

def find_tmdb_id(title, year, imdb_id=None):
    """Find TMDB movie ID. Try IMDB ID first, then search."""
    if imdb_id:
        data = tmdb_get(f"find/{imdb_id}", {"external_source": "imdb_id"})
        if data and data.get("movie_results"):
            return data["movie_results"][0]["id"]
    # Fallback: search by title + year
    data = tmdb_get("search/movie", {"query": title, "year": year})
    if data and data.get("results"):
        return data["results"][0]["id"]
    # Try without year
    data = tmdb_get("search/movie", {"query": title})
    if data and data.get("results"):
        return data["results"][0]["id"]
    return None

def get_movie_details(tmdb_id):
    """Get full movie details from TMDB."""
    return tmdb_get(f"movie/{tmdb_id}", {"append_to_response": "keywords,credits,release_dates"})

def extract_mpaa(details):
    """Extract US MPAA rating from release_dates."""
    if not details:
        return ""
    releases = details.get("release_dates", {}).get("results", [])
    for country in releases:
        if country.get("iso_3166_1") == "US":
            for rd in country.get("release_dates", []):
                cert = rd.get("certification", "")
                if cert in ("G", "PG", "PG-13", "R", "NC-17"):
                    return cert
    return ""

def extract_box_office(details):
    """Get worldwide revenue."""
    if not details:
        return ""
    rev = details.get("revenue", 0)
    return str(rev) if rev and rev > 0 else ""

def classify_source_material(details):
    """Best-effort classification of source material."""
    if not details:
        return "Original Screenplay"
    keywords = [kw["name"].lower() for kw in details.get("keywords", {}).get("keywords", [])]
    keyword_str = " ".join(keywords)

    # Check keywords for clues
    comic_terms = ["comic", "superhero", "marvel", "dc comics", "graphic novel", "comic book"]
    novel_terms = ["based on novel", "novel", "book"]
    play_terms = ["based on play", "play", "musical", "broadway", "stage"]
    real_terms = ["based on true story", "biography", "true story", "real event", "historical event"]
    remake_terms = ["remake", "reboot"]

    for term in comic_terms:
        if term in keyword_str:
            return "Comic Book"
    for term in remake_terms:
        if term in keyword_str:
            return "Remake"
    for term in real_terms:
        if term in keyword_str:
            return "Real Event"
    for term in novel_terms:
        if term in keyword_str:
            return "Novel"
    for term in play_terms:
        if term in keyword_str:
            return "Play"

    return "Original Screenplay"

# ─── OMDB for Oscars ────────────────────────────────────────────────────────

OMDB_KEY = None  # We'll use TMDB for what we can, and a fallback dict for Oscars

# Pre-populated Oscar wins for known movies (best-effort, from public knowledge)
# We'll attempt OMDB if a key is available; otherwise use this dictionary.
OSCAR_WINS = {
    "tt0111161": 0, "tt0068646": 3, "tt0071562": 6, "tt0468569": 2,
    "tt0050083": 0, "tt0108052": 7, "tt0167260": 11, "tt0110912": 1,
    "tt0137523": 0, "tt0120737": 4, "tt0109830": 6, "tt0080684": 2,
    "tt0076759": 7, "tt1375666": 4, "tt0167261": 2, "tt0073486": 5,
    "tt0099685": 1, "tt0133093": 4, "tt0110413": 0, "tt0021749": 0,
    "tt0114369": 0, "tt0038650": 0, "tt0102926": 5, "tt0114814": 2,
    "tt0110357": 2, "tt0120815": 5, "tt0816692": 1, "tt0112573": 1,
    "tt0085334": 0, "tt0027977": 0, "tt0034583": 3, "tt0120689": 0,
    "tt0054215": 0, "tt0082971": 5, "tt0253474": 3, "tt0047396": 0,
    "tt0407887": 4, "tt0482571": 1, "tt2582802": 3, "tt0103064": 4,
    "tt0088763": 1, "tt0172495": 5, "tt0032553": 0, "tt0043014": 3,
    "tt0078788": 0, "tt0209144": 0, "tt0081505": 0, "tt0050825": 0,
    "tt1345836": 0, "tt0910970": 1, "tt0051201": 0, "tt0169547": 5,
    "tt0087843": 0, "tt0090605": 2, "tt0033467": 1, "tt0053125": 0,
    "tt0052357": 0, "tt0086190": 1, "tt1853728": 2, "tt0105236": 0,
    "tt0036775": 0, "tt0064115": 4, "tt0066921": 0, "tt0056172": 7,
    "tt0012349": 0, "tt0093058": 0, "tt0086879": 8, "tt0056592": 1,
    "tt0070735": 7, "tt0435761": 0, "tt0062622": 1, "tt0077416": 5,
    "tt3890160": 3, "tt0075314": 0, "tt0114709": 0, "tt0061722": 1,
    "tt0079470": 0, "tt0063522": 0, "tt0081398": 2, "tt0095016": 0,
    "tt0057115": 0, "tt0097576": 1, "tt0053291": 1, "tt0083658": 0,
    "tt1049413": 2, "tt0031381": 10, "tt0057012": 0, "tt0117951": 0,
    "tt0080678": 0, "tt0105695": 4, "tt0094226": 0, "tt0075148": 0,
    "tt0074958": 0, "tt0119488": 2, "tt0119217": 2, "tt0074896": 0,
    "tt0038355": 0, "tt0338013": 2, "tt0032976": 0, "tt0032904": 2,
    "tt0046250": 3, "tt0059578": 0, "tt0075860": 0, "tt0118715": 0,
    "tt0084787": 0, "tt0128442": 0, "tt0116282": 2, "tt0120735": 0,
    "tt0131764": 0, "tt0978762": 0, "tt0477348": 4, "tt0892769": 1,
    "tt0469494": 2, "tt0758758": 0, "tt0137363": 0, "tt0107290": 3,
    "tt2267998": 1, "tt0107207": 1, "tt0026778": 0, "tt1865505": 0,
    "tt0041546": 0, "tt0033870": 0, "tt0120731": 0, "tt0037558": 0,
    "tt0032551": 2, "tt2096673": 2, "tt0056687": 1, "tt0052311": 0,
    "tt2250912": 0, "tt0036868": 7, "tt1201607": 0, "tt2488496": 0,
    "tt0087884": 0, "tt0067328": 2, "tt1010048": 8, "tt0037008": 1,
    "tt0069281": 0, "tt0046250": 3, "tt0039689": 0, "tt0052561": 0,
    "tt0061184": 5, "tt0044079": 0, "tt0048424": 0, "tt0020629": 2,
    "tt0101414": 2, "tt3741834": 0, "tt0114746": 0, "tt0072890": 0,
    "tt2948356": 1, "tt3896198": 0, "tt0046359": 1, "tt0276919": 0,
    "tt0070511": 0, "tt0036613": 0, "tt0049406": 0, "tt0038787": 0,
    "tt0042546": 0, "tt0053221": 0, "tt0040746": 0, "tt0084503": 0,
    "tt0107688": 0, "tt2370248": 0, "tt0032599": 0,
    "tt0993846": 0, "tt0052618": 11, "tt0450259": 0,
    "tt0266543": 1, "tt0361748": 1, "tt0440963": 0, "tt0319061": 0,
    "tt2084970": 1, "tt0100802": 0, "tt0395169": 0,
    "tt0097165": 1, "tt1028532": 0, "tt0093779": 0,
    "tt0091763": 2, "tt0206634": 0, "tt0113277": 0,
    "tt0015864": 0, "tt0071315": 1, "tt0017925": 0,
    "tt3783958": 6, "tt3315342": 0,
    "tt0046912": 0, "tt2119532": 2,
    "tt0061512": 1, "tt0207201": 0,
    "tt0198781": 1, "tt3659388": 0,
    "tt0073195": 3, "tt0088247": 0,
    "tt0065214": 0, "tt0075686": 4,
    "tt0042192": 6, "tt0040897": 3,
    "tt0041959": 0, "tt0047296": 8,
    "tt0050212": 7, "tt0051459": 0,
    "tt0066206": 7, "tt0078748": 1,
    "tt0072684": 0, "tt0055031": 2,
    "tt0095953": 1, "tt0083987": 8,
    "tt0120586": 0, "tt0024216": 0,
    "tt0045152": 0, "tt0112471": 0,
    "tt0381681": 0, "tt0044706": 4,
    "tt0071853": 0, "tt0025316": 5,
    "tt0072431": 0, "tt0032138": 2,
    "tt0056217": 0, "tt0037884": 4,
    "tt0043014": 3, "tt0102138": 2,
    "tt0175880": 0, "tt0117666": 1,
    "tt0268978": 4, "tt0120382": 0,
    "tt1431045": 0, "tt0434409": 0,
    "tt0112641": 0, "tt0264464": 0,
    "tt1291584": 0, "tt1979320": 0,
    "tt0405159": 4, "tt0166896": 0,
    "tt0230600": 0, "tt1392214": 0,
    "tt0180093": 0, "tt0029583": 0,
    "tt2024544": 3, "tt1895587": 2,
    "tt0088763": 1, "tt1504320": 4,
    "tt0107048": 0, "tt0092005": 0,
    "tt0070047": 2, "tt0246578": 0,
    "tt1392190": 6, "tt2015381": 0,
    "tt0325980": 1, "tt1663202": 1,
    "tt3170832": 1, "tt0401792": 0,
    "tt0162222": 0, "tt0474848": 0,
    "tt1454029": 1, "tt0031679": 1,
    "tt2278388": 4, "tt1130884": 0,
    "tt0056218": 0, "tt0054997": 0,
    "tt0044081": 4,
}

def get_oscar_wins(imdb_id):
    """Lookup Oscar wins from pre-populated dict."""
    return OSCAR_WINS.get(imdb_id, 0)

# ─── 3. Recent blockbusters to add ──────────────────────────────────────────

RECENT_MOVIES = [
    # (id, title, year) - we'll fill details from TMDB
    (300, "Black Panther", 2018),
    (301, "A Star Is Born", 2018),
    (302, "Spider-Man: Into the Spider-Verse", 2018),
    (303, "Bohemian Rhapsody", 2018),
    (304, "Avengers: Infinity War", 2018),
    (305, "Avengers: Endgame", 2019),
    (306, "Parasite", 2019),
    (307, "Joker", 2019),
    (308, "1917", 2019),
    (309, "Once Upon a Time in Hollywood", 2019),
    (310, "Knives Out", 2019),
    (311, "Jojo Rabbit", 2019),
    (312, "Dune", 2021),
    (313, "Spider-Man: No Way Home", 2021),
    (314, "No Time to Die", 2021),
    (315, "The Batman", 2022),
    (316, "Everything Everywhere All at Once", 2022),
    (317, "Top Gun: Maverick", 2022),
    (318, "The Banshees of Inisherin", 2022),
    (319, "Oppenheimer", 2023),
    (320, "Barbie", 2023),
    (321, "Killers of the Flower Moon", 2023),
    (322, "The Holdovers", 2023),
    (323, "Dune: Part Two", 2024),
    (324, "Inside Out 2", 2024),
    (325, "The Brutalist", 2024),
    (326, "Anora", 2024),
    (327, "Gladiator II", 2024),
    (328, "Wicked", 2024),
    (329, "The Wild Robot", 2024),
    (330, "Conclave", 2024),
]

# Oscar wins for recent movies
RECENT_OSCARS = {
    "Black Panther": 3, "A Star Is Born": 1, "Spider-Man: Into the Spider-Verse": 1,
    "Bohemian Rhapsody": 4, "Avengers: Infinity War": 0, "Avengers: Endgame": 0,
    "Parasite": 4, "Joker": 2, "1917": 3, "Once Upon a Time in Hollywood": 2,
    "Knives Out": 0, "Jojo Rabbit": 1, "Dune": 6, "Spider-Man: No Way Home": 0,
    "No Time to Die": 1, "The Batman": 0, "Everything Everywhere All at Once": 7,
    "Top Gun: Maverick": 1, "The Banshees of Inisherin": 0, "Oppenheimer": 7,
    "Barbie": 1, "Killers of the Flower Moon": 0, "The Holdovers": 1,
    "Dune: Part Two": 0, "Inside Out 2": 0, "The Brutalist": 3,
    "Anora": 1, "Gladiator II": 0, "Wicked": 0, "The Wild Robot": 0, "Conclave": 0,
}

# Source material overrides for well-known movies
SOURCE_OVERRIDES = {
    "Black Panther": "Comic Book", "Spider-Man: Into the Spider-Verse": "Comic Book",
    "Bohemian Rhapsody": "Real Event", "Avengers: Infinity War": "Comic Book",
    "Avengers: Endgame": "Comic Book", "Joker": "Comic Book",
    "1917": "Original Screenplay", "Once Upon a Time in Hollywood": "Original Screenplay",
    "Knives Out": "Original Screenplay", "Jojo Rabbit": "Novel",
    "Dune": "Novel", "Spider-Man: No Way Home": "Comic Book",
    "No Time to Die": "Novel", "The Batman": "Comic Book",
    "Everything Everywhere All at Once": "Original Screenplay",
    "Top Gun: Maverick": "Original Screenplay", "The Banshees of Inisherin": "Original Screenplay",
    "Oppenheimer": "Novel", "Barbie": "Original Screenplay",
    "Killers of the Flower Moon": "Novel", "The Holdovers": "Original Screenplay",
    "Dune: Part Two": "Novel", "Inside Out 2": "Original Screenplay",
    "The Brutalist": "Original Screenplay", "Anora": "Original Screenplay",
    "Gladiator II": "Original Screenplay", "Wicked": "Play",
    "The Wild Robot": "Novel", "Conclave": "Novel",
    "A Star Is Born": "Remake", "Parasite": "Original Screenplay",
    # Existing movies overrides
    "Star Wars: The Empire Strikes Back": "Original Screenplay",
    "Star Wars: A New Hope": "Original Screenplay",
    "Star Wars: Return of the Jedi": "Original Screenplay",
    "Léon: The Professional": "Original Screenplay",
    "City Lights": "Original Screenplay",
    "Rear Window": "Novel",
    "The Great Dictator": "Original Screenplay",
    "Sunset Boulevard": "Original Screenplay",
    "Paths of Glory": "Novel",
    "Witness for the Prosecution": "Play",
    "Citizen Kane": "Original Screenplay",
    "North by Northwest": "Original Screenplay",
    "Vertigo": "Novel",
    "Double Indemnity": "Novel",
    "A Clockwork Orange": "Novel",
    "Full Metal Jacket": "Novel",
    "Baby Driver": "Original Screenplay",
    "All About Eve": "Play",
    "The Treasure of the Sierra Madre": "Novel",
    "The Third Man": "Novel",
    "Heat": "Remake",
    "The Gold Rush": "Original Screenplay",
    "Chinatown": "Original Screenplay",
    "The General": "Real Event",
    "La La Land": "Original Screenplay",
    "Logan": "Comic Book",
    "Dial M for Murder": "Play",
    "Hacksaw Ridge": "Real Event",
    "The Message": "Real Event",
    "Cool Hand Luke": "Novel",
    "Fargo": "Original Screenplay",
    "Mary and Max": "Original Screenplay",
    "Life of Brian": "Original Screenplay",
    "In the Name of the Father": "Real Event",
    "Song of the Sea": "Original Screenplay",
    "Kind Hearts and Coronets": "Novel",
    "The Maltese Falcon": "Novel",
    "The Legend of 1900": "Novel",
    "Brief Encounter": "Play",
    "The Grapes of Wrath": "Novel",
    "What Ever Happened to Baby Jane?": "Novel",
    "Touch of Evil": "Novel",
    "Spider-Man: Homecoming": "Comic Book",
    "Harry Potter and the Deathly Hallows: Part 2": "Novel",
    "Star Wars: The Force Awakens": "Original Screenplay",
    "Paris, Texas": "Original Screenplay",
    "The Last Picture Show": "Novel",
    "Laura": "Novel",
    "Sleuth": "Play",
    "Roman Holiday": "Original Screenplay",
    "Out of the Past": "Novel",
    "Anatomy of a Murder": "Novel",
    "Who's Afraid of Virginia Woolf?": "Play",
    "Strangers on a Train": "Novel",
    "The Night of the Hunter": "Novel",
    "All Quiet on the Western Front": "Novel",
    "Beauty and the Beast": "Novel",
    "Lion": "Novel",
    "Twelve Monkeys": "Remake",
    "Dog Day Afternoon": "Real Event",
    "Zootopia": "Original Screenplay",
    "Guardians of the Galaxy Vol. 2": "Comic Book",
    "Stalag 17": "Play",
    "Dogville": "Original Screenplay",
    "Papillon": "Novel",
    "Arsenic and Old Lace": "Play",
    "A Night at the Opera": "Original Screenplay",
    "The Killing": "Novel",
    "Notorious": "Original Screenplay",
    "Harvey": "Play",
    "Rio Bravo": "Novel",
    "The Philadelphia Story": "Play",
    "Rope": "Play",
    "The Big Sleep": "Novel",
    "Pink Floyd: The Wall": "Original Screenplay",
    "The Graduate": "Novel",
    "The Nightmare Before Christmas": "Original Screenplay",
    "Short Term 12": "Original Screenplay",
    "His Girl Friday": "Play",
    "The Dark Knight Rises": "Comic Book",
    "The Avengers": "Comic Book",
    "Toy Story 3": "Original Screenplay",
    "The Dark Knight": "Comic Book",
    "WALL·E": "Original Screenplay",
    "Up": "Original Screenplay",
    "Inside Out": "Original Screenplay",
    "Guardians of the Galaxy": "Comic Book",
    "Interstellar": "Original Screenplay",
    "How to Train Your Dragon": "Novel",
    "Inception": "Original Screenplay",
    "Batman Begins": "Comic Book",
    "Mad Max: Fury Road": "Original Screenplay",
    "Pirates of the Caribbean: The Curse of the Black Pearl": "Original Screenplay",
    "The Revenant": "Novel",
    "Monsters, Inc.": "Original Screenplay",
    "The Martian": "Novel",
    "Gladiator": "Original Screenplay",
    "Terminator 2: Judgment Day": "Original Screenplay",
    "Django Unchained": "Original Screenplay",
    "The Wolf of Wall Street": "Novel",
    "Ben-Hur": "Novel",
    "Blood Diamond": "Original Screenplay",
    "The Lord of the Rings: The Return of the King": "Novel",
    "Finding Nemo": "Original Screenplay",
    "The Lord of the Rings: The Fellowship of the Ring": "Novel",
    "The Departed": "Remake",
    "Shutter Island": "Novel",
    "The Manchurian Candidate": "Novel",
    "The Lord of the Rings: The Two Towers": "Novel",
    "Braveheart": "Real Event",
    "Saving Private Ryan": "Original Screenplay",
    "Inglourious Basterds": "Original Screenplay",
    "The Bourne Ultimatum": "Novel",
    "Big Fish": "Novel",
    "The Kid": "Original Screenplay",
    "Fight Club": "Novel",
    "The Matrix": "Original Screenplay",
    "Jurassic Park": "Novel",
    "Gone Girl": "Novel",
    "The Green Mile": "Novel",
    "A Beautiful Mind": "Real Event",
    "The Truman Show": "Original Screenplay",
    "Deadpool": "Comic Book",
    "Forrest Gump": "Novel",
    "V for Vendetta": "Comic Book",
    "Casino": "Novel",
    "Catch Me If You Can": "Real Event",
    "Indiana Jones and the Last Crusade": "Original Screenplay",
    "Prisoners": "Original Screenplay",
    "The Lion King": "Original Screenplay",
    "The Prestige": "Novel",
    "The Sixth Sense": "Original Screenplay",
    "Sin City": "Comic Book",
    "JFK": "Real Event",
    "Rush": "Real Event",
    "Magnolia": "Original Screenplay",
    "The Pianist": "Novel",
    "L.A. Confidential": "Novel",
    "Se7en": "Original Screenplay",
    "Gran Torino": "Original Screenplay",
    "Apocalypse Now": "Novel",
    "Once Upon a Time in America": "Novel",
    "Toy Story": "Original Screenplay",
    "Kill Bill: Vol. 1": "Original Screenplay",
    "The Grand Budapest Hotel": "Novel",
    "Million Dollar Baby": "Novel",
    "Die Hard": "Novel",
    "Blade Runner": "Novel",
    "Aladdin": "Novel",
    "The Shawshank Redemption": "Novel",
    "Goodfellas": "Novel",
    "Scarface": "Remake",
    "Warrior": "Original Screenplay",
    "No Country for Old Men": "Novel",
    "There Will Be Blood": "Novel",
    "The Help": "Novel",
    "Rain Man": "Original Screenplay",
    "Schindler's List": "Novel",
    "Gandhi": "Real Event",
    "American History X": "Original Screenplay",
    "Eternal Sunshine of the Spotless Mind": "Original Screenplay",
    "Spotlight": "Real Event",
    "12 Years a Slave": "Novel",
    "The Silence of the Lambs": "Novel",
    "Back to the Future": "Original Screenplay",
    "The Shining": "Novel",
    "Aliens": "Original Screenplay",
    "Raiders of the Lost Ark": "Original Screenplay",
    "Amadeus": "Play",
    "Raging Bull": "Real Event",
    "Hotel Rwanda": "Real Event",
    "Dead Poets Society": "Original Screenplay",
    "Hachi: A Dog's Tale": "Real Event",
    "The Princess Bride": "Novel",
    "American Beauty": "Original Screenplay",
    "Lawrence of Arabia": "Real Event",
    "The Deer Hunter": "Original Screenplay",
    "The Big Lebowski": "Original Screenplay",
    "The Thing": "Novel",
    "Into the Wild": "Novel",
    "The King's Speech": "Real Event",
    "Slumdog Millionaire": "Novel",
    "Groundhog Day": "Original Screenplay",
    "Unforgiven": "Original Screenplay",
    "The Imitation Game": "Real Event",
    "The Godfather: Part II": "Novel",
    "Patton": "Real Event",
    "Alien": "Original Screenplay",
    "Barry Lyndon": "Novel",
    "2001: A Space Odyssey": "Novel",
    "Snatch": "Original Screenplay",
    "Good Will Hunting": "Original Screenplay",
    "The Straight Story": "Real Event",
    "Memento": "Novel",
    "Pulp Fiction": "Original Screenplay",
    "Stand by Me": "Novel",
    "The Exorcist": "Novel",
    "Jaws": "Novel",
    "The Terminator": "Original Screenplay",
    "The Wild Bunch": "Original Screenplay",
    "The Godfather": "Novel",
    "The Usual Suspects": "Original Screenplay",
    "Room": "Novel",
    "Platoon": "Real Event",
    "Butch Cassidy and the Sundance Kid": "Real Event",
    "Donnie Darko": "Original Screenplay",
    "The Sting": "Original Screenplay",
    "The Elephant Man": "Real Event",
    "Requiem for a Dream": "Novel",
    "The Great Escape": "Real Event",
    "Gone with the Wind": "Novel",
    "Trainspotting": "Novel",
    "Annie Hall": "Original Screenplay",
    "Network": "Original Screenplay",
    "Whiplash": "Original Screenplay",
    "The Man Who Shot Liberty Valance": "Novel",
    "It's a Wonderful Life": "Novel",
    "One Flew Over the Cuckoo's Nest": "Novel",
    "The Apartment": "Original Screenplay",
    "Judgment at Nuremberg": "Play",
    "The Bridge on the River Kwai": "Novel",
    "Cat on a Hot Tin Roof": "Play",
    "Some Like It Hot": "Original Screenplay",
    "Young Frankenstein": "Novel",
    "The Wizard of Oz": "Novel",
    "Before Sunset": "Original Screenplay",
    "Singin' in the Rain": "Original Screenplay",
    "Before Sunrise": "Original Screenplay",
    "The Best Years of Our Lives": "Novel",
    "To Kill a Mockingbird": "Novel",
    "The Hustler": "Novel",
    "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb": "Novel",
    "A Streetcar Named Desire": "Play",
    "Mr. Smith Goes to Washington": "Novel",
    "Lock, Stock and Two Smoking Barrels": "Original Screenplay",
    "Taxi Driver": "Original Screenplay",
    "Rebecca": "Novel",
    "The Lost Weekend": "Novel",
    "Reservoir Dogs": "Original Screenplay",
    "Rocky": "Original Screenplay",
    "Sling Blade": "Original Screenplay",
    "On the Waterfront": "Novel",
    "Casablanca": "Play",
    "Psycho": "Novel",
    "High Noon": "Novel",
    "Monty Python and the Holy Grail": "Original Screenplay",
    "12 Angry Men": "Play",
    "It Happened One Night": "Novel",
    "Modern Times": "Original Screenplay",
    "A Christmas Story": "Novel",
}

# ─── 4. Main pipeline ────────────────────────────────────────────────────────

def read_csv(path):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def enrich_row(row):
    """Enrich a single row with TMDB data."""
    title = row["Title"]
    year = row["Year"]
    imdb_id = row.get("imdbID", "")

    print(f"  Enriching: {title} ({year})...")

    # Find TMDB ID
    tmdb_id = find_tmdb_id(title, year, imdb_id)
    time.sleep(0.26)  # ~4 req/sec to stay under rate limit

    details = None
    if tmdb_id:
        details = get_movie_details(tmdb_id)
        time.sleep(0.26)

    # Studio
    row["Production"] = standardize_studio(row.get("Production", ""))

    # Box office - use TMDB if we don't have it
    if not row.get("box_office") or row["box_office"].strip() == "":
        row["box_office"] = extract_box_office(details)

    # MPAA rating - use TMDB if we don't have it
    if not row.get("mpaa_rating") or row["mpaa_rating"].strip() == "":
        row["mpaa_rating"] = extract_mpaa(details)

    # Source material - use overrides first, then TMDB keywords
    if title in SOURCE_OVERRIDES:
        row["source_material"] = SOURCE_OVERRIDES[title]
    else:
        row["source_material"] = classify_source_material(details)

    # Oscars
    oscars = get_oscar_wins(imdb_id)
    row["oscars_won"] = str(oscars)

    return row

def build_recent_row(movie_id, title, year):
    """Create a row for a recent movie entirely from TMDB."""
    print(f"  Adding: {title} ({year})...")
    tmdb_id = find_tmdb_id(title, year)
    time.sleep(0.26)

    if not tmdb_id:
        print(f"    WARNING: Could not find TMDB ID for {title}")
        return None

    details = get_movie_details(tmdb_id)
    time.sleep(0.26)

    if not details:
        print(f"    WARNING: Could not get details for {title}")
        return None

    # Extract credits (director + top cast)
    credits_list = []
    crew = details.get("credits", {}).get("crew", [])
    cast = details.get("credits", {}).get("cast", [])
    # Directors first
    directors = [c["name"] for c in crew if c.get("job") == "Director"]
    credits_list.extend(directors)
    # Writers
    writers = [c["name"] for c in crew if c.get("job") in ("Screenplay", "Writer")]
    credits_list.extend(writers[:2])
    # Top 4 cast
    cast_names = [c["name"] for c in cast[:4]]
    credits_list.extend(cast_names)
    credits_str = ", ".join(dict.fromkeys(credits_list))  # deduplicate preserving order

    # Genres
    genres = ", ".join([g["name"] for g in details.get("genres", [])])

    # Runtime
    runtime = details.get("runtime", 0)

    # IMDB ID
    imdb_id = details.get("imdb_id", "")

    # Box office
    revenue = details.get("revenue", 0)
    box_office = str(revenue) if revenue > 0 else ""

    # MPAA
    mpaa = extract_mpaa(details)

    # Rating - we'll use TMDB vote_average as proxy (TMDB scale is 0-10 like IMDB)
    rating = details.get("vote_average", 0)
    rating = round(rating, 1)

    # Production company
    companies = details.get("production_companies", [])
    production = ""
    if companies:
        # Map to standardized studio
        for comp in companies:
            name = comp.get("name", "")
            std = standardize_studio(name)
            if std in ("Disney", "Warner Bros.", "20th Century Fox", "Universal Pictures",
                       "Paramount Pictures", "Sony Pictures", "MGM", "Lionsgate"):
                production = std
                break
        if not production:
            production = standardize_studio(companies[0].get("name", ""))

    # Source material & Oscars from overrides
    source = SOURCE_OVERRIDES.get(title, classify_source_material(details))
    oscars = RECENT_OSCARS.get(title, 0)

    return {
        "id": str(movie_id),
        "Title": title,
        "Year": str(year),
        "duration_mins": str(runtime) if runtime else "",
        "Genre": genres,
        "Credits": credits_str,
        "imdbRating": str(rating),
        "imdbID": imdb_id,
        "Production": production,
        "box_office": box_office,
        "mpaa_rating": mpaa,
        "source_material": source,
        "oscars_won": str(oscars),
    }

# ─── 5. Categorical buckets ─────────────────────────────────────────────────

def make_buckets(values, n_buckets):
    """Create equal-frequency buckets from a sorted list of numeric values.
    Returns list of (label, low, high) tuples."""
    clean = sorted([v for v in values if v is not None])
    if not clean:
        return []
    bucket_size = len(clean) // n_buckets
    remainder = len(clean) % n_buckets
    buckets = []
    idx = 0
    for i in range(n_buckets):
        size = bucket_size + (1 if i < remainder else 0)
        if idx >= len(clean):
            break
        low = clean[idx]
        high = clean[min(idx + size - 1, len(clean) - 1)]
        buckets.append((low, high))
        idx += size
    return buckets

def assign_bucket(value, buckets, labels):
    """Assign a value to a bucket, return label."""
    if value is None:
        return ""
    for i, (low, high) in enumerate(buckets):
        if value <= high or i == len(buckets) - 1:
            return labels[i]
    return labels[-1]

def categorize_column(rows, col, labels, parse_fn=float):
    """Add a categorical column based on equal-frequency bucketing."""
    values = []
    for r in rows:
        try:
            v = parse_fn(r[col])
            values.append(v)
        except (ValueError, KeyError, TypeError):
            values.append(None)

    buckets = make_buckets([v for v in values if v is not None], len(labels))

    cat_col = f"{col}_category"
    for i, r in enumerate(rows):
        r[cat_col] = assign_bucket(values[i], buckets, labels)

    # Print bucket info
    print(f"\n  {cat_col} buckets:")
    for label, (low, high) in zip(labels, buckets):
        count = sum(1 for r in rows if r[cat_col] == label)
        print(f"    {label}: {low} - {high} ({count} movies)")

    return rows

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Hollywood CSV Data Pipeline")
    print("=" * 60)

    # Read existing data
    print("\n[1/5] Reading CSV...")
    rows = read_csv(INPUT_CSV)
    print(f"  Loaded {len(rows)} movies")

    # Enrich existing rows
    print("\n[2/5] Enriching existing movies via TMDB...")
    for i, row in enumerate(rows):
        rows[i] = enrich_row(row)
        if (i + 1) % 25 == 0:
            print(f"  Progress: {i + 1}/{len(rows)}")

    # Add recent movies
    print(f"\n[3/5] Adding {len(RECENT_MOVIES)} recent movies...")
    for movie_id, title, year in RECENT_MOVIES:
        new_row = build_recent_row(movie_id, title, year)
        if new_row:
            rows.append(new_row)

    print(f"\n  Total movies: {len(rows)}")

    # Create categorical columns
    print("\n[4/5] Creating categorical columns...")

    # Box office categories (6 buckets)
    bo_labels = ["Indie", "Modest", "Moderate", "Hit", "Blockbuster", "Mega-Hit"]
    rows = categorize_column(rows, "box_office", bo_labels, parse_fn=lambda x: int(float(x)) if x else None)

    # Release year categories (7 buckets)
    year_labels = ["Silent/Pre-War", "Golden Age", "New Hollywood", "Blockbuster Era", "Modern Classic", "21st Century", "Contemporary"]
    rows = categorize_column(rows, "Year", year_labels, parse_fn=int)

    # Runtime categories (5 buckets)
    runtime_labels = ["Short", "Standard", "Long", "Extended", "Epic"]
    rows = categorize_column(rows, "duration_mins", runtime_labels, parse_fn=int)

    # IMDB rating categories (5 buckets)
    rating_labels = ["Good", "Very Good", "Great", "Excellent", "Masterpiece"]
    rows = categorize_column(rows, "imdbRating", rating_labels, parse_fn=float)

    # Write output
    print(f"\n[5/5] Writing to {OUTPUT_CSV}...")
    fieldnames = [
        "id", "Title", "Year", "Year_category", "duration_mins", "duration_mins_category",
        "Genre", "Credits", "imdbRating", "imdbRating_category", "imdbID",
        "Production", "box_office", "box_office_category", "mpaa_rating",
        "source_material", "oscars_won"
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    print(f"\n  Done! Wrote {len(rows)} movies to {OUTPUT_CSV}")
    print("=" * 60)

if __name__ == "__main__":
    main()
