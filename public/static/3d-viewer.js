/**
 * Advanced 3D Viewer Component
 * Inspired by Framer Import 3D with Three.js
 * Supports GLB/GLTF with auto-rotation, orbit controls, and glow effects
 */

class Advanced3DViewer {
    constructor(containerId, modelPath, options = {}) {
        console.log('🎨 Advanced3DViewer initializing...', containerId, modelPath);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`❌ Container #${containerId} not found`);
            return;
        }
        console.log('✅ Container found:', this.container);

        this.modelPath = modelPath;
        this.options = {
            autoRotate: options.autoRotate !== false,
            autoRotateSpeed: options.autoRotateSpeed || 2.0,
            cameraControls: options.cameraControls !== false,
            glow: options.glow !== false,
            glowIntensity: options.glowIntensity || 0.3,
            glowColor: options.glowColor || 0xC9A472, // Copper color
            backgroundColor: options.backgroundColor || 0xF5F4F2, // Cream
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.clock = null;
        this.composer = null;

        // Interactive effects - Sparkle colors
        this.sparkleColors = [
            0xFFD700, // Gold
            0xC9A472, // Copper
            0xFFFFFF, // White
            0xFFA500, // Orange
            0xFF6B35, // Bright orange
        ];
        this.totalRotation = 0;
        this.lastRotationAngle = 0;
        this.rotationMilestone = 0;
        this.isIlluminated = false;

        // Particle system
        this.particles = [];
        this.particleGeometry = null;
        this.particleMaterial = null;
        this.particleSystem = null;

        this.init();
        this.loadModel();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        if (this.options.transparentBackground) {
            this.scene.background = null;
        } else {
            this.scene.background = new THREE.Color(this.options.backgroundColor);
        }

        // Clock for animations
        this.clock = new THREE.Clock();

        // Camera setup
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting setup - Enhanced for better model appearance
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 5, 5);
        directionalLight1.castShadow = true;
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, 3, -5);
        this.scene.add(directionalLight2);

        // Rim light for glow effect
        if (this.options.glow) {
            const rimLight = new THREE.DirectionalLight(this.options.glowColor, 0.5);
            rimLight.position.set(0, 0, -5);
            this.scene.add(rimLight);
        }

        // Controls setup
        if (this.options.cameraControls && typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = this.options.minZoom || 2;
            this.controls.maxDistance = this.options.maxZoom || 8;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = this.options.autoRotateSpeed;
        }

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Click handler for color change
        if (this.options.interactive !== false) {
            this.renderer.domElement.addEventListener('click', (e) => this.onModelClick(e), false);
            this.renderer.domElement.style.cursor = 'pointer';
        }

        // Start animation loop
        this.animate();
    }

    onModelClick(event) {
        if (!this.model) return;

        // Créer une explosion d'étincelles légère
        this.createSparkles(12);

        // Petit pulse sur le modèle
        this.triggerPulse();
    }

    createSparkles(count) {
        // Limiter le nombre total de particules pour la performance
        const maxParticles = 30;
        if (this.particles.length > maxParticles) return;

        // Créer des étincelles simples (sans lumières individuelles)
        for (let i = 0; i < count; i++) {
            const sparkle = this.createSingleSparkle();
            this.particles.push(sparkle);
            this.scene.add(sparkle.mesh);
        }
    }

    createSingleSparkle() {
        // Géométrie ultra-légère (juste un point/sprite)
        const geometry = new THREE.PlaneGeometry(0.08, 0.08);
        const color = this.sparkleColors[Math.floor(Math.random() * this.sparkleColors.length)];
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position initiale
        mesh.position.set(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2
        );

        // Toujours face caméra
        mesh.lookAt(this.camera.position);

        // Vélocité vers l'extérieur
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.12,
            (Math.random() - 0.5) * 0.12 + 0.04,
            (Math.random() - 0.5) * 0.12
        );

        return {
            mesh,
            velocity,
            life: 1.0,
            decay: 0.025 + Math.random() * 0.015 // Disparition plus rapide
        };
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Mouvement
            p.mesh.position.add(p.velocity);
            p.velocity.y -= 0.003; // Gravité
            p.velocity.multiplyScalar(0.96); // Friction

            // Faire face à la caméra
            p.mesh.lookAt(this.camera.position);

            // Fade out
            p.life -= p.decay;
            p.mesh.material.opacity = p.life;
            p.mesh.scale.setScalar(0.5 + p.life * 0.5);

            // Cleanup
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    triggerPulse() {
        if (!this.model) return;

        const originalScale = this.model.scale.clone();
        const pulseScale = originalScale.clone().multiplyScalar(1.06);
        this.model.scale.copy(pulseScale);

        // Un seul flash léger
        const flashLight = new THREE.PointLight(0xFFD700, 1.5, 4);
        flashLight.position.set(0, 0, 2);
        this.scene.add(flashLight);

        let flashIntensity = 1.5;
        const fadeFlash = () => {
            flashIntensity *= 0.85;
            flashLight.intensity = flashIntensity;
            if (flashIntensity > 0.05) {
                requestAnimationFrame(fadeFlash);
            } else {
                this.scene.remove(flashLight);
            }
        };
        requestAnimationFrame(fadeFlash);

        // Scale back
        const startTime = performance.now();
        const animatePulse = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / 200, 1);
            this.model.scale.lerpVectors(pulseScale, originalScale, progress);
            if (progress < 1) requestAnimationFrame(animatePulse);
        };
        requestAnimationFrame(animatePulse);
    }

    triggerIllumination() {
        if (!this.model || this.isIlluminated) return;
        this.isIlluminated = true;

        // Étincelles en vagues légères
        this.createSparkles(15);
        setTimeout(() => this.createSparkles(10), 150);
        setTimeout(() => this.createSparkles(8), 300);

        // Un seul anneau de lumière (pas 8)
        const ringLight = new THREE.PointLight(0xFFD700, 2, 8);
        ringLight.position.set(0, 0, 0);
        this.scene.add(ringLight);

        let ringRadius = 0.5;
        const expandRing = () => {
            ringRadius += 0.15;
            ringLight.intensity = Math.max(0, 2 - ringRadius * 0.4);

            if (ringRadius < 5) {
                requestAnimationFrame(expandRing);
            } else {
                this.scene.remove(ringLight);
                this.isIlluminated = false;
            }
        };
        expandRing();
    }

    loadModel() {
        console.log('📦 Loading 3D model:', this.modelPath);
        const loader = new THREE.GLTFLoader();

        // Show loading indicator
        this.showLoading();

        loader.load(
            this.modelPath,
            (gltf) => {
                console.log('✅ Model loaded successfully!', gltf);
                this.model = gltf.scene;
                
                // Center and scale model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                
                this.model.scale.multiplyScalar(scale);
                this.model.position.sub(center.multiplyScalar(scale));

                // Enable shadows and prepare materials for color changes
                this.model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;

                        // Clone material to allow individual modifications
                        if (node.material) {
                            node.material = node.material.clone();
                            // Enable emissive for color change effects
                            node.material.emissive = new THREE.Color(this.options.glowColor || 0xC9A472);
                            node.material.emissiveIntensity = this.options.glow ? this.options.glowIntensity : 0.15;
                        }
                    }
                });

                // Add model to scene
                this.scene.add(this.model);
                
                // Setup animations if present
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    gltf.animations.forEach((clip) => {
                        this.mixer.clipAction(clip).play();
                    });
                }

                // Hide loading indicator
                this.hideLoading();
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                this.updateLoadingProgress(percent);
            },
            (error) => {
                console.error('❌ Error loading 3D model:', error);
                console.error('❌ Model path was:', this.modelPath);
                this.hideLoading();
                this.showError('Erreur lors du chargement du modèle 3D');
            }
        );
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Update controls
        if (this.controls) {
            this.controls.update();

            // Track rotation for illumination trigger
            if (this.options.interactive !== false && this.model) {
                const currentAngle = this.controls.getAzimuthalAngle();
                let angleDelta = currentAngle - this.lastRotationAngle;

                // Handle wrap-around
                if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
                if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

                this.totalRotation += Math.abs(angleDelta);
                this.lastRotationAngle = currentAngle;

                // Trigger illumination every full rotation (2π radians)
                const currentMilestone = Math.floor(this.totalRotation / (2 * Math.PI));
                if (currentMilestone > this.rotationMilestone) {
                    this.rotationMilestone = currentMilestone;
                    this.triggerIllumination();
                }
            }
        }

        // Update animations
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Update particle system (sparkles)
        if (this.particles.length > 0) {
            this.updateParticles();
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    showLoading() {
        const loader = document.createElement('div');
        loader.id = `${this.container.id}-loader`;
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #5A7D8C;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            text-align: center;
        `;
        loader.innerHTML = `
            <div style="margin-bottom: 10px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
            </div>
            <div>Chargement du modèle 3D...</div>
            <div id="${this.container.id}-progress" style="margin-top: 5px; font-size: 12px;">0%</div>
        `;
        this.container.style.position = 'relative';
        this.container.appendChild(loader);
    }

    hideLoading() {
        const loader = document.getElementById(`${this.container.id}-loader`);
        if (loader) {
            loader.remove();
        }
    }

    updateLoadingProgress(percent) {
        const progress = document.getElementById(`${this.container.id}-progress`);
        if (progress) {
            progress.textContent = `${Math.round(percent)}%`;
        }
    }

    showError(message) {
        const error = document.createElement('div');
        error.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #DC2626;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            text-align: center;
            padding: 20px;
        `;
        error.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px;"></i>
            <div>${message}</div>
        `;
        this.container.appendChild(error);
    }

    dispose() {
        // Cleanup
        if (this.controls) {
            this.controls.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
}

// Make it globally available
window.Advanced3DViewer = Advanced3DViewer;
