// =========================================================
// GALAXY LOVE — Three.js Interactive Scene
// Struktur utama:
// 1. UI overlay + modal
// 2. Setup scene Three.js
// 3. Galaxy particles + black hole
// 4. 3D heart particles
// 5. Orbiting text + orbiting image sprites
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
const centerLight = new THREE.PointLight(0xff173d, 8, 120);
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
    gradient.addColorStop(0.18, "rgba(255,115,155,0.95)");
    gradient.addColorStop(0.45, "rgba(255,23,61,0.45)");
    gradient.addColorStop(1, "rgba(255,23,61,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

const glowTexture = createGlowTexture();

// =========================================================
// 1. Galaxy Particles — 15.000 partikel spiral merah/pink
// =========================================================
const galaxyGroup = new THREE.Group();
const galaxyGeometry = new THREE.BufferGeometry();
const particleCount = 15000;
const galaxyPositions = new Float32Array(particleCount * 3);
const galaxyColors = new Float32Array(particleCount * 3);
const galaxyVelocities = new Float32Array(particleCount * 3);

const galaxyColorA = new THREE.Color(0xff173d);
const galaxyColorB = new THREE.Color(0xff6f9d);
const galaxyColorC = new THREE.Color(0xffffff);

for (let i = 0; i < particleCount; i++) {
    const base = i * 3;
    const branchCount = 5;
    const radius = Math.pow(Math.random(), 0.58) * 36;
    const branchAngle = (i % branchCount) / branchCount * Math.PI * 2;
    const spinAngle = radius * 0.38;
    const randomSpread = Math.pow(Math.random(), 2.2) * 4.2;
    const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.35;

    galaxyPositions[base] = Math.cos(angle) * radius + (Math.random() - 0.5) * randomSpread;
    galaxyPositions[base + 1] = (Math.random() - 0.5) * 1.7 + Math.sin(radius * 0.55) * 0.22;
    galaxyPositions[base + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * randomSpread;

    const mixed = galaxyColorA.clone().lerp(galaxyColorB, Math.random());
    if (Math.random() > 0.92) mixed.lerp(galaxyColorC, 0.65);
    galaxyColors[base] = mixed.r;
    galaxyColors[base + 1] = mixed.g;
    galaxyColors[base + 2] = mixed.b;
}

galaxyGeometry.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
galaxyGeometry.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.PointsMaterial({
    size: 0.16,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const galaxyMesh = new THREE.Points(galaxyGeometry, galaxyMaterial);
galaxyGroup.add(galaxyMesh);
scene.add(galaxyGroup);

// =========================================================
// 2. Black Hole — Torus merah transparan di pusat galaksi
// =========================================================
const blackHole = new THREE.Mesh(
    new THREE.TorusGeometry(2.35, 0.38, 24, 120),
    new THREE.MeshBasicMaterial({
        color: 0xff173d,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
blackHole.rotation.x = Math.PI / 2;
galaxyGroup.add(blackHole);

const blackHoleCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 48, 48),
    new THREE.MeshBasicMaterial({
        color: 0x070004,
        transparent: true,
        opacity: 0.9
    })
);
galaxyGroup.add(blackHoleCore);

// =========================================================
// 3. 3D Heart Particles — 3.000 partikel rumus parametrik hati
// =========================================================
const heartGeometry = new THREE.BufferGeometry();
const heartParticles = 3000;
const heartPositions = new Float32Array(heartParticles * 3);
const heartColors = new Float32Array(heartParticles * 3);

for (let i = 0; i < heartParticles; i++) {
    const base = i * 3;
    const t = Math.PI * 2 * Math.random();
    const fill = Math.pow(Math.random(), 0.42);

    // Rumus matematis bentuk hati.
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (Math.random() - 0.5) * (2.8 - fill);

    const scale = 0.62;
    heartPositions[base] = x * scale * fill;
    heartPositions[base + 1] = y * scale * fill + 15.2;
    heartPositions[base + 2] = z;

    const c = new THREE.Color(0xff173d).lerp(new THREE.Color(0xff9fbe), Math.random() * 0.55);
    heartColors[base] = c.r;
    heartColors[base + 1] = c.g;
    heartColors[base + 2] = c.b;
}

heartGeometry.setAttribute("position", new THREE.BufferAttribute(heartPositions, 3));
heartGeometry.setAttribute("color", new THREE.BufferAttribute(heartColors, 3));

const heartMaterial = new THREE.PointsMaterial({
    size: 0.22,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const heartMesh = new THREE.Points(heartGeometry, heartMaterial);
scene.add(heartMesh);

// Garis tipis outline hati untuk menambah kesan glow.
const heartLinePoints = [];
for (let i = 0; i <= 220; i++) {
    const t = i / 220 * Math.PI * 2;
    heartLinePoints.push(new THREE.Vector3(
        16 * Math.pow(Math.sin(t), 3) * 0.62,
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.62 + 15.2,
        0
    ));
}
const heartLine = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(heartLinePoints),
    new THREE.LineBasicMaterial({
        color: 0xff6f9d,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending
    })
);
scene.add(heartLine);

// =========================================================
// 4. Orbiting Texts — Sprite dari Canvas API
// =========================================================
const textGroup = new THREE.Group();
const orbitWords = ["AMOR ETERNO", "INFINITO ∞", "TE AMO", "MY LOVE", "PARA SIEMPRE"];

function createTextSprite(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "700 48px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff174f";
    ctx.shadowBlur = 28;
    ctx.fillStyle = "#ff9fbe";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12, 3, 1);
    return sprite;
}

orbitWords.forEach((word, index) => {
    const sprite = createTextSprite(word);
    const angle = index / orbitWords.length * Math.PI * 2;
    const radius = 18 + (index % 2) * 4;
    sprite.position.set(Math.cos(angle) * radius, 3 + Math.sin(index) * 2, Math.sin(angle) * radius);
    sprite.userData = { angle, radius, speed: 0.18 + index * 0.015, floatOffset: index * 1.7 };
    textGroup.add(sprite);
});
scene.add(textGroup);

// =========================================================
// 5. Orbiting Images — Sprite interaktif dengan userData
// =========================================================
const interactiveGroup = new THREE.Group();
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

const memories = [
    {
        image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=700&q=80",
        title: "AMOR ETERNO",
        desc: "Di antara jutaan bintang, kamu tetap menjadi cahaya favoritku.",
        angle: 0,
        radius: 15
    },
    {
        image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=700&q=80",
        title: "INFINITO ∞",
        desc: "Cinta kecil ini berputar seperti galaksi, pelan, indah, dan tidak pernah berhenti.",
        angle: Math.PI * 0.72,
        radius: 18
    },
    {
        image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=700&q=80",
        title: "MI UNIVERSO",
        desc: "Jika semesta punya pusat, maka hatiku selalu menemukanmu di sana.",
        angle: Math.PI * 1.44,
        radius: 16.5
    },
    {
        image: "https://images.unsplash.com/photo-1529254479751-faeedc59e78f?auto=format&fit=crop&w=700&q=80",
        title: "TE AMO",
        desc: "Setiap orbit, setiap detik, setiap bintang — semuanya seperti mengucapkan namamu.",
        angle: Math.PI * 2.15,
        radius: 19
    }
];

function createFallbackTexture(label) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#ff174f");
    gradient.addColorStop(1, "#21000a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
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
    sprite.scale.set(5.5, 5.5, 1);
    sprite.position.set(Math.cos(data.angle) * data.radius, 3.4, Math.sin(data.angle) * data.radius);
    sprite.userData = { ...data, speed: 0.12 + index * 0.018, floatOffset: index * 2.1 };

    // Ganti fallback dengan gambar asli jika berhasil diload.
    textureLoader.load(data.image, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        material.map = texture;
        material.needsUpdate = true;
    });

    interactiveGroup.add(sprite);
});
scene.add(interactiveGroup);

// =========================================================
// 6. Raycaster & Interactivity
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
        modalTitle.textContent = data.title;
        modalDesc.textContent = data.desc;
        modalOverlay.classList.remove("hidden");
        modalOverlay.setAttribute("aria-hidden", "false");
    }
});

// Burst kecil ketika START ditekan agar galaksi terasa hidup.
function releaseIntroBurst() {
    for (let i = 0; i < particleCount; i += 4) {
        const base = i * 3;
        galaxyVelocities[base] += (Math.random() - 0.5) * 2.2;
        galaxyVelocities[base + 1] += (Math.random() - 0.5) * 1.4;
        galaxyVelocities[base + 2] += (Math.random() - 0.5) * 2.2;
    }
}

// =========================================================
// 7. Animation Loop — berjalan penuh setelah START
// =========================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const delta = Math.min(clock.getDelta(), 0.033);

    // Mouse parallax tetap dihitung halus supaya kamera terasa responsive.
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;

    if (animationStarted) {
        // Rotasi galaksi dan black hole.
        galaxyGroup.rotation.y = elapsed * 0.055;
        blackHole.rotation.z = elapsed * 0.85;
        blackHoleCore.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.08);

        // Update posisi partikel galaksi dengan sedikit velocity burst.
        const positions = galaxyGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const base = i * 3;
            positions[base] += galaxyVelocities[base] * delta;
            positions[base + 1] += galaxyVelocities[base + 1] * delta;
            positions[base + 2] += galaxyVelocities[base + 2] * delta;
            galaxyVelocities[base] *= 0.94;
            galaxyVelocities[base + 1] *= 0.94;
            galaxyVelocities[base + 2] *= 0.94;
        }
        galaxyGeometry.attributes.position.needsUpdate = true;

        // Hati besar melayang dan berdenyut.
        const heartPulse = 1 + Math.sin(elapsed * 3.1) * 0.035 + Math.pow(Math.max(0, Math.sin(elapsed * 3.1)), 8) * 0.12;
        heartMesh.scale.setScalar(heartPulse);
        heartLine.scale.setScalar(heartPulse * 1.012);
        heartMesh.rotation.y = elapsed * -0.12;
        heartLine.rotation.y = elapsed * -0.12;
        heartLine.material.opacity = 0.58 + Math.sin(elapsed * 3.1) * 0.18;

        // Orbiting text mengelilingi galaksi.
        textGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = 3 + Math.sin(elapsed * 0.9 + sprite.userData.floatOffset) * 1.8;
            sprite.material.opacity = 0.62 + Math.sin(elapsed * 1.4 + sprite.userData.floatOffset) * 0.18;
        });

        // Orbiting images interaktif.
        interactiveGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = 2.6 + Math.sin(elapsed * 1.05 + sprite.userData.floatOffset) * 1.5;
            sprite.scale.setScalar(5.2 + Math.sin(elapsed * 1.2 + sprite.userData.floatOffset) * 0.35);
        });

        // Kamera parallax mengikuti cursor dengan smooth.
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
