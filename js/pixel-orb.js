import * as THREE from 'three';

/**
 * About-section visual: a voxel ("pixelated") sphere that flies together,
 * rotates, dismantles into tumbling cubes, then rebuilds itself on a loop.
 * Replays the fly-in each time it scrolls into view and pauses off-screen.
 * Renders a single assembled frame for prefers-reduced-motion, and the CSS
 * stand-in (.no-webgl) is shown if WebGL is unavailable.
 */

const stage = document.getElementById('pixelOrb');
const canvas = document.getElementById('pixelOrbCanvas');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

if (stage && canvas) {
  if (!supportsWebGL()) {
    stage.classList.add('no-webgl');
  } else {
    initPixelOrb();
  }
}

function randomUnit() {
  const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
  return v.lengthSq() > 1e-4 ? v.normalize() : new THREE.Vector3(0, 1, 0);
}

function initPixelOrb() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  // Same palette/lighting language as the hero scene
  const keyLight = new THREE.DirectionalLight(0xd2c4ff, 3.2);
  keyLight.position.set(2, 3, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x33e0c6, 2.0);
  rimLight.position.set(-4, -3, 2);
  scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0x6a6aa8, 1.8));

  const group = new THREE.Group();
  group.rotation.x = 0.35;
  scene.add(group);

  // Voxel shell: every grid cell whose centre sits on the sphere surface
  const RADIUS = 1.45;
  const CELL = 0.145;
  const homes = [];
  const n = Math.ceil(RADIUS / CELL) + 1;
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      for (let k = -n; k <= n; k++) {
        const x = i * CELL, y = j * CELL, z = k * CELL;
        if (Math.abs(Math.hypot(x, y, z) - RADIUS) <= CELL * 0.62) {
          homes.push(new THREE.Vector3(x, y, z));
        }
      }
    }
  }

  const count = homes.length;
  const voxelGeo = new THREE.BoxGeometry(CELL * 0.86, CELL * 0.86, CELL * 0.86);
  const voxelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.15 });
  const voxels = new THREE.InstancedMesh(voxelGeo, voxelMat, count);
  voxels.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(voxels);

  // Per-voxel scatter data. Delay is height-based so the orb peels apart
  // from the top down and rebuilds from the bottom up.
  const MAX_DELAY = 0.55;
  const purple = new THREE.Color(0x9b6bff);
  const blue = new THREE.Color(0x4f8dff);
  const cyan = new THREE.Color(0x33e0c6);
  const pink = new THREE.Color(0xf14e9c);
  const tmpColor = new THREE.Color();
  const offsets = [], axes = [], spins = [], delays = [];

  homes.forEach((home, idx) => {
    const t = (1 - home.y / RADIUS) / 2; // 0 at top, 1 at bottom
    if (t < 0.5) tmpColor.copy(purple).lerp(blue, t * 2);
    else tmpColor.copy(blue).lerp(cyan, (t - 0.5) * 2);
    if (Math.random() < 0.025) tmpColor.copy(pink);
    voxels.setColorAt(idx, tmpColor);

    const dir = home.clone().normalize().add(randomUnit().multiplyScalar(0.55)).normalize();
    offsets.push(dir.multiplyScalar(0.5 + Math.random() * 0.75));
    axes.push(randomUnit());
    spins.push((0.5 + Math.random() * 1.5) * Math.PI);
    delays.push(t * MAX_DELAY * 0.8 + Math.random() * MAX_DELAY * 0.2);
  });
  voxels.instanceColor.needsUpdate = true;

  // Thin orbit ring, echoing the hero
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.006, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0x6a6a9a, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);

  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  let lastU = -1;

  // u: 0 = assembled sphere, 1 = fully dismantled
  function layout(u) {
    if (u === lastU) return;
    lastU = u;
    for (let i = 0; i < count; i++) {
      const local = easeInOutCubic(THREE.MathUtils.clamp(u * (1 + MAX_DELAY) - delays[i], 0, 1));
      p.copy(homes[i]).addScaledVector(offsets[i], local);
      q.setFromAxisAngle(axes[i], spins[i] * local);
      const sc = 1 - local * 0.45;
      s.set(sc, sc, sc);
      m.compose(p, q, s);
      voxels.setMatrixAt(i, m);
    }
    voxels.instanceMatrix.needsUpdate = true;
  }

  // 10s loop: hold → dismantle → drift → rebuild → hold
  const CYCLE = 10;
  const ENTRY_TIME = 6.4; // start mid-scatter so the orb flies together when first seen
  function scatterAt(t) {
    if (t < 4.2) return 0;
    if (t < 6.0) return (t - 4.2) / 1.8;
    if (t < 7.0) return 1;
    if (t < 8.8) return 1 - (t - 7.0) / 1.8;
    return 0;
  }

  // Gentle pointer parallax, relative to the orb itself
  let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
  if (!prefersReducedMotion) {
    window.addEventListener('pointermove', (e) => {
      const rect = stage.getBoundingClientRect();
      const nx = THREE.MathUtils.clamp((e.clientX - (rect.left + rect.width / 2)) / window.innerWidth, -0.5, 0.5);
      const ny = THREE.MathUtils.clamp((e.clientY - (rect.top + rect.height / 2)) / window.innerHeight, -0.5, 0.5);
      targetTiltY = nx * 0.5;
      targetTiltX = ny * 0.35;
    }, { passive: true });
  }

  function resize() {
    const size = stage.clientWidth;
    if (!size) return;
    renderer.setSize(size, size, false);
    if (!rafId) renderer.render(scene, camera);
  }

  const clock = new THREE.Clock();
  let rafId = null;
  let t = ENTRY_TIME;
  let entryAge = 0;
  let spinY = 0;

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t = (t + dt) % CYCLE;
    entryAge += dt;

    layout(scatterAt(t));

    tiltX += (targetTiltX - tiltX) * 0.05;
    tiltY += (targetTiltY - tiltY) * 0.05;
    spinY += dt * 0.35;
    group.rotation.y = spinY + tiltY;
    group.rotation.x = 0.35 + tiltX + Math.sin(entryAge * 0.6) * 0.05;
    ring.rotation.z += dt * 0.08;

    const grow = easeOutCubic(Math.min(entryAge / 1.6, 1));
    group.scale.setScalar(0.65 + 0.35 * grow);

    renderer.render(scene, camera);
  }

  function start() {
    if (rafId) return;
    t = ENTRY_TIME;
    entryAge = 0;
    clock.getDelta();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (prefersReducedMotion) {
    layout(0);
    resize();
    new ResizeObserver(resize).observe(stage);
    return;
  }

  layout(scatterAt(ENTRY_TIME));
  group.scale.setScalar(0.65);
  resize();
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(
    (entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())),
    { threshold: 0.15 }
  ).observe(stage);
}
