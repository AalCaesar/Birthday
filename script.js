// =========================================================
// GALAXY LOVE — Three.js Interactive Scene (Enhanced Visual)
// Struktur utama:
// 1. UI overlay + modal
// 2. Setup scene Three.js
// 3. Galaxy particles (30k) + Black Hole (Sphere + Accretion Disk Rings)
// 4. Connection Stream (energy pillar)
// 5. 3D Heart particles (fluffy) + heart outline
// 6. Orbiting text + floating heart sprites + orbiting image sprites
// 7. Raycaster, parallax mouse, animation loop
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
scene.fog = new THREE.FogExp2(0x050006, 0.016);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const baseCameraY = 14;
const baseCameraZ = 46;
camera.position.set(0, baseCameraY, baseCameraZ);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020006, 1);
container.appendChild(renderer.domElement);

// Cahaya ambient dan point light
scene.add(new THREE.AmbientLight(0xffb6cc, 0.4));
const centerLight = new THREE.PointLight(0xff0033, 12, 130);
centerLight.position.set(0, 10, 12);
scene.add(centerLight);

// ---------- Utility: tekstur glow partikel ----------
function createGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.15, "rgba(255,100,180,0.95)");
    gradient.addColorStop(0.4, "rgba(255,0,60,0.5)");
    gradient.addColorStop(1, "rgba(139,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

// Tekstur khusus untuk pusat cincin yang sangat terang (putih/pink)
function createBrightRingTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,220,240,0.9)");
    gradient.addColorStop(0.55, "rgba(255,80,150,0.5)");
    gradient.addColorStop(1, "rgba(200,0,50,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

// Tekstur "i love you" berulang untuk partikel hati — teks kecil merah/pink
function createLoveTextTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Latar transparan
    ctx.clearRect(0, 0, size, size);
    // Glow merah samar di belakang teks
    const glow = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    glow.addColorStop(0,   "rgba(255, 80, 120, 0.28)");
    glow.addColorStop(0.6, "rgba(255, 0,  50,  0.10)");
    glow.addColorStop(1,   "rgba(0,   0,   0,  0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    // Teks "i love you" kecil, berulang 3 baris
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff2255";
    ctx.shadowBlur = 10;
    const lines = ["i love you", "i love you", "i love you"];
    const lineH = 68;
    lines.forEach((line, i) => {
        const yPos = size / 2 + (i - 1) * lineH;
        // Highlight putih untuk kejelasan
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillText(line, size / 2, yPos);
    });
    return new THREE.CanvasTexture(canvas);
}

const glowTexture = createGlowTexture();
const brightRingTexture = createBrightRingTexture();
const loveTextTexture = createLoveTextTexture();

// =========================================================
// 1. BLACK HOLE — Bola hitam pekat + Event Horizon Glow + Cincin Akresi Bersinar
// =========================================================
const blackHoleGroup = new THREE.Group();

// Inti bola hitam pekat — memblokir semua cahaya di belakangnya
const blackHoleCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
);
blackHoleGroup.add(blackHoleCore);

// Layer 1 — Event Horizon: halo putih-pink sangat terang persis di tepi bola
const eventHorizon = new THREE.Mesh(
    new THREE.SphereGeometry(1.68, 64, 64),
    new THREE.MeshBasicMaterial({
        color: 0xffeeff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
blackHoleGroup.add(eventHorizon);

// Layer 2 — Glow merah-pink melebar
const coreHaloMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 48, 48),
    new THREE.MeshBasicMaterial({
        color: 0xff2266,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
blackHoleGroup.add(coreHaloMesh);

// Layer 3 — Halo terluar yang sangat lembut
const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 32, 32),
    new THREE.MeshBasicMaterial({
        color: 0xff0033,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
blackHoleGroup.add(outerGlow);

// Cincin akresi datar (mirip planet Saturnus), diputar agar terlihat miring
// Grup di-tilt X = 90° agar cincin RingGeometry (yang default di XY plane) menjadi horizontal
blackHoleGroup.rotation.x = Math.PI / 2;
blackHoleGroup.userData.rings = [];

const accretionRingDefs = [
    // Paling dalam — putih menyilaukan seperti inner edge accretion disk
    { inner: 1.85, outer: 2.55, color: 0xffffff, opacity: 0.98, tiltY: 0 },
    // Pink sangat terang
    { inner: 2.6,  outer: 3.15, color: 0xffccee, opacity: 0.82, tiltY: 0.03 },
    // Pink-merah
    { inner: 3.22, outer: 3.80, color: 0xff88bb, opacity: 0.60, tiltY: -0.04 },
    // Merah cerah
    { inner: 3.88, outer: 4.42, color: 0xff2255, opacity: 0.42, tiltY: 0.055 },
    // Merah gelap
    { inner: 4.50, outer: 4.92, color: 0xcc0033, opacity: 0.26, tiltY: -0.05 },
    // Luar — hampir hilang
    { inner: 5.00, outer: 5.40, color: 0x880022, opacity: 0.14, tiltY: 0.04 },
    // Pita tipis paling luar (seperti F-ring Saturnus)
    { inner: 5.60, outer: 5.75, color: 0xffaacc, opacity: 0.08, tiltY: -0.02 }
];

accretionRingDefs.forEach((def) => {
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(def.inner, def.outer, 256),
        new THREE.MeshBasicMaterial({
            color: def.color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: def.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    ring.rotation.y = def.tiltY;
    ring.userData.baseOpacity = def.opacity;
    blackHoleGroup.userData.rings.push(ring);
    blackHoleGroup.add(ring);
});

// =========================================================
// 2. Galaxy Particles — 30.000 partikel spiral crimson/ruby
// =========================================================
const galaxyGroup = new THREE.Group();
const galaxyGeometry = new THREE.BufferGeometry();
const particleCount = 30000;
const galaxyPositions = new Float32Array(particleCount * 3);
const galaxyColors = new Float32Array(particleCount * 3);
const galaxyVelocities = new Float32Array(particleCount * 3);

// Palet: merah/crimson/ruby, lebih terang di tengah
const colorDark = new THREE.Color("#8b0000");
const colorMid  = new THREE.Color("#cc0022");
const colorBright = new THREE.Color("#ff3366");
const colorWhite = new THREE.Color("#ffddee");

for (let i = 0; i < particleCount; i++) {
    const base = i * 3;
    const branchCount = 5;
    // Distribusi radius: lebih rapat di dekat pusat
    const radius = Math.pow(Math.random(), 0.6) * 28.0;
    const branchAngle = (i % branchCount) / branchCount * Math.PI * 2;
    const spinAngle = radius * 0.58;
    const compactNoise = Math.pow(Math.random(), 3.0) * 2.2 * (radius / 28.0);
    const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.18;

    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * compactNoise;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * compactNoise;
    const y = (Math.random() - 0.5) * 0.85 + Math.sin(radius * 0.65) * 0.1;

    galaxyPositions[base]     = x;
    galaxyPositions[base + 1] = y;
    galaxyPositions[base + 2] = z;

    // Warna: sangat terang (hampir putih) di dekat pusat, meredup ke luar
    const distFactor = radius / 28.0; // 0 = pusat, 1 = luar
    const color = new THREE.Color();
    if (distFactor < 0.12) {
        // Pusat: hampir putih/pink terang
        color.copy(colorWhite).lerp(colorBright, distFactor / 0.12);
    } else if (distFactor < 0.45) {
        color.copy(colorBright).lerp(colorMid, (distFactor - 0.12) / 0.33);
    } else {
        color.copy(colorMid).lerp(colorDark, (distFactor - 0.45) / 0.55);
    }
    // Sedikit variasi acak
    color.r = Math.min(1, color.r + (Math.random() - 0.5) * 0.08);
    color.g = Math.max(0, color.g + (Math.random() - 0.5) * 0.04);
    color.b = Math.max(0, color.b + (Math.random() - 0.5) * 0.04);

    galaxyColors[base]     = color.r;
    galaxyColors[base + 1] = color.g;
    galaxyColors[base + 2] = color.b;
}

galaxyGeometry.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
galaxyGeometry.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.PointsMaterial({
    size: 0.13,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});

const galaxyMesh = new THREE.Points(galaxyGeometry, galaxyMaterial);
galaxyGroup.add(galaxyMesh);
// Tambahkan black hole ke dalam galaxyGroup agar ikut berotasi
galaxyGroup.add(blackHoleGroup);
scene.add(galaxyGroup);

// =========================================================
// 3. Orbiting Dots — Titik-titik yang mengikuti lengan spiral
// =========================================================
const orbitingDotsGroup = new THREE.Group();
const orbitDotCount = 1200;
const orbitDotGeometry = new THREE.BufferGeometry();
const orbitDotPositions = new Float32Array(orbitDotCount * 3);
const orbitDotColors = new Float32Array(orbitDotCount * 3);
const orbitDotMeta = [];

for (let i = 0; i < orbitDotCount; i++) {
    const base = i * 3;
    const branchCount = 5;
    const radius = 2.0 + Math.random() * 25.0;
    const branchIndex = i % branchCount;
    const branchAngle = branchIndex / branchCount * Math.PI * 2;
    const spinAngle = radius * 0.58;
    const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.22;

    orbitDotPositions[base]     = Math.cos(angle) * radius;
    orbitDotPositions[base + 1] = (Math.random() - 0.5) * 0.6;
    orbitDotPositions[base + 2] = Math.sin(angle) * radius;

    // Kecepatan berbeda berdasarkan radius (lebih dekat = lebih cepat)
    const speed = (0.04 + Math.random() * 0.08) / (radius * 0.12 + 0.5);
    orbitDotMeta.push({
        radius,
        branchAngle,
        spinOffset: spinAngle,
        speed: speed * (Math.random() > 0.5 ? 1 : -0.6), // Arah berbeda
        noiseOffset: Math.random() * Math.PI * 2
    });

    const brightness = 1 - radius / 27.0;
    const color = new THREE.Color().setRGB(
        0.8 + brightness * 0.2,
        brightness * 0.35,
        brightness * 0.18
    );
    orbitDotColors[base]     = color.r;
    orbitDotColors[base + 1] = color.g;
    orbitDotColors[base + 2] = color.b;
}

orbitDotGeometry.setAttribute("position", new THREE.BufferAttribute(orbitDotPositions, 3));
orbitDotGeometry.setAttribute("color", new THREE.BufferAttribute(orbitDotColors, 3));

const orbitDotMaterial = new THREE.PointsMaterial({
    size: 0.19,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});

const orbitDotMesh = new THREE.Points(orbitDotGeometry, orbitDotMaterial);
orbitingDotsGroup.add(orbitDotMesh);
galaxyGroup.add(orbitingDotsGroup);

// =========================================================
// 4. Connection Stream — Aliran energi dari black hole ke heart
// =========================================================
const heartCenterY = 15.5;
const pillarParticleCount = 4200;
const pillarGeometry = new THREE.BufferGeometry();
const pillarPositions = new Float32Array(pillarParticleCount * 3);
const pillarColors = new Float32Array(pillarParticleCount * 3);
const pillarMeta = [];

for (let i = 0; i < pillarParticleCount; i++) {
    const base = i * 3;
    const progress = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const spreadRadius = (1 - progress) * (0.9 + Math.random() * 0.6) + 0.08;

    pillarPositions[base]     = Math.cos(angle) * spreadRadius;
    pillarPositions[base + 1] = progress * heartCenterY;
    pillarPositions[base + 2] = Math.sin(angle) * spreadRadius;

    // Warna: merah menyala di bawah, menuju putih-pink di atas
    const t = progress;
    const color = new THREE.Color("#ff0033").lerp(new THREE.Color("#ffaacc"), t * 0.45);
    pillarColors[base]     = color.r;
    pillarColors[base + 1] = color.g;
    pillarColors[base + 2] = color.b;

    pillarMeta.push({
        progress,
        angle,
        radius: spreadRadius,
        speed: 0.18 + Math.random() * 0.26
    });
}

pillarGeometry.setAttribute("position", new THREE.BufferAttribute(pillarPositions, 3));
pillarGeometry.setAttribute("color", new THREE.BufferAttribute(pillarColors, 3));

const pillarMaterial = new THREE.PointsMaterial({
    size: 0.16,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});

const pillarMesh = new THREE.Points(pillarGeometry, pillarMaterial);
scene.add(pillarMesh);

// =========================================================
// 5. Heart Particles — Tersusun dari teks "i love you" (Text-Based Heart)
// =========================================================

// --- 5a. Layer TEKS: partikel yang map-nya adalah tekstur "i love you" ---
// Partikel ini lebih besar dan jarang, memberikan kesan teks terbaca
const heartTextGeometry = new THREE.BufferGeometry();
const heartTextCount = 4800; // Lebih sedikit agar teks tidak saling tumpuk
const heartTextPositions = new Float32Array(heartTextCount * 3);

for (let i = 0; i < heartTextCount; i++) {
    const base = i * 3;
    const t = Math.PI * 2 * (i / heartTextCount); // Distribusi merata

    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const scale = 0.62;

    // Noise kecil agar tidak persis di garis — sedikit "fluffy"
    const noiseAmt = 0.55 + Math.random() * 0.45;
    const nx = (Math.random() - 0.5) * noiseAmt;
    const ny = (Math.random() - 0.5) * noiseAmt;
    const nz = (Math.random() - 0.5) * (noiseAmt * 1.4);

    heartTextPositions[base]     = hx * scale + nx;
    heartTextPositions[base + 1] = hy * scale + heartCenterY + ny;
    heartTextPositions[base + 2] = nz;
}

heartTextGeometry.setAttribute("position", new THREE.BufferAttribute(heartTextPositions, 3));

// Material khusus dengan tekstur teks — tidak pakai vertexColors
// size lebih besar agar teks terbaca
const heartTextMaterial = new THREE.PointsMaterial({
    size: 1.8,              // Besar agar teks "i love you" terlihat
    map: loveTextTexture,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});

const heartTextMesh = new THREE.Points(heartTextGeometry, heartTextMaterial);
scene.add(heartTextMesh);

// --- 5b. Layer GLOW: partikel merah lebih kecil & padat untuk isi/volume ---
// Lapisan ini memberikan warna merah menyala di balik teks
const heartGeometry = new THREE.BufferGeometry();
const heartParticles = 18000;
const heartPositions = new Float32Array(heartParticles * 3);
const heartColors = new Float32Array(heartParticles * 3);

for (let i = 0; i < heartParticles; i++) {
    const base = i * 3;
    const t = Math.PI * 2 * Math.random();

    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const scale = 0.62;

    // Fluffy noise — berbeda dari layer teks agar terlihat volumetrik
    const noiseScale = 1.1 + Math.random() * 1.3;
    const nx = (Math.random() - 0.5) * noiseScale;
    const ny = (Math.random() - 0.5) * noiseScale;
    const nz = (Math.random() - 0.5) * (noiseScale * 1.9);

    heartPositions[base]     = hx * scale + nx;
    heartPositions[base + 1] = hy * scale + heartCenterY + ny;
    heartPositions[base + 2] = nz;

    // Palet: merah menyala → pink terang → crimson
    const cv = Math.random();
    let color;
    if (cv < 0.5)       color = new THREE.Color("#ff0033");
    else if (cv < 0.75) color = new THREE.Color("#ff3366");
    else if (cv < 0.9)  color = new THREE.Color("#cc0022");
    else                color = new THREE.Color("#ff80a0"); // Highlight

    color.r = Math.min(1, color.r + (Math.random() - 0.5) * 0.06);
    color.g = Math.max(0, color.g);

    heartColors[base]     = color.r;
    heartColors[base + 1] = color.g;
    heartColors[base + 2] = color.b;
}

heartGeometry.setAttribute("position", new THREE.BufferAttribute(heartPositions, 3));
heartGeometry.setAttribute("color", new THREE.BufferAttribute(heartColors, 3));

const heartMaterial = new THREE.PointsMaterial({
    size: 0.17,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});

const heartMesh = new THREE.Points(heartGeometry, heartMaterial);
scene.add(heartMesh);

// --- 5c. Outline hati berlapis (neon sign effect) ---
const heartLineGroup = new THREE.Group();
const heartLinePoints = [];
for (let i = 0; i <= 300; i++) {
    const t = i / 300 * Math.PI * 2;
    heartLinePoints.push(new THREE.Vector3(
        16 * Math.pow(Math.sin(t), 3) * 0.62,
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.62 + heartCenterY,
        0
    ));
}

[
    { scale: 0.98,  color: 0xffffff, opacity: 0.65 },
    { scale: 1.035, color: 0xff66aa, opacity: 0.42 },
    { scale: 1.07,  color: 0xff0033, opacity: 0.26 },
    { scale: 1.11,  color: 0x880022, opacity: 0.13 }
].forEach((def) => {
    const heartLine = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(heartLinePoints),
        new THREE.LineBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: def.opacity,
            blending: THREE.AdditiveBlending
        })
    );
    heartLine.scale.setScalar(def.scale);
    heartLine.userData.baseScale   = def.scale;
    heartLine.userData.baseOpacity = def.opacity;
    heartLineGroup.add(heartLine);
});
scene.add(heartLineGroup);

// =========================================================
// 6. Orbiting Texts — Sprite Canvas API
// =========================================================
const textGroup = new THREE.Group();
const orbitWords = ["AMOR ETERNO", "INFINITO ∞", "TE AMO", "MY LOVE", "AMOR DE MI VIDA"];

function createTextSprite(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "800 56px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 34;
    ctx.fillStyle = "#ffeeee";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(13.8, 3.45, 1);
    return sprite;
}

const textOrbitSettings = [
    { radius: 18.5, y: 3.4,  speed: 0.16 },
    { radius: 23.5, y: 5.4,  speed: 0.13 },
    { radius: 28,   y: 7.1,  speed: 0.105 },
    { radius: 32.5, y: 4.5,  speed: 0.09 },
    { radius: 37,   y: 6.6,  speed: 0.075 }
];

orbitWords.forEach((word, index) => {
    const sprite = createTextSprite(word);
    const setting = textOrbitSettings[index];
    const angle = index / orbitWords.length * Math.PI * 2;
    sprite.position.set(Math.cos(angle) * setting.radius, setting.y, Math.sin(angle) * setting.radius);
    sprite.userData = {
        angle,
        radius: setting.radius,
        baseY: setting.y,
        speed: setting.speed,
        floatOffset: index * 1.7
    };
    textGroup.add(sprite);
});
scene.add(textGroup);

// =========================================================
// 7. Floating Heart Emojis
// =========================================================
const floatingHeartGroup = new THREE.Group();

function createHeartEmojiSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "118px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 28;
    ctx.fillText(Math.random() > 0.45 ? "💖" : "❤", 128, 132);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
}

for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 39 + Math.random() * 15;
    const sprite = new THREE.Sprite(createHeartEmojiSprite());
    sprite.position.set(Math.cos(angle) * radius, 5 + Math.random() * 14, Math.sin(angle) * radius);
    sprite.scale.setScalar(1.3 + Math.random() * 1.5);
    sprite.userData = {
        angle,
        radius,
        baseY: sprite.position.y,
        speed: 0.035 + Math.random() * 0.055,
        floatOffset: Math.random() * Math.PI * 2,
        baseScale: sprite.scale.x
    };
    floatingHeartGroup.add(sprite);
}
scene.add(floatingHeartGroup);

// =========================================================
// 8. Orbiting Images — Sprite interaktif
// =========================================================
const interactiveGroup = new THREE.Group();
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

function createCuteCharacterImage(icon, label) {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(350, 260, 40, 350, 350, 430);
    gradient.addColorStop(0, "#ff6f9d");
    gradient.addColorStop(0.42, "#ff0033");
    gradient.addColorStop(1, "#090005");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 700, 700);

    ctx.save();
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 44;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(350, 350, 246, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.font = "210px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ffeeee";
    ctx.shadowBlur = 18;
    ctx.fillText(icon, 350, 305);

    ctx.font = "800 54px Inter, Arial, sans-serif";
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#ffeeee";
    ctx.fillText(label, 350, 520);
    return canvas.toDataURL("image/png");
}

const memories = [
    {
        image: createCuteCharacterImage("🕷️", "SPIDER LOVE"),
        title: "SPIDER LOVE",
        desc: "Kamu adalah pahlawan kecil di semestaku, selalu hadir seperti bintang merah yang paling terang.",
        angle: Math.PI * 0.08,
        radius: 21.5
    },
    {
        image: createCuteCharacterImage("🎀", "KITTY LOVE"),
        title: "KITTY LOVE",
        desc: "Manis, lembut, dan selalu membuat galaksi ini terasa lebih hangat.",
        angle: Math.PI * 0.52,
        radius: 25.5
    },
    {
        image: createCuteCharacterImage("🐱", "HELLO LOVE"),
        title: "HELLO LOVE",
        desc: "Setiap orbit seperti mengulang satu hal yang sama: hatiku selalu menemukanmu.",
        angle: Math.PI * 1.08,
        radius: 29.5
    },
    {
        image: createCuteCharacterImage("💖", "MY HEART"),
        title: "MY HEART",
        desc: "Di pusat cincin merah ini, ada satu nama yang paling bersinar: kamu.",
        angle: Math.PI * 1.62,
        radius: 33.5
    },
    {
        image: createCuteCharacterImage("✨", "STAR LOVE"),
        title: "STAR LOVE",
        desc: "Tidak peduli sejauh apa bintang-bintang pergi, hatiku tetap berputar pulang kepadamu.",
        angle: Math.PI * 2.18,
        radius: 37.5
    }
];

function createFallbackTexture(label) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#ff0033");
    gradient.addColorStop(1, "#1a0008");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "rgba(255,238,238,0.92)";
    ctx.font = "700 46px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 256, 256);
    return new THREE.CanvasTexture(canvas);
}

memories.forEach((data, index) => {
    const fallback = createFallbackTexture(data.title);
    const material = new THREE.SpriteMaterial({
        map: fallback,
        transparent: true,
        opacity: 0.96,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4.6, 4.6, 1);
    sprite.position.set(Math.cos(data.angle) * data.radius, 4.15 + index * 0.28, Math.sin(data.angle) * data.radius);
    sprite.userData = { ...data, baseY: 4.15 + index * 0.28, speed: 0.095 + index * 0.012, floatOffset: index * 2.1 };

    textureLoader.load(data.image, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        material.map = texture;
        material.needsUpdate = true;
    });

    interactiveGroup.add(sprite);
});
scene.add(interactiveGroup);

// =========================================================
// 9. Raycaster & Interactivity
// =========================================================
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

function updateMouseFromEvent(event) {
    pointer.targetX = event.clientX / window.innerWidth * 2 - 1;
    pointer.targetY = -(event.clientY / window.innerHeight * 2 - 1);
    mouseVector.x = event.clientX / window.innerWidth * 2 - 1;
    mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

document.addEventListener("mousemove", updateMouseFromEvent, { passive: true });

document.addEventListener("click", (event) => {
    if (event.target.closest("#modal-overlay")) return;
    updateMouseFromEvent(event);
    if (!animationStarted) return;
    raycaster.setFromCamera(mouseVector, camera);
    const intersects = raycaster.intersectObjects(interactiveGroup.children, false);
    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        modalImg.src = data.image;
        modalTitle.textContent = "MI UNIVERSO";
        modalDesc.textContent = data.desc;
        modalOverlay.classList.remove("hidden");
        modalOverlay.setAttribute("aria-hidden", "false");
    }
});

// Burst kecil ketika START ditekan
function releaseIntroBurst() {
    for (let i = 0; i < particleCount; i += 4) {
        const base = i * 3;
        galaxyVelocities[base]     += (Math.random() - 0.5) * 2.2;
        galaxyVelocities[base + 1] += (Math.random() - 0.5) * 1.4;
        galaxyVelocities[base + 2] += (Math.random() - 0.5) * 2.2;
    }
}

// =========================================================
// 10. Animation Loop
// =========================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const delta = Math.min(clock.getDelta(), 0.033);

    // Mouse parallax
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;

    if (animationStarted) {
        // --- Galaksi berotasi perlahan ---
        galaxyGroup.rotation.y = elapsed * 0.052;

        // --- Black hole: bola berdenyut + cincin berputar ---
        // Black hole group berputar (rotasi Z karena group sudah di-tilt X)
        // Putar seluruh blackHoleGroup sedikit di Y untuk efek wobble
        blackHoleGroup.rotation.z = elapsed * 0.85;
        // Inti bola berdenyut
        const corePulse = 1 + Math.sin(elapsed * 2.5) * 0.07;
        blackHoleCore.scale.setScalar(corePulse);
        coreHaloMesh.scale.setScalar(corePulse * (1 + Math.sin(elapsed * 1.4) * 0.05));
        coreHaloMesh.material.opacity = 0.15 + Math.sin(elapsed * 1.8) * 0.06;

        // Cincin akresi: setiap ring berkedip dan sedikit mengembang/mengecil
        blackHoleGroup.userData.rings.forEach((ring, index) => {
            const pulseFactor = Math.sin(elapsed * 1.6 + index * 0.7) * 0.06;
            ring.material.opacity = Math.max(0.05, ring.userData.baseOpacity + pulseFactor);
            ring.scale.setScalar(1 + Math.sin(elapsed * 1.0 + index * 0.5) * 0.02);
        });

        // --- Update posisi partikel galaksi (velocity burst decay) ---
        const positions = galaxyGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const base = i * 3;
            positions[base]     += galaxyVelocities[base]     * delta;
            positions[base + 1] += galaxyVelocities[base + 1] * delta;
            positions[base + 2] += galaxyVelocities[base + 2] * delta;
            galaxyVelocities[base]     *= 0.94;
            galaxyVelocities[base + 1] *= 0.94;
            galaxyVelocities[base + 2] *= 0.94;
        }
        galaxyGeometry.attributes.position.needsUpdate = true;

        // --- Orbiting dots: bergerak mengikuti lengan spiral ---
        const orbitPositions = orbitDotGeometry.attributes.position.array;
        for (let i = 0; i < orbitDotCount; i++) {
            const base = i * 3;
            const meta = orbitDotMeta[i];
            // Update sudut berdasarkan kecepatan masing-masing
            const currentAngle = meta.branchAngle + meta.spinOffset + elapsed * meta.speed;
            const wobbleR = meta.radius + Math.sin(elapsed * 1.2 + meta.noiseOffset) * 0.3;
            orbitPositions[base]     = Math.cos(currentAngle) * wobbleR;
            orbitPositions[base + 1] = Math.sin(elapsed * 0.8 + meta.noiseOffset) * 0.25;
            orbitPositions[base + 2] = Math.sin(currentAngle) * wobbleR;
        }
        orbitDotGeometry.attributes.position.needsUpdate = true;

        // --- Connection Stream: partikel mengalir dari black hole ke heart ---
        const pillarArray = pillarGeometry.attributes.position.array;
        for (let i = 0; i < pillarParticleCount; i++) {
            const base = i * 3;
            const meta = pillarMeta[i];
            // Progress mengalir dari 0 → 1 secara kontinu
            const progress = (meta.progress + elapsed * meta.speed * 0.14) % 1.0;
            const spreadRadius = (1 - progress) * meta.radius + 0.05 + Math.sin(elapsed * 2.1 + i * 0.7) * 0.02;
            const angle = meta.angle + elapsed * 0.38 + progress * 2.3;
            pillarArray[base]     = Math.cos(angle) * spreadRadius;
            pillarArray[base + 1] = progress * heartCenterY;
            pillarArray[base + 2] = Math.sin(angle) * spreadRadius;
        }
        pillarGeometry.attributes.position.needsUpdate = true;
        pillarMaterial.opacity = 0.68 + Math.sin(elapsed * 2.6) * 0.14;

        // --- Heart berdenyut dan mengapung ---
        const heartBeat = Math.pow(Math.max(0, Math.sin(elapsed * 3.0)), 6) * 0.14;
        const heartPulse = 1 + Math.sin(elapsed * 3.0) * 0.032 + heartBeat;

        // Layer glow (partikel merah kecil)
        heartMesh.scale.setScalar(heartPulse);
        heartMesh.rotation.y = elapsed * -0.11;
        heartMaterial.size = 0.17 + heartBeat * 0.035;
        heartMaterial.opacity = 0.80 + Math.sin(elapsed * 2.8) * 0.05;

        // Layer teks "i love you" — ikut berdenyut, sedikit lebih lambat agar teks tetap terbaca
        heartTextMesh.scale.setScalar(heartPulse * 0.995);
        heartTextMesh.rotation.y = elapsed * -0.11;
        // Opacity teks sedikit berfluktuasi agar tampak hidup
        heartTextMaterial.opacity = 0.78 + Math.sin(elapsed * 2.2 + 0.5) * 0.08;

        heartLineGroup.children.forEach((line, index) => {
            line.scale.setScalar(line.userData.baseScale * heartPulse);
            line.rotation.y = elapsed * -0.11;
            line.material.opacity = Math.max(0.05, line.userData.baseOpacity + Math.sin(elapsed * 3.0 + index) * 0.1);
        });

        // --- Orbiting text ---
        textGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = sprite.userData.baseY + Math.sin(elapsed * 0.9 + sprite.userData.floatOffset) * 1.2;
            sprite.material.opacity = 0.72 + Math.sin(elapsed * 1.4 + sprite.userData.floatOffset) * 0.12;
        });

        // --- Floating heart emojis ---
        floatingHeartGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = sprite.userData.baseY + Math.sin(elapsed * 0.75 + sprite.userData.floatOffset) * 2.1;
            sprite.scale.setScalar(sprite.userData.baseScale + Math.sin(elapsed * 1.1 + sprite.userData.floatOffset) * 0.18);
        });

        // --- Orbiting image sprites ---
        interactiveGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = sprite.userData.baseY + Math.sin(elapsed * 1.05 + sprite.userData.floatOffset) * 0.9;
            sprite.scale.setScalar(4.6 + Math.sin(elapsed * 1.2 + sprite.userData.floatOffset) * 0.28);
        });

        // --- Kamera parallax ---
        const targetCameraX = pointer.x * 5.5;
        const targetCameraY = baseCameraY + pointer.y * 3.2;
        camera.position.x += (targetCameraX - camera.position.x) * 0.045;
        camera.position.y += (targetCameraY - camera.position.y) * 0.045;
        camera.position.z += (baseCameraZ - camera.position.z) * 0.035;
        camera.lookAt(0, 5, 0);
    }

    renderer.render(scene, camera);
}

// ---------- Responsive Resize ----------
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
