// main.js — boot + event wiring
const TUTORIAL_STEPS = [
  {
    target: "storyPanel",
    text: "Hier bei Ort & Story findest du Infos zu deinem aktuellen Aufenthaltsort, NPCs und hilfreiche Spielmechaniken (Commands).",
    button: "Ok, verstanden"
  },
  {
    target: "mapPanel",
    text: "Die Ordnerkarte zeigt dir den Aufbau der Spielwelt als Verzeichnisbaum. So behältst du den Überblick.",
    button: "Okay"
  },
  {
    target: "objectivesPanel",
    text: "Unter Ziele siehst du, was als Nächstes wichtig ist. Das ist dein roter Faden durch die Story.",
    button: "Weiter"
  },
  {
    target: "rewardsPanel",
    text: "Bei Belohnungen sammelst du Abzeichen und Fortschritt. So siehst du, was du schon geschafft hast.",
    button: "Weiter"
  },
  {
    target: "terminalPanel",
    text: "Das Terminal ist dein Hauptwerkzeug im Spiel. Hier gibst du alle Befehle ein und steuerst deinen Fortschritt.",
    button: "Testen wirs aus"
  }
];

const TUTORIAL_TASKS = [
  { id:"ls_home", kind:"input", text:'Du bist in deinem Zimmer. Schaue dich mal um und mache dich mit deiner Umgebung vertraut. Tippe dazu "ls" in das Eingabefeld ein und bestätige deine Eingabe mit der Entertaste auf der Tastatur oder mit dem "Run" Knopf rechts.' },
  { id:"cd_backpack", kind:"output", text:'In der Ausgabe erkennst du Ordner an einem Slash (/) und Dateien ohne Slash (z.B. readme.txt). Wechsle jetzt mit "cd backpack/" in den Ordner.' },
  { id:"ls_backpack", kind:"input", text:'Super. Schau dich auch hier mit "ls" um.' },
  { id:"cat_snack", kind:"output", text:'Mit "cat" kannst du Dateien lesen bzw. mit Gegenständen interagieren. Probier das mit der Datei hier im Ordner aus. Geben dazu "cat snack.txt" ein.' },
  { id:"cd_up", kind:"input", text:'Du kannst mit "cd .." eine Ebene nach oben gehen. Probier das jetzt aus.' },
  { id:"final", kind:"input", text:'Sehr gut! Viel Erfolg im Spiel 🎉 Lies jetzt mit "cat readme.txt" weiter und leg los. Falls du später festhängst: Oben rechts im Terminal hilft dir der 📎 Clippy Helfer mit einer Schritt-für-Schritt-Lösung zur nächsten Mainquest.' }
];

const CLIPPY_COOLDOWN_MS = 5 * 60 * 1000;

let clippyHelper = {
  open:false,
  objectiveTitle:"",
  key:""
};

const CLIPPY_SOLUTION_GUIDES = {
  tutorial:[
    "1) Starte in /home/player und tippe nacheinander: ls, cd backpack/, ls, cat snack.txt, cd .., cat readme.txt.",
    "2) Warum genau so? Erst verschaffst du dir Überblick (ls), dann wechselst du kontrolliert in den Ordner (cd), dann liest du Hinweise (cat).",
    "3) Nach cat readme.txt wird die Quest als erledigt erkannt. Prüfe zur Sicherheit mit quests."
  ],
  iserv:[
    "1) Wechsle in die Schule und in den PC-Raum: cd /school/pcraum/Schul-PC.",
    "2) Lies die Glitch-Datei: cat iserv-glitch.txt.",
    "3) Warum? Diese Datei setzt den Story-Flag für die Quest. Danach quests ausführen und prüfen, ob die nächste Quest offen ist."
  ],
  keycard:[
    "1) Bleib im Bereich /school/pcraum und liste Dateien: ls.",
    "2) Lies die verdächtige Datei: cat keycard.txt.",
    "3) Die Keycard landet dadurch im Inventar/Status. Kontrolliere mit quests oder inventory."
  ],
  gate:[
    "1) Lies zuerst die Quelle des Codes (typisch keycard/notiz).",
    "2) Öffne das Gate exakt mit unlock <CODE> (Groß/Kleinschreibung beachten).",
    "3) Verifiziere den Fortschritt mit quests. Bei Fehlern: Code 1:1 kopieren, keine Extra-Leerzeichen."
  ],
  frag1:[
    "1) Gehe in den Bereich mit Logs und suche den Marker: grep -n TOKEN <datei>.",
    "2) Wenn Dateiname unklar ist: find <ordner> -name \"*.log\" und dann grep erneut.",
    "3) Sobald der Marker erkannt wurde, ist Fragment #1 erledigt. Mit inventory/quests bestätigen."
  ],
  frag2:[
    "1) Erstelle die Workbench-Struktur: mkdir ~/workbench (falls noch nicht da).",
    "2) Erstelle die benötigte Datei: touch ~/workbench/<ziel>.",
    "3) Lies sie einmal mit cat, damit du sicher im richtigen Pfad bist. Danach quests prüfen."
  ],
  frag3:[
    "1) Finde die Datei mit Signal-Hinweis: find <bereich> -name \"*.txt\" (oder *.log).",
    "2) Suche gezielt: grep -n SIGNAL <datei>.",
    "3) Bei Treffer Queststatus mit quests aktualisieren/prüfen."
  ],
  assemble:[
    "1) Prüfe Voraussetzungen: inventory (alle 3 Fragmente müssen da sein).",
    "2) Wechsle in die Workbench: cd ~/workbench.",
    "3) Führe assemble aus. Danach sollte die Quest abgeschlossen sein."
  ],
  locate:[
    "1) Suche im Boss-Bereich: find /boss -name \"*.sh\".",
    "2) Identifiziere das Patchlord-Script und lies es mit cat.",
    "3) Sobald das Script lokalisiert wurde, springt die Quest auf erledigt."
  ],
  bug:[
    "1) Lass dir Zeilenummern anzeigen: grep -n <marker> /boss/<script>.sh.",
    "2) Merke dir die fehlerhafte Zeile (Nummer + Inhalt).",
    "3) Danach quests prüfen: 'Bug-Zeile identifizieren' sollte erledigt sein."
  ],
  hotfix:[
    "1) Kopiere das Original in deine Workbench: cp /boss/<script>.sh ~/workbench/patchlord.sh.",
    "2) Ergänze den Fix markerbasiert per echo >> ~/workbench/patchlord.sh.",
    "3) Kontrolliere mit cat ~/workbench/patchlord.sh, dann quests."
  ],
  chmod:[
    "1) In die Workbench wechseln: cd ~/workbench.",
    "2) Script ausführbar machen: chmod +x patchlord.sh.",
    "3) Überprüfen mit ls -l patchlord.sh (x-Recht muss sichtbar sein)."
  ],
  boss:[
    "1) Starte das gefixte Script: ./patchlord.sh <token1> <token2> ... (laut Quest-Hinweis).",
    "2) Bei Fehlern zuerst Tokens und Reihenfolge prüfen.",
    "3) Nach erfolgreichem Lauf quests ausführen; Bossfight muss als erledigt erscheinen."
  ],
  report:[
    "1) Geh ins Sekretariat: cd /school/sekretariat.",
    "2) Starte Dialog: talk harries oder talk pietsch.",
    "3) Danach quests prüfen, ob Zeugnis-Quest abgeschlossen wurde."
  ],
  lagfix:[
    "1) Prozesse prüfen: ps oder top.",
    "2) CPU-Fresser identifizieren und gezielt beenden: kill <PID>.",
    "3) Zurück zu Noah: talk noah, dann quests prüfen."
  ],
  emma:[
    "1) Verlauf anzeigen: history.",
    "2) Relevanten fehlerhaften Command identifizieren.",
    "3) Mit Emma sprechen: talk emma, anschließend quest-check via quests."
  ],
  leo:[
    "1) Alias anlegen: alias <kurz>=\"<langer_befehl>\".",
    "2) Alias testen durch Eingabe des Kurznamens.",
    "3) Mit Leo sprechen: talk leo."
  ],
  mentor_clear:[
    "1) Stelle sicher, dass Noah/Emma/Leo fertig sind (quests).",
    "2) Führe mentor_clear aus.",
    "3) Kontrolliere den Abschluss erneut mit quests."
  ],
  arbeitsamt:[
    "1) Wechsle in den neuen Ort: cd /arbeitsamt.",
    "2) Lies Einstieg: cat start.txt (falls vorhanden) und talk beamter.",
    "3) Danach wird der Job-Arc gestartet."
  ],
  beamter:[
    "1) Gespräch öffnen: talk beamter.",
    "2) Notiere die Firmenziele aus dem Dialog.",
    "3) Mit quests verifizieren, welche Firma als Nächstes offen ist."
  ],
  snackmaster:[
    "1) In die Firma: cd /real_life/snackmaster und cat quest.txt.",
    "2) Audit-Log untersuchen (cat/grep -n) und Marker zur Allergene-Zeile finden.",
    "3) Abschluss triggern mit talk jansen."
  ],
  ars:[
    "1) In A-R-S: cd /real_life/ars und quest.txt lesen.",
    "2) Zieldatei finden und in ~/workbench kopieren (cp).",
    "3) Dann talk wiebe für Quest-Abschluss."
  ],
  ohlendorf:[
    "1) Ticket in Workbench holen: cp <quelle> ~/workbench/.",
    "2) Rechte prüfen/anpassen: ls -l + chmod <modus> <datei>.",
    "3) Datei lesen und mit talk neele abschließen."
  ],
  berndt:[
    "1) Performance prüfen: ps/top.",
    "2) Problemprozess mit kill <PID> beenden.",
    "3) Bei Tom melden: talk tom."
  ],
  cms:[
    "1) Struktur anlegen: mkdir -p ~/workbench/cms/... (alle Gewerke).",
    "2) Codes sammeln und per echo in Berichte + uebersicht.txt schreiben.",
    "3) Finale Abgabe bei Holger: talk holger."
  ],
  jobangebot:[
    "1) Sicherstellen, dass alle Firmenquests erledigt sind (quests).",
    "2) Zurück zum Arbeitsamt: cd /arbeitsamt.",
    "3) Abschlussgespräch: talk beamter (Jobangebot triggern)."
  ]
};

function inferQuestKey(title){
  const t = String(title||"").toLowerCase();
  if(t.includes("tutorial")) return "tutorial";
  if(t.includes("keycard")) return "keycard";
  if(t.includes("server-gate")) return "gate";
  if(t.includes("fragment #1")) return "frag1";
  if(t.includes("fragment #2")) return "frag2";
  if(t.includes("fragment #3")) return "frag3";
  if(t.includes("reality")) return "assemble";
  if(t.includes("patchlord lokalisieren")) return "locate";
  if(t.includes("bug")) return "bug";
  if(t.includes("hotfix")) return "hotfix";
  if(t.includes("ausführbar")) return "chmod";
  if(t.includes("bossfight")) return "boss";
  if(t.includes("iserv-glitch")) return "iserv";
  if(t.includes("zeugnis abholen")) return "report";
  if(t.includes("noah")) return "lagfix";
  if(t.includes("emma")) return "emma";
  if(t.includes("leo")) return "leo";
  if(t.includes("mentor-run") || t.includes("squad geholfen")) return "mentor_clear";
  return "quest";
}

function getCurrentMainObjective(){
  const list = OBJECTIVES.filter((o)=>Number(o.phase) === Number(state.phase));
  return list.find((o)=>!o.done(state)) || null;
}

function buildClippyText(objective){
  if(!objective) return "Stark! In dieser Phase ist keine Mainquest mehr offen. Schau mit quests, ob der nächste Abschnitt bereit ist.";
  const key = objective.key || inferQuestKey(objective.title);
  const steps = CLIPPY_SOLUTION_GUIDES[key] || [
    "1) Öffne quests und lies die aktuelle Hint-Zeile exakt.",
    "2) Nutze help - <questkey> und arbeite die Hinweise in der Reihenfolge Ort -> Datei -> Aktion ab.",
    "3) Prüfe nach jedem Schritt mit quests, ob die Quest als erledigt markiert wurde."
  ];
  return [
    `📎 Clippy Helfer – Musterlösung für: ${objective.title}`,
    "",
    `Quest-Hint: ${objective.hint}`,
    "",
    ...steps,
    "",
    "Warum diese Reihenfolge? So minimierst du Fehlversuche: erst Orientierung (Ort/Datei), dann exakte Aktion, dann Verifikation (quests)."
  ].join("\n");
}

function isClippyOnCooldown(){
  const last = Number(state?.clippy?.lastUsedAt || 0);
  return last > 0 && (Date.now() - last) < CLIPPY_COOLDOWN_MS;
}

function updateClippyAvailabilityUI(){
  const btn = el("clippyBtn");
  const status = el("clippyStatus");
  if(!btn || !status) return;

  const cooldownActive = isClippyOnCooldown();
  btn.classList.toggle("cooldownActive", cooldownActive);
  btn.setAttribute("aria-disabled", cooldownActive ? "true" : "false");

  status.classList.remove("ready", "cooldown");
  if(cooldownActive){
    status.textContent = "Clippy ist auf Cooldown (5 Minuten).";
    status.classList.add("cooldown");
  }else{
    status.textContent = "Clippy bereit zum Helfen.";
    status.classList.add("ready");
  }
}

function startClippyCooldown(){
  if(!state.clippy) state.clippy = { lastUsedAt:0 };
  state.clippy.lastUsedAt = Date.now();
  saveState();
  updateClippyAvailabilityUI();
}

function placeClippyTooltip(){
  const btn = el("clippyBtn");
  const bubble = el("clippyTooltip");
  if(!btn || !bubble || bubble.hidden) return;
  const rect = btn.getBoundingClientRect();
  const top = Math.min(window.innerHeight - bubble.offsetHeight - 12, Math.max(12, rect.bottom + 8));
  const left = Math.min(window.innerWidth - bubble.offsetWidth - 12, Math.max(12, rect.right - bubble.offsetWidth));
  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
}

function closeClippyTooltip(){
  const bubble = el("clippyTooltip");
  if(!bubble) return;
  bubble.hidden = true;
  bubble.style.top = "";
  bubble.style.left = "";
  clippyHelper.open = false;
  clippyHelper.objectiveTitle = "";
  clippyHelper.key = "";
}

function maybeCloseClippyOnQuestProgress(){
  if(!clippyHelper.open) return;
  const objective = getCurrentMainObjective();
  if(!objective || objective.title !== clippyHelper.objectiveTitle){
    closeClippyTooltip();
  }
}

function openClippyTooltip(){
  const bubble = el("clippyTooltip");
  const text = el("clippyText");
  const objective = getCurrentMainObjective();
  if(!bubble || !text) return;

  if(!objective){
    text.textContent = buildClippyText(null);
    bubble.hidden = false;
    clippyHelper.open = true;
    requestAnimationFrame(placeClippyTooltip);
    return;
  }

  const key = objective.key || inferQuestKey(objective.title);
  clippyHelper.open = true;
  clippyHelper.objectiveTitle = objective.title;
  clippyHelper.key = key;
  text.textContent = buildClippyText(objective);
  bubble.hidden = false;
  requestAnimationFrame(placeClippyTooltip);
}

let gameStarted = false;
let guidedTutorial = {
  active:false,
  panelStep:0,
  taskStep:0
};
let bootLoadSource = "Autosave";

function startNewGuidedGame(){
  doReset(false);
  state.flags.booted = true;
  bootLoadSource = "Guided";
  if(!state.startedAt) state.startedAt = now();
  saveState();
  boot();
  startGuidedTutorial();
}

function startGuidedTutorial(){
  guidedTutorial.active = true;
  guidedTutorial.panelStep = 0;
  guidedTutorial.taskStep = 0;
  showPanelTutorialStep();
}

function endGuidedTutorial(){
  guidedTutorial.active = false;
  hideTutorialBubble();
  clearTutorialFocus();
  const overlay = el("tutorialOverlay");
  overlay.hidden = true;
}

function clearTutorialFocus(){
  ["storyPanel","mapPanel","objectivesPanel","rewardsPanel","terminalPanel","cmd","term"].forEach((id)=>{
    const node = el(id);
    if(node){
      node.classList.remove("tutorialFocus");
      node.classList.remove("tutorialInputFocus");
    }
  });
}

function placeBubbleAt(targetEl, opts={}){
  const bubble = el("tutorialBubble");
  const rect = targetEl.getBoundingClientRect();
  const topOffset = Number(opts.topOffset || 8);
  const top = Math.min(window.innerHeight - bubble.offsetHeight - 12, Math.max(12, rect.top + topOffset));
  const left = Math.min(window.innerWidth - bubble.offsetWidth - 12, Math.max(12, rect.right + 12));
  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
}

function showTutorialBubble(text, buttonText, onClick, opts={}){
  const overlay = el("tutorialOverlay");
  const bubble = el("tutorialBubble");
  overlay.hidden = false;
  bubble.hidden = false;
  el("tutorialText").textContent = text;
  const btn = el("tutorialBtn");
  const showButton = Boolean(opts.showButton !== false);
  btn.hidden = !showButton;
  if(showButton){
    btn.textContent = buttonText || "Weiter";
    btn.onclick = onClick || null;
  }else{
    btn.onclick = null;
  }
}

function hideTutorialBubble(){
  const bubble = el("tutorialBubble");
  bubble.hidden = true;
  bubble.style.top = "";
  bubble.style.left = "";
}

function showPanelTutorialStep(){
  clearTutorialFocus();
  const step = TUTORIAL_STEPS[guidedTutorial.panelStep];
  if(!step){
    hideTutorialBubble();
    clearTutorialFocus();
    showTaskTutorialStep();
    return;
  }
  const target = el(step.target);
  if(!target){
    guidedTutorial.panelStep += 1;
    showPanelTutorialStep();
    return;
  }
  target.classList.add("tutorialFocus");
  showTutorialBubble(step.text, step.button, ()=>{
    guidedTutorial.panelStep += 1;
    showPanelTutorialStep();
  });
  requestAnimationFrame(()=>placeBubbleAt(target));
}

function showTaskTutorialStep(){
  clearTutorialFocus();
  const task = TUTORIAL_TASKS[guidedTutorial.taskStep];
  if(!task){
    endGuidedTutorial();
    return;
  }

  const terminalPanel = el("terminalPanel");
  if(terminalPanel){
    terminalPanel.classList.add("tutorialFocus");
  }

  if(task.kind === "input"){
    el("cmd").classList.add("tutorialInputFocus");
    showTutorialBubble(task.text, "Weiter", null, { showButton:false });
    const topOffset = (task.id === "ls_home" || task.id === "ls_backpack") ? 40 : 8;
    requestAnimationFrame(()=>placeBubbleAt(el("cmd"), { topOffset }));
  } else {
    el("term").classList.add("tutorialInputFocus");
    showTutorialBubble(task.text, "Weiter", null, { showButton:false });
    requestAnimationFrame(()=>placeBubbleAt(el("term")));
  }
}

function getGuidedTutorialBlockMessage(segment){
  if(!guidedTutorial.active) return "";
  const s = String(segment||"").trim();
  if(!s) return "";

  if(guidedTutorial.panelStep < TUTORIAL_STEPS.length){
    return "Noch nicht junger Padawan, halte dich an die Einführung!";
  }

  const task = TUTORIAL_TASKS[guidedTutorial.taskStep];
  if(!task) return "";

  const expectedByTask = {
    ls_home: ["ls"],
    cd_backpack: ["cd backpack", "cd backpack/"],
    ls_backpack: ["ls"],
    cat_snack: ["cat snack.txt"],
    cd_up: ["cd .."],
    final: ["cat readme.txt"]
  };
  const expected = expectedByTask[task.id] || [];
  if(expected.includes(s)) return "";
  return "Noch nicht junger Padawan, halte dich an die Einführung!";
}

function checkTutorialCommand(segment){
  if(!guidedTutorial.active) return;
  const s = String(segment||"").trim();
  const task = TUTORIAL_TASKS[guidedTutorial.taskStep];
  if(!task) return;

  let ok = false;
  if(task.id === "ls_home") ok = s === "ls";
  if(task.id === "cd_backpack") ok = (s === "cd backpack" || s === "cd backpack/");
  if(task.id === "ls_backpack") ok = s === "ls";
  if(task.id === "cat_snack") ok = (s === "cat snack.txt");
  if(task.id === "cd_up") ok = s === "cd ..";
  if(task.id === "final") ok = s === "cat readme.txt";

  if(ok){
    guidedTutorial.taskStep += 1;
    showTaskTutorialStep();
  }
}

function boot(){
  gameStarted = true;
  promptEl.textContent = promptText();
  renderLocation();
  renderObjectives();
  renderRewards();
  renderSidequestPanel();
  renderPhasePill();
  maybeCloseClippyOnQuestProgress();
  updateClippyAvailabilityUI();

  try{ renderHeaderSub(); }catch(e){}

  const ps = document.getElementById("printStatus");
  if(ps){
    if(state.flags && state.flags.system_fixed){
      ps.textContent = "✅ Druckdienste online — Zeugnisse verfügbar.";
      ps.classList.remove("warnInline");
      ps.classList.add("okInline");
    } else {
      ps.textContent = "⚠️ Wegen eines System-Glitches können aktuell keine Zeugnisse gedruckt werden.";
      ps.classList.remove("okInline");
      ps.classList.add("warnInline");
    }
  }

  if(!state.processes || !state.processes.length){
    state.processes = [
      { pid: 101, name: "terminald", cpu: 3, mem: 42 },
      { pid: 202, name: "rgbd", cpu: 99, mem: 180 },
      { pid: 303, name: "patchwatch", cpu: 5, mem: 65 },
    ];
    saveState();
  }

  if(!state.flags.booted){
    state.flags.booted = true;
    if(!state.startedAt){
      state.startedAt = now();
      state.flags.escaped = false;
    }
    saveState();
    intro();
    row("Mini-Tipp: help zeigt deine freigeschalteten Commands.", "p");
    row("Mini-Tipp 2: quests ist dein Quest-Tracker.", "p");
  }else{
    if(bootLoadSource === "Guided"){
      if(typeof guidedIntro === "function"){
        guidedIntro();
      }
      bootLoadSource = "Autosave";
      progressPhaseIfReady();
      return;
    }
    rowHtml(`<span class="p">[${escapeHtml(now())}] ${escapeHtml(bootLoadSource)} geladen. Tipp: <span class="kbd">quests</span></span>`);
    bootLoadSource = "Autosave";
    progressPhaseIfReady();
  }
}

function showStartModal(){
  const overlay = el("startOverlay");
  overlay.hidden = false;
  const autoBtn = el("startAutosave");
  autoBtn.disabled = !hasAutosave();
}

function closeStartModal(){
  el("startOverlay").hidden = true;
}

el("startNew").addEventListener("click", ()=>{
  closeStartModal();
  startNewGuidedGame();
});

el("startAutosave").addEventListener("click", ()=>{
  closeStartModal();
  if(!hasAutosave()){
    doReset(false);
  }
  bootLoadSource = "Autosave";
  boot();
});

el("startSavegame").addEventListener("click", ()=>{
  el("savegameLoad").hidden = false;
  el("savegameLoadError").textContent = "";
  el("savegamePassphrase").focus();
});

el("savegameCancel").addEventListener("click", ()=>{
  el("savegameLoad").hidden = true;
  el("savegameLoadError").textContent = "";
});

el("savegameConfirm").addEventListener("click", ()=>{
  const pass = el("savegamePassphrase").value;
  const result = loadStateFromPassphrase(pass);
  if(!result.ok){
    el("savegameLoadError").textContent = result.error;
    return;
  }
  closeStartModal();
  el("savegameLoad").hidden = true;
  bootLoadSource = "Savegame";
  boot();
});

el("clippyBtn").addEventListener("click", ()=>{
  if(clippyHelper.open){
    closeClippyTooltip();
    return;
  }
  if(isClippyOnCooldown()){
    updateClippyAvailabilityUI();
    return;
  }
  openClippyTooltip();
  startClippyCooldown();
});

el("clippyOk").addEventListener("click", ()=>{
  closeClippyTooltip();
});

window.addEventListener("resize", ()=>{
  placeClippyTooltip();
});

window.addEventListener("schwarmshell:state-updated", ()=>{
  maybeCloseClippyOnQuestProgress();
});

el("run").addEventListener("click", ()=>{
  const v = cmdInput.value;
  cmdInput.value = "";
  runLine(v);
});
el("reset").addEventListener("click", ()=>doReset(true));
el("savegame").addEventListener("click", ()=>{
  const phrase = createSavePassphrase();
  row("🔐 Savegame-Passphrase erstellt. Notiere sie dir, um später an exakt dieser Stelle weiterzumachen:", "ok");
  row(phrase, "p");
});

cmdInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    const v = cmdInput.value;
    cmdInput.value = "";
    runLine(v);
    e.preventDefault();
    return;
  }
  if(e.key === "ArrowUp"){
    const i = clamp(state.historyIndex + 1, 0, state.lastCmds.length);
    state.historyIndex = i;
    cmdInput.value = state.lastCmds[i-1] || cmdInput.value;
    e.preventDefault();
    saveState();
    return;
  }
  if(e.key === "ArrowDown"){
    const i = clamp(state.historyIndex - 1, 0, state.lastCmds.length);
    state.historyIndex = i;
    cmdInput.value = state.lastCmds[i-1] || "";
    e.preventDefault();
    saveState();
    return;
  }
  if(e.key === "Tab"){
    const auto = autocomplete(cmdInput.value);
    if(auto) cmdInput.value = auto;
    e.preventDefault();
    return;
  }
});

showStartModal();

// --- UI/State Helpers (Refactor light) ---
function commitUI(opts={}){
  const o = Object.assign({ loc:true, obj:true, rewards:true, phase:true }, opts||{});
  saveState();
  try{ if(o.phase) renderPhasePill(); }catch(e){}
  try{ if(o.phase) renderHeaderSub(); }catch(e){}
  try{ if(o.loc) renderLocation(); }catch(e){}
  try{ if(o.obj) renderObjectives(); }catch(e){}
  try{ if(o.rewards) renderRewards(); }catch(e){}
  try{ if(o.rewards) renderSidequestPanel(); }catch(e){}
  try{ updateClippyAvailabilityUI(); }catch(e){}

  try{
    const base = allowedCommands();
    return base.filter(c=>COMMAND_REGISTRY[c]);
  }catch(e){
    return [];
  }
}

function renderHeaderSub(){
  const elSub = document.getElementById("headerSub");
  if(!elSub) return;
  if(!elSub.dataset.defaultHtml){
    elSub.dataset.defaultHtml = elSub.innerHTML;
  }

  if(Number(state.phase) >= 5){
    elSub.innerHTML = [
      "Schule fertig. Ab zur Arbeit: regel dein eigenes Leben — und guck mal, ob dir Schule überhaupt was gebracht hat. 😎 ",
      "Tipp: <span class=\"kbd\">help</span> · <span class=\"kbd\">quests</span>"
    ].join("");
  }else{
    elSub.innerHTML = elSub.dataset.defaultHtml;
  }
}

function setPhase(n){
  state.phase = Math.max(1, Math.min(99, Number(n)||1));
  commitUI({ phase:true, loc:true, obj:true, rewards:true });
}

function unlockSidequestWinkelmann(){
  if(!state.sidequest) state.sidequest = { unlocked:false };
  state.sidequest.unlocked = true;
  commitUI({ rewards:true, obj:true, loc:true, phase:false });
}

function sanityCheckNPCs(){
  try{
    const roomMap = {};
    for(const [id,n] of Object.entries(NPCS)){
      if(!n || !n.name || !n.at) continue;
      const nm = (n.name||"").trim().toLowerCase();
      for(const room of n.at){
        roomMap[room] = roomMap[room] || {};
        roomMap[room][nm] = (roomMap[room][nm]||0) + 1;
      }
    }
    const dupRooms = Object.entries(roomMap)
      .filter(([room,counts])=>Object.values(counts).some(c=>c>1))
      .map(([room,counts])=>({room, dups:Object.entries(counts).filter(([k,c])=>c>1).map(([k,c])=>`${k}×${c}`)}));
    if(dupRooms.length){
      console.warn("[SchwarmShell] Duplicate NPC names in rooms:", dupRooms);
    }
  }catch(e){}

  try{
    const missing = [];
    for(const [id,n] of Object.entries(NPCS)){
      if(!n || !n.at) continue;
      for(const room of n.at){
        if(!FS || !FS[room]) missing.push({ npc:id, room });
      }
    }
    if(missing.length){
      console.warn("[SchwarmShell] Missing NPC rooms in FS (NPC will never appear there):", missing);
    }
  }catch(e){}
}

window.checkTutorialCommand = checkTutorialCommand;
window.getGuidedTutorialBlockMessage = getGuidedTutorialBlockMessage;

if(!window.__traceInterval){
  window.__traceInterval = setInterval(()=>{
    try{
      if(state.sidequest && state.sidequest.unlocked && state.netSession && state.netSession.active){
        const host = state.netSession.host;
        const k = (host==="gym-ost-core") ? "gym" : (host==="igs-edu-lab") ? "igs" : null;
        if(k){
          bumpTrace(k, 1);
          const tm = state.sidequest.traceMeter || {gym:0,igs:0};

          if((tm[k]||0) >= 100){
            if(!state.sidequest.alarm) state.sidequest.alarm = {gym:false,igs:false};
            state.sidequest.alarm[k] = true;
            state.sidequest.traces[k] = true;

            const kickedHost = state.netSession.host;
            state.netSession = { active:false, host:"", user:"", returnCwd:"" };
            state.cwd = "/superpc";

            row(`⚠️ TRACE ALARM (${kickedHost}): Du wurdest rausgekickt!`, "warn");
            row("Security-Sweep läuft… Wenn du weiter willst: logwipe (und diesmal stealth).", "warn");
          }

          saveState();
          renderRewards();
          renderSidequestPanel();
        }
      }
    }catch(e){}
  }, 1000);
}
