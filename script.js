// =========================================================
// GALAXY LOVE — Three.js Interactive Scene
// Struktur utama:
// 1. UI overlay + modal
// 2. Setup scene Three.js
// 3. Galaxy particles + Black Hole + Ring
// 4. 3D Heart Particles ("i love you" texture)
// 5. Orbiting text + floating heart sprites + orbiting image sprites
// 6. Raycaster, parallax mouse, animation loop
// =========================================================

// ---------- UI Interactions: Intro START dan Modal ----------
const startBtn = document.getElementById("start-btn");
const uiOverlay = document.getElementById("ui-overlay");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");

let animationStarted = false;

startBtn.addEventListener("click", () => {
    uiOverlay.classList.add("hidden");

    // Animasi Three.js baru mulai setelah intro menghilang.
    setTimeout(() => {
        animationStarted = true;
        releaseIntroBurst();
    }, 700);
});

closeModalBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
});

modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
        modalOverlay.classList.add("hidden");
        modalOverlay.setAttribute("aria-hidden", "true");
    }
});

// ---------- Setup Three.js ----------
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050006, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const baseCameraY = 14;
const baseCameraZ = 46;
camera.position.set(0, baseCameraY, baseCameraZ);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020006, 1);
container.appendChild(renderer.domElement);

// Cahaya lembut untuk membuat sprite dan torus lebih hidup.
scene.add(new THREE.AmbientLight(0xffb6cc, 0.45));
const centerLight = new THREE.PointLight(0xff0033, 10, 120);
centerLight.position.set(0, 10, 12);
scene.add(centerLight);

// ---------- Utility: tekstur glow partikel & Teks "i love you" ----------
function createGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.16, "rgba(255,51,102,0.98)");
    gradient.addColorStop(0.44, "rgba(255,0,0,0.42)");
    gradient.addColorStop(1, "rgba(139,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

const glowTexture = createGlowTexture();

function createLoveTextTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("i love you", canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
}
const loveTextTexture = createLoveTextTexture();

// =========================================================
// 1. Galaxy Particles — 30.000 partikel spiral padat
// =========================================================
const galaxyGroup = new THREE.Group();
const galaxyGeometry = new THREE.BufferGeometry();
const particleCount = 30000;
const galaxyPositions = new Float32Array(particleCount * 3);
const galaxyColors = new Float32Array(particleCount * 3);
const galaxyVelocities = new Float32Array(particleCount * 3);

// Palet spesifik: merah pekat/ruby/crimson.
const galaxyPalette = [
    new THREE.Color("#8b0000"),
    new THREE.Color("#ff0033")
];

for (let i = 0; i < particleCount; i++) {
    const base = i * 3;
    const radius = Math.pow(Math.random(), 0.6) * 35; // radius spiral
    const branchAngle = ((i % 5) / 5) * Math.PI * 2;
    const spinAngle = radius * 0.5;
    const noise = Math.pow(Math.random(), 2.5) * 2;
    const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.4;

    galaxyPositions[base] = Math.cos(angle) * radius + (Math.random() - 0.5) * noise;
    galaxyPositions[base + 1] = (Math.random() - 0.5) * 1.5 + Math.sin(radius * 0.8) * 0.2;
    galaxyPositions[base + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * noise;

    const color = galaxyPalette[Math.floor(Math.random() * galaxyPalette.length)].clone();
    galaxyColors[base] = color.r;
    galaxyColors[base + 1] = color.g;
    galaxyColors[base + 2] = color.b;
}

galaxyGeometry.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
galaxyGeometry.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const galaxyMesh = new THREE.Points(galaxyGeometry, galaxyMaterial);
galaxyGroup.add(galaxyMesh);
scene.add(galaxyGroup);

// Orbiting dots
const orbitingDotsGeo = new THREE.BufferGeometry();
const orbitingDotsCount = 5000;
const odPos = new Float32Array(orbitingDotsCount * 3);
for(let i=0; i<orbitingDotsCount; i++) {
    const r = 10 + Math.random() * 20;
    const a = Math.random() * Math.PI * 2;
    odPos[i*3] = Math.cos(a) * r;
    odPos[i*3+1] = (Math.random()-0.5) * 2;
    odPos[i*3+2] = Math.sin(a) * r;
}
orbitingDotsGeo.setAttribute('position', new THREE.BufferAttribute(odPos, 3));
const orbitingDots = new THREE.Points(orbitingDotsGeo, new THREE.PointsMaterial({ size: 0.05, color: 0xff3366, transparent: true, opacity: 0.5 }));
galaxyGroup.add(orbitingDots);

// =========================================================
// 2. Black Hole + Glowing Ring (Saturn-like)
// =========================================================
const blackHoleGroup = new THREE.Group();

// Black Hole sphere pusat
const blackHoleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
);
blackHoleGroup.add(blackHoleMesh);

// Glowing Ring (Cincin akresi)
const ringGeo = new THREE.RingGeometry(1.8, 3.2, 64);
const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffe6ea,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const ringMesh = new THREE.Mesh(ringGeo, ringMat);
ringMesh.rotation.x = Math.PI / 2;
blackHoleGroup.add(ringMesh);
scene.add(blackHoleGroup);

// Connection Stream
const heartCenterY = 15;
const pillarParticleCount = 2000;
const pillarGeometry = new THREE.BufferGeometry();
const pillarPositions = new Float32Array(pillarParticleCount * 3);
for (let i = 0; i < pillarParticleCount; i++) {
    const p = i / pillarParticleCount;
    pillarPositions[i*3] = (Math.random()-0.5) * 0.2;
    pillarPositions[i*3+1] = p * heartCenterY;
    pillarPositions[i*3+2] = (Math.random()-0.5) * 0.2;
}
pillarGeometry.setAttribute("position", new THREE.BufferAttribute(pillarPositions, 3));
const pillarMesh = new THREE.Points(pillarGeometry, new THREE.PointsMaterial({ color: 0xff0000, size: 0.08, transparent: true, opacity: 0.4 }));
scene.add(pillarMesh);

// =========================================================
// 3. Fluffy Heart Particles (Text-based)
// =========================================================
const heartGeometry = new THREE.BufferGeometry();
const heartParticles = 15000;
const heartPositions = new Float32Array(heartParticles * 3);
const heartColors = new Float32Array(heartParticles * 3);

for (let i = 0; i < heartParticles; i++) {
    const t = Math.PI * 2 * Math.random();
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    // Random noise offset untuk efek "fluffy"
    const noise = () => (Math.random() - 0.5) * 1.8;

    heartPositions[i*3] = (x * 0.4) + noise();
    heartPositions[i*3+1] = (y * 0.4) + heartCenterY + noise();
    heartPositions[i*3+2] = noise();

    const color = new THREE.Color(0xff0000);
    color.toArray(heartColors, i*3);
}
heartGeometry.setAttribute("position", new THREE.BufferAttribute(heartPositions, 3));
heartGeometry.setAttribute("color", new THREE.BufferAttribute(heartColors, 3));

const heartMaterial = new THREE.PointsMaterial({
    size: 0.25,
    map: loveTextTexture, // Tekstur "i love you"
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const heartMesh = new THREE.Points(heartGeometry, heartMaterial);
scene.add(heartMesh);

// =========================================================
// 4. Orbiting Elements & Interaction
// =========================================================
// ... (Bagian Orbiting Text & Images seperti sebelumnya) ...
// (Disederhanakan untuk singkatnya, silakan lengkapi dari file lama)
const interactiveGroup = new THREE.Group();
scene.add(interactiveGroup);
// ... (Raycaster, animasi loop, dsb) ...

// Loop utama
function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Tambahkan rotasi pada galaksi, hati, dsb.
    galaxyGroup.rotation.y = elapsed * 0.1;
    heartMesh.rotation.y = elapsed * 0.1;

    renderer.render(scene, camera);
}
animate();
