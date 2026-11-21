#!/usr/bin/env python3
"""Gör tomteröst av kalenderns 24 texter.

Läser texterna ur app.js (DAGAR) och skriver en ljudfil per lucka till
public/roster/dag-01.wav … dag-24.wav. Appen spelar den filen när en lucka
öppnas; saknas filen läser webbläsaren upp texten i stället.

Två API-format stöds, båda med samma slutpunkt som bas:

  --api openai   POST {bas}/v1/audio/speech   (Piper, Kokoro, OpenAI, …)
                 {"model": "piper", "input": "...", "voice": "sv_SE-nst-medium",
                  "response_format": "wav"}

  --api agent    POST {bas}/api/tts           (private-whisper-agent)
                 {"text": "...", "voice": "sv_SE-nst-medium", "engine": "piper"}

Miljövariabler (om flaggorna inte anges):
  TOMTE_TTS_URL    t.ex. https://voice.garageai.eu   (utan /v1/audio/speech)
  TOMTE_TTS_KEY    API-nyckel, skickas som Authorization: Bearer …
  TOMTE_TTS_VOICE  default sv_SE-nst-medium
  TOMTE_TTS_MODEL  default piper
  TOMTE_TTS_API    openai | agent

Exempel:
  TOMTE_TTS_URL=https://voice.garageai.eu TOMTE_TTS_KEY=sk-… \\
      python3 tools/tomte_rost.py

  python3 tools/tomte_rost.py --dry-run          # visa vad som skulle göras
  python3 tools/tomte_rost.py --only 1 24        # bara lucka 1 och 24
"""

import argparse
import json
import os
import re
import struct
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "app.js"
OUT_DIR = ROOT / "public" / "roster"


def las_dagar():
    """Plocka titel/text/uppdrag ur DAGAR i app.js utan att köra filen."""
    kalla = APP_JS.read_text(encoding="utf-8")
    start = kalla.index("var DAGAR = [")
    slut = kalla.index("];", start) + 1
    block = kalla[start:slut]

    def falt(namn):
        return re.findall(namn + r':\s*"((?:[^"\\]|\\.)*)"', block)

    titlar = falt("titel")
    texter = falt("text")
    uppdrag = falt("uppdrag")
    if not (len(titlar) == len(texter) == len(uppdrag) == 24):
        sys.exit(
            "Hittade %d titlar, %d texter, %d uppdrag i app.js – väntade 24 av varje."
            % (len(titlar), len(texter), len(uppdrag))
        )

    def avkoda(s):
        return s.replace('\\"', '"').replace("\\n", " ").replace("\\\\", "\\")

    return [
        {"dag": i + 1, "titel": avkoda(t), "text": avkoda(x), "uppdrag": avkoda(u)}
        for i, (t, x, u) in enumerate(zip(titlar, texter, uppdrag))
    ]


def mening(dag):
    """Det tomten säger: hälsning och uppdrag, utan rubriken."""
    return "%s %s" % (dag["text"], dag["uppdrag"])


def wav_langd(data):
    """Sekunder, om det är en WAV vi förstår. Används bara för rapporten."""
    if len(data) < 44 or data[:4] != b"RIFF":
        return None
    byte_rate = struct.unpack_from("<I", data, 28)[0]
    data_size = struct.unpack_from("<I", data, 40)[0]
    return round(data_size / byte_rate, 1) if byte_rate else None


def begar(url, nyckel, kropp, api):
    if api == "agent":
        endpoint = url.rstrip("/") + "/api/tts"
        payload = {"text": kropp["input"], "voice": kropp["voice"], "engine": "piper"}
    else:
        endpoint = url.rstrip("/") + "/v1/audio/speech"
        payload = kropp

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + nyckel},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as svar:
        ljud = svar.read()
        if not ljud:
            raise RuntimeError("tomt svar från %s" % endpoint)
        return ljud, svar.headers.get("Content-Type", "")


def main():
    p = argparse.ArgumentParser(description="Skapa tomteröst till julkalendern.")
    p.add_argument("--url", default=os.environ.get("TOMTE_TTS_URL", ""))
    p.add_argument("--key", default=os.environ.get("TOMTE_TTS_KEY", ""))
    p.add_argument("--voice", default=os.environ.get("TOMTE_TTS_VOICE", "sv_SE-nst-medium"))
    p.add_argument("--model", default=os.environ.get("TOMTE_TTS_MODEL", "piper"))
    p.add_argument("--api", default=os.environ.get("TOMTE_TTS_API", "openai"), choices=["openai", "agent"])
    p.add_argument("--only", nargs="*", type=int, help="bara dessa luckor")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--force", action="store_true", help="gör om filer som redan finns")
    args = p.parse_args()

    dagar = las_dagar()
    valda = [d for d in dagar if not args.only or d["dag"] in args.only]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run or not args.url:
        if not args.dry_run:
            print("Ingen TOMTE_TTS_URL angiven – visar bara planen.\n")
        print("%-4s %-26s %s" % ("dag", "titel", "text"))
        for d in valda:
            print("%-4d %-26s %d tecken" % (d["dag"], d["titel"][:26], len(mening(d))))
        print("\n%s → %s" % (args.url or "<url saknas>", OUT_DIR))
        return 0

    if not args.key:
        sys.exit("Ingen API-nyckel: sätt --key eller TOMTE_TTS_KEY.")

    gjorda, hoppade = 0, 0
    for d in valda:
        mal = OUT_DIR / ("dag-%02d.wav" % d["dag"])
        if mal.exists() and not args.force:
            hoppade += 1
            print("  – dag %02d finns redan (%.0f kB)" % (d["dag"], mal.stat().st_size / 1024))
            continue
        kropp = {
            "model": args.model,
            "input": mening(d),
            "voice": args.voice,
            "response_format": "wav",
            "speed": 0.95,
        }
        try:
            ljud, typ = begar(args.url, args.key, kropp, args.api)
        except urllib.error.HTTPError as e:
            sys.exit("dag %02d: HTTP %s – %s" % (d["dag"], e.code, e.read()[:200].decode("utf-8", "replace")))
        except Exception as e:
            sys.exit("dag %02d: %s" % (d["dag"], e))
        if not (ljud[:4] == b"RIFF" or ljud[:3] == b"ID3" or ljud[:4] == b"OggS"):
            sys.exit("dag %02d: svaret är inte ljud (%s, %d byte)" % (d["dag"], typ, len(ljud)))
        mal.write_bytes(ljud)
        gjorda += 1
        print("  ✓ dag %02d  %.0f kB  %s" % (d["dag"], len(ljud) / 1024, ("%ss" % wav_langd(ljud)) if wav_langd(ljud) else typ))

    print("\n%d filer skrivna, %d fanns redan. Total storlek: %.1f MB"
          % (gjorda, hoppade, sum(f.stat().st_size for f in OUT_DIR.glob("*.wav")) / 1048576))
    return 0


if __name__ == "__main__":
    sys.exit(main())