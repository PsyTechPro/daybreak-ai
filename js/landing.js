const canvas = document.getElementById('rays');
const ctx = canvas.getContext('2d');

const COLORS = ['#ff4dc4', '#00e5ff', '#39ff14', '#b44fff'];
const RAY_COUNT = 70;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function makeRay() {
  return {
    x: randomBetween(0, canvas.width),
    y: randomBetween(0, canvas.height),
    height: randomBetween(60, 220),
    width: randomBetween(1, 3),
    speed: randomBetween(0.4, 1.4),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    baseAlpha: randomBetween(0.35, 0.85),
    pulseOffset: randomBetween(0, Math.PI * 2),
    pulseSpeed: randomBetween(0.008, 0.022),
    phase: 0,
  };
}

const rays = Array.from({ length: RAY_COUNT }, makeRay);

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function drawRay(ray) {
  ray.phase += ray.pulseSpeed;
  const pulse = 0.5 + 0.5 * Math.sin(ray.phase + ray.pulseOffset);
  const alpha = ray.baseAlpha * (0.6 + 0.4 * pulse);

  const { r, g, b } = hexToRgb(ray.color);

  const grad = ctx.createLinearGradient(ray.x, ray.y, ray.x, ray.y - ray.height);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
  ctx.fillStyle = grad;
  ctx.fillRect(ray.x - ray.width / 2, ray.y - ray.height, ray.width, ray.height);
  ctx.restore();

  ray.y -= ray.speed;

  if (ray.y + ray.height < 0) {
    ray.y = canvas.height + ray.height;
    ray.x = randomBetween(0, canvas.width);
  }
}

function frame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rays.forEach(drawRay);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  resize();
  rays.forEach(r => {
    r.x = randomBetween(0, canvas.width);
  });
});

resize();
frame();
