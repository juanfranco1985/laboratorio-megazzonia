# Solar Climate Dashboard

Interactive Streamlit dashboard for mapping climate data onto a conceptual 4x90 solar calendar while keeping Gregorian comparisons available.

The project is designed as a climate analytics workbench: it converts daily weather data into solar-season coordinates, compares solar and Gregorian views, explores hemispheric inversion, tracks seasonal drift and optionally runs ML-based clustering, anomaly detection and regression.

## Current Status

- Streamlit app in `app.py`.
- Modular Python package in `solar_dashboard/`.
- Bundled sample dataset: `data/madrid_climate_sample.csv`.
- Portfolio screenshots included as `Imagen 1.jpg` through `Imagen 4.jpg`.
- Case page integrated into Laboratorio Megazzonia.

## Features

- 4x90 solar calendar conversion: season, solar day, offset from center event and normalized progress.
- Solar and Gregorian heatmaps for variables such as temperature, humidity, radiation and precipitation.
- Solar vs Gregorian curves with rolling means and statistics.
- Hemispheric comparison with mirrored curves, dual heatmaps and solar-day scatter plots.
- Solar drift analysis across years using peak shifts, moving windows and seasonal boxplots.
- Data explorer with CSV/XLSX upload, filtering and export of processed datasets.
- Optional ML module for clustering, anomaly detection and regression using solar features.

## Quickstart

From this folder:

```powershell
pip install -r requirements.txt
streamlit run app.py
```

Then open the local Streamlit URL shown in the terminal.

## Data Format

Required:

- `date`: daily date in `YYYY-MM-DD` format.
- At least one numeric climate variable, for example `temp`, `humidity`, `radiation` or `precip`.

Optional:

- `location`
- `hemisphere`

Extra columns are preserved in the processed dataset.

## Solar Calendar Model

- Solar year: 360 days.
- Four solar seasons of 90 days each.
- Solar day absolute: 1 to 360.
- Solar day inside season: 1 to 90.
- Offset from season center: -45 to +45.
- Normalized progress: 0 to 1 across the solar year.
- Southern hemisphere mode applies a half-year phase shift for mirrored comparisons.

## Folder Structure

- `app.py`: Streamlit UI.
- `solar_dashboard/solar_engine.py`: solar calendar conversion.
- `solar_dashboard/data_loader.py`: file loading, cleaning and filtering.
- `solar_dashboard/charts.py`: Plotly visualizations.
- `solar_dashboard/ml_module.py`: optional ML helpers.
- `data/`: sample datasets.
- `assets/`: future exported figures or static assets.

## Verification

Run a syntax check from the repository root:

```powershell
python -m compileall "9 - Solar Climate Dashboard"
```

Manual smoke test:

1. Start Streamlit with `streamlit run app.py`.
2. Load the bundled sample dataset or upload a CSV/XLSX.
3. Switch heatmap calendar mode between `solar` and `gregorian`.
4. Review hemispheric comparison and drift sections.
5. Enable the optional ML module and confirm prediction/anomaly outputs render.

## Portfolio Value

This project demonstrates Python dashboard work, climate data modeling, data preparation, interactive visualization, export flows, modular analytics code and an original calendar-mapping concept.
