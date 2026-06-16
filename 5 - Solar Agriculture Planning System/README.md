# Solar Agriculture Planning System

An end-to-end planner that aligns crops, climate history, and risk analysis to a 4×90 solar calendar anchored on real solstice/equinox events. The system normalizes climate data to solar days, computes planting/harvest windows, and provides an interactive dashboard.

## 4×90 Solar Model
- The year is split into four 90-day solar seasons. Day 46 is the astronomical center (solstice or equinox) with offsets –45…+44 mapped to solar days 1–90.
- Real solstice/equinox drift per year is baked into `src/solar/real_events.py`; missing years use close approximations.
- Hemispheres are supported by rotating season labels (e.g., March equinox = Spring north, Autumn south).
- Conversions:
  - Gregorian → solar via `SolarConverter.to_solar(date)`.
  - Solar → Gregorian via `SolarConverter.from_solar(year, season, solar_day)`.
  - `solar_progress` provides a 0–1 normalized position inside the 90-day window.

## Climate Methodology
- Climate data ingested from user CSV (`date,tmin_c,tmax_c,humidity_pct,precip_mm,...`) or synthetic fallback.
- Data is resampled to daily frequency and enriched with solar metadata (`solar_day`, `solar_season`, offsets).
- Aggregations and risk metrics are computed per solar day instead of Gregorian months to align with plant physiology.
- Stability score measures variance across years; lower variance = higher stability.

## Crop Knowledge Base
Stored in `crops/crops_db.json` with fields:
- Optimal soil temperature (min/max)
- Climate tolerance (min/max air temp)
- Growth days (min/max)
- Sensitivity: frost/heat/humidity
- Seasonal preferences and photoperiod bounds
- Watering windows (mm/week)

## Agriculture Logic
- `risk_engine.py`: frost/heat/drought probabilities and stability scores by solar day.
- `recommendations.py`: germination success, viable planting windows, and harvest projections. “Smart recommendations” summarize best solar-day windows and cautionary notes.
- `simulator.py`: Monte Carlo success probability, KMeans clustering of solar climate types, and a RandomForest germination score.

Planting window logic:
1. Compute germination success from soil/air temperature vs. crop optimal soil temp.
2. Penalize by combined risk (frost/heat/drought + stability).
3. Windows with success ≥0.5 and risk ≤0.35 are viable; scored windows are ranked.
4. Harvest window = planting day + crop growth days (min/max) projected on the solar cycle.

Risk indices:
- Frost risk: P(tmin ≤ threshold) per solar day.
- Heat stress: P(tmax ≥ threshold) per solar day.
- Drought: P(precip ≤ 0.5 mm).
- Combined risk: weighted frost/heat/drought plus stability penalty.

## Dashboard (Streamlit)
Run `streamlit run src/dashboard/app.py`.
Features:
- Crop selector and hemisphere toggle.
- File uploader for climate CSV (or synthetic fallback).
- Solar-cycle heatmaps (temperature), risk lines, stability area plot.
- Planting and harvest guidance with Monte Carlo probability.
- Clustered solar climate types and download buttons for CSV outputs.

## Uploading Your Dataset
1. Prepare CSV with required columns: `date,tmin_c,tmax_c,humidity_pct,precip_mm`. Optional: `solar_radiation_mj,morning_soil_temp_c,night_soil_temp_c`.
2. In the dashboard sidebar, upload the file. Data is resampled to daily and converted to solar coordinates automatically.

## Examples
- Sample crop data: `crops/crops_db.json` includes Tomato, Winter Wheat, and Lettuce profiles.
- Sample climate CSV: `data/raw/sample_climate.csv`.
- Notebooks: `notebooks/Crop_Analysis.ipynb` and `notebooks/Risk_Trends.ipynb` show quick-start analysis.

## Project Layout
```
data/
  raw/
  processed/
crops/
  crops_db.json
src/
  solar/ (converter + real event table)
  climate/ (loaders + solar normalization)
  agriculture/ (recommendations, risk engine, simulator)
  dashboard/ (Streamlit app + Plotly charts)
notebooks/
README.md
requirements.txt
```
