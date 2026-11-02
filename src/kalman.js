// "The need for Kalman filters": drive a car for up to 10 s and compare the
// true path with what noisy sensors would tell you.

const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');
const resultEl = document.getElementById('result');
const W = canvas.width, H = canvas.height;

const MAX_T = 10;            // seconds of driving allowed
const SCALE = 8;             // pixels per metre
const WHEELBASE = 2.5;       // m
const MAX_STEER = 0.45;      // rad
const STEER_RATE = 2.5;      // rad/s
const ACCEL = 4;             // m/s^2 while Up is held
const DRAG = 1.5;            // m/s^2 slowdown when Up is released
const V_MAX = 20;            // m/s

const GPS_PERIOD = 0.5;      // s between GPS readings
const GPS_SIGMA = 3;         // m
const SPEED_SIGMA = 0.3;     // m/s
const YAW_SIGMA = 0.05;      // rad/s
const YAW_BIAS = 0.05;       // rad/s, constant gyro error
const SPEED_SCALE = 1.04;    // wheel-speed reading is 4% high

const keys = new Set();
let s;

function randn() {
  const u = 1 - Math.random(), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function reset() {
  const th0 = Math.PI / 2; // facing "up" the screen
  s = {
    phase: 'ready', t: 0, dist: 0,
    x: 0, y: 0, th: th0, v: 0, steer: 0,
    dr: { x: 0, y: 0, th: th0 },
    path: [[0, 0]], drPath: [[0, 0]],
    gps: [], gpsTimer: 0, gpsErrSum: 0,
  };
  resultEl.textContent = '';
}

function step(dt) {
  if (s.phase !== 'running') return;

  // Driver input
  // Less steering lock at speed, like a real car
  const lock = MAX_STEER / (1 + s.v / 6);
  const target = ((keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)) * lock;
  s.steer += clamp(target - s.steer, -STEER_RATE * dt, STEER_RATE * dt);
  s.v = keys.has('ArrowUp') ? Math.min(V_MAX, s.v + ACCEL * dt) : Math.max(0, s.v - DRAG * dt);

  // True motion (kinematic bicycle model)
  const yawRate = (s.v / WHEELBASE) * Math.tan(s.steer);
  s.th += yawRate * dt;
  s.x += s.v * Math.cos(s.th) * dt;
  s.y += s.v * Math.sin(s.th) * dt;
  s.dist += s.v * dt;

  // Dead reckoning: integrate noisy speed and turn-rate readings
  const vMeas = s.v * SPEED_SCALE + SPEED_SIGMA * randn();
  const yawMeas = yawRate + YAW_BIAS + YAW_SIGMA * randn();
  s.dr.th += yawMeas * dt;
  s.dr.x += vMeas * Math.cos(s.dr.th) * dt;
  s.dr.y += vMeas * Math.sin(s.dr.th) * dt;

  // GPS: absolute but jumpy
  s.gpsTimer += dt;
  if (s.gpsTimer >= GPS_PERIOD) {
    s.gpsTimer -= GPS_PERIOD;
    const nx = GPS_SIGMA * randn(), ny = GPS_SIGMA * randn();
    s.gps.push([s.x + nx, s.y + ny]);
    s.gpsErrSum += Math.hypot(nx, ny);
  }

  // TODO: run the Kalman filter here (predict with vMeas/yawMeas, update with GPS)

  s.path.push([s.x, s.y]);
  s.drPath.push([s.dr.x, s.dr.y]);

  s.t += dt;
  if (s.t >= MAX_T) {
    s.t = MAX_T;
    s.phase = 'done';
    const drErr = Math.hypot(s.dr.x - s.x, s.dr.y - s.y);
    const gpsErr = s.gpsErrSum / Math.max(1, s.gps.length);
    resultEl.textContent =
      `The car travelled ${s.dist.toFixed(0)} m. Dead reckoning ended ${drErr.toFixed(1)} m from the true position, ` +
      `and that error keeps growing the longer you drive. GPS readings were off by ${gpsErr.toFixed(1)} m on average: ` +
      `a smaller error that never grows, but never goes away either. A Kalman filter combines both.`;
  }
}

// ---- Drawing ----
const toScreen = (wx, wy) => [W / 2 + (wx - s.x) * SCALE, H * 0.65 - (wy - s.y) * SCALE];

function drawGrid() {
  const spacing = 10 * SCALE;
  ctx.strokeStyle = '#1e4363';
  ctx.lineWidth = 1;
  const [ox, oy] = toScreen(0, 0);
  ctx.beginPath();
  for (let x = ((ox % spacing) + spacing) % spacing; x < W; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = ((oy % spacing) + spacing) % spacing; y < H; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

function drawPath(points, color, dashed) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    const [sx, sy] = toScreen(x, y);
    i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCar() {
  const [cx, cy] = toScreen(s.x, s.y);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-s.th);
  ctx.fillStyle = '#e8f1f8';
  ctx.fillRect(-2.25 * SCALE, -1 * SCALE, 4.5 * SCALE, 2 * SCALE);
  ctx.fillStyle = '#0f2a43';
  ctx.fillRect(0.4 * SCALE, -0.8 * SCALE, 1.2 * SCALE, 1.6 * SCALE); // windscreen marks the front
  ctx.restore();
}

function drawText(text, x, y, size, align = 'left') {
  ctx.fillStyle = '#e8f1f8';
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function draw() {
  ctx.fillStyle = '#12263a';
  ctx.fillRect(0, 0, W, H);
  drawGrid();
  drawPath(s.drPath, '#ffb347', true);
  drawPath(s.path, '#ffffff', false);
  ctx.fillStyle = '#ff6b5a';
  for (const [x, y] of s.gps) {
    const [sx, sy] = toScreen(x, y);
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }
  drawCar();

  drawText(`Time ${s.t.toFixed(1)} / ${MAX_T} s`, 16, 28, 18);
  drawText(`Speed ${(s.v * 3.6).toFixed(0)} km/h`, 16, 52, 18);

  if (s.phase === 'ready') drawText('Press \u2191 to start driving', W / 2, H * 0.3, 24, 'center');
  if (s.phase === 'done') {
    drawText("Time's up", W / 2, H * 0.28, 32, 'center');
    drawText('Press Enter to drive again', W / 2, H * 0.28 + 32, 18, 'center');
  }
}

// ---- Input and loop ----
const ARROWS = ['ArrowUp', 'ArrowLeft', 'ArrowRight'];
window.addEventListener('keydown', (e) => {
  if (ARROWS.includes(e.code)) {
    e.preventDefault(); // stop the page scrolling
    keys.add(e.code);
    if (s.phase === 'ready') s.phase = 'running';
  } else if (e.code === 'Enter' && s.phase === 'done' && e.target === document.body) {
    reset();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
document.getElementById('again').addEventListener('click', reset);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
