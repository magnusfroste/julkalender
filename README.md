# Julkalender

En julkalender för barn: 24 luckor, en per dag i december, med en kort hälsning
från tomten och ett litet uppdrag. Luckorna öppnas vid midnatt svensk tid, och
det som öppnats kommer ihåg på enheten.

- Ingen inloggning, inga konton, ingen reklam.
- Inga nätanrop alls: typsnitt, ikoner och allt annat ligger i repot.
- Inget sparas på en server. Öppnade luckor ligger i `localStorage`.
- "Läs upp" använder webbläsarens egen svenska talsyntes (kostar inget).

## Filer

| Fil | Vad den gör |
|---|---|
| `index.html` | Sidan, metadata och startskärmen |
| `styles.css` | Kalenderns utseende |
| `app.js` | Luckorna, datumen och texterna (24 st) |
| `public/` | Ikoner, Fredoka-typsnitt, manifest, robots |
| `bygg_ikoner.py` | Ritar om ikonerna utan externa bilder |

## Köra lokalt

```bash
cd public && python3 -m http.server 8190
```

Öppna <http://127.0.0.1:8190/>. Vill du se en lucka innan december: sätt
`localStorage.setItem("julkalender-oppnade-v1", "[1,2,3]")` i konsolen, eller
tryck "Visa alla luckor" i sidfoten.

## Drift

Statisk sajt i nginx (`Dockerfile`), publicerad som git-app på AgentHotel:
`julkalender.skolappar.com`.
