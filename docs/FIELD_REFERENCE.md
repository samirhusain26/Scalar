# Scalar — Field Reference

This document explains every **visible clue field** shown in the game grid for each category. Hidden support columns (category buckets, lat/lon, etc.) are excluded.

---

## Countries

| Display Label | Attribute Key | Explanation |
|---|---|---|
| **Continent** | `continent` | The continent the country is located on (e.g., Europe, Asia, Africa). Colored green if it matches the target exactly; white if not. |
| **Subregion** | `subregion` | A finer geographic subdivision within a continent (e.g., Western Europe, Southeast Asia, South America). Colored green on exact match; white if not. |
| **Hemisphere** | `hemisphere` | Which hemisphere(s) the country lies in — North, South, East, West, or combinations (e.g., "N, E"). Colored green on exact match; white if not. |
| **Distance from Target** | `distance_km` | The straight-line (great-circle) distance in kilometers between the **capitals** of the guessed country and the target country. Green = within 1,000 km, amber = within 3,000 km, yellow = within 5,000 km, white = farther. |
| **Area (sq km)** | `area` | The total land area of the country in square kilometers. Displayed as a directional arrow (↑ target is larger / ↓ target is smaller) and a percentage tier showing how far off you are (e.g., ~25%, ~2×). |
| **Population** | `population` | The country's total population. Displayed as a directional arrow and percentage tier (e.g., ↑ ~5×). |
| **Landlocked?** | `is_landlocked` | Whether the country has no coastline and is entirely surrounded by land. Displays "Yes" or "No". Exact match only — green if correct, white if not. |
| **Govt. Type** | `government_type` | The form of government (e.g., Republic, Constitutional Monarchy, Federal Republic). Exact text match — green if identical to the target, white if not. |
| **Borders** | `border_countries_count` | The number of countries that share a land border with this country. Displayed as a raw number with a directional arrow. |
| **Timezones** | `timezone_count` | How many distinct time zones the country spans. Displayed as a raw number with a directional arrow. |
| **1st Letter** | `first_letter` | The alphabetical position of the first letter of the country's name (A=1, B=2, … Z=26), rendered as the letter itself. Uses horizontal arrows (← earlier / → later in the alphabet) to indicate direction. |

---

## Elements

| Display Label | Attribute Key | Explanation |
|---|---|---|
| **Atomic #** | `AtomicNumber` | The element's atomic number — the number of protons in its nucleus. This uniquely identifies the element. Displayed with a directional arrow (↑ target has more protons / ↓ fewer). |
| **Group** | `group` | The column number in the periodic table (1–18). Elements in the same group share similar chemical properties. Displayed with a directional arrow. |
| **Period** | `period` | The row number in the periodic table (1–7). Determines the number of electron shells. Displayed with a directional arrow. |
| **Phase (STP)** | `StandardState` | The physical state of the element at standard temperature and pressure: **Solid**, **Liquid**, or **Gas**. Exact text match — green if it matches the target. |
| **Element Family** | `element_family` | A named group of elements sharing chemical behavior (e.g., Alkali Metal, Noble Gas, Transition Metal, Halogen). Exact text match. |
| **Block** | `block` | The section of the periodic table based on which electron subshell is being filled: **s**, **p**, **d**, or **f**. Exact text match. |
| **Radioactive** | `is_radioactive` | Whether the element is radioactive (all isotopes are unstable). Displays "Yes" or "No". Exact match. |
| **Symbol matches name?** | `symbol_match` | Whether the element's chemical symbol is an abbreviation or starts with letters from its English name (e.g., Carbon → C = Yes; Gold → Au = No). Displays "Yes" or "No". Exact match. |

---

## How Clue Colors Work

| Color | Meaning |
|---|---|
| **Green (Exact)** | The guessed value exactly matches the target. |
| **Orange (Hot)** | Close but not exact. For numeric fields: guessed value is within ~10% of the target. For categorical fields (Group in Elements): same named group. |
| **Amber dashed (Near)** | Further away but in the right ballpark. For numeric fields: within ~10–25%. For distance: within 3,000 km. |
| **White (Miss)** | The value is far off or doesn't match at all. |

For **directional fields** (Area, Population, Atomic #, etc.), an arrow indicates whether the target is **higher ↑** or **lower ↓** than your guess, and a tier label shows by approximately how much (e.g., ~25%, ~2×, ~10×).
