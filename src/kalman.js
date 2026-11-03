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
const GPS_SIGMA = 1;         // m
const SPEED_SIGMA = 0.2;     // m/s
const YAW_SIGMA = 0.05;      // rad/s
const YAW_BIAS = 0.05;       // rad/s, constant gyro error
const SPEED_SCALE = 1.04;    // wheel-speed reading is 4% high
const OBSTACLES = [
  { x: -16, y: 20 }, { x: -5, y: 20 }, { x: 9, y: 20 }, { x: 22, y: 20 },
  { x: -28, y: 33 }, { x: -12, y: 33 }, { x: 5, y: 33 }, { x: 20, y: 33 }, { x: 34, y: 33 },
  { x: -36, y: 48 }, { x: -20, y: 48 }, { x: -2, y: 48 }, { x: 15, y: 48 }, { x: 31, y: 48 },
  { x: -32, y: 63 }, { x: -14, y: 63 }, { x: 3, y: 63 }, { x: 23, y: 63 }, { x: 40, y: 63 },
  { x: -43, y: 78 }, { x: -25, y: 78 }, { x: -7, y: 78 }, { x: 11, y: 78 }, { x: 30, y: 78 }, { x: 46, y: 78 },
  { x: -38, y: 95 }, { x: -19, y: 95 }, { x: 0, y: 95 }, { x: 18, y: 95 }, { x: 37, y: 95 },
  { x: -45, y: 112 }, { x: -26, y: 112 }, { x: -8, y: 112 }, { x: 12, y: 112 }, { x: 29, y: 112 }, { x: 48, y: 112 },
  { x: -37, y: 130 }, { x: -18, y: 130 }, { x: 2, y: 130 }, { x: 22, y: 130 }, { x: 42, y: 130 },
  { x: -30, y: 148 }, { x: -10, y: 148 }, { x: 11, y: 148 }, { x: 33, y: 148 },
  { x: -18, y: 166 }, { x: 0, y: 166 }, { x: 18, y: 166 }, { x: 36, y: 166 },
];
const OBSTACLE_RADIUS = 2.5;

const keys = new Set();
let attempt = 0;
let s;
let kalmanFilter;
let kalmanModulePromise;

function randn() {
  const u = 1 - Math.random(), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function loadKalmanFilter() {
  if (!kalmanModulePromise) {
    const moduleUrl = new URL('../' + 'wasm/kalman_filter.js', import.meta.url);
    kalmanModulePromise = import(/* @vite-ignore */ moduleUrl.href)
      .then(({ default: createKalmanModule }) => createKalmanModule())
      .then((wasmModule) => {
        kalmanFilter = new wasmModule.EKF();
        return kalmanFilter;
      });
  }
  return kalmanModulePromise;
}

function reset(nextAttempt = false) {
  if (nextAttempt) attempt += 1;
  const th0 = Math.PI / 2; // facing "up" the screen
  const mode = attempt === 0 ? 'dead-reckoning' : attempt === 1 ? 'gps' : 'kalman';
  s = {
    phase: 'ready', mode, t: 0, dist: 0, hits: new Set(),
    x: 0, y: 0, th: th0, v: 0, steer: 0,
    estimate: { x: 0, y: 0, th: th0 },
    path: [[0, 0]], estimatePath: [[0, 0]], gpsTimer: 0, gpsErrSum: 0,
  };
  resultEl.textContent = '';
  document.getElementById('again').disabled = true;

  if (attempt >= 2) {
    s.phase = 'loading';
    loadKalmanFilter().then((filter) => {
      if (s.phase !== 'loading') return;
      filter.reset(0, 0, th0);
      s.phase = 'ready';
    }).catch((error) => {
      if (s.phase !== 'loading') return;
      s.phase = 'error';
      resultEl.textContent = `Kalman filter unavailable. Build the WebAssembly module first: ${error.message}`;
    });
  } else {
    kalmanFilter?.reset(0, 0, th0);
  }
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

  const estimate = s.estimate;
  if (s.mode === 'kalman') {
    kalmanFilter.predict(vMeas, yawMeas, dt, SPEED_SIGMA, YAW_SIGMA);
    estimate.x = kalmanFilter.getX();
    estimate.y = kalmanFilter.getY();
    estimate.th = kalmanFilter.getHeading();
  } else {
    estimate.th += yawMeas * dt;
    estimate.x += vMeas * Math.cos(estimate.th) * dt;
    estimate.y += vMeas * Math.sin(estimate.th) * dt;
  }

  for (const [index, obstacle] of OBSTACLES.entries()) {
    if (!s.hits.has(index) && Math.hypot(s.x - obstacle.x, s.y - obstacle.y) <= OBSTACLE_RADIUS + 2.25) {
      s.hits.add(index);
    }
  }

  // GPS: absolute but jumpy
  s.gpsTimer += dt;
  if (s.gpsTimer >= GPS_PERIOD) {
    s.gpsTimer -= GPS_PERIOD;
    const nx = GPS_SIGMA * randn(), ny = GPS_SIGMA * randn();
    const gpsX = s.x + nx, gpsY = s.y + ny;
    s.gpsErrSum += Math.hypot(nx, ny);

    if (s.mode === 'gps') {
      estimate.x = gpsX;
      estimate.y = gpsY;
    } else if (s.mode === 'kalman') {
      kalmanFilter.update(gpsX, gpsY, GPS_SIGMA);
      estimate.x = kalmanFilter.getX();
      estimate.y = kalmanFilter.getY();
      estimate.th = kalmanFilter.getHeading();
    }
  }

  s.path.push([s.x, s.y]);
  s.estimatePath.push([estimate.x, estimate.y]);

  s.t += dt;
  if (s.t >= MAX_T) {
    s.t = MAX_T;
    s.phase = 'done';
    s.overview = createOverview();
    document.getElementById('again').disabled = false;
    const positionError = Math.hypot(estimate.x - s.x, estimate.y - s.y);
    const hitText = `${s.hits.size} obstacle${s.hits.size === 1 ? '' : 's'} hit`;
    const modeText = s.mode === 'dead-reckoning' ? 'dead reckoning' : s.mode === 'gps' ? 'GPS updates' : 'the Kalman filter';
    const nextMode = attempt === 0 ? 'GPS updates' : 'the Kalman filter';
    resultEl.textContent =
      `Using ${modeText}, you travelled ${s.dist.toFixed(0)} m and ended ${positionError.toFixed(1)} m from your true position. ` +
      `${hitText}. The white line is the true path; the orange dashed line is the route shown by the localization system. ` +
      `Drive again to try ${nextMode}.`;
  }
}

// ---- Drawing ----
function createOverview() {
  const points = [...s.path, ...s.estimatePath, ...OBSTACLES.map(({ x, y }) => [x, y])];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padding = 48;
  const scale = Math.min(
    SCALE,
    (W - padding * 2) / Math.max(maxX - minX, 1),
    (H - padding * 2) / Math.max(maxY - minY, 1),
  );
  return { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2, scale };
}

function toScreen(wx, wy) {
  if (s.overview) {
    return [W / 2 + (wx - s.overview.centerX) * s.overview.scale, H / 2 - (wy - s.overview.centerY) * s.overview.scale];
  }
  return [W / 2 + (wx - s.estimate.x) * SCALE, H * 0.65 - (wy - s.estimate.y) * SCALE];
}

function drawGrid() {
  const spacing = 10 * (s.overview ? s.overview.scale : SCALE);
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
  const [cx, cy] = toScreen(s.estimate.x, s.estimate.y);
  const scale = s.overview ? s.overview.scale : SCALE;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-s.estimate.th);
  ctx.fillStyle = '#e8f1f8';
  ctx.fillRect(-2.25 * scale, -1 * scale, 4.5 * scale, 2 * scale);
  ctx.fillStyle = '#0f2a43';
  ctx.fillRect(0.4 * scale, -0.8 * scale, 1.2 * scale, 1.6 * scale); // windscreen marks the front
  ctx.restore();
}

function drawObstacles() {
  const scale = s.overview ? s.overview.scale : SCALE;
  for (const [index, obstacle] of OBSTACLES.entries()) {
    const [x, y] = toScreen(obstacle.x, obstacle.y);
    ctx.fillStyle = s.hits.has(index) ? '#73808a' : '#ff6b5a';
    ctx.beginPath();
    ctx.arc(x, y, OBSTACLE_RADIUS * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#12263a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
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
  drawObstacles();
  if (s.phase === 'done') {
    drawPath(s.path, '#ffffff', false);
    drawPath(s.estimatePath, '#ffb347', true);
  }
  drawCar();

  drawText(`Time ${s.t.toFixed(1)} / ${MAX_T} s`, 16, 28, 18);
  drawText(`Speed ${(s.v * 3.6).toFixed(0)} km/h`, 16, 52, 18);
  drawText(`Mode: ${s.mode === 'dead-reckoning' ? 'Dead reckoning' : s.mode === 'gps' ? 'GPS updates' : 'Kalman filter'}`, 16, 76, 18);
  drawText(`Obstacles hit: ${s.hits.size}`, 16, 100, 18);

  if (s.phase === 'ready') drawText('Press \u2191 to start driving', W / 2, H * 0.3, 24, 'center');
  if (s.phase === 'loading') drawText('Loading Kalman filter...', W / 2, H * 0.3, 24, 'center');
  if (s.phase === 'error') drawText('Kalman filter unavailable', W / 2, H * 0.3, 24, 'center');
}

// ---- Input and loop ----
const ARROWS = ['ArrowUp', 'ArrowLeft', 'ArrowRight'];
window.addEventListener('keydown', (e) => {
  if (ARROWS.includes(e.code)) {
    e.preventDefault(); // stop the page scrolling
    keys.add(e.code);
    if (s.phase === 'ready') s.phase = 'running';
  } else if (e.code === 'Enter' && s.phase === 'done' && e.target === document.body) {
    reset(true);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
document.getElementById('again').addEventListener('click', () => reset(true));

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
