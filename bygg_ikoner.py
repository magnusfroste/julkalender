#!/usr/bin/env python3
"""Bygger ikoner och småfil till julkalendern (inga externa bilder).

Ikonen är en röd dörr med en gyllene stjärna: luckan i kalendern, inget mer.
"""
import json
import os
import pathlib
import shutil

from PIL import Image, ImageDraw

APP = pathlib.Path("/opt/data/projects/julkalender")
PUB = APP / "public"
PORT = pathlib.Path("/opt/data/projects/skolappar-port")

ROD = (179, 36, 59)
ROD_DJUP = (125, 21, 38)
PAPPER = (250, 247, 242)
LJUS = (246, 227, 228)
GULD = (201, 162, 39)


def runda(mask, storlek, radie, farg):
    lager = Image.new("RGBA", (storlek, storlek), (0, 0, 0, 0))
    d = ImageDraw.Draw(lager)
    d.rounded_rectangle((0, 0, storlek - 1, storlek - 1), radius=radie, fill=farg)
    mask.paste(lager, (0, 0), lager)


def ikon(storlek=512, maskable=False):
    im = Image.new("RGBA", (storlek, storlek), (0, 0, 0, 0))
    # maskable: låt motivet ligga inom säker zon (80 %)
    insats = int(storlek * 0.1) if maskable else 0
    inre = storlek - 2 * insats
    radie = int(inre * (0.5 if maskable else 0.26))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((insats, insats, insats + inre - 1, insats + inre - 1), radius=radie, fill=ROD)

    # dörren: ljus lucka med rundad överkant
    m = inre * 0.50
    x0 = insats + (inre - m) / 2
    y0 = insats + inre * 0.24
    x1 = x0 + m
    y1 = insats + inre * 0.86
    d.rounded_rectangle((x0, y0, x1, y1), radius=int(m * 0.16), fill=LJUS)

    # stjärna ovanför dörren
    cx = insats + inre / 2
    cy = insats + inre * 0.165
    r = inre * 0.085
    punkter = []
    import math
    for i in range(10):
        vinkel = -math.pi / 2 + i * math.pi / 5
        radie = r if i % 2 == 0 else r * 0.45
        punkter.append((cx + radie * math.cos(vinkel), cy + radie * math.sin(vinkel)))
    d.polygon(punkter, fill=GULD)

    # handtag
    hr = inre * 0.028
    d.ellipse((x1 - m * 0.22 - hr, (y0 + y1) / 2 - hr, x1 - m * 0.22 + hr, (y0 + y1) / 2 + hr), fill=ROD_DJUP)

    # talet 24 under dörren? Nej – ikonen ska vara läsbar i 40 px. Bara dörren.
    return im


def main():
    (PUB / "fonts").mkdir(parents=True, exist_ok=True)
    os.makedirs(PUB, exist_ok=True)

    for storlek, namn in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png"), (64, "favicon-logga.png")]:
        ikon(storlek).save(PUB / namn)
        print(namn, "klarade")
    ikon(512).save(PUB / "favicon.png")
    ikon(512, maskable=True).save(PUB / "icon-maskable-512.png")

    # favicon.svg: samma motiv som vektorgrafik
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="15" fill="#b3243b"/>
  <rect x="18" y="17" width="28" height="34" rx="4.5" fill="#f6e3e4"/>
  <path d="M32 6.5l1.9 4.6 4.9.4-3.7 3.2 1.1 4.8-4.2-2.6-4.2 2.6 1.1-4.8-3.7-3.2 4.9-.4z" fill="#c9a227"/>
  <circle cx="40" cy="35" r="2" fill="#7d1526"/>
</svg>
"""
    (PUB / "favicon.svg").write_text(svg, encoding="utf-8")

    # typsnitt: Fredoka lokalt, fyra vikter
    for vikt in (400, 500, 600, 700):
        kalla = PORT / "fonts" / "fredoka" / ("Fredoka-%d.ttf" % vikt)
        shutil.copyfile(kalla, PUB / "fonts" / ("fredoka-%d.ttf" % vikt))
    (PUB / "fonts.css").write_text("""/* Fredoka (SIL OFL 1.1) – lokalt, inga webbtypsnitt. */
@font-face {
  font-family: "Fredoka";
  src: url("/fonts/fredoka-400.ttf") format("truetype");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Fredoka";
  src: url("/fonts/fredoka-500.ttf") format("truetype");
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Fredoka";
  src: url("/fonts/fredoka-600.ttf") format("truetype");
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: "Fredoka";
  src: url("/fonts/fredoka-700.ttf") format("truetype");
  font-weight: 700;
  font-display: swap;
}
""", encoding="utf-8")

    shutil.copyfile(PORT / "ux" / "ux.css", PUB / "ux.css")

    manifest = {
        "name": "Julkalender",
        "short_name": "Julkalender",
        "description": "Julkalender för barn: 24 luckor med en hälsning från tomten och ett litet uppdrag varje dag. Gratis och utan inloggning.",
        "lang": "sv",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "orientation": "any",
        "background_color": "#faf7f2",
        "theme_color": "#b3243b",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (PUB / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (PUB / "robots.txt").write_text("User-agent: *\nAllow: /\n\nSitemap: https://julkalender.skolappar.org/sitemap.xml\n", encoding="utf-8")
    (PUB / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        "  <url><loc>https://julkalender.skolappar.org/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n"
        "</urlset>\n",
        encoding="utf-8",
    )
    print("public/ klar")


if __name__ == "__main__":
    main()