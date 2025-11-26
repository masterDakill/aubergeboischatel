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

        this.init();
        this.loadModel();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

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
            this.controls.minDistance = 1;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = this.options.autoRotateSpeed;
        }

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Start animation loop
        this.animate();
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

                // Enable shadows
                this.model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        
                        // Apply glow effect
                        if (this.options.glow && node.material) {
                            node.material.emissive = new THREE.Color(this.options.glowColor);
                            node.material.emissiveIntensity = this.options.glowIntensity;
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
        }

        // Update animations
        if (this.mixer) {
            this.mixer.update(delta);
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
