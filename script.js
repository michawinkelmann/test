const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const state = {
  running: false,
  score: 0,
  lives: 3,
  level: 1,
  multiplier: 1,
  lastTime: 0,
  items: [],
  spawnTimer: 0,
  windCooldown: 0,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  radius: 18,
  speed: 340,
  velocity: 0,
  windBoost: 0,
};

const keys = {
  left: false,
  right: false,
};

const itemTypes = [
  { kind: "star", color: "#ffd166", radius: 12, score: 10 },
  { kind: "rock", color: "#7f8caa", radius: 16, score: -1 },
  { kind: "gust", color: "#6ef3ff", radius: 14, score: 0 },
];

function resetGame() {
  state.running = false;
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.multiplier = 1;
  state.items = [];
  state.spawnTimer = 0;
  state.windCooldown = 0;
  player.x = canvas.width / 2;
  player.velocity = 0;
  player.windBoost = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score.toString();
  livesEl.textContent = state.lives.toString();
  levelEl.textContent = state.level.toString();
}

function startGame() {
  resetGame();
  state.running = true;
  overlay.classList.add("hidden");
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  overlay.querySelector("h2").textContent = "Sturm vorbei!";
  overlay.querySelector("p").innerHTML =
    `Du hast <strong>${state.score}</strong> Punkte erreicht.\n    Drücke „Spiel starten“, um es noch einmal zu versuchen.`;
  overlay.classList.remove("hidden");
}

function spawnItem() {
  const roll = Math.random();
  let type = itemTypes[0];
  if (roll > 0.7) type = itemTypes[1];
  if (roll > 0.9) type = itemTypes[2];

  state.items.push({
    type,
    x: 40 + Math.random() * (canvas.width - 80),
    y: -30,
    speed: 120 + Math.random() * 80 + state.level * 18,
    wobble: Math.random() * Math.PI * 2,
  });
}

function updatePlayer(dt) {
  const move = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const targetVelocity = move * player.speed;
  player.velocity += (targetVelocity - player.velocity) * Math.min(1, dt * 6);
  player.x += (player.velocity + player.windBoost) * dt;
  player.windBoost *= Math.max(0, 1 - dt * 3.5);

  const padding = 24;
  player.x = Math.max(padding, Math.min(canvas.width - padding, player.x));
}

function updateItems(dt) {
  state.items.forEach((item) => {
    item.y += item.speed * dt;
    item.wobble += dt * 2;
    item.x += Math.sin(item.wobble) * dt * 14;
  });

  state.items = state.items.filter((item) => item.y < canvas.height + 40);
}

function checkCollisions() {
  state.items = state.items.filter((item) => {
    const dx = item.x - player.x;
    const dy = item.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < item.type.radius + player.radius) {
      if (item.type.kind === "star") {
        state.score += item.type.score * state.multiplier;
        state.multiplier = Math.min(5, state.multiplier + 0.2);
      }
      if (item.type.kind === "rock") {
        state.lives -= 1;
        state.multiplier = 1;
      }
      if (item.type.kind === "gust") {
        player.windBoost = 220 + state.level * 15;
      }
      updateHud();
      return false;
    }
    return true;
  });

  if (state.lives <= 0) {
    endGame();
  }
}

function updateLevel() {
  const nextLevel = Math.floor(state.score / 120) + 1;
  if (nextLevel !== state.level) {
    state.level = nextLevel;
    updateHud();
  }
}

function updateSpawn(dt) {
  const baseRate = Math.max(0.45, 1.3 - state.level * 0.08);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnItem();
    state.spawnTimer = baseRate;
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(39, 50, 86, 0.9)");
  gradient.addColorStop(1, "rgba(10, 12, 24, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 60; i += 1) {
    const x = (i * 83) % canvas.width;
    const y = (i * 137) % canvas.height;
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = "#7b8bff";
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(-6, -6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawItems() {
  state.items.forEach((item) => {
    ctx.beginPath();
    ctx.fillStyle = item.type.color;
    ctx.arc(item.x, item.y, item.type.radius, 0, Math.PI * 2);
    ctx.fill();

    if (item.type.kind === "star") {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(item.x + 3, item.y - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawMultiplier() {
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText(`Multiplikator x${state.multiplier.toFixed(1)}`, 20, 30);
  if (state.windCooldown > 0) {
    ctx.fillStyle = "rgba(110, 243, 255, 0.7)";
    ctx.fillText(`Windschub bereit in ${state.windCooldown.toFixed(1)}s`, 20, 52);
  } else {
    ctx.fillStyle = "rgba(110, 243, 255, 0.9)";
    ctx.fillText("Windschub bereit! (Leertaste)", 20, 52);
  }
}

function loop(timestamp) {
  if (!state.running) return;
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  if (state.windCooldown > 0) {
    state.windCooldown = Math.max(0, state.windCooldown - dt);
  }

  updatePlayer(dt);
  updateItems(dt);
  checkCollisions();
  updateLevel();
  updateSpawn(dt);

  drawBackground();
  drawItems();
  drawPlayer();
  drawMultiplier();

  requestAnimationFrame(loop);
}

function triggerWind() {
  if (state.windCooldown > 0 || !state.running) return;
  player.windBoost += 260;
  state.windCooldown = 4.5;
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = true;
  }
  if (event.code === "Space") {
    triggerWind();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = false;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = false;
  }
});

startBtn.addEventListener("click", startGame);

resetGame();
