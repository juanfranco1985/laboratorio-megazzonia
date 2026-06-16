# Product Research Engine MVP

Minimal, extensible Python MVP for ingesting raw product reviews, extracting pain
points, clustering similar issues, and scoring severity per issue cluster.

## Scope

- Ingest plain text reviews
- Extract negative signals and pain points
- Cluster similar issues
- Score severity per cluster
- Output a structured insight object

## Quick Start

```bash
pip install -e .[dev]
pytest
```

## Basic Usage

```python
from product_research_engine import ProductResearchEngine

engine = ProductResearchEngine()
report = engine.analyze(
    """
    Battery dies in two hours. Very frustrating.
    The hinge cracked after one week. Cheap build quality.
    App crashes every time I sync data.
    """
)

print(report.to_dict())
```
