// =========================================================
// GALAXY LOVE — Three.js Interactive Scene
// Struktur utama:
// 1. UI overlay + modal
// 2. Setup scene Three.js
// 3. Galaxy particles + black hole + light pillar
// 4. 3D heart particles
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

// ---------- Utility: tekstur glow partikel ----------
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

// =========================================================
// 1. Galaxy Particles — 20.000 partikel ruby/crimson spiral padat
// =========================================================
const galaxyGroup = new THREE.Group();
const galaxyGeometry = new THREE.BufferGeometry();
const particleCount = 20000;
const galaxyPositions = new Float32Array(particleCount * 3);
const galaxyColors = new Float32Array(particleCount * 3);
const galaxyVelocities = new Float32Array(particleCount * 3);

// Palet spesifik: merah pekat/ruby/crimson tanpa orange/gold.
const galaxyPalette = [
    new THREE.Color("#ff0000"),
    new THREE.Color("#8b0000"),
    new THREE.Color("#ff3366"),
    new THREE.Color("#ff0033")
];

for (let i = 0; i < particleCount; i++) {
    const base = i * 3;
    const branchCount = 6;
    const radius = Math.pow(Math.random(), 0.72) * 27.5; // radius lebih rapat dari versi sebelumnya
    const branchAngle = (i % branchCount) / branchCount * Math.PI * 2;
    const spinAngle = radius * 0.62;
    const compactNoise = Math.pow(Math.random(), 2.8) * 1.75;
    const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.2;

    galaxyPositions[base] = Math.cos(angle) * radius + (Math.random() - 0.5) * compactNoise;
    galaxyPositions[base + 1] = (Math.random() - 0.5) * 0.9 + Math.sin(radius * 0.7) * 0.12;
    galaxyPositions[base + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * compactNoise;

    const color = galaxyPalette[Math.floor(Math.random() * galaxyPalette.length)].clone();
    color.lerp(new THREE.Color("#ff3366"), Math.random() * 0.28);
    galaxyColors[base] = color.r;
    galaxyColors[base + 1] = color.g;
    galaxyColors[base + 2] = color.b;
}

galaxyGeometry.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
galaxyGeometry.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.PointsMaterial({
    size: 0.125,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const galaxyMesh = new THREE.Points(galaxyGeometry, galaxyMaterial);
galaxyGroup.add(galaxyMesh);
scene.add(galaxyGroup);

// =========================================================
// 2. Black Hole + Pilar Cahaya menuju Heart
// =========================================================
const blackHole = new THREE.Mesh(
    new THREE.TorusGeometry(2.35, 0.38, 24, 140),
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
blackHole.rotation.x = Math.PI / 2;
galaxyGroup.add(blackHole);

const blackHoleCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 48, 48),
    new THREE.MeshBasicMaterial({
        color: 0x050001,
        transparent: true,
        opacity: 0.94
    })
);
galaxyGroup.add(blackHoleCore);

// Pilar partikel merah yang menyembur dari pusat galaksi ke heart.
const heartCenterY = 15.2;
const pillarParticleCount = 2200;
const pillarGeometry = new THREE.BufferGeometry();
const pillarPositions = new Float32Array(pillarParticleCount * 3);
const pillarColors = new Float32Array(pillarParticleCount * 3);
const pillarMeta = [];

for (let i = 0; i < pillarParticleCount; i++) {
    const base = i * 3;
    const progress = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const radius = (1 - progress) * (0.95 + Math.random() * 0.7) + 0.12;

    pillarPositions[base] = Math.cos(angle) * radius;
    pillarPositions[base + 1] = progress * heartCenterY;
    pillarPositions[base + 2] = Math.sin(angle) * radius;

    const color = new THREE.Color("#ff0033").lerp(new THREE.Color("#ffeeee"), progress * 0.28);
    pillarColors[base] = color.r;
    pillarColors[base + 1] = color.g;
    pillarColors[base + 2] = color.b;
    pillarMeta.push({ progress, angle, radius, speed: 0.16 + Math.random() * 0.28 });
}

pillarGeometry.setAttribute("position", new THREE.BufferAttribute(pillarPositions, 3));
pillarGeometry.setAttribute("color", new THREE.BufferAttribute(pillarColors, 3));

const pillarMaterial = new THREE.PointsMaterial({
    size: 0.18,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const pillarMesh = new THREE.Points(pillarGeometry, pillarMaterial);
scene.add(pillarMesh);

// =========================================================
// 3. Heart Particles — heart tebal/volume merah menyala #ff0033
// =========================================================
const heartGeometry = new THREE.BufferGeometry();
const heartParticles = 5200;
const heartPositions = new Float32Array(heartParticles * 3);
const heartColors = new Float32Array(heartParticles * 3);

for (let i = 0; i < heartParticles; i++) {
    const base = i * 3;
    const t = Math.PI * 2 * Math.random();

    // Mayoritas partikel dibuat dekat outline agar siluet hati sangat jelas dan padat.
    const shell = Math.random() > 0.34 ? 0.82 + Math.random() * 0.22 : Math.pow(Math.random(), 0.34) * 0.86;
    const thickness = (Math.random() - 0.5) * 2.6 * (0.45 + shell * 0.75);
    const jitter = (Math.random() - 0.5) * 0.12;

    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const scale = 0.62;
    heartPositions[base] = x * scale * shell + jitter;
    heartPositions[base + 1] = y * scale * shell + heartCenterY;
    heartPositions[base + 2] = thickness;

    const color = new THREE.Color("#ff0033").lerp(new THREE.Color("#ff3366"), Math.random() * 0.18);
    heartColors[base] = color.r;
    heartColors[base + 1] = color.g;
    heartColors[base + 2] = color.b;
}

heartGeometry.setAttribute("position", new THREE.BufferAttribute(heartPositions, 3));
heartGeometry.setAttribute("color", new THREE.BufferAttribute(heartColors, 3));

const heartMaterial = new THREE.PointsMaterial({
    size: 0.2,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const heartMesh = new THREE.Points(heartGeometry, heartMaterial);
scene.add(heartMesh);

// Outline hati dibuat beberapa lapis agar terlihat tebal seperti neon sign.
const heartLineGroup = new THREE.Group();
const heartLinePoints = [];
for (let i = 0; i <= 260; i++) {
    const t = i / 260 * Math.PI * 2;
    heartLinePoints.push(new THREE.Vector3(
        16 * Math.pow(Math.sin(t), 3) * 0.62,
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.62 + heartCenterY,
        0
    ));
}

[0.98, 1.04, 1.11].forEach((scale, index) => {
    const heartLine = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(heartLinePoints),
        new THREE.LineBasicMaterial({
            color: index === 0 ? 0xffeeee : 0xff0033,
            transparent: true,
            opacity: index === 0 ? 0.72 : 0.42,
            blending: THREE.AdditiveBlending
        })
    );
    heartLine.scale.setScalar(scale);
    heartLine.userData.baseScale = scale;
    heartLine.userData.baseOpacity = heartLine.material.opacity;
    heartLineGroup.add(heartLine);
});
scene.add(heartLineGroup);

// =========================================================
// 4. Orbiting Texts — Sprite Canvas API putih/pink pudar
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
    ctx.letterSpacing = "2px";
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
    { radius: 18.5, y: 3.4, speed: 0.16 },
    { radius: 23.5, y: 5.4, speed: 0.13 },
    { radius: 28, y: 7.1, speed: 0.105 },
    { radius: 32.5, y: 4.5, speed: 0.09 },
    { radius: 37, y: 6.6, speed: 0.075 }
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
// 5. Floating Heart Emojis — Sprite kecil di luar orbit teks
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
// 6. Orbiting Images — Sprite interaktif dengan userData
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
// 7. Raycaster & Interactivity
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
// 8. Animation Loop — berjalan penuh setelah START
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
        blackHole.rotation.z = elapsed * 0.9;
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

        // Pilar cahaya: partikel mengalir ke atas dari black hole menuju heart.
        const pillarArray = pillarGeometry.attributes.position.array;
        for (let i = 0; i < pillarParticleCount; i++) {
            const base = i * 3;
            const meta = pillarMeta[i];
            const progress = (meta.progress + elapsed * meta.speed * 0.16) % 1;
            const radius = (1 - progress) * meta.radius + 0.06 + Math.sin(elapsed * 2.3 + i) * 0.025;
            const angle = meta.angle + elapsed * 0.36 + progress * 2.1;
            pillarArray[base] = Math.cos(angle) * radius;
            pillarArray[base + 1] = progress * heartCenterY;
            pillarArray[base + 2] = Math.sin(angle) * radius;
        }
        pillarGeometry.attributes.position.needsUpdate = true;
        pillarMaterial.opacity = 0.66 + Math.sin(elapsed * 2.4) * 0.12;

        // Hati besar melayang dan berdenyut.
        const heartPulse = 1 + Math.sin(elapsed * 3.1) * 0.035 + Math.pow(Math.max(0, Math.sin(elapsed * 3.1)), 8) * 0.12;
        heartMesh.scale.setScalar(heartPulse);
        heartMesh.rotation.y = elapsed * -0.12;
        heartMaterial.size = 0.2 + Math.pow(Math.max(0, Math.sin(elapsed * 3.1)), 8) * 0.035;

        heartLineGroup.children.forEach((line, index) => {
            line.scale.setScalar(line.userData.baseScale * heartPulse);
            line.rotation.y = elapsed * -0.12;
            line.material.opacity = line.userData.baseOpacity + Math.sin(elapsed * 3.1 + index) * 0.12;
        });

        // Orbiting text pada radius berbeda agar tidak bertabrakan.
        textGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = sprite.userData.baseY + Math.sin(elapsed * 0.9 + sprite.userData.floatOffset) * 1.2;
            sprite.material.opacity = 0.72 + Math.sin(elapsed * 1.4 + sprite.userData.floatOffset) * 0.12;
        });

        // Floating heart emojis di luar orbit teks.
        floatingHeartGroup.children.forEach((sprite) => {
            const angle = sprite.userData.angle + elapsed * sprite.userData.speed;
            sprite.position.x = Math.cos(angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(angle) * sprite.userData.radius;
            sprite.position.y = sprite.userData.baseY + Math.sin(elapsed * 0.75 + sprite.userData.floatOffset) * 2.1;
            sprite.scale.setScalar(sprite.userData.baseScale + Math.sin(elapsed * 1.1 + sprite.userData.floatOffset) * 0.18);
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
