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
  var prat = document.getElementById("prat");
  var forslag = document.getElementById("forslag");
  var skriv = document.getElementById("skriv");
  var fragaFalt = document.getElementById("fraga-falt");
  var fragorKvarText = document.getElementById("fragor-kvar");
  var mik = document.getElementById("mik");
  var mikRad = document.getElementById("mik-rad");
  var mikEtikett = mik ? mik.querySelector(".mik-text") : null;
  var mikStatus = document.getElementById("mik-status");

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

  function p(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function visa(n, spelaNu) {
    var d = DAGAR[n - 1];
    if (!d) return;
    var tomte = window.TOMTE && window.TOMTE.dagar ? window.TOMTE.dagar[n - 1] : null;
    dlgDag.textContent = n + " december";
    dlgTitel.textContent = d.titel;
    if (mikStatus) mikSager("");
    dlgText.textContent = d.text;
    dlgUppdrag.textContent = d.uppdrag;
    dlgDag.dataset.nr = String(n);
    lasUppKnapp.hidden = !harRost();

    samtal = { dag: n, kvar: 2, klar: false, fragade: [] };
    prat.innerHTML = "";
    forslag.innerHTML = "";
    skriv.hidden = true;
    fragaFalt.value = "";
    fragorKvarText.textContent = "";

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    if (!tomte) return;
    if (spelaNu) {
      // Första gången: tomten hälsar och berättar. Frågan och knapparna kommer
      // när historien är slut, så barnet vet vad det kan fråga om.
      spelaSerie([
        { namn: "halsning-" + p(n), text: tomte.halsning },
        { namn: "dag-" + p(n), text: d.text + " " + d.uppdrag }
      ], function () {
        tomteFragar(n);
        spelaSerie([{ namn: "fraga-" + p(n), text: tomte.fraga }]);
      });
    } else {
      // Man har varit här förut: visa samtalet direkt, utan att prata först.
      tomteFragar(n);
    }
  }

  function harRost() {
    return rostFinns === true || ("speechSynthesis" in window);
  }

  /* Tomtens röst. Varje replik är förinspelad (piper, röst nst) och ligger i
     /roster som mp3 – samma röst hela samtalet, inget API-anrop från
     webbläsaren. Saknas en fil läser talsyntesen samma text i stället. */
  var ROST = "/roster/";
  var rostFinns = null;      // null = inte undersökt än, false = använd talsyntes
  var ljud = null;
  var tur = 0;               // ökar vid varje avbrott, så gamla köer dör
  var samtal = { dag: 0, kvar: 0, klar: false, fragade: [] };

  function talsyntes(text, klar) {
    if (!("speechSynthesis" in window)) {
      if (klar) klar();
      return;
    }
    window.speechSynthesis.cancel();
    var minTur = tur;
    var y = new SpeechSynthesisUtterance(text);
    var roster = window.speechSynthesis.getVoices().filter(function (v) {
      return /^sv/i.test(v.lang);
    });
    // Ingen röst i webbläsaren (t.ex. en del Chromebooks och headless-lägen):
    // då finns inget att vänta på, samtalet går vidare direkt.
    if (!roster.length && window.speechSynthesis.getVoices().length === 0) {
      if (klar) klar();
      return;
    }
    if (roster.length) y.voice = roster[0];
    y.lang = "sv-SE";
    y.rate = 0.88;
    y.pitch = 0.85;   // mörkare: låter mer som tomte
    var vakt = setTimeout(function () {
      if (minTur === tur && klar) klar();
    }, Math.max(6000, text.length * 90));
    if (klar) {
      y.addEventListener("end", function () {
        clearTimeout(vakt);
        if (minTur === tur) klar();
      });
    }
    window.speechSynthesis.speak(y);
  }

  /* Spelar en replik och anropar klar() när den är slut. Faller tillbaka på
     talsyntes om filen saknas eller webbläsaren vägrar spela den. */
  function spelaEn(del, klar) {
    if (rostFinns === false) {
      talsyntes(del.text, klar);
      return;
    }
    var minTur = tur;
    var a = new Audio(ROST + del.namn + ".mp3");
    ljud = a;
    var klart = function () {
      clearTimeout(vakt);
      a.removeEventListener("ended", klart);
      a.removeEventListener("error", fel);
      if (minTur === tur && klar) klar();
    };
    var fel = function () {
      clearTimeout(vakt);
      a.removeEventListener("ended", klart);
      a.removeEventListener("error", fel);
      if (minTur !== tur) return;
      rostFinns = false;      // en gång räcker: nästa replik går direkt på talsyntes
      ljud = null;
      talsyntes(del.text, klar);
    };
    // Om varken "ended" eller talsyntesen hör av sig (en del webbläsare i
    // headless-läge, eller en ljudfil som fastnar) går samtalet vidare ändå.
    var vakt = setTimeout(function () {
      if (minTur !== tur) return;
      klart();
    }, 30000);
    a.addEventListener("ended", klart);
    a.addEventListener("error", fel);
    var p = a.play();
    if (p && typeof p.catch === "function") p.catch(fel);
  }

  function spelaSerie(delar, klar) {
    stoppa();
    var minTur = tur;
    var i = 0;
    var nasta = function () {
      if (minTur !== tur) return;
      if (i >= delar.length) {
        if (klar) klar();
        return;
      }
      var del = delar[i];
      i += 1;
      spelaEn(del, nasta);
    };
    if (!delar.length) {
      if (klar) klar();
      return;
    }
    nasta();
  }

  function tomteFragar(n) {
    var tomte = window.TOMTE.dagar[n - 1];
    bubbla("tomte", tomte.fraga);
    visaForslag(n);
    skriv.hidden = false;
    fragorKvarText.textContent = "Du kan fråga tomten två saker.";
  }

  function visaForslag(n) {
    var tomte = window.TOMTE.dagar[n - 1];
    forslag.innerHTML = "";
    var lista = document.createElement("div");
    lista.className = "chips-fragor";
    tomte.svar.forEach(function (s, i) {
      if (samtal.fragade.indexOf(i) !== -1) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fraga-knapp";
      b.textContent = s.q;
      b.addEventListener("click", function () {
        samtal.fragade.push(i);
        stallFraga(n, s.q, s.s, "svar-" + p(n) + "-" + (i + 1));
      });
      lista.appendChild(b);
    });
    if (lista.children.length) forslag.appendChild(lista);
  }

  function bubbla(vem, text) {
    var rad = document.createElement("p");
    rad.className = "bubbla bubbla-" + vem;
    var etikett = document.createElement("span");
    etikett.className = "bubbla-vem";
    etikett.textContent = vem === "tomte" ? "Tomten" : "Du";
    rad.appendChild(etikett);
    rad.appendChild(document.createTextNode(text));
    prat.appendChild(rad);
    if (typeof rad.scrollIntoView === "function") {
      rad.scrollIntoView({ block: "nearest" });
    }
    return rad;
  }

  function stallFraga(n, fraga, svar, ljudnamn) {
    if (samtal.klar || samtal.kvar <= 0) return;
    samtal.kvar -= 1;
    bubbla("barn", fraga);
    forslag.innerHTML = "";
    skriv.hidden = true;
    var rad = bubbla("tomte", svar);
    rad.classList.add("sager");
    spelaSerie([{ namn: ljudnamn, text: svar }], function () {
      rad.classList.remove("sager");
      if (samtal.kvar > 0) {
        visaForslag(n);
        skriv.hidden = false;
        fragorKvarText.textContent = "Du kan fråga en sak till.";
      } else {
        avsluta(n);
      }
    });
  }

  function avsluta(n) {
    samtal.klar = true;
    forslag.innerHTML = "";
    skriv.hidden = true;
    var tomte = window.TOMTE.dagar[n - 1];
    bubbla("tomte", tomte.slut);
    fragorKvarText.textContent = "Tomten har bråttom nu. Vi ses i morgon.";
    spelaSerie([{ namn: "slut-" + p(n), text: tomte.slut }]);
  }

  /* Nyckelord → svar. Barn stavar som de stavar, så vi jamför ord för ord
     utan skiljetecken och accenter. */
  function forenkla(s) {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9åäö ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function traffOrd(ord, nyckel) {
    if (ord === nyckel) return true;
    if (nyckel.length < 3) return false;
    if (ord.indexOf(nyckel) === 0) return true;    // ren → renar
    if (ord.length >= 3 && nyckel.indexOf(ord) === 0) return true;  // renarna → ren
    return false;
  }

  function matchaFraga(n, text) {
    var tomte = window.TOMTE;
    var q = forenkla(text);
    var ord = q.split(" ").filter(function (o) { return o.length > 2; });
    var bast = null;
    var bastPoang = 0;

    tomte.dagar[n - 1].svar.forEach(function (s, i) {
      var poang = 0;
      var m = forenkla(s.q).split(" ");
      ord.forEach(function (o) {
        if (m.indexOf(o) !== -1) poang += 2;
      });
      if (poang > bastPoang) {
        bastPoang = poang;
        bast = { svar: s.s, namn: "svar-" + p(n) + "-" + (i + 1) };
      }
    });

    tomte.ovrigt.forEach(function (o, i) {
      var poang = 0;
      o.nyckel.forEach(function (ny) {
        var k = forenkla(ny);
        if (!k) return;
        if (k.indexOf(" ") !== -1) {
          if (q.indexOf(k) !== -1) poang += 3;
          return;
        }
        ord.some(function (ordet) {
          if (traffOrd(ordet, k)) {
            poang += 3;
            return true;
          }
          return false;
        });
      });
      if (poang > bastPoang) {
        bastPoang = poang;
        bast = { svar: o.svar, namn: "ovrigt-" + (i + 1) };
      }
    });

    return bast || { svar: tomte.vetinte, namn: "vetinte" };
  }

  function stoppa() {
    tur += 1;
    if (ljud) {
      try { ljud.pause(); } catch (e) {}
      ljud = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function stang() {
    stoppa();
    slutaLyssna();
    if (mikStatus) mikSager("");
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
    var n = parseInt(dlgDag.dataset.nr || "1", 10);
    var d = DAGAR[n - 1];
    var tomte = window.TOMTE && window.TOMTE.dagar ? window.TOMTE.dagar[n - 1] : null;
    if (!tomte) {
      if (d) talsyntes(d.text + " " + d.uppdrag);
      return;
    }
    spelaSerie([
      { namn: "halsning-" + p(n), text: tomte.halsning },
      { namn: "dag-" + p(n), text: d.text + " " + d.uppdrag },
      { namn: "fraga-" + p(n), text: tomte.fraga }
    ]);
  });

  /* En fråga från barnet, oavsett om den skrevs eller sades. */
  function fragaText(text) {
    text = String(text || "").trim();
    if (!text) return false;
    if (!window.TOMTE || samtal.klar || samtal.kvar <= 0) return false;
    fragaFalt.value = "";
    var traff = matchaFraga(samtal.dag, text);
    stallFraga(samtal.dag, text, traff.svar, traff.namn);
    return true;
  }

  skriv.addEventListener("submit", function (e) {
    e.preventDefault();
    fragaText(fragaFalt.value);
  });

  /* Röst: barnet trycker på mikrofonen och pratar i stället för att skriva.
     Vi använder webbläsarens egen tolkning (svenska), så inget ljud går till
     vår server, ingen nyckel behövs och inget spelas in. Saknas stödet visas
     ingen mikrofon alls och skrivfältet fungerar som förut. */
  var Rost = window.SpeechRecognition || window.webkitSpeechRecognition;
  var lyssnar = null;

  function mikSager(text) {
    mikStatus.textContent = text;
    mikStatus.hidden = !text;
  }

  function mikLage(pa) {
    mik.setAttribute("aria-pressed", pa ? "true" : "false");
    if (mikEtikett) mikEtikett.textContent = pa ? "Lyssnar … prata nu" : "Säg din fråga";
  }

  function slutaLyssna() {
    var r = lyssnar;
    lyssnar = null;
    mikLage(false);
    if (r) {
      try { r.stop(); } catch (e) { /* redan stoppad */ }
    }
  }

  function lyssna() {
    if (!Rost) return;
    if (lyssnar) { slutaLyssna(); return; }
    if (!window.TOMTE || samtal.klar || samtal.kvar <= 0) return;

    // Tysta tomten först, annars hör mikrofonen hans egen röst.
    stoppa();
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    var r = new Rost();
    r.lang = "sv-SE";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    lyssnar = r;
    mikLage(true);
    mikSager("");

    var hortText = "";
    var vakt = setTimeout(function () {
      mikSager("Jag hörde inget. Tryck igen och prata lite högre.");
      slutaLyssna();
    }, 12000);

    r.onresult = function (e) {
      var slutlig = "";
      var pagaende = "";
      for (var i = e.resultIndex; i < e.results.length; i += 1) {
        var bit = e.results[i][0].transcript;
        if (e.results[i].isFinal) slutlig += bit;
        else pagaende += bit;
      }
      hortText = (slutlig || pagaende || hortText).trim();
      if (hortText) fragaFalt.value = hortText;
      if (slutlig) {
        clearTimeout(vakt);
        mikSager("");
        setTimeout(function () {
          slutaLyssna();
          fragaText(hortText);
        }, 150);
      }
    };

    r.onerror = function (e) {
      clearTimeout(vakt);
      lyssnar = null;
      mikLage(false);
      var kod = e && e.error;
      if (kod === "not-allowed" || kod === "service-not-allowed") {
        mikRad.hidden = true;
        mikSager("Mikrofonen är avstängd. Skriv i stället.");
      } else if (kod === "no-speech") {
        mikSager("Jag hörde inget. Tryck igen och prata lite högre.");
      } else if (kod === "network") {
        mikSager("Rösten behöver nät. Skriv i stället.");
      } else {
        mikSager("Det gick inte att lyssna. Skriv i stället.");
      }
    };

    r.onend = function () {
      clearTimeout(vakt);
      lyssnar = null;
      mikLage(false);
    };

    try {
      r.start();
    } catch (e) {
      lyssnar = null;
      mikLage(false);
      mikSager("Det gick inte att lyssna. Skriv i stället.");
    }
  }

  if (Rost) {
    mik.addEventListener("click", lyssna);
    mikRad.hidden = false;
  }
  dialog.addEventListener("close", function () { stoppa(); slutaLyssna(); });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) stang();
  });

  // Finns förinspelad röst? Ett litet anrop vid start, sedan vet vi. Vi frågar
  // efter första luckans hälsning, som är den kortaste filen.
  if (window.fetch) {
    fetch(ROST + "halsning-01.mp3", { method: "HEAD" }).then(function (s) {
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