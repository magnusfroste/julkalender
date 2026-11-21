"""Liten HTTP-hjälpare för rösttjänsterna.

Två saker som ställer till det på den här maskinen och som curl klarar bättre
än urllib:

1. Systemets resolver kan ha negativ cache på ett namn som nyss skapats
   (piper.autoversio.ai svarar NXDOMAIN i timmar medan DoH svarar rätt).
   Vi slår upp via Cloudflare DoH och skickar med curl --resolve.
2. Cloudflare blockerar Python-urllibs user-agent med "error code: 1010".
   Vi skickar alltid en riktig webbläsar-UA.

Allt går genom curl, så multipart, tidsgränser och binärdata blir samma sak
som när man testar för hand.
"""

import json
import subprocess
import urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"


def slaa_upp(host):
    """A-record via Cloudflare DoH. None om det inte går."""
    try:
        req = urllib.request.Request(
            "https://cloudflare-dns.com/dns-query?name=%s&type=A" % host,
            headers={"Accept": "application/dns-json"},
        )
        with urllib.request.urlopen(req, timeout=10) as s:
            d = json.load(s)
        for svar in d.get("Answer", []):
            if svar.get("type") == 1:
                return svar["data"]
    except Exception:
        pass
    return None


def kor(url, metod="GET", rubriker=None, kropp=None, fil=None, timeout=120):
    """curl-anrop. Returnerar (status, content_type, bytes)."""
    from urllib.parse import urlsplit

    delar = urlsplit(url)
    host = delar.hostname or ""
    cmd = ["curl", "-sS", "-m", str(timeout), "-A", UA, "-X", metod,
           "-o", "-", "-w", "\n%{http_code}\t%{content_type}\t%{redirect_url}"]
    for k, v in (rubriker or {}).items():
        cmd += ["-H", "%s: %s" % (k, v)]
    if kropp is not None:
        cmd += ["--data-binary", kropp]
    if fil is not None:
        cmd += ["-F", fil]
    # Namnet kanske bara finns i DoH: peka curl rätt.
    cmd += ["--resolve", "%s:%d:%s" % (host, delar.port or (443 if delar.scheme == "https" else 80), slaa_upp(host) or host)]
    cmd.append(url)

    r = subprocess.run(cmd, capture_output=True, timeout=timeout + 20)
    ut = r.stdout
    if b"\n" not in ut:
        return "ERR", "", (r.stderr or b"tomt svar")[:300]
    data, meta = ut.rsplit(b"\n", 1)
    delar_meta = meta.decode("utf-8", "replace").split("\t")
    try:
        status = int(delar_meta[0])
    except Exception:
        status = "ERR"
    ct = delar_meta[1] if len(delar_meta) > 1 else ""
    return status, ct, data


def ar_ljud(data, typ=""):
    return data[:4] in (b"RIFF", b"OggS") or data[:3] == b"ID3" or data[:2] in (b"\xff\xfb", b"\xff\xf3") or typ.startswith("audio/")