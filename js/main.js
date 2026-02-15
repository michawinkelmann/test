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
  { id:"final", kind:"input", text:'Sehr gut! Viel Erfolg im Spiel 🎉 Lies jetzt mit "cat readme.txt" weiter und leg los. Wenn du später bei einer Mainquest festhängst, nutze oben im Terminal (mittig links) den 📎 Clippy Helfer für eine Schritt-für-Schritt-Musterlösung.' }
];

let gameStarted = false;
let guidedTutorial = {
  active:false,
  panelStep:0,
  taskStep:0
};
let bootLoadSource = "Autosave";


const CLIPPY_SOLUTIONS = {
  tutorial: {
    subtitle:"Die allererste Orientierung in deinem Zimmer.",
    steps:[
      'Schau zuerst, wo du bist: tippe <code>pwd</code>. Du solltest in <code>/home/player</code> landen.',
      'Sieh dir den Raum an: <code>ls</code>. Achte auf <code>readme.txt</code>, weil dort der Start erklärt wird.',
      'Lies die Datei komplett: <code>cat readme.txt</code>. Damit wird die Tutorial-Quest abgeschlossen.',
      'Wenn du unsicher bist: nutze danach <code>quests</code>, um zu prüfen, dass das nächste Ziel aktiv ist.'
    ],
    hint:'Erklärung: Diese Quest trainiert den absoluten Bash-Basis-Loop „sehen → lesen → verstehen“.'
  },
  iserv: {
    subtitle:"Den Ursprung des Glitches finden.",
    steps:[
      'Wechsle in die Schule: <code>cd /school</code> und prüfe mit <code>ls</code>, welche Räume es gibt.',
      'Gehe gezielt in den PC-Raum: <code>cd pcraum</code> und sieh dich wieder mit <code>ls</code> um.',
      'Dort liegt der Schul-PC-Ordner: <code>cd Schul-PC</code>. Lies dann nacheinander die Dateien mit <code>cat boot.txt</code> und <code>cat iserv-glitch.txt</code>.',
      'Sobald der Glitch-Hinweis gelesen ist, kontrolliere mit <code>quests</code>, dass das Ziel abgeschlossen ist.'
    ],
    hint:'Erklärung: Du lernst hier „Ordnernavigation plus Informationsgewinn über Dateien“.'
  },
  keycard: { subtitle:"Zutrittstoken für das Gate besorgen.", steps:[ 'Bleib im Bereich <code>/school/pcraum</code> (oder gehe dorthin zurück).', 'Nutze <code>ls</code> und lies verdächtige Dateien mit <code>cat</code>, vor allem <code>keycard.txt</code>.', 'Wenn nötig: wiederhole den Befehl exakt als <code>cat /school/pcraum/keycard.txt</code>.', 'Prüfe mit <code>quests</code>, ob „KEYCARD besorgen“ auf erledigt steht.' ], hint:'Erklärung: Hier trainierst du sauberes Lesen von questrelevanten Dateien mit exakten Pfaden.' },
  gate: { subtitle:"Server-Gate korrekt entsperren.", steps:[ 'Gehe zum Gate: <code>cd /server_gate</code> und prüfe den Inhalt mit <code>ls</code>.', 'Lies zuerst alle Hinweise im Gate-Ordner mit <code>cat &lt;datei&gt;</code>, damit du den richtigen Code kennst.', 'Gib den Freischalt-Befehl exakt ein: <code>unlock &lt;code&gt;</code> (ohne Tippfehler).', 'Falls es fehlschlägt: Hinweisdatei erneut lesen und den Code 1:1 erneut eingeben.' ], hint:'Erklärung: Diese Quest übt präzises Arbeiten mit Kommando-Argumenten.' },
  frag1: { subtitle:"Erstes Fragment aus Logs extrahieren.", steps:[ 'Wechsle in den Netzwerkbereich: <code>cd /network</code> (oder den im Hinweis genannten Ort).', 'Suche relevante Dateien: <code>find . -name "*.log"</code> und lies Kandidaten mit <code>cat</code>.', 'Nutze gezielte Suche: <code>grep -n "FRAG" &lt;datei&gt;</code> oder Marker aus dem Quest-Hinweis.', 'Sichere/trigger das Fragment durch den im Text geforderten Folgeschritt und prüfe danach <code>inventory</code> + <code>quests</code>.' ], hint:'Erklärung: Muster „finden → filtern → gezielt lesen“.' },
  frag2: { subtitle:"Workbench-Struktur für Fragment #2 bauen.", steps:[ 'Gehe nach Hause: <code>cd /home/player</code>.', 'Erstelle falls nötig den Arbeitsbereich: <code>mkdir workbench</code>.', 'Lege die geforderte Datei an: <code>touch workbench/&lt;dateiname&gt;</code> (laut Quest-Hinweis).', 'Kontrolliere mit <code>ls workbench</code>, danach <code>quests</code>.' ], hint:'Erklärung: Diese Quest trainiert das Erzeugen von Ordnern/Dateien als Grundlage für spätere Patches.' },
  frag3: { subtitle:"Signaldatei finden und drittes Fragment sichern.", steps:[ 'Suche im genannten Bereich nach Signaldateien: <code>find / -name "*signal*"</code> oder enger nach Quest-Hinweis.', 'Lies Treffer mit <code>cat</code> und verifiziere die Markerzeile per <code>grep -n</code>.', 'Kopiere die relevante Datei in deine Workbench: <code>cp &lt;quelle&gt; ~/workbench/</code>, falls verlangt.', 'Prüfe den Fortschritt mit <code>quests</code> und <code>inventory</code>.' ], hint:'Erklärung: Hier kombinierst du globale Suche mit sauberem Sichern von Ergebnissen.' },
  assemble: { subtitle:"Alle Fragmente zu einem Patch kombinieren.", steps:[ 'Verifiziere zuerst in <code>inventory</code>, dass alle 3 Fragmente vorhanden sind.', 'Gehe in deine Workbench: <code>cd ~/workbench</code>.', 'Führe den Assemble-Befehl aus: <code>assemble</code>.', 'Bei Fehlern erst fehlende Fragmente nachholen; danach erneut <code>assemble</code> und mit <code>quests</code> prüfen.' ], hint:'Erklärung: „assemble“ ist der Crafting-Schritt, der mehrere Vorbedingungen zusammenführt.' },
  locate: { subtitle:"Patchlord-Script finden.", steps:[ 'Gehe in den Boss-Bereich: <code>cd /boss</code>.', 'Suche das Zielscript: <code>find . -name "*patchlord*.sh"</code>.', 'Bestätige Fund und Inhalt mit <code>cat &lt;script&gt;</code>.', 'Danach mit <code>quests</code> prüfen, dass „Patchlord lokalisieren“ abgeschlossen ist.' ], hint:'Erklärung: Fokus auf präzise Dateisuche nach Namensmustern.' },
  bug: { subtitle:"Fehlerzeile im Script mit Zeilennummer identifizieren.", steps:[ 'Nutze <code>grep -n "BUG" &lt;script&gt;</code> (alternativ Marker aus Hinweis).', 'Wenn kein Treffer: weitere typische Marker testen (<code>FIXME</code>, <code>TOKEN</code>).', 'Notiere die Zeilennummer aus der Ausgabe.', 'Lies das Script ggf. komplett mit <code>cat</code>, um den Kontext für den Hotfix zu verstehen.' ], hint:'Erklärung: Zeilennummern machen Fehlerbehebung reproduzierbar.' },
  hotfix: { subtitle:"Sicheres Patchen über Workbench-Kopie.", steps:[ 'Kopiere das Boss-Script in die Workbench: <code>cp /boss/patchlord.sh ~/workbench/patchlord.sh</code>.', 'Hänge die geforderte Korrekturzeile an: <code>echo "..." >> ~/workbench/patchlord.sh</code>.', 'Kontrolliere die Datei danach mit <code>cat ~/workbench/patchlord.sh</code>.', 'Wenn die Quest noch offen ist, exakt die verlangte Patch-Zeile erneut anfügen (ohne Tippfehler).' ], hint:'Erklärung: Originaldatei bleibt unverändert, du arbeitest revisionssicher auf einer Kopie.' },
  chmod: { subtitle:"Script ausführbar machen.", steps:[ 'Setze das Ausführrecht: <code>chmod +x ~/workbench/patchlord.sh</code>.', 'Starte testweise: <code>./workbench/patchlord.sh</code> oder nach <code>cd ~/workbench</code> mit <code>./patchlord.sh</code>.', 'Bei „Permission denied“: Pfad prüfen und chmod auf exakt dieselbe Datei erneut ausführen.', 'Anschließend mit <code>quests</code> den Haken prüfen.' ], hint:'Erklärung: Ohne Execute-Bit kann ein Script trotz korrektem Inhalt nicht laufen.' },
  boss: { subtitle:"Bossfight final ausführen.", steps:[ 'Stelle sicher, dass Hotfix + chmod bereits erledigt sind.', 'Wechsle in die Workbench und starte das Script mit den im Spiel geforderten Tokens/Argumenten.', 'Achte auf exakte Schreibweise und Reihenfolge der Argumente.', 'Wenn erfolgreich, Fortschritt mit <code>quests</code> bestätigen und zum nächsten Story-Schritt weitergehen.' ], hint:'Erklärung: Finale Quests prüfen vor allem Genauigkeit bei Argumenten.' }
};

function objectiveKeyFromTitle(title){
  const t = String(title||"").toLowerCase();
  if(t.includes("tutorial")) return "tutorial";
  if(t.includes("iserv")) return "iserv";
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
  return "quest";
}

function getCurrentMainObjective(){
  const list = OBJECTIVES.filter((o)=>o.phase===state.phase);
  return list.find((o)=>!o.done(state)) || null;
}

const CLIPPY_DIFFICULTY = {
  1: { label:"Stufe 1", desc:"nur Richtung", usageCost:1, cooldownMs:5 * 60 * 1000 },
  2: { label:"Stufe 2", desc:"nächster Command", usageCost:2, cooldownMs:8 * 60 * 1000 },
  3: { label:"Stufe 3", desc:"fast vollständige Lösung", usageCost:3, cooldownMs:12 * 60 * 1000 }
};

function normalizeClippyTemplate(template){
  const steps = Array.isArray(template?.steps) ? template.steps : [];
  const stage1 = template?.stages?.[1] || [steps[0] || 'Orientiere dich an Hinweis + Zielort und prüfe deinen Standort mit <code>pwd</code>.'];
  const stage2 = template?.stages?.[2] || [steps[1] || steps[0] || 'Nutze den nächsten passenden Einzelbefehl aus dem Quest-Hinweis.'];
  const stage3 = template?.stages?.[3] || (steps.length ? steps.slice(0, 4) : ['Folge dem Standardablauf: <code>pwd</code> → <code>ls</code> → <code>cat</code> → <code>quests</code>.']);
  const nextCommand = template?.nextCommand || ((stage2[0]||"").match(/<code>([^<]+)<\/code>/)||[])[1] || "quests";
  return {
    subtitle: template?.subtitle || "Hilfestellung zur aktuellen Mainquest.",
    hint: template?.hint || "Erklärung: Schrittweise vorgehen hilft bei der Fehlersuche.",
    steps,
    stages: { 1:stage1, 2:stage2, 3:stage3 },
    nextCommand
  };
}

Object.keys(CLIPPY_SOLUTIONS).forEach((k)=>{
  CLIPPY_SOLUTIONS[k] = normalizeClippyTemplate(CLIPPY_SOLUTIONS[k]);
});

function ensureClippyState(){
  if(!state.clippy || typeof state.clippy !== "object") state.clippy = { lastUsedAt: 0, usageCount: 0, weightedUsage: 0, difficulty: 1 };
  if(!Number.isFinite(Number(state.clippy.lastUsedAt))) state.clippy.lastUsedAt = 0;
  if(!Number.isFinite(Number(state.clippy.usageCount))) state.clippy.usageCount = 0;
  if(!Number.isFinite(Number(state.clippy.weightedUsage))) state.clippy.weightedUsage = 0;
  const d = Number(state.clippy.difficulty);
  state.clippy.difficulty = CLIPPY_DIFFICULTY[d] ? d : 1;
}

function getClippyDifficulty(){
  ensureClippyState();
  return Number(state.clippy.difficulty) || 1;
}

function getClippyCooldownRemainingMs(){
  ensureClippyState();
  const lastDiff = CLIPPY_DIFFICULTY[Number(state.clippy.lastDifficulty)] ? Number(state.clippy.lastDifficulty) : getClippyDifficulty();
  const cooldown = CLIPPY_DIFFICULTY[lastDiff].cooldownMs;
  const elapsed = Date.now() - Number(state.clippy.lastUsedAt || 0);
  return Math.max(0, cooldown - elapsed);
}

function formatCooldown(ms){
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function analyzeClippyMistake(key){
  const recent = Array.isArray(state.lastCmds) ? state.lastCmds.slice(0, 6).map((c)=>String(c||"").trim()).filter(Boolean) : [];
  const typo = recent.find((c)=>/^(sl|pdw|cta|unlok|ulock)\b/i.test(c));
  if(typo) return `Typischer Fehler erkannt: Tippfehler im Command <code>${escapeHtml(typo)}</code>.`;

  const wrongPath = recent.find((c)=>/^cd\s+\/(pcraum|Schul-PC|workbench)\b/i.test(c));
  if(wrongPath) return `Typischer Fehler erkannt: Wahrscheinlich falscher Pfad bei <code>${escapeHtml(wrongPath)}</code>.`;

  const questPatterns = {
    keycard: /cat\s+keycard\.txt$/i,
    gate: /unlock\s*$/i,
    hotfix: /echo\s+.+>>\s*\/boss\//i,
    chmod: /chmod\s+\+x\s+\/boss\//i
  };
  const pattern = questPatterns[key];
  if(pattern){
    const found = recent.find((c)=>pattern.test(c));
    if(found) return `Typischer Fehler erkannt: Quest-spezifischer Stolperstein bei <code>${escapeHtml(found)}</code>.`;
  }

  return "Typischer Fehler erkannt: Kein klarer Fehler im Verlauf — vermutlich fehlt ein Zwischenschritt.";
}

function renderClippyAvailability(){
  const btn = el("clippyHelperBtn");
  const status = el("clippyStatus");
  const usage = el("clippyUsage");
  if(!btn || !status) return;

  ensureClippyState();
  const difficulty = getClippyDifficulty();
  const diffCfg = CLIPPY_DIFFICULTY[difficulty];
  if(usage) usage.textContent = `Nutzungen: ${Math.max(0, Number(state.clippy.usageCount)||0)} · Hilfe-Punkte: ${Math.max(0, Number(state.clippy.weightedUsage)||0)} · ${diffCfg.label} (${diffCfg.desc})`;

  const remaining = getClippyCooldownRemainingMs();
  const hasObjective = !!getCurrentMainObjective();
  const isCooldown = remaining > 0;

  btn.classList.toggle("isCooldown", isCooldown);
  status.classList.remove("isReady", "isCooldown");

  if(!hasObjective){
    btn.disabled = true;
    btn.textContent = "📎 Clippy Helfer";
    status.textContent = "Status: aktuell keine Mainquest aktiv";
    status.classList.add("isCooldown");
    return;
  }

  if(isCooldown){
    btn.disabled = true;
    btn.textContent = `📎 Clippy Cooldown (${formatCooldown(remaining)})`;
    status.textContent = `Status: ${diffCfg.label} aktiv · Restzeit ${formatCooldown(remaining)}`;
    status.classList.add("isCooldown");
    return;
  }

  btn.disabled = false;
  btn.textContent = `📎 Clippy Helfer (${diffCfg.label})`;
  status.textContent = `Status: bereit · ${diffCfg.desc}`;
  status.classList.add("isReady");
}

function buildClippyContent(){
  const current = getCurrentMainObjective();
  if(!current) return null;
  const key = current.key || objectiveKeyFromTitle(current.title);
  const baseTemplate = CLIPPY_SOLUTIONS[key] || normalizeClippyTemplate({
    subtitle:"Für diese Quest gibt es aktuell eine allgemeine Musterstrategie.",
    steps:[
      'Lies zuerst den Quest-Hinweis komplett und markiere das Zielverb (z.B. finden, lesen, kopieren, ausführen).',
      'Nutze den Standardablauf: <code>pwd</code> → <code>ls</code> → <code>cat relevante_datei</code>.',
      'Wenn etwas gesucht werden muss: <code>find</code> und <code>grep -n</code> kombinieren, dann Ergebnis in die Workbench sichern.',
      'Nach jedem Schritt sofort mit <code>quests</code> kontrollieren, ob die Quest bereits als erledigt markiert wurde.'
    ],
    hint:'Erklärung: Die meisten Mainquests folgen demselben Lernmuster aus Navigation, Analyse und sauberer Ausführung.'
  });
  const difficulty = getClippyDifficulty();
  const stageSteps = baseTemplate.stages[difficulty] || baseTemplate.stages[1];
  const detectedMistake = analyzeClippyMistake(key);
  const nextStep = difficulty === 1
    ? `Nächster sinnvoller Schritt: Gehe Richtung Quest-Ziel und verifiziere dann mit <code>quests</code>.`
    : difficulty === 2
      ? `Nächster sinnvoller Schritt: Nutze als nächstes <code>${escapeHtml(baseTemplate.nextCommand)}</code>.`
      : `Nächster sinnvoller Schritt: Arbeite die folgenden Teilschritte der Reihe nach ab.`;
  return { key, objective: current, template: baseTemplate, difficulty, stageSteps, detectedMistake, nextStep };
}

function getOpenClippyObjectiveKey(){
  const tooltip = el("clippyTooltip");
  if(!tooltip) return "";
  return String(tooltip.dataset.objectiveKey || "");
}

function getOpenClippyObjectiveTitle(){
  const tooltip = el("clippyTooltip");
  if(!tooltip) return "";
  return String(tooltip.dataset.objectiveTitle || "");
}

function positionClippyTooltip(){
  const tooltip = el("clippyTooltip");
  const btn = el("clippyHelperBtn");
  if(!tooltip || !btn || tooltip.hidden) return;
  const r = btn.getBoundingClientRect();
  const top = Math.min(window.innerHeight - tooltip.offsetHeight - 12, r.bottom + 10);
  const left = Math.min(window.innerWidth - tooltip.offsetWidth - 12, Math.max(12, r.right - tooltip.offsetWidth));
  tooltip.style.top = `${Math.max(12, top)}px`;
  tooltip.style.left = `${left}px`;
}

function closeClippyTooltip(){
  const tooltip = el("clippyTooltip");
  const btn = el("clippyHelperBtn");
  if(!tooltip || !btn) return;
  tooltip.hidden = true;
  tooltip.style.top = "";
  tooltip.style.left = "";
  delete tooltip.dataset.objectiveKey;
  delete tooltip.dataset.objectiveTitle;
  btn.setAttribute("aria-expanded", "false");
}

function showClippyTooltip(){
  const tooltip = el("clippyTooltip");
  const btn = el("clippyHelperBtn");
  if(!tooltip || !btn) return;
  const remaining = getClippyCooldownRemainingMs();
  if(remaining > 0){
    closeClippyTooltip();
    return;
  }
  const payload = buildClippyContent();
  if(!payload){
    closeClippyTooltip();
    return;
  }
  const { key, objective, template, difficulty, stageSteps, detectedMistake, nextStep } = payload;
  const stepsHtml = stageSteps.map((step)=>`<li>${step}</li>`).join("");
  const diffButtons = [1,2,3].map((lvl)=>{
    const cfg = CLIPPY_DIFFICULTY[lvl];
    const active = lvl === difficulty ? "isActive" : "";
    return `<button class="btn ${active}" type="button" data-clippy-diff="${lvl}">${cfg.label}</button>`;
  }).join("");
  tooltip.innerHTML = `
    <h3 class="clippyTitle">📎 Clippy Helfer: [${escapeHtml(key)}] · ${escapeHtml(CLIPPY_DIFFICULTY[difficulty].label)}</h3>
    <p class="clippySub"><strong>${escapeHtml(objective.title)}</strong><br>${escapeHtml(template.subtitle)}</p>
    <div class="clippyActions">${diffButtons}</div>
    <p class="clippyHint"><strong>${detectedMistake}</strong></p>
    <p class="clippyHint"><strong>${nextStep}</strong></p>
    <ol class="clippySteps">${stepsHtml}</ol>
    <p class="clippyHint">${escapeHtml(template.hint)}</p>
    <div class="clippyActions"><button class="btn" id="clippyCloseBtn" type="button">Okay</button></div>
  `;
  tooltip.hidden = false;
  tooltip.dataset.objectiveKey = key;
  tooltip.dataset.objectiveTitle = objective.title;
  btn.setAttribute("aria-expanded", "true");

  ensureClippyState();
  const cfg = CLIPPY_DIFFICULTY[difficulty];
  state.clippy.lastUsedAt = Date.now();
  state.clippy.lastDifficulty = difficulty;
  state.clippy.usageCount = Math.max(0, Number(state.clippy.usageCount)||0) + 1;
  state.clippy.weightedUsage = Math.max(0, Number(state.clippy.weightedUsage)||0) + Number(cfg.usageCost || 1);
  saveState();
  renderClippyAvailability();

  const closeBtn = el("clippyCloseBtn");
  if(closeBtn) closeBtn.addEventListener("click", closeClippyTooltip);
  tooltip.querySelectorAll("[data-clippy-diff]").forEach((node)=>{
    node.addEventListener("click", ()=>{
      const lvl = Number(node.getAttribute("data-clippy-diff"));
      if(!CLIPPY_DIFFICULTY[lvl]) return;
      state.clippy.difficulty = lvl;
      saveState();
      closeClippyTooltip();
      renderClippyAvailability();
      showClippyTooltip();
    });
  });
  requestAnimationFrame(positionClippyTooltip);
}

function syncClippyTooltip(){
  renderClippyAvailability();
  const tooltip = el("clippyTooltip");
  if(!tooltip || tooltip.hidden) return;
  const payload = buildClippyContent();
  if(!payload){
    closeClippyTooltip();
    return;
  }
  if(payload.key !== getOpenClippyObjectiveKey()){
    closeClippyTooltip();
    return;
  }
  if(payload.objective.title !== getOpenClippyObjectiveTitle()){
    closeClippyTooltip();
    return;
  }
  positionClippyTooltip();
}

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
    syncClippyTooltip();
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

  try{ renderHeaderSub(); }catch(e){}
  syncClippyTooltip();

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

function showSavegamePanel(phrase){
  const overlay = el("savegameOverlay");
  const out = el("savegamePhraseOutput");
  const hint = el("savegamePanelHint");
  if(!overlay || !out || !hint) return;
  out.value = phrase;
  hint.textContent = "Tipp: Mit Kopieren oder Export musst du auf mobilen Geräten nichts manuell markieren.";
  overlay.hidden = false;
  out.focus();
  out.select();
}

function closeSavegamePanel(){
  const overlay = el("savegameOverlay");
  if(overlay) overlay.hidden = true;
}

async function copySavegamePhrase(){
  const out = el("savegamePhraseOutput");
  const hint = el("savegamePanelHint");
  if(!out || !hint) return;
  const phrase = String(out.value || "");
  if(!phrase){
    hint.textContent = "Es ist noch keine Passphrase vorhanden.";
    return;
  }

  if(navigator.clipboard && typeof navigator.clipboard.writeText === "function"){
    try{
      await navigator.clipboard.writeText(phrase);
      hint.textContent = "✅ Passphrase in die Zwischenablage kopiert.";
      return;
    }catch(_err){
      // fallback below
    }
  }

  out.focus();
  out.select();
  hint.textContent = "⚠️ Automatisches Kopieren nicht verfügbar. Bitte manuell kopieren (Strg/Cmd + C).";
}

function exportSavegamePhrase(){
  const out = el("savegamePhraseOutput");
  const hint = el("savegamePanelHint");
  if(!out || !hint) return;
  const phrase = String(out.value || "");
  if(!phrase){
    hint.textContent = "Es ist noch keine Passphrase vorhanden.";
    return;
  }
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `schwarmshell-savegame-${ts}.txt`;
  const blob = new Blob([`SchwarmShell Savegame Passphrase

${phrase}
`], { type:"text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  hint.textContent = `✅ Export gestartet (${fileName}).`;
}

const RESET_UNDO_STORAGE_KEY = "schwarmshell_reset_undo_snapshot_v1";
const RESET_UNDO_WINDOW_MS = 10_000;
const AUTOSAVE_STORAGE_KEY = (typeof STORAGE_KEY === "string" && STORAGE_KEY) ? STORAGE_KEY : "schwarmshell_all_phases_v5";
let resetUndoTimer = null;

function readResetUndoSnapshot(){
  try{
    const raw = localStorage.getItem(RESET_UNDO_STORAGE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(!parsed || typeof parsed !== "object") return null;
    if(!parsed.passphrase || !parsed.expiresAt) return null;
    if(Date.now() > Number(parsed.expiresAt)){
      localStorage.removeItem(RESET_UNDO_STORAGE_KEY);
      return null;
    }
    return parsed;
  }catch(_err){
    localStorage.removeItem(RESET_UNDO_STORAGE_KEY);
    return null;
  }
}

function clearResetUndoState(){
  localStorage.removeItem(RESET_UNDO_STORAGE_KEY);
  if(resetUndoTimer){
    clearTimeout(resetUndoTimer);
    resetUndoTimer = null;
  }
  const resetBtn = el("reset");
  if(resetBtn) resetBtn.textContent = "Reset";
}

function startResetUndoWindow(snapshot){
  const expiresAt = Date.now() + RESET_UNDO_WINDOW_MS;
  localStorage.setItem(RESET_UNDO_STORAGE_KEY, JSON.stringify({
    passphrase: snapshot.passphrase,
    autosaveRaw: snapshot.autosaveRaw,
    expiresAt
  }));

  const resetBtn = el("reset");
  if(resetBtn) resetBtn.textContent = "Undo Reset (10s)";

  if(resetUndoTimer) clearTimeout(resetUndoTimer);
  resetUndoTimer = setTimeout(()=>{
    clearResetUndoState();
  }, RESET_UNDO_WINDOW_MS + 50);
}

function tryUndoReset(){
  const snapshot = readResetUndoSnapshot();
  if(!snapshot) return false;

  const shouldUndo = confirm("Letzten Reset rückgängig machen? Der Spielstand vor dem Reset wird wiederhergestellt.");
  if(!shouldUndo) return true;

  const restored = loadStateFromPassphrase(snapshot.passphrase);
  if(!restored.ok){
    row("⚠️ Undo fehlgeschlagen: Snapshot konnte nicht geladen werden.", "warn");
    clearResetUndoState();
    return true;
  }

  if(snapshot.autosaveRaw){
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, snapshot.autosaveRaw);
  }
  clearResetUndoState();
  term.innerHTML = "";
  bootLoadSource = "Undo";
  boot();
  return true;
}

function requestResetWithSafety(){
  if(tryUndoReset()) return;

  const confirmed = confirm("Willst du wirklich resetten? Dabei wird dein Autosave gelöscht und dein Fortschritt geht verloren.");
  if(!confirmed) return;

  const wantsBackup = confirm("Optional: Vor dem Reset eine Backup-Passphrase erzeugen?");
  if(wantsBackup){
    const phrase = createSavePassphrase();
    showSavegamePanel(phrase);
    const continueReset = confirm("Backup-Passphrase wurde erzeugt. Jetzt wirklich resetten?");
    if(!continueReset) return;
  }

  const snapshot = {
    passphrase: createSavePassphrase(),
    autosaveRaw: localStorage.getItem(AUTOSAVE_STORAGE_KEY)
  };

  doReset(true);
  startResetUndoWindow(snapshot);
  row("↩️ Undo verfügbar: 10 Sekunden über den Reset-Button.", "p");
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
    el("savegameLoadError").textContent = `${result.error} Beispiel für gültiges Format: SS1...`;
    return;
  }
  closeStartModal();
  el("savegameLoad").hidden = true;
  bootLoadSource = "Savegame";
  boot();
});

el("savegamePassphrase").addEventListener("keydown", (e)=>{
  if(e.key !== "Enter") return;
  e.preventDefault();
  el("savegameConfirm").click();
});

el("run").addEventListener("click", ()=>{
  const v = cmdInput.value;
  cmdInput.value = "";
  runLine(v);
});
el("reset").addEventListener("click", requestResetWithSafety);
el("savegame").addEventListener("click", ()=>{
  const phrase = createSavePassphrase();
  row("🔐 Savegame-Passphrase erstellt.", "ok");
  showSavegamePanel(phrase);
});

el("savegamePanelClose").addEventListener("click", closeSavegamePanel);
el("savegameCopy").addEventListener("click", ()=>{ copySavegamePhrase(); });
el("savegameExport").addEventListener("click", exportSavegamePhrase);

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
    if(!auto){
      e.preventDefault();
      return;
    }

    cmdInput._tabState = cmdInput._tabState || { source:"", index:-1, candidates:[] };
    const tabState = cmdInput._tabState;
    const candidates = Array.isArray(auto.candidates) ? auto.candidates : [];

    if(auto.replacement){
      cmdInput.value = auto.replacement;
      tabState.source = "";
      tabState.index = -1;
      tabState.candidates = [];
      e.preventDefault();
      return;
    }

    if(candidates.length > 1){
      if(tabState.source === cmdInput.value && tabState.candidates.join("\u0000") === candidates.join("\u0000")){
        tabState.index = (tabState.index + 1) % candidates.length;
      }else{
        tabState.source = cmdInput.value;
        tabState.index = 0;
        tabState.candidates = candidates.slice();
        const preview = candidates.slice(0, 12).join("   ");
        const suffix = candidates.length > 12 ? `   … +${candidates.length - 12} weitere` : "";
        row(`Tab-Kandidaten (${candidates.length}): ${preview}${suffix}`, "muted");
      }

      if(auto.kind === "path"){
        cmdInput.value = `${auto.activePrefix}${tabState.candidates[tabState.index]}`;
      }else{
        cmdInput.value = tabState.candidates[tabState.index];
      }
    }
    e.preventDefault();
    return;
  }

  if(cmdInput._tabState){
    cmdInput._tabState.source = "";
    cmdInput._tabState.index = -1;
    cmdInput._tabState.candidates = [];
  }
});

const clippyBtn = el("clippyHelperBtn");
if(clippyBtn){
  clippyBtn.addEventListener("click", ()=>{
    renderClippyAvailability();
    const tooltip = el("clippyTooltip");
    if(tooltip && !tooltip.hidden){
      closeClippyTooltip();
      return;
    }
    showClippyTooltip();
  });
}
window.addEventListener("resize", ()=>{
  positionClippyTooltip();
});

setInterval(()=>{
  renderClippyAvailability();
}, 1000);
renderClippyAvailability();

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
  try{ syncClippyTooltip(); }catch(e){}

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
window.syncClippyTooltip = syncClippyTooltip;

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
