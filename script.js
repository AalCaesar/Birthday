// --- UI Interaksi ---
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('ui-overlay');
let animationStarted = false;

startBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    // Mulai animasi setelah jeda memudar
    setTimeout(() => {
        animationStarted = true;
    }, 1000); 
});

// --- Setup Three.js ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Posisi kamera awal
camera.position.set(0, 15, 50);
camera.lookAt(0, 0, 0);

// --- 1. Membuat Partikel Galaksi ---
const galaxyGroup = new THREE.Group();
const galaxyGeometry = new THREE.BufferGeometry();
const particleCount = 12000;
const posArray = new Float32Array(particleCount * 3);
const colorArray = new Float32Array(particleCount * 3);

const color1 = new THREE.Color(0xff66cc); // Pink
const color2 = new THREE.Color(0xffcc99); // Orange / Gold

for(let i = 0; i < particleCount * 3; i+=3) {
    const radius = Math.random() * 40;
    const spinAngle = radius * 0.5;
    const branchAngle = ((i/3) % 3) * ((Math.PI * 2) / 3);
    
    const randomX = (Math.random() - 0.5) * 5;
    const randomY = (Math.random() - 0.5) * 2; 
    const randomZ = (Math.random() - 0.5) * 5;

    posArray[i] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    posArray[i+1] = randomY;
    posArray[i+2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colorArray[i] = mixedColor.r;
    colorArray[i+1] = mixedColor.g;
    colorArray[i+2] = mixedColor.b;
}

galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const particleMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const galaxyMesh = new THREE.Points(galaxyGeometry, particleMaterial);
galaxyGroup.add(galaxyMesh);

// --- 2. Membuat "Black Hole" di tengah ---
const blackHoleGeo = new THREE.TorusGeometry(3.5, 1.5, 16, 100);
const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5 });
const blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
blackHole.rotation.x = Math.PI / 2;
galaxyGroup.add(blackHole);

scene.add(galaxyGroup);

// --- 3. Membuat Teks Mengorbit (Berdasarkan Video) ---
const textGroup = new THREE.Group();
const words = [
    "GALAXIES OF YOU", "ALWAYS WITH YOU", "EVERY HEARTBEAT COSMOS", 
    "ACROSS TIME", "INFINITE ∞", "ETERNAL LOVE", 
    "MY HEART IS YOURS", "POLAR STAR"
];

function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.font = 'bold 30px "Courier New", Courier, monospace';
    ctx.fillStyle = '#ff88cc'; // Warna pink teks
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(15, 3.75, 1); 
    return sprite;
}

words.forEach((word, index) => {
    const sprite = createTextSprite(word);
    const angle = (index / words.length) * Math.PI * 2;
    const radius = 15 + Math.random() * 10;
    
    sprite.position.x = Math.cos(angle) * radius;
    sprite.position.y = (Math.random() - 0.5) * 5 + 3; // Sedikit melayang di atas galaksi
    sprite.position.z = Math.sin(angle) * radius;
    
    textGroup.add(sprite);
});

scene.add(textGroup);

// --- 4. Membuat Gambar/Planet Mengorbit ---
const imageGroup = new THREE.Group();
const textureLoader = new THREE.TextureLoader();

// GANTI URL DI BAWAH DENGAN URL FOTO ANDA SENDIRI
const imageUrls = [
    "https://picsum.photos/200?random=1",
    "https://picsum.photos/200?random=2",
    "https://picsum.photos/200?random=3",
    "https://picsum.photos/200?random=4"
];

imageUrls.forEach((url, index) => {
    const geo = new THREE.SphereGeometry(1.5, 32, 32); // Berbentuk seperti planet bola
    const mat = new THREE.MeshBasicMaterial({ 
        map: textureLoader.load(url),
    });
    const sphere = new THREE.Mesh(geo, mat);
    
    const angle = (index / imageUrls.length) * Math.PI * 2 + 0.5; // Offset sudut
    const radius = 12 + Math.random() * 8;
    
    sphere.position.x = Math.cos(angle) * radius;
    sphere.position.y = (Math.random() - 0.5) * 4 + 2;
    sphere.position.z = Math.sin(angle) * radius;
    
    imageGroup.add(sphere);
});

scene.add(imageGroup);

// --- Fungsi Animasi ---
let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    if (animationStarted) {
        const elapsedTime = clock.getElapsedTime();
        
        // Memutar Galaksi
        galaxyGroup.rotation.y = elapsedTime * 0.05;
        
        // Memutar Grup Teks & Gambar secara perlahan
        textGroup.rotation.y = elapsedTime * 0.03;
        imageGroup.rotation.y = elapsedTime * 0.04;
        
        // Rotasi individu untuk gambar (planet berputar pada porosnya)
        imageGroup.children.forEach(sphere => {
            sphere.rotation.y += 0.01;
        });

        // Gerakan kamera sinematik pelan
        camera.position.x = Math.sin(elapsedTime * 0.1) * 10;
        camera.position.y = 15 + Math.sin(elapsedTime * 0.2) * 2;
        camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
}

// Tangani perubahan ukuran layar
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mulai
animate();