import * as THREE from 'three';

/**
 * Hero 3D scene: floating glass/crystal geometry with gentle idle rotation
 * and a few degrees of cursor-driven parallax. Never full free-camera control.
 * Falls back to a static image if WebGL is unavailable, and is skipped
 * entirely for prefers-reduced-motion.
 */

const sceneRoot = document.getElementById('heroScene');
const canvas = document.getElementById('heroCanvas');
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

if (!supportsWebGL()) {
  sceneRoot.classList.add('no-webgl');
} else {
  initHeroScene();
}

function initHeroScene() {
  let width = sceneRoot.clientWidth;
  let height = sceneRoot.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Lighting: cool key light + warm rim to sell the "glass/crystal" material
  const keyLight = new THREE.DirectionalLight(0x9b6bff, 2.2);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x33e0c6, 1.6);
  rimLight.position.set(-5, -3, -4);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0x2a2a55, 0.9);
  scene.add(ambient);

  // Group of floating crystalline shapes
  const group = new THREE.Group();
  scene.add(group);

  const geometries = [
    new THREE.IcosahedronGeometry(1.5, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TorusGeometry(1.1, 0.14, 16, 100),
    new THREE.TetrahedronGeometry(0.9, 0),
  ];

  const materialOptions = [
    { color: 0x9b6bff, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.85 },
    { color: 0x4f8dff, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.8 },
    { color: 0x33e0c6, metalness: 0.15, roughness: 0.1, transparent: true, opacity: 0.75 },
  ];

  const meshes = [];
  const positions = [
    [2.4, 1.0, 0],
    [-2.2, -0.6, -1.5],
    [1.1, -1.6, -1],
    [-1.4, 1.6, -0.5],
  ];

  geometries.forEach((geo, i) => {
    const matOpts = materialOptions[i % materialOptions.length];
    const mat = new THREE.MeshStandardMaterial(matOpts);
    const mesh = new THREE.Mesh(geo, mat);
    const [x, y, z] = positions[i];
    mesh.position.set(x, y, z);
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.floatSpeed = 0.4 + Math.random() * 0.3;
    mesh.userData.rotSpeed = (0.05 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1);
    group.add(mesh);
    meshes.push(mesh);
  });

  // Thin orbit ring for "orbit lines" language from the brief
  const ringGeo = new THREE.TorusGeometry(3.4, 0.006, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6a6a9a, transparent: true, opacity: 0.35 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.3;
  group.add(ring);

  // Subtle particle field
  const particleCount = 120;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePos[i * 3] = (Math.random() - 0.5) * 14;
    particlePos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.4 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  group.position.x = 2.6; // bias toward the right side, behind hero copy

  // Cursor parallax: a few degrees only, never free camera
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  const maxTilt = THREE.MathUtils.degToRad(6);

  function onPointerMove(e) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY = nx * maxTilt;
    targetRotX = ny * maxTilt * 0.6;
  }

  if (!prefersReducedMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  function onResize() {
    width = sceneRoot.clientWidth;
    height = sceneRoot.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let rafId;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      meshes.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotSpeed * 0.01;
        mesh.rotation.y += mesh.userData.rotSpeed * 0.014;
        mesh.position.y += Math.sin(t * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.0025;
      });
      ring.rotation.z += 0.0009;
      particles.rotation.y += 0.0004;

      currentRotX += (targetRotX - currentRotX) * 0.04;
      currentRotY += (targetRotY - currentRotY) * 0.04;
      group.rotation.x = currentRotX;
      group.rotation.y = 0.3 + currentRotY;
    } else {
      group.rotation.y = 0.3;
    }

    renderer.render(scene, camera);
  }

  // Pause rendering when the hero is off-screen to save battery/perf
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!rafId) animate();
        } else {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    },
    { threshold: 0.05 }
  );
  io.observe(sceneRoot);

  animate();

  if (prefersReducedMotion) {
    // Render a single static frame and stop the loop entirely.
    cancelAnimationFrame(rafId);
    rafId = null;
    renderer.render(scene, camera);
  }
}
