from __future__ import annotations

import html
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CERTIFICATES_ROOT = ROOT / "certificados"

UTEDYC_SLUGS = {
    "automatizacion-industrial",
    "comunicacion-estrategica-publicidad-y-desarrollo-digital",
    "creacion-y-manejo-de-tiendas-virtuales",
    "data-analitics-2",
    "diseno-web-html5-css-javascript",
    "diseno-y-fabricacion-digital-3d",
    "introduccion-a-la-robotica-con-arduino",
}


def font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def redact_box(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str,
    *,
    fill: tuple[int, int, int] = (255, 255, 255),
) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=max(8, (y2 - y1) // 8), fill=fill, outline=(110, 120, 130), width=2)
    text_font = font(max(16, min(38, int((y2 - y1) * 0.28))))
    bbox = draw.textbbox((0, 0), label, font=text_font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    draw.text(
        (x1 + ((x2 - x1 - text_w) / 2), y1 + ((y2 - y1 - text_h) / 2) - 2),
        label,
        fill=(42, 52, 62),
        font=text_font,
    )


def proportional_box(size: tuple[int, int], box: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    width, height = size
    x1, y1, x2, y2 = box
    return (round(width * x1), round(height * y1), round(width * x2), round(height * y2))


def redact_image(slug: str, image_path: Path) -> bool:
    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    size = image.size
    changed = False

    if slug in UTEDYC_SLUGS:
        redact_box(draw, proportional_box(size, (0.66, 0.405, 0.81, 0.465)), "DNI oculto")
        changed = True
    elif slug == "programador-javascript":
        redact_box(draw, proportional_box(size, (0.39, 0.305, 0.63, 0.355)), "DNI oculto")
        redact_box(draw, proportional_box(size, (0.015, 0.845, 0.40, 0.975)), "QR / verificacion ocultos", fill=(244, 247, 252))
        changed = True
    elif slug == "data-fundamentals-badge":
        redact_box(draw, proportional_box(size, (0.38, 0.875, 0.67, 0.925)), "URL ocultada")
        changed = True
    elif slug.startswith("ibm-"):
        redact_box(draw, proportional_box(size, (0.80, 0.075, 0.94, 0.255)), "QR oculto")
        redact_box(draw, proportional_box(size, (0.24, 0.825, 0.78, 0.875)), "URL de verificacion ocultada")
        redact_box(draw, proportional_box(size, (0.00, 0.945, 0.78, 0.998)), "URL ocultada")
        changed = True

    if changed:
        image.save(image_path, quality=92, optimize=True)

    return changed


def render_certificate_page(certificate: dict) -> str:
    title = certificate["title"]
    safe_title = html.escape(title)
    image_name = certificate.get("image")

    if image_name:
        safe_image = html.escape(image_name)
        actions = f'<a class="button primary" href="{safe_image}">Abrir imagen redactada</a>'
        preview = f'<img class="certificate-preview" src="{safe_image}" alt="{safe_title}">'
    else:
        actions = ""
        preview = (
            '<div class="privacy-placeholder">'
            "<strong>Vista publica no disponible</strong>"
            "<span>El PDF original se retiro de esta carpeta publica para evitar exponer datos personales.</span>"
            "</div>"
        )

    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{safe_title} | Certificados</title>
    <link rel="stylesheet" href="../styles.css">
  </head>
  <body>
    <main class="certificate-page">
      <p class="eyebrow"><a href="../">Certificados</a></p>
      <h1>{safe_title}</h1>
      <p class="privacy-note">Version publica redactada. DNI, QR y codigos o URLs de verificacion se ocultan antes de publicar.</p>
      <div class="actions">
        {actions}
      </div>
      <section class="viewer" aria-label="Vista publica del certificado">
        {preview}
      </section>
      <section class="meta">
        <h2>Privacidad</h2>
        <p>No se publica el PDF original en esta carpeta. El archivo fuente queda fuera del sitio publico.</p>
      </section>
    </main>
  </body>
</html>
"""


def render_index(certificates: list[dict]) -> str:
    cards = "\n".join(
        f'<a class="certificate-card" href="{html.escape(item["slug"])}/">'
        f'<strong>{html.escape(item["title"])}</strong>'
        "<span>URL independiente redactada</span></a>"
        for item in certificates
    )

    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Certificados | Laboratorio Megazzonia</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="certificate-index">
      <p class="eyebrow">Laboratorio Megazzonia</p>
      <h1>Certificados</h1>
      <p class="intro">Cada certificacion tiene su propia pagina publica. Las vistas publicadas estan redactadas: no incluyen DNI, QR ni codigos o URLs unicas de verificacion.</p>
      <section class="certificate-grid" aria-label="Lista de certificados">
        {cards}
      </section>
    </main>
  </body>
</html>
"""


def update_styles() -> None:
    styles_path = CERTIFICATES_ROOT / "styles.css"
    styles = styles_path.read_text(encoding="utf-8")
    addition = """

.privacy-note {
  max-width: 760px;
  margin: 12px 0 18px;
  color: #52616b;
  line-height: 1.5;
}

.privacy-placeholder {
  display: grid;
  min-height: 360px;
  place-items: center;
  padding: 32px;
  text-align: center;
}

.privacy-placeholder strong,
.privacy-placeholder span {
  display: block;
}

.privacy-placeholder span {
  max-width: 560px;
  color: #52616b;
  line-height: 1.5;
}
"""
    if ".privacy-note" not in styles:
        styles_path.write_text(styles.rstrip() + addition, encoding="utf-8")


def main() -> None:
    manifest_path = CERTIFICATES_ROOT / "certificados.json"
    certificates = json.loads(manifest_path.read_text(encoding="utf-8-sig"))

    removed_pdfs = 0
    redacted_images = 0

    for certificate in certificates:
        slug = certificate["slug"]
        certificate_dir = CERTIFICATES_ROOT / slug
        image_name = certificate.get("image")

        if image_name:
            image_path = certificate_dir / image_name
            if image_path.exists() and redact_image(slug, image_path):
                redacted_images += 1

        for pdf_path in certificate_dir.glob("*.pdf"):
            pdf_path.unlink()
            removed_pdfs += 1

        certificate["pdf"] = None
        certificate["publicRedacted"] = True
        certificate["redactionPolicy"] = "DNI, QR y codigos o URLs de verificacion ocultos. PDF original no publicado."

        (certificate_dir / "index.html").write_text(render_certificate_page(certificate), encoding="utf-8")
        (certificate_dir / "metadata.json").write_text(
            json.dumps(certificate, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    manifest_path.write_text(json.dumps(certificates, ensure_ascii=False, indent=2), encoding="utf-8")
    (CERTIFICATES_ROOT / "index.html").write_text(render_index(certificates), encoding="utf-8")
    update_styles()

    readme = """# Certificados

Carpeta preparada para GitHub Pages con una pagina independiente por certificado.

Politica de publicacion:

- No se publican PDFs originales en esta carpeta.
- Las imagenes disponibles estan redactadas.
- Se ocultan DNI, QR y codigos o URLs unicas de verificacion.
- El nombre del titular se conserva para que la certificacion siga siendo identificable.

Si GitHub Pages publica este repositorio desde la raiz, el patron de URL sera:

`https://juanfranco1985.github.io/laboratorio-megazzonia/certificados/<slug>/`

Indice general:

`https://juanfranco1985.github.io/laboratorio-megazzonia/certificados/`
"""
    (CERTIFICATES_ROOT / "README.md").write_text(readme, encoding="utf-8")

    print(f"Imagenes redactadas: {redacted_images}")
    print(f"PDFs publicos retirados: {removed_pdfs}")


if __name__ == "__main__":
    main()
