import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const mix = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

class NeonHeartfield {
    constructor() {
        this.canvas = document.querySelector("#webgl");
        this.modeLabel = document.querySelector("#modeLabel");
        this.particleLabel = document.querySelector("#particleLabel");
        this.igniteBtn = document.querySelector("#igniteBtn");
        this.morphBtn = document.querySelector("#morphBtn");

        this.clock = new THREE.Clock();
        this.pointer = new THREE.Vector2(0, 0);
        this.pointerTarget = new THREE.Vector2(0, 0);
        this.cameraTarget = new THREE.Vector3();
        this.cameraLookAt = new THREE.Vector3();
        this.isSmallScreen = window.matchMedia("(max-width: 720px)").matches;
        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.particleCount = this.reducedMotion ? 1600 : this.isSmallScreen ? 5200 : 9500;
        this.modes = ["heart", "galaxy", "rose"];
        this.modeIndex = 0;
        this.lastAutoMorph = 0;
        this.explosionPower = 0;

        this.initRenderer();
        this.initScene();
        this.createTargets();
        this.createHeartParticles();
        this.createBackgroundStars();
        this.createNeonHeartLines();
        this.createFloatingHearts();
        this.createCyberGrid();
        this.bindEvents();
        this.resize();
        this.animate();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setClearColor(0x020005, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x07000f, 0.055);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 80);
        this.camera.position.set(0, 1.3, 8.2);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.isSmallScreen ? 1.15 : 1.45,
            0.68,
            0.04
        );
        this.composer.addPass(this.bloomPass);

        this.afterimagePass = new AfterimagePass(this.reducedMotion ? 0.72 : 0.88);
        this.composer.addPass(this.afterimagePass);
    }

    initScene() {
        this.scene.add(new THREE.AmbientLight(0xffb7ef, 0.45));

        const pinkLight = new THREE.PointLight(0xff2bd6, 12, 12);
        pinkLight.position.set(-2.8, 2.4, 3.6);
        this.scene.add(pinkLight);

        const redLight = new THREE.PointLight(0xff174f, 10, 10);
        redLight.position.set(2.5, -0.5, 2.2);
        this.scene.add(redLight);

        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
    }

    createTargets() {
        this.targets = {
            heart: this.buildHeartTarget(),
            galaxy: this.buildGalaxyTarget(),
            rose: this.buildRoseTarget()
        };
        this.activeTarget = this.targets.heart;
    }

    buildHeartTarget() {
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const fill = Math.pow(Math.random(), 0.44);
            const jitter = (1 - fill) * 0.22;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const layer = (Math.random() - 0.5) * (0.8 + (1 - fill) * 1.3);
            const base = i * 3;

            positions[base] = x * 0.145 * fill + (Math.random() - 0.5) * jitter;
            positions[base + 1] = y * 0.145 * fill + 0.22 + (Math.random() - 0.5) * jitter;
            positions[base + 2] = layer;
        }

        return positions;
    }

    buildGalaxyTarget() {
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const branch = i % 5;
            const branchAngle = (branch / 5) * Math.PI * 2;
            const distance = Math.pow(Math.random(), 0.58) * 3.45;
            const spin = distance * 1.35;
            const randomRadius = Math.pow(Math.random(), 2.4) * 0.45;
            const angle = branchAngle + spin + (Math.random() - 0.5) * 0.46;
            const base = i * 3;

            positions[base] = Math.cos(angle) * distance + (Math.random() - 0.5) * randomRadius;
            positions[base + 1] = (Math.random() - 0.5) * 1.15 + Math.sin(distance * 2.1) * 0.22;
            positions[base + 2] = Math.sin(angle) * distance + (Math.random() - 0.5) * randomRadius;
        }

        return positions;
    }

    buildRoseTarget() {
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const petal = Math.sin(5 * t) * 1.25 + 1.65;
            const radius = petal * Math.pow(Math.random(), 0.48);
            const height = (Math.random() - 0.5) * 1.35 + Math.sin(t * 3) * 0.28;
            const twist = height * 0.55;
            const base = i * 3;

            positions[base] = Math.cos(t + twist) * radius;
            positions[base + 1] = height;
            positions[base + 2] = Math.sin(t + twist) * radius;
        }

        return positions;
    }

    createHeartParticles() {
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);

        const palette = [
            new THREE.Color(0xff2bd6),
            new THREE.Color(0xff174f),
            new THREE.Color(0xff78e4),
            new THREE.Color(0xff003c),
            new THREE.Color(0xffffff)
        ];

        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 3;
            const source = this.targets.galaxy;
            positions[base] = source[base] * 1.8 + (Math.random() - 0.5) * 8;
            positions[base + 1] = source[base + 1] * 1.8 + (Math.random() - 0.5) * 4;
            positions[base + 2] = source[base + 2] * 1.8 + (Math.random() - 0.5) * 8;

            const color = palette[Math.floor(Math.random() * palette.length)].clone();
            color.lerp(new THREE.Color(0xff2bd6), Math.random() * 0.42);
            colors[base] = color.r;
            colors[base + 1] = color.g;
            colors[base + 2] = color.b;
        }

        this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        this.particleMaterial = new THREE.PointsMaterial({
            size: this.isSmallScreen ? 0.035 : 0.028,
            map: this.createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.92,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(this.geometry, this.particleMaterial);
        this.mainGroup.add(this.particles);
        this.particleLabel.textContent = `${this.particleCount.toLocaleString()} neon particles`;
    }

    createGlowTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.18, "rgba(255,120,228,0.95)");
        gradient.addColorStop(0.42, "rgba(255,43,214,0.48)");
        gradient.addColorStop(1, "rgba(255,43,214,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    createBackgroundStars() {
        const starCount = this.isSmallScreen ? 900 : 1800;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const base = i * 3;
            positions[base] = (Math.random() - 0.5) * 38;
            positions[base + 1] = (Math.random() - 0.5) * 24;
            positions[base + 2] = -Math.random() * 28 - 2;

            const tint = new THREE.Color().setHSL(0.88 + Math.random() * 0.08, 1, 0.58 + Math.random() * 0.35);
            colors[base] = tint.r;
            colors[base + 1] = tint.g;
            colors[base + 2] = tint.b;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        this.stars = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                size: 0.018,
                map: this.createGlowTexture(),
                vertexColors: true,
                transparent: true,
                opacity: 0.68,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(this.stars);
    }

    createNeonHeartLines() {
        this.heartLines = new THREE.Group();
        const points = [];

        for (let i = 0; i <= 220; i++) {
            const t = (i / 220) * Math.PI * 2;
            points.push(new THREE.Vector3(
                16 * Math.pow(Math.sin(t), 3) * 0.145,
                (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.145 + 0.22,
                0.05
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const materials = [
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending }),
            new THREE.LineBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending }),
            new THREE.LineBasicMaterial({ color: 0xff174f, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
        ];

        materials.forEach((material, index) => {
            const line = new THREE.LineLoop(geometry, material);
            const scale = 1 + index * 0.052;
            line.scale.setScalar(scale);
            line.userData.baseScale = scale;
            this.heartLines.add(line);
        });

        this.mainGroup.add(this.heartLines);
    }

    createFloatingHearts() {
        this.floaters = new THREE.Group();
        const geometry = new THREE.ShapeGeometry(this.createHeartShape());

        for (let i = 0; i < 34; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: i % 3 === 0 ? 0xff174f : 0xff2bd6,
                transparent: true,
                opacity: 0.28 + Math.random() * 0.34,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const heart = new THREE.Mesh(geometry, material);
            heart.position.set((Math.random() - 0.5) * 9, Math.random() * 7 - 2.8, (Math.random() - 0.5) * 8 - 2);
            heart.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            heart.scale.setScalar(0.025 + Math.random() * 0.035);
            heart.userData = {
                speed: 0.13 + Math.random() * 0.22,
                drift: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.75,
                baseOpacity: material.opacity
            };
            this.floaters.add(heart);
        }

        this.scene.add(this.floaters);
    }

    createHeartShape() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 8);
        shape.bezierCurveTo(0, 8, -8, 0, -16, 5);
        shape.bezierCurveTo(-28, 13, -16, 31, 0, 40);
        shape.bezierCurveTo(16, 31, 28, 13, 16, 5);
        shape.bezierCurveTo(8, 0, 0, 8, 0, 8);
        return shape;
    }

    createCyberGrid() {
        const grid = new THREE.GridHelper(28, 42, 0xff2bd6, 0x5f153f);
        grid.position.y = -2.8;
        grid.material.transparent = true;
        grid.material.opacity = 0.22;
        grid.material.depthWrite = false;
        this.scene.add(grid);
    }

    bindEvents() {
        window.addEventListener("resize", () => this.resize());
        window.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
        window.addEventListener("pointerdown", (event) => {
            if (event.target.closest("button")) return;
            this.triggerExplosion(event);
        });

        this.igniteBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            this.triggerExplosion(event, 1.28);
        });

        this.morphBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            this.nextMode(true);
        });
    }

    onPointerMove(event) {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.pointerTarget.set(x, y);
    }

    triggerExplosion(_event, intensity = 1) {
        const positions = this.geometry.attributes.position.array;
        const outward = new THREE.Vector3();
        const pointerBias = new THREE.Vector3(this.pointer.x * 0.9, this.pointer.y * 0.55, 0.6);

        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 3;
            outward.set(positions[base], positions[base + 1], positions[base + 2]).normalize();
            outward.add(pointerBias).normalize();

            const force = (1.2 + Math.random() * 4.8) * intensity;
            this.velocities[base] += outward.x * force + (Math.random() - 0.5) * 1.8;
            this.velocities[base + 1] += outward.y * force + Math.random() * 2.2;
            this.velocities[base + 2] += outward.z * force + (Math.random() - 0.5) * 2.2;
        }

        this.explosionPower = 1;
        this.setMode("heart", "EXPLOSION");
    }

    nextMode(manual = false) {
        this.modeIndex = (this.modeIndex + 1) % this.modes.length;
        const mode = this.modes[this.modeIndex];
        this.setMode(mode, manual ? "MORPHING" : undefined);
    }

    setMode(mode, labelPrefix) {
        this.activeTarget = this.targets[mode];
        const label = labelPrefix || `${mode.toUpperCase()} MODE`;
        this.modeLabel.textContent = label;

        window.clearTimeout(this.modeTimeout);
        this.modeTimeout = window.setTimeout(() => {
            this.modeLabel.textContent = `${mode.toUpperCase()} MODE`;
        }, 1200);
    }

    updateParticles(delta, elapsed) {
        const positions = this.geometry.attributes.position.array;
        const target = this.activeTarget;
        const pull = this.explosionPower > 0.05 ? 0.018 : 0.034;
        const waveAmp = this.reducedMotion ? 0.004 : 0.024;
        const pointerPush = 0.18;

        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 3;
            const wave = Math.sin(elapsed * 2.25 + i * 0.017) * waveAmp;
            const depthWave = Math.cos(elapsed * 1.5 + i * 0.013) * waveAmp * 1.7;

            const tx = target[base] + this.pointer.x * pointerPush * Math.sin(i * 12.989);
            const ty = target[base + 1] + this.pointer.y * pointerPush * Math.cos(i * 7.331) + wave;
            const tz = target[base + 2] + depthWave;

            positions[base] += this.velocities[base] * delta;
            positions[base + 1] += this.velocities[base + 1] * delta;
            positions[base + 2] += this.velocities[base + 2] * delta;

            positions[base] += (tx - positions[base]) * pull;
            positions[base + 1] += (ty - positions[base + 1]) * pull;
            positions[base + 2] += (tz - positions[base + 2]) * pull;

            this.velocities[base] *= 0.95;
            this.velocities[base + 1] *= 0.95;
            this.velocities[base + 2] *= 0.95;
        }

        this.explosionPower *= 0.965;
        this.geometry.attributes.position.needsUpdate = true;
        this.particles.rotation.y = Math.sin(elapsed * 0.23) * 0.12 + this.pointer.x * 0.13;
        this.particles.rotation.x = Math.sin(elapsed * 0.17) * 0.08 - this.pointer.y * 0.08;
    }

    updateHeartLines(elapsed) {
        const beat = 1 + Math.sin(elapsed * 3.4) * 0.035 + Math.sin(elapsed * 7.1) * 0.012;
        this.heartLines.children.forEach((line, index) => {
            const glow = beat + index * 0.035;
            line.scale.setScalar(line.userData.baseScale * glow);
            line.rotation.z = Math.sin(elapsed * 0.9 + index) * 0.018;
            line.material.opacity = mix(0.35, 0.9, (Math.sin(elapsed * 2.6 + index) + 1) * 0.5) / (index + 1) + 0.18;
        });
    }

    updateFloaters(delta, elapsed) {
        this.floaters.children.forEach((heart, index) => {
            heart.position.y += heart.userData.speed * delta;
            heart.position.x += Math.sin(elapsed * 0.55 + heart.userData.drift) * delta * 0.22;
            heart.rotation.z += heart.userData.spin * delta;
            heart.rotation.y += (0.2 + index * 0.002) * delta;
            heart.material.opacity = heart.userData.baseOpacity * (0.72 + Math.sin(elapsed * 1.4 + index) * 0.28);

            if (heart.position.y > 4.5) {
                heart.position.y = -3.4;
                heart.position.x = (Math.random() - 0.5) * 9;
                heart.position.z = (Math.random() - 0.5) * 8 - 2;
            }
        });
    }

    updateCamera(elapsed) {
        const angle = elapsed * 0.13;
        const radius = this.isSmallScreen ? 8.9 : 7.3;
        const easedX = easeOutCubic((this.pointer.x + 1) * 0.5) * 2 - 1;
        const easedY = easeOutCubic((this.pointer.y + 1) * 0.5) * 2 - 1;

        this.cameraTarget.set(
            Math.sin(angle) * radius + easedX * 0.7,
            1.1 + easedY * 0.48 + Math.sin(elapsed * 0.27) * 0.14,
            Math.cos(angle) * radius + 0.8
        );
        this.camera.position.lerp(this.cameraTarget, 0.035);

        this.cameraLookAt.set(easedX * 0.22, 0.28 + easedY * 0.12, 0);
        this.camera.lookAt(this.cameraLookAt);
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = this.reducedMotion ? 1 : clamp(window.devicePixelRatio, 1, this.isSmallScreen ? 1.5 : 2);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(width, height, false);
        this.composer.setPixelRatio(pixelRatio);
        this.composer.setSize(width, height);
        this.bloomPass.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.033);
        const elapsed = this.clock.elapsedTime;

        this.pointer.lerp(this.pointerTarget, 0.075);

        if (!this.reducedMotion && elapsed - this.lastAutoMorph > 8.5) {
            this.lastAutoMorph = elapsed;
            this.nextMode(false);
        }

        this.updateParticles(delta, elapsed);
        this.updateHeartLines(elapsed);
        this.updateFloaters(delta, elapsed);
        this.updateCamera(elapsed);

        if (this.stars) {
            this.stars.rotation.y = elapsed * 0.018;
            this.stars.rotation.x = Math.sin(elapsed * 0.05) * 0.035;
        }

        this.mainGroup.rotation.z = Math.sin(elapsed * 0.18) * 0.018;
        this.composer.render();
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new NeonHeartfield();
});
