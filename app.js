const state = {
  scene: "werkraum",
  courage: 3,
  timeIndex: 0,
  log: ["Projektmappe", "Kopfhörer"],
};

const times = ["16:30", "17:05", "17:40", "18:15", "19:00", "19:30", "20:10", "20:45"];

const scenes = {
  werkraum: {
    title: "Werksraum – Projektwoche, letzter Nachmittagsblock",
    text: "Du packst gerade deinen Prototyp ein, da macht es *klack*. Die Flurtür fällt zu. Draußen ist's plötzlich still. Niemand mehr da. Classic. In deinem Kopf: \"Bro, ich bin eingeschlossen.\"",
    tags: ["Geruch nach Holz", "Werkbank", "Flurtür zu"],
    choices: [
      {
        label: "Erstmal chillen und die Schulordnung checken, die am Brett hängt.",
        next: "ordnung",
      },
      {
        label: "Zur Tür schleichen und lauschen, ob jemand im Flur ist.",
        next: "flur",
      },
      {
        label: "Fenster auf? Vielleicht raus?", 
        next: "fenster",
      },
    ],
  },
  ordnung: {
    title: "Aushang Schulordnung",
    text: "Die Schulordnung hängt wie ein Endboss an der Wand. Du liest: \"Ruhe im Gebäude, Fluchtwege freihalten\". Darunter klebt ein Post-it: \"Schlüssel im Sekretariat, wenn Hausmeister nicht da ist.\" Leak bestätigt.",
    tags: ["Regeln", "Post-it"],
    choices: [
      {
        label: "Post-it einstecken (Beweis!).",
        next: "flur",
        effect: () => addLog("Post-it mit Hinweis")
      },
      {
        label: "Direkt Richtung Sekretariat.",
        next: "flur",
      },
    ],
  },
  flur: {
    title: "Hauptflur der KGS",
    text: "Die Neonlichter surren. Du siehst die Aula, den Weg zur Mensa und das Sekretariat. Alles wirkt riesig, wenn man allein ist. Your move.",
    tags: ["Neonlicht", "Leerer Flur", "Echo"],
    choices: [
      {
        label: "Zur Aula – vielleicht gibt's dort einen Notausgang.",
        next: "aula",
      },
      {
        label: "Zum Sekretariat – Schlüssel-Quest.",
        next: "sekretariat",
      },
      {
        label: "Zur Mensa – Snacks regeln erstmal.",
        next: "mensa",
      },
    ],
  },
  fenster: {
    title: "Fenster check",
    text: "Du schiebst das Fenster an. Zu eng für einen coolen Escape. Außerdem: Schule am Abend? Kein Bock auf Stress mit Nachbarn. Du brauchst Plan B.",
    tags: ["Fenster zu eng"],
    choices: [
      {
        label: "Zurück in den Flur.",
        next: "flur",
      },
    ],
  },
  aula: {
    title: "Aula – Bühne der Projekte",
    text: "Auf der Bühne liegen noch Plakate der Projektwoche. Ein Roll-up der KGS kündigt den nächsten Infoabend an. Hinter dem Vorhang blinkt ein Sicherungskasten.",
    tags: ["Bühne", "Infoabend", "Sicherungskasten"],
    choices: [
      {
        label: "Sicherungskasten checken – Licht aus, vielleicht Tür auf?",
        next: "sicherung",
        effect: () => adjustCourage(-1),
      },
      {
        label: "Backstage nach einem Notausgang suchen.",
        next: "notausgang",
      },
      {
        label: "Zurück in den Flur.",
        next: "flur",
      },
    ],
  },
  sicherung: {
    title: "Sicherungskasten",
    text: "Du ziehst einen Hebel. Licht aus. Herz kurz lag. Du findest einen Zettel: \"Notausgang nur mit Alarmfreigabe über Sekretariat\". Okay, Plan bestätigt.",
    tags: ["Licht aus", "Zettel"],
    choices: [
      {
        label: "Zettel einstecken.",
        next: "aula",
        effect: () => addLog("Zettel: Alarm nur über Sekretariat")
      },
      {
        label: "Licht wieder an und in den Flur.",
        next: "flur",
      },
    ],
  },
  notausgang: {
    title: "Notausgang",
    text: "Tür mit Alarm-Schild. Du hörst in deinem Kopf schon die Sirenen. Nope. Du brauchst Freigabe.",
    tags: ["Alarm", "Exit"],
    choices: [
      {
        label: "Zurück zur Aula.",
        next: "aula",
      },
    ],
  },
  mensa: {
    title: "Mensa",
    text: "Die Mensa ist dunkel, aber du riechst noch Pizza von heute Mittag. Du findest eine Kiste mit Getränken für die Projektwoche. Score.",
    tags: ["Snack-Spot", "Dunkel"],
    choices: [
      {
        label: "Einen Eistee schnappen (+Mut).",
        next: "flur",
        effect: () => {
          adjustCourage(1);
          addLog("Eistee aus der Mensa");
        },
      },
      {
        label: "Zurück in den Flur.",
        next: "flur",
      },
    ],
  },
  sekretariat: {
    title: "Sekretariat",
    text: "Die Tür ist zu, aber der Schlüssel steckt innen. Auf dem Schreibtisch liegen KGS-Infoflyer und ein Notfallhandbuch. Du brauchst jetzt einen Plan, wie du reinkommst, ohne Alarm.",
    tags: ["Infoflyer", "Schlüssel", "Leise sein"],
    choices: [
      {
        label: "Mit einer Büroklammer aus dem Log die Tür öffnen.",
        next: "drin",
        requires: "Büroklammer",
      },
      {
        label: "Im Lehrerzimmer nach einer Büroklammer suchen.",
        next: "lehrerzimmer",
      },
      {
        label: "Zurück in den Flur.",
        next: "flur",
      },
    ],
  },
  lehrerzimmer: {
    title: "Lehrerzimmer",
    text: "Im Lehrerzimmer hängen noch Stundenpläne. Du findest einen offenen Ordner: \"Projektwoche KGS Schwarmstedt\". In der Schublade liegen Büroklammern. Jackpot.",
    tags: ["Stundenplan", "Ordner"],
    choices: [
      {
        label: "Büroklammern mitnehmen.",
        next: "sekretariat",
        effect: () => addLog("Büroklammer"),
      },
      {
        label: "Die Liste mit echten Ansprechpartnern merken (Schulleitung, Sekretariat, Hausmeister).",
        next: "sekretariat",
      },
    ],
  },
  drin: {
    title: "Sekretariat – drin!",
    text: "Du klickst die Tür leise auf. Drinnen: Schlüsselbrett, Telefon, Alarmfreigabe. Du liest im Handbuch: \"Notausgang über Code 2-4-6\".",
    tags: ["Schlüsselbrett", "Code 2-4-6"],
    choices: [
      {
        label: "Schlüssel nehmen und zum Notausgang.",
        next: "escape",
        effect: () => addLog("Schulschlüssel")
      },
      {
        label: "Erst den Code sichern.",
        next: "escape",
        effect: () => addLog("Alarmcode 2-4-6")
      },
    ],
  },
  escape: {
    title: "Notausgang – final run",
    text: "Du gibst den Code 2-4-6 ein, die Anzeige wird grün. Tür auf. Frische Luft. Du bist frei. KGS bei Nacht? Next Level. Morgen erzählst du's – aber nur den echten Leuten.",
    tags: ["Escape geschafft", "Projektwoche gerettet"],
    choices: [
      {
        label: "Nochmal spielen und einen anderen Weg testen.",
        next: "werkraum",
        effect: () => resetState(),
      },
    ],
  },
};

const titleEl = document.getElementById("scene-title");
const textEl = document.getElementById("scene-text");
const tagsEl = document.getElementById("scene-tags");
const choiceList = document.getElementById("choice-list");
const logEl = document.getElementById("log");
const clockEl = document.getElementById("clock");
const courageEl = document.getElementById("courage");

const restartButton = document.getElementById("restart");

function renderScene() {
  const scene = scenes[state.scene];
  titleEl.textContent = scene.title;
  textEl.textContent = scene.text;

  tagsEl.innerHTML = "";
  scene.tags.forEach((tag) => {
    const li = document.createElement("li");
    li.textContent = tag;
    tagsEl.appendChild(li);
  });

  choiceList.innerHTML = "";
  scene.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.textContent = choice.label;
    if (choice.requires && !state.log.includes(choice.requires)) {
      button.disabled = true;
      button.textContent = `${choice.label} (fehlt: ${choice.requires})`;
    }
    button.addEventListener("click", () => {
      if (choice.effect) {
        choice.effect();
      }
      if (choice.next) {
        state.scene = choice.next;
        advanceTime();
        renderScene();
      }
    });
    choiceList.appendChild(button);
  });

  renderLog();
  renderStatus();
}

function renderLog() {
  logEl.innerHTML = "";
  state.log.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    logEl.appendChild(li);
  });
}

function renderStatus() {
  clockEl.textContent = `⏰ ${times[state.timeIndex]}`;
  courageEl.textContent = `💡 Mut: ${state.courage}`;
}

function addLog(entry) {
  if (!state.log.includes(entry)) {
    state.log.push(entry);
  }
}

function advanceTime() {
  state.timeIndex = Math.min(state.timeIndex + 1, times.length - 1);
}

function adjustCourage(amount) {
  state.courage = Math.max(1, state.courage + amount);
}

function resetState() {
  state.scene = "werkraum";
  state.courage = 3;
  state.timeIndex = 0;
  state.log = ["Projektmappe", "Kopfhörer"]; 
}

restartButton.addEventListener("click", () => {
  resetState();
  renderScene();
});

renderScene();
