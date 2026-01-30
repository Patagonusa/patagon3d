/**
 * Patagon3d - 3D Scanning & AI Renovation System
 * Frontend Application
 */

class Patagon3d {
    constructor() {
        this.currentJobId = null;
        this.modelUrl = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.measureMode = false;
        this.measurePoints = [];
        this.selectedElements = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadJobsHistory();
        this.initThreeJS();
    }

    bindEvents() {
        // Video input
        const videoInput = document.getElementById('video-input');
        videoInput?.addEventListener('change', (e) => this.handleVideoSelect(e));

        // Upload button
        const uploadBtn = document.getElementById('upload-btn');
        uploadBtn?.addEventListener('click', () => this.uploadVideo());

        // Viewer controls
        document.getElementById('rotate-btn')?.addEventListener('click', () => this.toggleAutoRotate());
        document.getElementById('measure-btn')?.addEventListener('click', () => this.toggleMeasureMode());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetView());

        // Continue to design
        document.getElementById('continue-to-design')?.addEventListener('click', () => this.showSection('design-section'));

        // Element selection
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleElement(btn));
        });

        // Style presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset));
        });

        // Generate design
        document.getElementById('generate-design')?.addEventListener('click', () => this.generateDesign());
    }

    handleVideoSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const previewContainer = document.getElementById('video-preview');
        const previewVideo = document.getElementById('preview-video');

        previewVideo.src = URL.createObjectURL(file);
        previewContainer.classList.remove('hidden');
        this.selectedVideoFile = file;
    }

    async uploadVideo() {
        if (!this.selectedVideoFile) {
            this.showToast('Please select a video first', 'error');
            return;
        }

        const uploadBtn = document.getElementById('upload-btn');
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        uploadBtn.disabled = true;
        progressContainer.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', this.selectedVideoFile);

        try {
            // Simulate upload progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                progressFill.style.width = `${progress}%`;
            }, 500);

            const response = await fetch('/api/upload-video', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.currentJobId = data.job_id;
            progressText.textContent = 'Processing 3D model...';

            this.showToast('Video uploaded! Creating 3D model...', 'success');

            // Start polling for job status
            this.pollJobStatus();

        } catch (error) {
            console.error('Upload error:', error);
            this.showToast(error.message, 'error');
            uploadBtn.disabled = false;
            progressContainer.classList.add('hidden');
        }
    }

    async pollJobStatus() {
        if (!this.currentJobId) return;

        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');

        try {
            const response = await fetch(`/api/job/${this.currentJobId}`);
            const job = await response.json();

            if (job.status === 'completed') {
                progressFill.style.width = '100%';
                progressText.textContent = '3D Model ready!';
                this.modelUrl = job.model_url;

                this.showToast('3D Model created successfully!', 'success');

                // Load the 3D model
                setTimeout(() => {
                    this.showSection('model-section');
                    this.loadModel(job.model_url);
                }, 1000);

            } else if (job.status === 'failed') {
                progressText.textContent = `Failed: ${job.error}`;
                this.showToast(`Processing failed: ${job.error}`, 'error');
                document.getElementById('upload-btn').disabled = false;

            } else {
                // Still processing
                progressText.textContent = `Processing... (${job.status})`;
                setTimeout(() => this.pollJobStatus(), 3000);
            }

            // Update jobs history
            this.loadJobsHistory();

        } catch (error) {
            console.error('Poll error:', error);
            setTimeout(() => this.pollJobStatus(), 5000);
        }
    }

    initThreeJS() {
        const container = document.getElementById('model-viewer');
        if (!container) return;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e293b);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        // Grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        // Animation loop
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls?.update();
        this.renderer?.render(this.scene, this.camera);
    }

    handleResize() {
        const container = document.getElementById('model-viewer');
        if (!container || !this.camera || !this.renderer) return;

        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    loadModel(url) {
        if (!url) {
            // Demo: create a simple room model
            this.createDemoRoom();
            return;
        }

        const loader = new THREE.GLTFLoader();
        loader.load(
            url,
            (gltf) => {
                if (this.model) {
                    this.scene.remove(this.model);
                }
                this.model = gltf.scene;
                this.scene.add(this.model);

                // Center and scale model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3 / maxDim;
                this.model.scale.multiplyScalar(scale);
                this.model.position.sub(center.multiplyScalar(scale));

                this.showToast('3D Model loaded!', 'success');
            },
            (progress) => {
                console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
            },
            (error) => {
                console.error('Model load error:', error);
                this.createDemoRoom();
            }
        );
    }

    createDemoRoom() {
        // Create a simple demo room for testing
        const roomGroup = new THREE.Group();

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(4, 4);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        roomGroup.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });

        // Back wall
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), wallMaterial);
        backWall.position.set(0, 1.25, -2);
        roomGroup.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-2, 1.25, 0);
        roomGroup.add(leftWall);

        // Cabinets (simple boxes)
        const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.6), cabinetMaterial);
        cabinet.position.set(-1.5, 0.45, -1.5);
        roomGroup.add(cabinet);

        // Counter
        const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.7), counterMaterial);
        counter.position.set(-0.5, 0.92, -1.5);
        roomGroup.add(counter);

        if (this.model) {
            this.scene.remove(this.model);
        }
        this.model = roomGroup;
        this.scene.add(roomGroup);
    }

    toggleAutoRotate() {
        if (this.controls) {
            this.controls.autoRotate = !this.controls.autoRotate;
            document.getElementById('rotate-btn')?.classList.toggle('active');
        }
    }

    toggleMeasureMode() {
        this.measureMode = !this.measureMode;
        document.getElementById('measure-btn')?.classList.toggle('active');
        document.getElementById('measurement-panel')?.classList.toggle('hidden', !this.measureMode);

        if (this.measureMode) {
            this.showToast('Measure mode: Click two points', 'success');
        }
    }

    resetView() {
        if (this.camera && this.controls) {
            this.camera.position.set(0, 2, 5);
            this.controls.reset();
        }
    }

    toggleElement(btn) {
        btn.classList.toggle('selected');
        const element = btn.dataset.element;
        const index = this.selectedElements.indexOf(element);
        if (index > -1) {
            this.selectedElements.splice(index, 1);
        } else {
            this.selectedElements.push(element);
        }
    }

    applyPreset(preset) {
        const prompts = {
            modern: 'Clean lines, white cabinets, stainless steel appliances, minimalist hardware, grey quartz countertops',
            farmhouse: 'Shaker style cabinets in cream, farmhouse sink, butcher block island, oil-rubbed bronze fixtures, subway tile backsplash',
            transitional: 'Two-tone cabinets (white uppers, navy lowers), brushed nickel hardware, marble countertops, herringbone backsplash',
            contemporary: 'High-gloss lacquer cabinets, waterfall edge island, integrated appliances, dramatic pendant lighting, marble slab backsplash'
        };

        const promptInput = document.getElementById('design-prompt');
        if (promptInput && prompts[preset]) {
            promptInput.value = prompts[preset];
        }
    }

    async generateDesign() {
        const prompt = document.getElementById('design-prompt')?.value;
        if (!prompt) {
            this.showToast('Please describe your vision', 'error');
            return;
        }

        if (this.selectedElements.length === 0) {
            this.showToast('Please select elements to modify', 'error');
            return;
        }

        const generateBtn = document.getElementById('generate-design');
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="spinner" style="width:24px;height:24px;margin:0"></div> Generating...';

        try {
            const response = await fetch('/api/renovate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_url: this.modelUrl,
                    prompt: prompt,
                    element_type: this.selectedElements.join(',')
                })
            });

            const data = await response.json();
            this.showToast('Design generation started!', 'success');

            // Show placeholder results for now
            this.showDesignResults([
                { title: 'Option 1 - Modern White', description: prompt.substring(0, 50) + '...' },
                { title: 'Option 2 - Contemporary', description: 'Alternative interpretation...' },
                { title: 'Option 3 - Premium', description: 'Luxury materials...' }
            ]);

        } catch (error) {
            console.error('Generate error:', error);
            this.showToast('Generation failed', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="btn-icon">✨</span> Generate AI Renovation';
        }
    }

    showDesignResults(proposals) {
        const resultsContainer = document.getElementById('ai-results');
        const grid = document.getElementById('proposals-grid');

        grid.innerHTML = proposals.map((p, i) => `
            <div class="proposal-card">
                <div style="height:200px;background:linear-gradient(135deg,#334155,#1e293b);display:flex;align-items:center;justify-content:center;font-size:48px;">
                    ${['🏠', '✨', '💎'][i]}
                </div>
                <div class="proposal-info">
                    <h4>${p.title}</h4>
                    <p>${p.description}</p>
                </div>
            </div>
        `).join('');

        resultsContainer.classList.remove('hidden');
    }

    async loadJobsHistory() {
        try {
            const response = await fetch('/api/jobs');
            const jobs = await response.json();

            const jobsList = document.getElementById('jobs-list');
            if (!jobsList) return;

            if (jobs.length === 0) {
                jobsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📹</div>
                        <p>No scans yet. Upload a video to get started!</p>
                    </div>
                `;
                return;
            }

            jobsList.innerHTML = jobs.slice(0, 5).map(job => `
                <div class="job-card" onclick="app.loadJob('${job.job_id}')">
                    <div class="job-thumbnail">
                        ${job.status === 'completed' ? '🏠' : job.status === 'processing' ? '⏳' : '📹'}
                    </div>
                    <div class="job-info">
                        <h4>Scan ${job.job_id.substring(0, 8)}</h4>
                        <p>${new Date(job.created_at).toLocaleString()}</p>
                    </div>
                    <span class="job-status ${job.status}">${job.status}</span>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    }

    loadJob(jobId) {
        this.currentJobId = jobId;
        fetch(`/api/job/${jobId}`)
            .then(res => res.json())
            .then(job => {
                if (job.status === 'completed' && job.model_url) {
                    this.modelUrl = job.model_url;
                    this.showSection('model-section');
                    this.loadModel(job.model_url);
                }
            });
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => {
            if (s.id === sectionId || s.id === 'history-section') {
                s.classList.remove('hidden');
            } else {
                s.classList.add('hidden');
            }
        });

        // Scroll to section
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize app
const app = new Patagon3d();
