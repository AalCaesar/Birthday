import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

class CosmicGalaxyLove {
    constructor() {
        this.canvas = document.querySelector("#galaxyCanvas");
        this.hero = document.querySelector("#hero");
        this.openButton = document.querySelector("#openButton");
        this.messageCard = document.querySelector("#messageCard");
        this.closeCard = document.querySelector("#closeCard");
        this.clock = new THREE.Clock();
        this.pointer = new THREE.Vector2();
        this.pointerTarget = new THREE.Vector2();
        this.isMobile = window.matchMedia("(max-width: 720px)").matches;
        this.particleCount = this.isMobile ? 6500 : 14500;
        this.isSurpriseOpen = false;
        this.heartPulse = 0;

        this.setupRenderer();
        this.setupScene();
        this.createGalaxyParticles();
        this.createGlowingHeart();
        this.createFloatingLights();
        this.createShootingStars();
        this.bindEvents();
        this.resize();
        this.animate();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setClearColor(0x020003, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050004, 0.035);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 1.2, this.isMobile ? 9.5 : 8.2);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.055;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.42;
        this.controls.target.set(0, 0.6, 0);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.isMobile ? 1.25 : 1.55,
            0.75,
            0.04
        );
        this.composer.addPass(this.bloom);
        this.afterimage = new AfterimagePass(0.86);
        this.composer.addPass(this.afterimage);
    }

    setupScene() {
        this.scene.add(new THREE.AmbientLight(0xffb3bc, 0.55));

        const heartLight = new THREE.PointLight(0xff163d, 20, 18);
        heartLight.position.set(0, 2.1, 2.8);
        this.scene.add(heartLight);

        const rimLight = new THREE.PointLight(0xff5c76, 8, 20);
        rimLight.position.set(-4, -1.5, 3);
        this.scene.add(rimLight);

        const blueBackLight = new THREE.PointLight(0x3558ff, 4, 22);
        blueBackLight.position.set(4, 3, -7);
        this.scene.add(blueBackLight);

        this.galaxyGroup = new THREE.Group();
        this.heartGroup = new THREE.Group();
        this.heartGroup.position.set(0, 1.35, 0.12);
        this.scene.add(this.galaxyGroup, this.heartGroup);
    }

    createGlowTexture(colorA = "rgba(255,255,255,1)", colorB = "rgba(255,22,61,0.58)") {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, colorA);
        gradient.addColorStop(0.22, colorB);
        gradient.addColorStop(0.48, "rgba(255,22,61,0.24)");
        gradient.addColorStop(1, "rgba(255,22,61,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    createGalaxyParticles() {
        this.positions = new Float32Array(this.particleCount * 3);
        this.galaxyTargets = new Float32Array(this.particleCount * 3);
        this.heartTargets = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        const red = new THREE.Color(0xff163d);
        const softRed = new THREE.Color(0xff6b7e);
        const white = new THREE.Color(0xffffff);
        const blue = new THREE.Color(0x6985ff);

        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 3;
            const branch = i % 6;
            const radius = Math.pow(Math.random(), 0.55) * (this.isMobile ? 4.5 : 5.6);
            const branchAngle = (branch / 6) * Math.PI * 2;
            const spinAngle = radius * 1.45;
            const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.5;
            const randomRadius = Math.pow(Math.random(), 2.4) * 0.65;

            const gx = Math.cos(angle) * radius + (Math.random() - 0.5) * randomRadius;
            const gy = (Math.random() - 0.5) * 1.1 + Math.sin(radius * 2.2) * 0.18;
            const gz = Math.sin(angle) * radius + (Math.random() - 0.5) * randomRadius;

            this.positions[base] = gx;
            this.positions[base + 1] = gy;
            this.positions[base + 2] = gz;
            this.galaxyTargets[base] = gx;
            this.galaxyTargets[base + 1] = gy;
            this.galaxyTargets[base + 2] = gz;

            const t = Math.random() * Math.PI * 2;
            const fill = Math.pow(Math.random(), 0.44);
            const hx = 16 * Math.pow(Math.sin(t), 3) * 0.155 * fill;
            const hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.155 * fill + 1.35;
            const hz = (Math.random() - 0.5) * (0.55 + (1 - fill) * 0.8);
            this.heartTargets[base] = hx;
            this.heartTargets[base + 1] = hy;
            this.heartTargets[base + 2] = hz;

            const color = Math.random() > 0.72 ? white : Math.random() > 0.48 ? softRed : red;
            color.clone().lerp(blue, Math.random() * 0.18).toArray(colors, base);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        this.particleMaterial = new THREE.PointsMaterial({
            size: this.isMobile ? 0.032 : 0.026,
            map: this.createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.galaxyParticles = new THREE.Points(geometry, this.particleMaterial);
        this.galaxyGroup.add(this.galaxyParticles);
    }

    createGlowingHeart() {
        const points = [];
        for (let i = 0; i <= 260; i++) {
            const t = (i / 260) * Math.PI * 2;
            points.push(new THREE.Vector3(
                16 * Math.pow(Math.sin(t), 3) * 0.155,
                (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.155,
                0
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const layers = [
            { color: 0xffffff, opacity: 0.82, scale: 0.92 },
            { color: 0xff163d, opacity: 0.78, scale: 1 },
            { color: 0xff002b, opacity: 0.42, scale: 1.13 }
        ];

        layers.forEach((layer) => {
            const line = new THREE.LineLoop(
                geometry,
                new THREE.LineBasicMaterial({
                    color: layer.color,
                    transparent: true,
                    opacity: layer.opacity,
                    blending: THREE.AdditiveBlending
                })
            );
            line.scale.setScalar(layer.scale);
            line.userData.baseScale = layer.scale;
            line.userData.baseOpacity = layer.opacity;
            this.heartGroup.add(line);
        });

        const coreGeometry = new THREE.CircleGeometry(1.15, 96);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff163d,
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.scale.set(1.1, 0.96, 1);
        core.userData.baseOpacity = coreMaterial.opacity;
        this.heartCore = core;
        this.heartGroup.add(core);
    }

    createFloatingLights() {
        const count = this.isMobile ? 45 : 90;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const base = i * 3;
            positions[base] = (Math.random() - 0.5) * 10;
            positions[base + 1] = (Math.random() - 0.5) * 6;
            positions[base + 2] = (Math.random() - 0.5) * 8;
            new THREE.Color(Math.random() > 0.5 ? 0xff163d : 0xffffff).toArray(colors, base);
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        this.fireflies = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                size: 0.065,
                map: this.createGlowTexture("rgba(255,255,255,1)", "rgba(255,92,118,0.7)"),
                vertexColors: true,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(this.fireflies);
    }

    createShootingStars() {
        this.shootingStars = [];
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(-1.35, -0.18, 0)
            ]);
            const material = new THREE.LineBasicMaterial({
                color: i % 2 ? 0xff163d : 0xffffff,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });
            const star = new THREE.Line(geometry, material);
            star.userData = {
                delay: Math.random() * 6,
                speed: 2 + Math.random() * 1.8,
                life: 0
            };
            this.resetShootingStar(star, true);
            this.scene.add(star);
            this.shootingStars.push(star);
        }
    }

    resetShootingStar(star, randomDelay = false) {
        star.position.set(4 + Math.random() * 5, 1 + Math.random() * 4, -4 - Math.random() * 5);
        star.rotation.z = -0.2 - Math.random() * 0.22;
        star.userData.life = randomDelay ? -Math.random() * 6 : 0;
        star.material.opacity = 0;
    }

    bindEvents() {
        window.addEventListener("resize", () => this.resize());
        window.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
        window.addEventListener("click", (event) => this.createClickHeart(event));

        this.openButton.addEventListener("pointermove", (event) => this.updateButtonGlow(event));
        this.openButton.addEventListener("click", (event) => this.openSurprise(event));
        this.closeCard.addEventListener("click", (event) => {
            event.stopPropagation();
            this.messageCard.classList.remove("is-open");
            this.hero.classList.remove("is-hidden");
            this.isSurpriseOpen = false;
        });
    }

    onPointerMove(event) {
        this.pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointerTarget.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    updateButtonGlow(event) {
        const rect = this.openButton.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        this.openButton.style.setProperty("--x", `${x}%`);
        this.openButton.style.setProperty("--y", `${y}%`);
    }

    openSurprise(event) {
        event.stopPropagation();
        this.createRipple(event);
        this.hero.classList.add("is-hidden");
        window.setTimeout(() => {
            this.messageCard.classList.add("is-open");
            this.isSurpriseOpen = true;
            this.releaseGalaxyBurst(1.25);
        }, 320);
    }

    createRipple(event) {
        const rect = this.openButton.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        this.openButton.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
    }

    createClickHeart(event) {
        const amount = event.target.closest("button") ? 4 : 8;
        for (let i = 0; i < amount; i++) {
            const heart = document.createElement("span");
            heart.className = "click-heart";
            heart.textContent = Math.random() > 0.35 ? "❤" : "♡";
            heart.style.setProperty("--left", `${event.clientX + (Math.random() - 0.5) * 24}px`);
            heart.style.setProperty("--top", `${event.clientY + (Math.random() - 0.5) * 24}px`);
            heart.style.setProperty("--size", `${18 + Math.random() * 18}px`);
            heart.style.setProperty("--rotate", `${(Math.random() - 0.5) * 46}deg`);
            heart.style.setProperty("--drift-x", `${(Math.random() - 0.5) * 120}px`);
            heart.style.setProperty("--drift-y", `${90 + Math.random() * 120}px`);
            document.body.appendChild(heart);
            heart.addEventListener("animationend", () => heart.remove());
        }
    }

    releaseGalaxyBurst(intensity = 1) {
        for (let i = 0; i < this.particleCount; i += 3) {
            const base = i * 3;
            this.velocities[base] += (Math.random() - 0.5) * intensity * 3.6;
            this.velocities[base + 1] += (Math.random() - 0.5) * intensity * 3.2;
            this.velocities[base + 2] += (Math.random() - 0.5) * intensity * 3.6;
        }
    }

    updateGalaxy(delta, elapsed) {
        const positions = this.galaxyParticles.geometry.attributes.position.array;
        const targetBlend = this.isSurpriseOpen ? 0.62 + Math.sin(elapsed * 1.35) * 0.24 : 0.08 + Math.sin(elapsed * 0.45) * 0.05;
        const pull = this.isSurpriseOpen ? 0.036 : 0.018;
        const heartbeat = Math.pow(Math.max(0, Math.sin(elapsed * 3.2)), 9) * targetBlend;
        this.heartPulse = lerp(this.heartPulse, heartbeat, 0.08);

        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 3;
            const twinkle = Math.sin(elapsed * 1.8 + i * 0.013) * 0.035;
            const tx = lerp(this.galaxyTargets[base], this.heartTargets[base], targetBlend) + this.pointer.x * 0.16 * Math.sin(i);
            const ty = lerp(this.galaxyTargets[base + 1], this.heartTargets[base + 1] * (1 + this.heartPulse * 0.025), targetBlend) + twinkle + this.pointer.y * 0.12 * Math.cos(i);
            const tz = lerp(this.galaxyTargets[base + 2], this.heartTargets[base + 2], targetBlend) + Math.cos(elapsed + i) * 0.012;

            positions[base] += this.velocities[base] * delta;
            positions[base + 1] += this.velocities[base + 1] * delta;
            positions[base + 2] += this.velocities[base + 2] * delta;

            positions[base] += (tx - positions[base]) * pull;
            positions[base + 1] += (ty - positions[base + 1]) * pull;
            positions[base + 2] += (tz - positions[base + 2]) * pull;

            this.velocities[base] *= 0.945;
            this.velocities[base + 1] *= 0.945;
            this.velocities[base + 2] *= 0.945;
        }

        this.galaxyParticles.geometry.attributes.position.needsUpdate = true;
        this.galaxyGroup.rotation.y = elapsed * 0.075;
        this.galaxyGroup.rotation.x = Math.sin(elapsed * 0.18) * 0.12;
    }

    updateHeart(elapsed) {
        const pulse = 1 + Math.sin(elapsed * 3.2) * 0.045 + this.heartPulse * 0.18;
        this.heartGroup.scale.setScalar(pulse);
        this.heartGroup.rotation.z = Math.sin(elapsed * 0.7) * 0.025;
        this.heartGroup.rotation.y = Math.sin(elapsed * 0.43) * 0.08 + this.pointer.x * 0.045;

        this.heartGroup.children.forEach((child, index) => {
            if (!child.material) return;
            child.material.opacity = (child.userData.baseOpacity || 0.1) + this.heartPulse * (index === 0 ? 0.16 : 0.28);
        });
    }

    updateFloatingLights(elapsed) {
        if (!this.fireflies) return;
        const positions = this.fireflies.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
            const base = i * 3;
            positions[base + 1] += Math.sin(elapsed * 0.7 + i) * 0.0009;
            positions[base] += Math.cos(elapsed * 0.55 + i * 0.7) * 0.0008;
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true;
        this.fireflies.rotation.y = elapsed * -0.035;
    }

    updateShootingStars(delta) {
        this.shootingStars.forEach((star) => {
            star.userData.life += delta;
            if (star.userData.life < star.userData.delay) return;

            star.position.x -= star.userData.speed * delta;
            star.position.y -= star.userData.speed * delta * 0.28;
            star.material.opacity = Math.sin(clamp((star.userData.life - star.userData.delay) * 2.1, 0, Math.PI)) * 0.8;

            if (star.position.x < -7 || star.position.y < -4) {
                this.resetShootingStar(star);
                star.userData.delay = 1 + Math.random() * 5;
            }
        });
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const ratio = clamp(window.devicePixelRatio, 1, this.isMobile ? 1.5 : 2);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(ratio);
        this.renderer.setSize(width, height, false);
        this.composer.setPixelRatio(ratio);
        this.composer.setSize(width, height);
        this.bloom.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.033);
        const elapsed = this.clock.elapsedTime;

        this.pointer.lerp(this.pointerTarget, 0.075);
        this.controls.target.x = this.pointer.x * 0.14;
        this.controls.target.y = 0.6 + this.pointer.y * 0.08;
        this.controls.update();

        this.updateGalaxy(delta, elapsed);
        this.updateHeart(elapsed);
        this.updateFloatingLights(elapsed);
        this.updateShootingStars(delta);

        this.camera.position.x += (this.pointer.x * 0.42 - this.camera.position.x) * 0.018;
        this.bloom.strength = (this.isMobile ? 1.18 : 1.45) + this.heartPulse * 0.58;
        this.bloom.radius = 0.62 + this.heartPulse * 0.12;
        this.composer.render();
    }
}

function setupLetterReveal() {
    document.querySelectorAll("[data-letter-reveal]").forEach((element) => {
        const text = element.textContent;
        element.textContent = "";
        [...text].forEach((letter, index) => {
            const span = document.createElement("span");
            span.className = "char";
            span.style.setProperty("--i", index);
            span.textContent = letter === " " ? " " : letter;
            element.appendChild(span);
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    setupLetterReveal();
    new CosmicGalaxyLove();
});
