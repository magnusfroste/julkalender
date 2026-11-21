#!/usr/bin/env python3
"""Bygger tomtens samtal: public/tomte.js med texterna och röstfilerna.

Texterna kommer från tools/tomte_data.py (fraga, fyra svar och vad tomten
måste göra sedan per lucka). Skriptet skriver:

  public/tomte.js              texterna som appen visar och läser
  public/roster/halsning-NN.mp3  "I dag är det den tredje december ..."
  public/roster/fraga-NN.mp3     tomtens fråga till barnet
  public/roster/slut-NN.mp3      tack och adjö, med dagens syssla
  public/roster/svar-NN-K.mp3    tomtens svar på barnfråga K
  public/roster/ovrigt-K.mp3     svar på vanliga frågor utanför dagen
  public/roster/vetinte.mp3      när frågan inte passar något svar

Historien och uppdraget ligger redan i dag-NN.mp3, så de spelas i ordning
mellan hälsningen och frågan i stället för att spelas in igen.

    python3 tools/tomte_samtal.py --texter       # bara tomte.js
    python3 tools/tomte_samtal.py                # texter + alla röster
    python3 tools/tomte_samtal.py --only 3 24    # bara dessa luckor
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rost_http import ar_ljud, kor  # noqa: E402
from tomte_data import DAGAR, ORDNINGSTAL, OVRIGT, RAKNORD  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
UT_JS = ROOT / "public" / "tomte.js"
UT_ROSTER = ROOT / "public" / "roster"
VETINTE = "Det där vet jag faktiskt inte. Fråga mig om renarna i stället, det kan jag."


def halsning(dag):
    """Vilken dag det är och hur många dagar det är kvar till jul."""
    if dag == 24:
        return "Hej! I dag är det den tjugofjärde december. Det är julafton!"
    kvar = 24 - dag
    ord = ORDNINGSTAL[dag - 1]
    if kvar == 1:
        return ("Hej! I dag är det den %s december, och det är en dag kvar till jul."
                % ord)
    return ("Hej! I dag är det den %s december, och det är %s dagar kvar till jul."
            % (ord, RAKNORD[kvar]))


def slut(dag):
    """Avskedet, med dagens syssla."""
    gor = DAGAR[dag - 1]["gor"]
    if dag == 24:
        return ("Tack! Det var trevligt att tala med dig i dag. Nu måste jag %s. "
                "God jul, och vi ses nästa december." % gor)
    return ("Tack! Det var trevligt att tala med dig i dag. Vi ses igen i morgon. "
            "Nu måste jag %s." % gor)


def textrader():
    """Alla texter i den ordning de skrivs: (filnamn, text)."""
    rader = []
    for i in range(24):
        n = i + 1
        d = DAGAR[i]
        rader.append(("halsning-%02d" % n, halsning(n)))
        rader.append(("fraga-%02d" % n, d["fraga"]))
        rader.append(("slut-%02d" % n, slut(n)))
        for k, (_, svar) in enumerate(d["svar"], start=1):
            rader.append(("svar-%02d-%d" % (n, k), svar))
    for k, (_, svar) in enumerate(OVRIGT, start=1):
        rader.append(("ovrigt-%d" % k, svar))
    rader.append(("vetinte", VETINTE))
    return rader


def skriv_js():
    dagar = []
    for i in range(24):
        n = i + 1
        d = DAGAR[i]
        dagar.append({
            "halsning": halsning(n),
            "fraga": d["fraga"],
            "slut": slut(n),
            "svar": [{"q": q, "s": s} for q, s in d["svar"]],
        })
    data = {
        "dagar": dagar,
        "ovrigt": [{"nyckel": nyckel, "svar": svar} for nyckel, svar in OVRIGT],
        "vetinte": VETINTE,
    }
    text = ("/* Tomtens samtal. Skrivs av tools/tomte_samtal.py - redigera inte för hand.\n"
            "   Texterna är samma ord som röstfilerna i /roster säger. */\n"
            "window.TOMTE = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    UT_JS.write_text(text, encoding="utf-8")
    return len(dagar)


def nyckel():
    audio = {}
    fil = Path("/opt/data/.audio")
    if fil.exists():
        for rad in fil.read_text(encoding="utf-8").splitlines():
            if "=" in rad and not rad.startswith("#"):
                k, v = rad.split("=", 1)
                audio[k.strip()] = v.strip()
    return audio


def main():
    p = argparse.ArgumentParser(description="Bygg tomtens samtal (texter och röst).")
    p.add_argument("--texter", action="store_true", help="skriv bara tomte.js")
    p.add_argument("--only", nargs="*", type=int, help="bara dessa luckor")
    p.add_argument("--force", action="store_true", help="gör om filer som finns")
    p.add_argument("--format", default="mp3", choices=["mp3", "wav"])
    args = p.parse_args()

    n = skriv_js()
    print("tomte.js: %d luckor, %d fritextsvar, %d tecken"
          % (n, len(OVRIGT), UT_JS.stat().st_size))
    if args.texter:
        return 0

    audio = nyckel()
    url = audio.get("PIPER_URL", "").rstrip("/") + "/v1/audio/speech"
    key = audio.get("PIPER_KEY", "")
    if not audio.get("PIPER_URL") or not key:
        sys.exit("Ingen PIPER_URL/PIPER_KEY i /opt/data/.audio")

    UT_ROSTER.mkdir(parents=True, exist_ok=True)
    rader = textrader()
    if args.only:
        behall = set()
        for d in args.only:
            behall.add("halsning-%02d" % d)
            behall.add("fraga-%02d" % d)
            behall.add("slut-%02d" % d)
            for k in range(1, 5):
                behall.add("svar-%02d-%d" % (d, k))
        rader = [r for r in rader if r[0] in behall]

    gjorda = hoppade = 0
    for namn, text in rader:
        mal = UT_ROSTER / (namn + "." + args.format)
        if mal.exists() and not args.force:
            hoppade += 1
            continue
        kropp = {"model": "piper", "input": text, "voice": "nst",
                 "response_format": args.format, "speed": 0.95}
        s, typ, ljud = kor(url, "POST",
                           {"Content-Type": "application/json",
                            "Authorization": "Bearer " + key},
                           kropp=json.dumps(kropp), timeout=120)
        if s != 200 or not ar_ljud(ljud, typ):
            print("FEL %-18s HTTP %s %s" % (namn, s, str(ljud[:120])))
            continue
        mal.write_bytes(ljud)
        gjorda += 1
        if gjorda % 10 == 0:
            print("  %d filer ..." % gjorda, flush=True)

    total = sum(f.stat().st_size for f in UT_ROSTER.glob("*." + args.format))
    print("%d filer skrivna, %d fanns redan. Roster: %.1f MB"
          % (gjorda, hoppade, total / 1048576))
    return 0


if __name__ == "__main__":
    sys.exit(main())