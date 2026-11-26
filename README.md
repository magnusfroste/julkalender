# Julkalender

En julkalender för barn: 24 luckor, en per dag i december. När en lucka öppnas
berättar tomten vilken dag det är och hur många dagar det är kvar till jul, läser
en kort historia om dagen och ställer en fråga. Barnet får sedan fråga honom två
saker innan han måste gå och göra dagens syssla.

- Ingen inloggning, inga konton, ingen reklam.
- Inga nätanrop till tredje part: typsnitt, ikoner, ljud och allt annat ligger i repot.
- Inget sparas på en server. Öppnade luckor ligger i `localStorage`.
- Tomtens röst är förinspelad (piper, röst `nst`) och ligger som mp3 i
  `public/roster/`. Saknas en fil läser webbläsarens egen svenska talsyntes upp
  samma text.

## Så går ett samtal till

1. Barnet trycker på dagens lucka. Tomten hälsar: "I dag är det den tredje
   december, och det är tjugoett dagar kvar till jul."
2. Han berättar dagens historia (samma text som står i rutan) och ställer en fråga.
3. Fyra frågor dyker upp som knappar, plus en mikrofonknapp **"Säg din fråga"**
   och ett fält för den som hellre skriver. Tomten svarar med samma röst.
4. Efter två frågor tackar han för sig: "Det var trevligt att tala med dig i
   dag. Vi ses igen i morgon. Nu måste jag ..." – och sysslan är olika varje dag
   (mata renarna, baka pepparkakor, lasta släden ...).

Fritextfrågor matchas mot dagens svar och mot elva vanliga frågor (renarna,
nissarna, skorstenen, sommaren ...). Passar inget svar säger tomten att han inte
vet och bjuder in till en fråga han kan. Ingen modell, ingen nyckel och inget
nätverk är inblandat – allt är text och ljud i repot.

### Röstfrågor

Mikrofonen använder **webbläsarens egen röstigenkänning** (`SpeechRecognition`,
`lang="sv-SE"`): tryck, prata, och texten hamnar i fältet och skickas som en
vanlig fråga. Inget ljud går till vår server, inget sparas och ingen nyckel
behövs. Två saker att känna till:

- Själva tolkningen görs av webbläsarens rösttjänst (i praktiken Apple på iOS,
  Google i Chrome), alltså utanför vår kontroll. Därför står det i sidfoten.
- Saknas stödet (t.ex. Firefox) visas ingen mikrofon alls; då fungerar
  skrivfältet som vanligt. Nekar användaren mikrofonen står det "Mikrofonen är
  avstängd. Skriv i stället." och knappen finns kvar för ett nytt försök.

Tomten tystas innan mikrofonen slås på, annars hör den hans egen röst. Lyssningen
stängs av efter 12 sekunder utan tal, när luckan stängs, och när frågan skickats.

## Filer

| Fil | Vad den gör |
|---|---|
| `index.html` | Sidan, metadata och startskärmen |
| `styles.css` | Kalenderns utseende |
| `app.js` | Luckorna, datumen, texterna (24 st) och samtalslogiken |
| `public/tomte.js` | Tomtens repliker: hälsning, fråga, svar och avsked |
| `public/roster/` | 204 mp3-filer med tomtens röst |
| `public/` | Ikoner, Fredoka-typsnitt, manifest, robots |
| `tools/tomte_data.py` | Innehållet i samtalen, en post per lucka |
| `tools/tomte_samtal.py` | Skriver `public/tomte.js` och spelar in rösterna |
| `tools/tomte_rost.py` | Spelar in dagens historia (`dag-NN.mp3`) |
| `bygg_ikoner.py` | Ritar om ikonerna utan externa bilder |

## Köra lokalt

```bash
mkdir -p .lokal && cp index.html styles.css app.js .lokal/ && cp -r public/* .lokal/
cd .lokal && python3 -m http.server 8190
```

Öppna <http://127.0.0.1:8190/>. Vill du se en lucka innan december: sätt
`localStorage.setItem("julkalender-oppnade-v1", "[1,2,3]")` i konsolen, eller
tryck "Visa alla luckor" i sidfoten.

## Spela in rösterna igen

```bash
python3 tools/tomte_samtal.py            # texter + alla röster
python3 tools/tomte_samtal.py --texter   # bara public/tomte.js
python3 tools/tomte_samtal.py --only 3   # bara lucka 3
```

Adress och nyckel till rösttjänsten läses från `/opt/data/.audio`
(`PIPER_URL`, `PIPER_KEY`). Ändrar du en replik i `tools/tomte_data.py` måste du
köra om skriptet **och** deploya, annars säger rösten något annat än texten.

## Drift

Statisk sajt i nginx (`Dockerfile`), publicerad som git-app på AgentHotel:
`julkalender.skolappar.org`.