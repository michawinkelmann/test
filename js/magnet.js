const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');

const floorY = canvas.height - 28;
const magnet = {
  x: 230,
  y: 190,
  w: 220,
  h: 66,
  dragging: false,
  dragDX: 0,
  dragDY: 0
};

const paperclips = Array.from({ length: 5 }, (_, i) => ({
  x: 700 + i * 40,
  y: floorY - 20 - (i % 2) * 16,
  vx: 0,
  vy: 0,
  a: Math.random() * Math.PI,
  av: 0
}));

function getPoles() {
  return {
    south: { x: magnet.x - magnet.w / 2 + 12, y: magnet.y },
    north: { x: magnet.x + magnet.w / 2 - 12, y: magnet.y }
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function applyPhysics(p, dt) {
  const { south, north } = getPoles();

  // Büroklammern sind ferromagnetisch: immer Anziehung zum stärkeren (näheren) Pol.
  const dsx = south.x - p.x;
  const dsy = south.y - p.y;
  const dnx = north.x - p.x;
  const dny = north.y - p.y;

  const ds2 = dsx * dsx + dsy * dsy + 90;
  const dn2 = dnx * dnx + dny * dny + 90;

  const fs = 170000 / ds2;
  const fn = 170000 / dn2;

  const ms = fs >= fn ? 1 : 0.55;
  const mn = fn > fs ? 1 : 0.55;

  const fx = (dsx / Math.sqrt(ds2)) * fs * ms + (dnx / Math.sqrt(dn2)) * fn * mn;
  const fy = (dsy / Math.sqrt(ds2)) * fs * ms + (dny / Math.sqrt(dn2)) * fn * mn;

  // sanfte Schwerkraft + Dämpfung gegen hektisches "Zappeln"
  p.vx += fx * dt;
  p.vy += (fy + 520) * dt;

  const drag = Math.exp(-3.8 * dt);
  p.vx *= drag;
  p.vy *= drag;

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Rotation richtet sich an Feldlinie des dominanten Pols aus
  const target = fs > fn ? Math.atan2(dsy, dsx) : Math.atan2(dny, dnx);
  let da = target - p.a;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  p.av += da * 5.5 * dt;
  p.av *= Math.exp(-8 * dt);
  p.a += p.av * dt;

  if (p.y > floorY - 8) {
    p.y = floorY - 8;
    p.vy *= -0.18;
    p.vx *= 0.85;
  }

  p.x = clamp(p.x, 10, canvas.width - 10);
}

function drawMagnet() {
  ctx.save();
  ctx.translate(magnet.x, magnet.y);
  ctx.strokeStyle = '#184a8f';
  ctx.lineWidth = 3;

  ctx.fillStyle = '#f35679';
  ctx.fillRect(-magnet.w / 2, -magnet.h / 2, magnet.w / 2, magnet.h);
  ctx.fillStyle = '#2f78df';
  ctx.fillRect(0, -magnet.h / 2, magnet.w / 2, magnet.h);

  ctx.strokeRect(-magnet.w / 2, -magnet.h / 2, magnet.w, magnet.h);

  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', -magnet.w * 0.24, 2);
  ctx.fillText('N', magnet.w * 0.24, 2);
  ctx.restore();
}

function drawPaperclip(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.a);

  ctx.strokeStyle = '#4a5676';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-24, -14, 48, 28, 13);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-15, -8, 30, 16, 9);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#d8e8ee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#c4ccd8';
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

  drawMagnet();
  for (const p of paperclips) drawPaperclip(p);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  for (const p of paperclips) applyPhysics(p, dt);
  draw();
  requestAnimationFrame(tick);
}

function toCanvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) / r.width) * canvas.width,
    y: ((ev.clientY - r.top) / r.height) * canvas.height
  };
}

canvas.addEventListener('pointerdown', (ev) => {
  const p = toCanvasPos(ev);
  if (
    p.x >= magnet.x - magnet.w / 2 && p.x <= magnet.x + magnet.w / 2 &&
    p.y >= magnet.y - magnet.h / 2 && p.y <= magnet.y + magnet.h / 2
  ) {
    magnet.dragging = true;
    magnet.dragDX = p.x - magnet.x;
    magnet.dragDY = p.y - magnet.y;
    canvas.setPointerCapture(ev.pointerId);
  }
});

canvas.addEventListener('pointermove', (ev) => {
  if (!magnet.dragging) return;
  const p = toCanvasPos(ev);
  magnet.x = clamp(p.x - magnet.dragDX, 130, canvas.width - 130);
  magnet.y = clamp(p.y - magnet.dragDY, 70, floorY - 120);
});

function stopDrag(ev) {
  if (!magnet.dragging) return;
  magnet.dragging = false;
  if (ev?.pointerId != null) canvas.releasePointerCapture(ev.pointerId);
}
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);

requestAnimationFrame(tick);
