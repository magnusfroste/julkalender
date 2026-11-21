/* Julkalender – logiken.
   Regler som gäller: inga nätanrop utom tomtens egna röstfiler, ingen
   inloggning, inget sparas på server. Vilka luckor som öppnats ligger i
   localStorage på enheten. Datum räknas i svensk tid, så en lucka öppnas vid
   midnatt i Stockholm även om plattan går på annan tidszon.

   Rösten: /roster/dag-NN.mp3 spelas när en lucka öppnas (skapas med
   tools/tomte_rost.py). Saknas filen läser webbläsaren upp texten i stället,
   med mörkare och långsammare röst. */

(function () {
  "use strict";

  var LAGRING = "julkalender-oppnade-v1";

  var DAGAR = [
    {
      titel: "Tomten har vaknat",
      text: "God morgon! Jag satt och putsade släden i natt och tänkte på hur mycket som hinner hända i december. Varje dag fram till julafton tittar jag in här med en liten hälsning.",
      uppdrag: "Dagens uppdrag: säg något snällt till någon du inte brukar prata med."
    },
    {
      titel: "Första snön",
      text: "Har ni fått snö än? Även om det bara är lite vitt på gräset blir hela gården en annan plats. Jag tycker bäst om snö som knarrar under stövlarna.",
      uppdrag: "Dagens uppdrag: gå ut och lyssna. Vad hör du som du inte hörde i går?"
    },
    {
      titel: "Fåglarna i kylan",
      text: "Småfåglarna har det tufft nu. Jag brukar hänga ut en talgboll i granen hemma hos mig. Då kommer dom och säger hej.",
      uppdrag: "Dagens uppdrag: rita en fågel som sitter i en buske och huttrar."
    },
    {
      titel: "Vanten som försvann",
      text: "En av mina vantar har varit borta sedan i fjol. Jag tror den ligger i en snödriva någonstans och väntar på att bli hittad. Känner du igen känslan?",
      uppdrag: "Dagens uppdrag: leta reda på en sak du trodde var borta."
    },
    {
      titel: "Pepparkakorna",
      text: "Det doftar kanel om hela verkstaden. Tomtemor bakar i form av stjärnor, hjärtan och en och annan ren som ser ut som en hund.",
      uppdrag: "Dagens uppdrag: rita den roligaste pepparkaksformen du kan hitta på."
    },
    {
      titel: "Mörkret ute",
      text: "Det är mörkt nästan hela dagen nu. Det är inte farligt, bara annorlunda. Tänd ett ljus, så blir rummet genast större.",
      uppdrag: "Dagens uppdrag: berätta om något som är mysigt när det är mörkt ute."
    },
    {
      titel: "Renarna räknar",
      text: "Jag räknade renarna i morse. Det gick bra ända till den nionde, för då ville den nionde bli kliad bakom örat i stället.",
      uppdrag: "Dagens uppdrag: räkna något i rummet ni är i. Hur många blev det?"
    },
    {
      titel: "En bok i soffan",
      text: "Ibland är det bästa som finns att krypa upp i soffan med en bok medan det snöar ute. Jag läser samma saga varje år och tycker om den lika mycket varje gång.",
      uppdrag: "Dagens uppdrag: läs en sida högt för någon."
    },
    {
      titel: "Skorna i hallen",
      text: "Hos mig står det tjugofyra par skor i hallen. Alla tomtenissar har olika stora fötter, och ingen av dem ställer tillbaka skorna där de ska stå.",
      uppdrag: "Dagens uppdrag: ställ dina skor fint. Någon blir glad, jag lovar."
    },
    {
      titel: "Stjärnan i fönstret",
      text: "Ser du stjärnan som lyser i många fönster? Den har sju uddar och snurrar långsamt. Jag brukar stanna på taket och titta på den en stund.",
      uppdrag: "Dagens uppdrag: rita en stjärna med sju uddar. Det är svårare än det låter."
    },
    {
      titel: "Luciadagen",
      text: "I dag går det tåg med ljus och sång. Jag hörde en klass sjunga så fint att en av renarna glömde bort att äta.",
      uppdrag: "Dagens uppdrag: sjung en rad ur en sång du kan. Bara en rad räcker."
    },
    {
      titel: "Paketpapper",
      text: "Jag har slagit in paket hela morgonen. Det svåraste är inte att knyta rosetten, det är att komma ihåg vad som ligger i vilket.",
      uppdrag: "Dagens uppdrag: gör en egen presentförpackning av papper och snöre."
    },
    {
      titel: "Klockan i verkstaden",
      text: "Klockan tickar fortare ju närmare vi kommer. Jag har slutat titta på den. Det går ändå alltid, och det brukar gå bra.",
      uppdrag: "Dagens uppdrag: gör något långsamt i dag. Riktigt långsamt."
    },
    {
      titel: "Ekorren vid brevlådan",
      text: "En ekorre har flyttat in i brevlådan hos grannen. Nu får posten ligga på trappan. Ingen verkar ha hjärta att säga till den.",
      uppdrag: "Dagens uppdrag: berätta om ett djur du sett på nära håll."
    },
    {
      titel: "Halvvägs",
      text: "Nu är vi halvvägs till julafton. Jag brukar stanna upp just i dag och tänka efter vad som varit bra hittills i december.",
      uppdrag: "Dagens uppdrag: säg tre saker som varit bra den här månaden."
    },
    {
      titel: "Den trasiga lyktan",
      text: "En av lyktorna i min släde har gått sönder. Jag lagade den med ståltråd och tejp, och nu lyser den nästan bättre än de andra, tycker jag.",
      uppdrag: "Dagens uppdrag: laga något i stället för att kasta det."
    },
    {
      titel: "Varm choklad",
      text: "Det finns inget bättre än varm choklad efter en lång dag i kylan. Jag tar min med en skvätt grädde, men det är ju en smaksak.",
      uppdrag: "Dagens uppdrag: gör en varm dryck och drick den långsamt."
    },
    {
      titel: "Snögubben som inte smälte",
      text: "En gång byggde barnen i en by en snögubbe som stod kvar ända till april. Jag tror nästan att den ville vara med hela vintern.",
      uppdrag: "Dagens uppdrag: rita en snögubbe med något roligt på huvudet."
    },
    {
      titel: "Listan",
      text: "Jag har en lång lista i verkstaden. Den är inte över saker, den är över barn. Alla står med. Det är faktiskt det enda som behövs.",
      uppdrag: "Dagens uppdrag: säg namnet på någon du tycker om, högt."
    },
    {
      titel: "Fyra dagar kvar",
      text: "Nu är det snart dags. Släden är lastad, renarna är rastade och jag har provat att säga \"ho ho\" så att det låter lagom. Fyra dagar kvar.",
      uppdrag: "Dagens uppdrag: rita hur du tror att släden ser ut inuti."
    },
    {
      titel: "Vintergatan",
      text: "I går kväll var himlen alldeles klar. Jag stod på taket länge och tittade upp. Det är svårt att tänka sig att det finns så mycket rymd ovanför ett vanligt hus.",
      uppdrag: "Dagens uppdrag: gå ut när det är mörkt och leta efter en stjärna."
    },
    {
      titel: "Tomtens favoritdag",
      text: "I dag är det den dag jag tycker bäst om. Det är inte den stora dagen, det är dagen innan, när allt är förberett och ingen har bråttom längre.",
      uppdrag: "Dagens uppdrag: hjälp någon med en sak som tar mindre än en minut."
    },
    {
      titel: "I morgon",
      text: "I morgon är det julafton. Jag har inte sovit mycket i natt, men det gör inget. Jag ville bara säga att jag har sett hur ni har hållit ut hela december.",
      uppdrag: "Dagens uppdrag: tacka någon som hjälpt dig i december."
    },
    {
      titel: "God jul!",
      text: "God jul! Jag åker runt hela natten och tittar in genom fönstren. Det finaste jag ser är inte paketen, det är att någon sitter uppe och väntar.",
      uppdrag: "Dagens uppdrag: berätta för någon vad du tyckte bäst om i den här kalendern."
    }
  ];

  var luckor = document.getElementById("luckor");
  var raknare = document.getElementById("raknare");
  var dialog = document.getElementById("dialog");
  var dlgDag = document.getElementById("dlg-dag");
  var dlgTitel = document.getElementById("dlg-titel");
  var dlgText = document.getElementById("dlg-text");
  var dlgUppdrag = document.getElementById("dlg-uppdrag");
  var stangKnapp = document.getElementById("stang");
  var lasUppKnapp = document.getElementById("las-upp");
  var pedagog = document.getElementById("pedagog");

  var oppnade = las();
  var allaOppnade = false;

  function las() {
    try {
      var rader = JSON.parse(localStorage.getItem(LAGRING) || "[]");
      return Array.isArray(rader) ? rader.filter(function (n) { return n >= 1 && n <= 24; }) : [];
    } catch (e) {
      return [];
    }
  }

  function spara() {
    try {
      localStorage.setItem(LAGRING, JSON.stringify(oppnade));
    } catch (e) {
      /* privat läge: luckorna öppnas ändå, men glöms när fliken stängs */
    }
  }

  /* Svensk tid oavsett enhetens inställning. */
  function nuISveridge() {
    var delar = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm", year: "numeric", month: "numeric",
        day: "numeric", hour: "2-digit", hour12: false
    }).formatToParts(new Date());
    var varde = {};
    delar.forEach(function (d) { varde[d.type] = d.value; });
    return {
      ar: parseInt(varde.year, 10),
      manad: parseInt(varde.month, 10),
      dag: parseInt(varde.day, 10),
      timme: parseInt(varde.hour, 10) % 24
    };
  }

  /* Hur många luckor som får öppnas i dag. Före 1 december: noll.
     Under december: dagens datum. Efter december: alla (man vill kunna
     spela kalendern i januari också). */
  function oppnaTillOchMed() {
    var nu = nuISveridge();
    if (nu.manad === 12) return Math.min(nu.dag, 24);
    if (nu.manad === 1) return 24;
    if (nu.manad === 11) return 0;
    return 24;
  }

  function arOppnad(n) {
    return oppnade.indexOf(n) !== -1;
  }

  function arLast(n) {
    var tillatna = oppnaTillOchMed();
    return n > tillatna;
  }

  function rita() {
    var idag = nuISveridge();
    var dagens = idag.manad === 12 ? Math.min(idag.dag, 24) : 0;

    luckor.innerHTML = "";
    for (var n = 1; n <= 24; n += 1) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lucka";
      b.textContent = String(n);
      b.dataset.nr = String(n);
      b.setAttribute("aria-label", "Lucka " + n + (arLast(n) ? " – låst" : ""));
      if (arLast(n)) {
        b.dataset.last = "ja";
        b.setAttribute("aria-disabled", "true");
      }
      if (arOppnad(n)) {
        b.dataset.oppnad = "ja";
        b.setAttribute("aria-label", "Lucka " + n + " – öppnad");
      }
      if (n === dagens && !allaOppnade) b.dataset.idag = "ja";
      li.appendChild(b);
      luckor.appendChild(li);
    }

    var tillatna = oppnaTillOchMed();
    if (tillatna === 0) {
      var kvar = dagarKvarTillForsta();
      raknare.textContent = kvar === 1 ? "Kalendern öppnar i morgon." : "Kalendern öppnar om " + kvar + " dagar.";
    } else if (tillatna >= 24) {
      raknare.textContent = "Alla 24 luckor är öppna.";
    } else {
      raknare.textContent = "I dag är det lucka " + tillatna + " som gäller.";
    }
  }

  function dagarKvarTillForsta() {
    var nu = nuISveridge();
    if (nu.manad !== 11) return 1;
    return 30 - nu.dag + 1;
  }

  function visa(n, textTillRost) {
    var d = DAGAR[n - 1];
    if (!d) return;
    dlgDag.textContent = n + " december";
    dlgTitel.textContent = d.titel;
    dlgText.textContent = d.text;
    dlgUppdrag.textContent = d.uppdrag;
    dlgDag.dataset.nr = String(n);
    lasUppKnapp.hidden = !harRost();
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    if (textTillRost) spela(n);
  }

  function harRost() {
    return rostFinns === true || ("speechSynthesis" in window);
  }

  /* Tomtens röst. .wav-filen är förinspelad och ligger på samma server som
     appen, så inget API-anrop behövs i webbläsaren. Finns den inte spelar vi
     texten med talsyntesen i stället – då hörs tomten ändå, bara torrare. */
  var ROSTFIL = "/roster/dag-";
  var rostFinns = null;      // null = inte undersökt än, false = använd talsyntes
  var ljud = null;
  var uppspelning = 0;       // så att bara en av felvägarna faller tillbaka

  function rostfil(n) {
    return ROSTFIL + (n < 10 ? "0" : "") + n + ".mp3";
  }

  function spela(n) {
    stoppa();
    var id = uppspelning += 1;
    if (rostFinns !== false) {
      var a = new Audio(rostfil(n));
      ljud = a;
      // Filen saknas, eller webbläsaren vägrar spela den: talsyntes i stället.
      // Både error-händelsen och play()-avvisningen kan komma – bara en får gälla.
      var fallTillbaka = function () {
        if (id !== uppspelning) return;
        uppspelning += 1;
        ljud = null;
        rostFinns = false;
        lasUpp(n);
      };
      a.addEventListener("error", fallTillbaka);
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(fallTillbaka);
      return;
    }
    lasUpp(n);
  }

  function lasUpp(n) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    var d = DAGAR[n - 1];
    if (!d) return;
    var yttrande = new SpeechSynthesisUtterance(d.text + " " + d.uppdrag);
    var roster = window.speechSynthesis.getVoices().filter(function (v) {
      return /^sv/i.test(v.lang);
    });
    if (roster.length) yttrande.voice = roster[0];
    yttrande.lang = "sv-SE";
    yttrande.rate = 0.88;
    yttrande.pitch = 0.85;   // mörkare: låter mer som tomte
    window.speechSynthesis.speak(yttrande);
  }

  function stoppa() {
    if (ljud) {
      try { ljud.pause(); } catch (e) {}
      ljud = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function stang() {
    stoppa();
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  luckor.addEventListener("click", function (e) {
    var knapp = e.target.closest(".lucka");
    if (!knapp) return;
    var n = parseInt(knapp.dataset.nr, 10);
    if (arLast(n) && !allaOppnade) {
      // Låst lucka: säg när den öppnas i stället för att ingenting hända.
      raknare.textContent = "Lucka " + n + " öppnas den " + n + " december.";
      return;
    }
    var ny = !arOppnad(n);
    if (ny) {
      oppnade.push(n);
      spara();
      rita();
    }
    // Tomten säger sin hälsning när luckan öppnas – inte när man tittar tillbaka.
    visa(n, ny);
  });

  stangKnapp.addEventListener("click", stang);
  lasUppKnapp.addEventListener("click", function () {
    spela(parseInt(dlgDag.dataset.nr || "1", 10));
  });
  dialog.addEventListener("close", stoppa);
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) stang();
  });

  // Finns förinspelad röst? Ett litet anrop vid start, sedan vet vi.
  if (window.fetch) {
    fetch(rostfil(1), { method: "HEAD" }).then(function (s) {
      rostFinns = s.ok;
    }).catch(function () {
      rostFinns = false;
    });
  } else {
    rostFinns = false;
  }

  pedagog.addEventListener("click", function () {
    if (!allaOppnade) {
      allaOppnade = true;
      pedagog.textContent = "Visa bara dagens luckor";
      raknare.textContent = "Alla luckor visas just nu.";
    } else {
      allaOppnade = false;
      pedagog.textContent = "Visa alla luckor";
      raknare.textContent = "";
    }
    Array.prototype.forEach.call(luckor.querySelectorAll(".lucka"), function (b) {
      if (allaOppnade) {
        delete b.dataset.last;
        b.removeAttribute("aria-disabled");
      } else if (arLast(parseInt(b.dataset.nr, 10))) {
        b.dataset.last = "ja";
        b.setAttribute("aria-disabled", "true");
      }
    });
    if (!allaOppnade) rita();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rita);
  } else {
    rita();
  }
})();