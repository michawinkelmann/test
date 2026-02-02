const statusText = document.getElementById("statusText");
const courageEl = document.getElementById("courage");
const reputationEl = document.getElementById("reputation");
const sceneTitle = document.getElementById("sceneTitle");
const sceneText = document.getElementById("sceneText");
const choicesEl = document.getElementById("choices");
const inventoryEl = document.getElementById("inventory");
const logEl = document.getElementById("log");
const restartBtn = document.getElementById("restartBtn");

const state = {
  courage: 3,
  reputation: 0,
  inventory: new Set(),
  flags: {},
  location: "intro",
};

const scenes = {
  intro: {
    title: "Projektwoche: Afterglow",
    text:
      "Die Flure der KGS Schwarmstedt sind leer, dein Handy leuchtet wie ein kleines Lagerfeuer. " +
      "Du hast nachmittags noch am Projekt gebaut, jetzt ist die Haustür verriegelt. " +
      "Du hörst das Summen der Reinigungsmaschine – jemand ist noch da. Was machst du?",
    choices: [
      { label: "Aula checken (vielleicht liegt da noch der Generalschlüssel?)", target: "aula" },
      { label: "Lehrerzimmer anpeilen – risky, aber da hängen Pläne", target: "lehrerzimmer" },
      { label: "Zur Sporthalle schleichen, da gibt's Notausgänge", target: "sporthalle" },
    ],
  },
  aula: {
    title: "Aula: Echo & Projektplakate",
    text:
      "Die Aula ist ein Meme-Archiv aus Projektplakaten. Zwischen Bühne und Technikpult blinkt eine Lampe. " +
      "Auf einem Infoboard hängt die aktuelle Schulordnung. Ein Schatten huscht über den Bühnenvorhang.",
    choices: [
      {
        label: "Schulordnung einstecken (kann später schützen)",
        target: "aula",
        effect: () => addItem("Schulordnung"),
        once: "gotRules",
      },
      {
        label: "Technikpult durchsuchen",
        target: "technik",
      },
      {
        label: "Jemanden ansprechen: \"Hallo? Wer ist da?\"",
        target: "reinigung",
      },
      {
        label: "Zurück in den Flur",
        target: "flur",
      },
    ],
  },
  technik: {
    title: "Technikpult: Licht & Sound",
    text:
      "Du findest ein altes Funkgerät der Veranstaltungstechnik. Vielleicht hört die Schulleitung mit? " +
      "Und hey, die Tür zur Bühne ist angelehnt.",
    choices: [
      {
        label: "Funkgerät einpacken",
        target: "technik",
        effect: () => addItem("Funkgerät"),
        once: "gotRadio",
      },
      {
        label: "Bühne hochklettern und umsehen",
        target: "buehne",
      },
      {
        label: "Zurück in die Aula",
        target: "aula",
      },
    ],
  },
  buehne: {
    title: "Bühne: Spotlight",
    text:
      "Auf der Bühne liegt ein Fundstück: ein Laminat-Ausweis mit dem Logo der KGS. " +
      "Dazu ein Zettel: \"Hausmeisterdienst – Notausgänge prüfen\".",
    choices: [
      {
        label: "Ausweis nehmen",
        target: "buehne",
        effect: () => addItem("Hausmeister-Ausweis"),
        once: "gotBadge",
      },
      {
        label: "Ausweis liegen lassen, nicht so deep gehen",
        target: "aula",
        effect: () => addReputation(1),
      },
      {
        label: "Zurück in die Aula",
        target: "aula",
      },
    ],
  },
  reinigung: {
    title: "Reinigungsteam: Nachtschicht",
    text:
      "Eine freundliche Reinigungskraft winkt. \"Ihr seid doch von der Projektwoche?\" " +
      "Sie kennt die Regeln und möchte keinen Ärger. Vielleicht kannst du sie überzeugen, dich rauszulassen.",
    choices: [
      {
        label: "Projekt zeigen und erklären, warum du drin bist",
        target: "reinigung",
        effect: () => addReputation(1),
        once: "talkedCleaning",
      },
      {
        label: "Nach dem Hausmeister fragen",
        target: "hausmeister",
      },
      {
        label: "Zurück in die Aula",
        target: "aula",
      },
    ],
  },
  lehrerzimmer: {
    title: "Lehrerzimmer: Der heilige Raum",
    text:
      "Du schleichst rein. Auf dem Tisch liegen Vertretungspläne und ein Schlüsselbrett. " +
      "Eine Notiz: \"Bitte den Schlüssel für den Hintereingang bei der Schulleitung abholen.\"",
    choices: [
      {
        label: "Vertretungsplan fotografieren",
        target: "lehrerzimmer",
        effect: () => addItem("Vertretungsplan"),
        once: "gotPlan",
      },
      {
        label: "Schlüsselbrett checken",
        target: "schluesselbrett",
      },
      {
        label: "Zurück in den Flur",
        target: "flur",
      },
    ],
  },
  schluesselbrett: {
    title: "Schlüsselbrett: Fast Jackpot",
    text:
      "Die meisten Schlüssel sind weg. Übrig ist nur ein alter Spindschlüssel mit der Aufschrift \"A-Gang\". " +
      "Vielleicht gibt's dort was?",
    choices: [
      {
        label: "Spindschlüssel nehmen",
        target: "schluesselfund",
        effect: () => addItem("Spindschlüssel"),
        once: "gotLockerKey",
      },
      {
        label: "Nicht anfassen, sonst Stress",
        target: "lehrerzimmer",
        effect: () => addReputation(1),
      },
    ],
  },
  schluesselfund: {
    title: "A-Gang: Spind-Quest",
    text:
      "Der A-Gang ist still. Du findest den Spind mit dem passenden Schloss. Darin: eine Warnweste und ein Plan vom Schulgelände.",
    choices: [
      {
        label: "Warnweste anziehen (sieht offiziell aus)",
        target: "schluesselfund",
        effect: () => addItem("Warnweste"),
        once: "gotVest",
      },
      {
        label: "Geländeplan nehmen",
        target: "schluesselfund",
        effect: () => addItem("Geländeplan"),
        once: "gotMap",
      },
      {
        label: "Zurück in den Flur",
        target: "flur",
      },
    ],
  },
  sporthalle: {
    title: "Sporthalle: Hallenlicht & Echo",
    text:
      "Die Sporthalle riecht nach Gummi und Turnbeutel. Der Notausgang ist da, aber abgeschlossen. " +
      "An der Wand hängt ein Schild: \"Notausgang nur mit Hausmeister-Freigabe\".",
    choices: [
      {
        label: "Mit Hausmeister-Ausweis versuchen",
        target: "notausgang",
        requires: ["Hausmeister-Ausweis"],
      },
      {
        label: "Mit Schulordnung argumentieren, dass du raus musst",
        target: "notausgang",
        requires: ["Schulordnung"],
      },
      {
        label: "Leise zurück in den Flur",
        target: "flur",
      },
    ],
  },
  notausgang: {
    title: "Notausgang: Entscheidung",
    text:
      "Du stehst vor der Tür. Wenn du jetzt rausgehst, endet das Abenteuer. " +
      "Bist du bereit?",
    choices: [
      {
        label: "Tür öffnen und raus in die Nacht",
        target: "ending_escape",
      },
      {
        label: "Zurück – ich will noch die Schulleitung finden",
        target: "flur",
      },
    ],
  },
  hausmeister: {
    title: "Hausmeister-Story",
    text:
      "Die Reinigungskraft erzählt, der Hausmeister checkt gerade den Hintereingang. " +
      "Wenn du ihn findest und deinen Fall sauber erklärst, lässt er dich vielleicht raus.",
    choices: [
      {
        label: "Zum Hintereingang schleichen",
        target: "hintereingang",
      },
      {
        label: "Erst mehr Infos im Sekretariat holen",
        target: "sekretariat",
      },
      {
        label: "Zurück in die Aula",
        target: "aula",
      },
    ],
  },
  sekretariat: {
    title: "Sekretariat: Das Nervenlevel",
    text:
      "Im Sekretariat leuchtet noch ein Monitor. Ein Post-it: \"Notfallnummer Schulleitung im Handy\". " +
      "Du siehst eine Liste mit Projektnamen und Teamleitungen.",
    choices: [
      {
        label: "Notfallnummer ins Handy speichern",
        target: "sekretariat",
        effect: () => addItem("Notfallnummer"),
        once: "gotNumber",
      },
      {
        label: "Projektliste checken (für Argumente)",
        target: "sekretariat",
        effect: () => addItem("Projektliste"),
        once: "gotProjects",
      },
      {
        label: "Zum Hintereingang",
        target: "hintereingang",
      },
    ],
  },
  hintereingang: {
    title: "Hintereingang: Gespräch",
    text:
      "Der Hausmeister steht da, Werkzeugtasche in der Hand. \"Wer bist du und warum bist du noch hier?\"",
    choices: [
      {
        label: "Ehrlich erklären + Projektliste zeigen",
        target: "ending_official",
        requires: ["Projektliste"],
        effect: () => addReputation(2),
      },
      {
        label: "Offiziell wirken mit Warnweste & Ausweis",
        target: "ending_official",
        requires: ["Warnweste", "Hausmeister-Ausweis"],
        effect: () => addReputation(1),
      },
      {
        label: "Ruf die Notfallnummer an",
        target: "ending_call",
        requires: ["Notfallnummer"],
      },
      {
        label: "Zurück in den Flur",
        target: "flur",
      },
    ],
  },
  flur: {
    title: "Hauptflur: Nebel der Möglichkeiten",
    text:
      "Der Flur wirkt ewig. Links die Aula, rechts der A-Gang. Vorn das Lehrerzimmer, hinten die Sporthalle.",
    choices: [
      { label: "Zur Aula", target: "aula" },
      { label: "Lehrerzimmer", target: "lehrerzimmer" },
      { label: "Sporthalle", target: "sporthalle" },
      { label: "Sekretariat", target: "sekretariat" },
    ],
  },
  ending_escape: {
    title: "Ending: Freigang",
    text:
      "Du schiebst die Tür auf, kalte Luft und Freiheit. Du hast es geschafft, ohne Drama. " +
      "Morgen erzählst du die Story – vielleicht wird sie ein Running Gag der Projektwoche.",
    choices: [{ label: "Nochmal spielen", target: "intro", reset: true }],
  },
  ending_official: {
    title: "Ending: Offiziell entlassen",
    text:
      "Der Hausmeister nickt. \"Okay, wir machen das sauber.\" Er öffnet den Hintereingang. " +
      "Du gehst mit erhobenem Kopf raus – Ruf +1.",
    choices: [{ label: "Nochmal spielen", target: "intro", reset: true }],
  },
  ending_call: {
    title: "Ending: Schulleitung am Telefon",
    text:
      "Die Schulleitung geht ran, etwas müde, aber verständnisvoll. " +
      "Du bekommst eine offizielle Entlassung – und einen freundlichen Reminder für das nächste Mal.",
    choices: [{ label: "Nochmal spielen", target: "intro", reset: true }],
  },
};

function addItem(item) {
  state.inventory.add(item);
  log(`Item erhalten: ${item}`);
}

function addReputation(amount) {
  state.reputation += amount;
  log(`Ruf ${amount > 0 ? "+" : ""}${amount}`);
}

function adjustCourage(amount) {
  state.courage += amount;
  log(`Mut ${amount > 0 ? "+" : ""}${amount}`);
}

function log(message) {
  const entry = document.createElement("li");
  entry.textContent = message;
  logEl.prepend(entry);
}

function updateStats() {
  courageEl.textContent = state.courage;
  reputationEl.textContent = state.reputation;
  statusText.textContent = state.courage <= 1 ? "Nervös" : "Wachsam";
}

function renderInventory() {
  inventoryEl.innerHTML = "";
  if (state.inventory.size === 0) {
    const li = document.createElement("li");
    li.textContent = "Noch nix eingesackt.";
    inventoryEl.appendChild(li);
    return;
  }
  state.inventory.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    inventoryEl.appendChild(li);
  });
}

function renderScene(id) {
  const scene = scenes[id];
  state.location = id;
  sceneTitle.textContent = scene.title;
  sceneText.textContent = scene.text;
  choicesEl.innerHTML = "";

  scene.choices.forEach((choice) => {
    if (choice.once && state.flags[choice.once]) {
      return;
    }

    const button = document.createElement("button");
    button.className = "choice";
    button.textContent = choice.label;

    if (choice.requires) {
      const hasAll = choice.requires.every((req) => state.inventory.has(req));
      if (!hasAll) {
        button.disabled = true;
        button.textContent = `${choice.label} (fehlt: ${choice.requires.join(", ")})`;
      }
    }

    button.addEventListener("click", () => {
      if (choice.reset) {
        resetState();
      }

      if (choice.effect) {
        choice.effect();
      }

      if (choice.once) {
        state.flags[choice.once] = true;
      }

      if (choice.target) {
        renderScene(choice.target);
      }
    });

    choicesEl.appendChild(button);
  });

  updateStats();
  renderInventory();
}

function resetState() {
  state.courage = 3;
  state.reputation = 0;
  state.inventory = new Set();
  state.flags = {};
  logEl.innerHTML = "";
}

restartBtn.addEventListener("click", () => {
  resetState();
  renderScene("intro");
});

resetState();
renderScene("intro");
