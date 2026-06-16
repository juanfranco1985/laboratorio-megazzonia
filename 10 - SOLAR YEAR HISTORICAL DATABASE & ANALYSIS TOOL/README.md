# Solar Year Historical Database & Analysis Tool (4×90 Solar Calendar)

This project implements a solar-centered analytical calendar that overlays the Gregorian calendar with four 90-day seasons (Summer, Autumn, Winter, Spring). It stores dates, locations, and observations, and enriches every record with solar-season indices for both a **fixed** model (centers on constant calendar dates) and a **real** model (centers on the astronomical solstices/equinoxes when available).

## 4×90 Model at a Glance
- The Gregorian year remains unchanged (365 or 366 days). The 4×90 system is conceptual.
- Four solar seasons of 90 indexed days each (1–90). Center day (offset 0) = solstice/equinox; offsets run -45…+44.
- 4 × 90 = 360 days → 5 or 6 **epagomenal** days per year fall outside all seasons (solar_day_index = NULL, epagomenal = TRUE, season = Complementary).
- Default (Southern Hemisphere) season centers: Dec solstice → Summer, Mar equinox → Autumn, Jun solstice → Winter, Sep equinox → Spring.
- Northern Hemisphere rotates labels: Mar equinox → Spring, Jun solstice → Summer, Sep equinox → Autumn, Dec solstice → Winter.

### Fixed vs Real Models
- **Fixed model:** centers are fixed calendar dates (21 Mar, 21 Jun, 21 Sep, 21 Dec). Deterministic, fast, no external data.
- **Real model:** centers are the actual astronomical event dates for that year (requires ephemerides, e.g., Skyfield + JPL). If real events are unavailable, the code can fall back to the fixed model with a note.

### Epagomenal Rule
For each Gregorian date, compute the offset to every seasonal center (previous, current, next year events are considered). If the closest center has |offset| ≤ 44, the date belongs to that season with solar_day_index = offset + 46. Otherwise it is epagomenal (Complementary, solar_day_index NULL). This produces 5 (or 6 in leap years) complementary days per year.

## Project Structure
```
data/
  raw/                # drop CSVs here
  processed/
/db/
  schema.sql          # SQLite schema
/src/
  solar/
    calendar_model.py # 4×90 logic, mapping, helpers to populate dates/events
    events_fixed.py   # fixed center dates
    events_real.py    # astronomical centers (optional, Skyfield) with fallback
  etl/
    load_climate.py   # ingest climate CSVs, enrich with solar annotations
    load_health.py    # ingest health data similarly
  analysis/
    drift_analysis.py # real-vs-fixed drift, center shifts
    anomalies.py      # climate anomalies by solar day
    cycles.py         # spectral/cycle exploration on solar axis
  interface/
    dashboard.py      # Streamlit-ready stub for interactive exploration
/notebooks/
  Solar_Drift_Study.ipynb (placeholder)
  Climate_by_Solar_Phase.ipynb (placeholder)
requirements.txt
README.md
```

## Getting Started
1) Create and activate an environment, then install deps: `pip install -r requirements.txt` (Skyfield is optional but needed for real events).
2) Initialize the SQLite DB: `sqlite3 solar_year.db < db/schema.sql`.
3) Generate dates and solar_events for a year range (example in `src/solar/calendar_model.py` under `__main__`).
4) Run ETL scripts to load climate/health CSVs; they will auto-enrich rows with solar annotations.

## Core Concepts (implementation)
- `calendar_model.annotate_year(year, hemisphere, model)` builds records for every day in a year with solar season/day, offsets, and epagomenal flag. It gathers centers from year-1..year+1 to resolve cross-year seasons.
- Season naming uses hemisphere-aware mapping; only labels change.
- Solar day index = offset + 46 (offset -45→1 … 0→46 … +44→90).
- Real events are obtained via Skyfield when available; otherwise fall back to fixed dates with a note so analyses can flag the approximation.

## ETL Expectations
- Climate CSV should include at least `date,location,temperature_min,temperature_max,precipitation,humidity,solar_radiation` (extra columns kept in `other`).
- Health CSV should include `date,location,metric_name,metric_value`.
- ETL resolves `location_id` via the locations table (requires pre-populated locations with hemisphere/coords).
- All ingested rows are enriched with fixed/real solar metadata before insertion.

## Analyses
- **Drift analysis:** Compare real vs fixed center dates over years; compute mean offset by season and visualize drift.
- **Climate anomalies:** Aggregate climate stats by solar_day_index/season, compute z-scores per year, render heatmaps.
- **Cycles:** Spectral or autocorrelation analyses on solar-day-indexed series to discover recurring patterns.

## Real Solar Events
`src/solar/events_real.py` contains a Skyfield-based implementation behind a try/except. Provide a JPL ephemeris (e.g., download `de421.bsp`) and set `EPHEMERIS_PATH` env var or pass a path to the helper. If Skyfield or an ephemeris is missing, the code falls back to fixed events and annotates the note field.

## Dashboard (optional)
`src/interface/dashboard.py` is a Streamlit-ready stub. Run with `streamlit run src/interface/dashboard.py` after filling in data access paths.

## Next Steps
- Add automated tests for the mapping logic (edge cases around year boundaries and leap days).
- Plug in real ephemeris data and verify drift outputs.
- Add sample climate datasets under `data/raw/` for smoke tests.
