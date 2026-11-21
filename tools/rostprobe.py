#!/usr/bin/env python3
"""Prova röststacken: Piper, OmniVoice och Private STT.

Läser nycklar från /opt/data/.audio (PIPER_URL/PIPER_KEY, OMNI_URL/OMNI_KEY,
STT_URL/STT_KEY). Gör ett riktigt anrop per tjänst, sparar ljudet och skickar
tillbaka det till STT så att hela kedjan TTS → STT bevisas.

  python3 tools/rostprobe.py                # allt
  python3 tools/rostprobe.py --only piper   # en tjänst
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rost_http import ar_ljud, kor  # noqa: E402

KEYFIL = Path(os.environ.get("ROST_KEYS", "/opt/data/.audio"))
PROV = "God morgon! Jag heter Tomten och jag bor i skogen bakom granen."


def las_nycklar():
    if not KEYFIL.exists():
        sys.exit("Saknar %s – skapa filen med PIPER_URL/PIPER_KEY/OMNI_URL/OMNI_KEY/STT_URL/STT_KEY." % KEYFIL)
    ut = {}
    for rad in KEYFIL.read_text(encoding="utf-8").splitlines():
        rad = rad.strip()
        if not rad or rad.startswith("#") or "=" not in rad:
            continue
        k, v = rad.split("=", 1)
        ut[k.strip()] = v.strip()
    return ut


def langd(fil):
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fil],
            capture_output=True, text=True, timeout=30,
        )
        return round(float(r.stdout.strip()), 1)
    except Exception:
        return None


def tts(namn, bas, nyckel, kropp, mal):
    if not bas:
        print("%-6s – ingen URL i %s" % (namn, KEYFIL))
        return None
    s, ct, b = kor(bas + "/health", timeout=30)
    print("%-6s /health   %s  %s" % (namn, s, b[:140].decode("utf-8", "replace").strip()))
    if not nyckel:
        print("%-6s ingen nyckel angiven – hoppar över syntes" % namn)
        return None
    h = {"Content-Type": "application/json", "Authorization": "Bearer " + nyckel}
    s, ct, b = kor(bas + "/v1/audio/speech", "POST", h, kropp=json.dumps(kropp), timeout=180)
    if s != 200 or not ar_ljud(b, ct):
        print("%-6s syntes    %s  %s" % (namn, s, b[:200].decode("utf-8", "replace").strip()))
        return None
    Path(mal).write_bytes(b)
    print("%-6s syntes    %s  %s  %.1f kB  %ss" % (namn, s, ct, len(b) / 1024, langd(mal)))
    return mal


def stt(bas, nyckel, fil):
    if not bas:
        return
    s, ct, b = kor(bas + "/api/status", timeout=30)
    print("stt    /api/status %s %s" % (s, b[:100].decode("utf-8", "replace").strip()))
    if not fil:
        print("stt    inget ljud att transkribera")
        return
    # WAV avvisas (415): konvertera till m4a först.
    m4a = fil.rsplit(".", 1)[0] + ".m4a"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", fil, "-c:a", "aac", "-b:a", "96k", m4a], timeout=60)
    h = {}
    if nyckel:
        h["Authorization"] = "Bearer " + nyckel
    s, ct, b = kor(bas + "/api/transcribe", "POST", h, fil="file=@%s;type=audio/mp4" % m4a, timeout=180)
    print("stt    transkribering %s %s" % (s, b[:400].decode("utf-8", "replace").strip()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["piper", "omni", "stt"])
    args = ap.parse_args()
    k = las_nycklar()
    ut = Path(tempfile.mkdtemp(prefix="rostprobe-"))

    piper_fil = None
    if args.only in (None, "piper"):
        piper_fil = tts(
            "piper", k.get("PIPER_URL", ""), k.get("PIPER_KEY", ""),
            {"model": "piper-sv", "input": PROV, "voice": "nst", "response_format": "wav", "speed": 0.95},
            str(ut / "piper.wav"),
        )

    omni_fil = None
    if args.only in (None, "omni"):
        omni_fil = tts(
            "omni", k.get("OMNI_URL", ""), k.get("OMNI_KEY", ""),
            {"model": "omnivoice", "input": PROV, "voice": "ref_female", "language": "sv",
             "response_format": "mp3"},
            str(ut / "omni.mp3"),
        )

    if args.only in (None, "stt"):
        stt(k.get("STT_URL", ""), k.get("STT_KEY", ""), piper_fil or omni_fil)

    print("\nljud i:", ut)
    return 0


if __name__ == "__main__":
    sys.exit(main())