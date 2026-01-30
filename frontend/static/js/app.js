/**
 * Patagon3d - 3D Scanning & AI Renovation System
 * Frontend Application with Advanced Measurement Tools
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
        this.selectedElements = [];

        // Measurement system
        this.measureMode = null; // null, 'distance', 'area', 'height'
        this.measurePoints = [];
        this.measurements = [];
        this.measurementObjects = []; // Three.js objects for visualization
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.tempLine = null;
        this.pointMarkers = [];

        // Scale factor (meters to feet) - can be calibrated
        this.scaleFactor = 3.28084; // 1 meter = 3.28084 feet
        this.modelScale = 1; // Will be set when model loads

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadJobsHistory();
        this.initThreeJS();
        this.loadSavedMeasurements();
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
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetView());

        // Measurement mode buttons
        document.getElementById('measure-distance-btn')?.addEventListener('click', () => this.setMeasureMode('distance'));
        document.getElementById('measure-area-btn')?.addEventListener('click', () => this.setMeasureMode('area'));
        document.getElementById('measure-height-btn')?.addEventListener('click', () => this.setMeasureMode('height'));
        document.getElementById('clear-measurements-btn')?.addEventListener('click', () => this.clearMeasurements());
        document.getElementById('export-measurements-btn')?.addEventListener('click', () => this.exportMeasurements());
        document.getElementById('calibrate-btn')?.addEventListener('click', () => this.showCalibrationModal());

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

        // Calibration modal
        document.getElementById('apply-calibration')?.addEventListener('click', () => this.applyCalibration());
        document.getElementById('cancel-calibration')?.addEventListener('click', () => this.hideCalibrationModal());
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

                setTimeout(() => {
                    this.showSection('model-section');
                    this.loadModel(job.model_url);
                }, 1000);

            } else if (job.status === 'failed') {
                progressText.textContent = `Failed: ${job.error}`;
                this.showToast(`Processing failed: ${job.error}`, 'error');
                document.getElementById('upload-btn').disabled = false;

            } else {
                progressText.textContent = `Processing... (${job.status})`;
                setTimeout(() => this.pollJobStatus(), 3000);
            }

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
        this.scene.background = new THREE.Color(0x1a365d);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 3, 6);

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

        // Grid helper (1 unit = 1 foot for reference)
        const gridHelper = new THREE.GridHelper(20, 20, 0x4299e1, 0x2b6cb0);
        this.scene.add(gridHelper);

        // Click handler for measurements
        this.renderer.domElement.addEventListener('click', (e) => this.onModelClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));

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
                this.modelScale = 5 / maxDim;
                this.model.scale.multiplyScalar(this.modelScale);
                this.model.position.sub(center.multiplyScalar(this.modelScale));

                this.showToast('3D Model loaded! Use measurement tools to measure.', 'success');
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
        // Create a realistic demo kitchen for testing measurements
        // Scale: 1 unit = 1 foot
        const roomGroup = new THREE.Group();

        // Floor (12ft x 10ft kitchen)
        const floorGeometry = new THREE.PlaneGeometry(12, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.userData.type = 'floor';
        floor.userData.label = 'Kitchen Floor';
        roomGroup.add(floor);

        // Walls (8ft high)
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, side: THREE.DoubleSide });

        // Back wall
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), wallMaterial);
        backWall.position.set(0, 4, -5);
        backWall.userData.type = 'wall';
        roomGroup.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-6, 4, 0);
        leftWall.userData.type = 'wall';
        roomGroup.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(6, 4, 0);
        rightWall.userData.type = 'wall';
        roomGroup.add(rightWall);

        // Base cabinets (2ft deep, 3ft high, 8ft long)
        const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const baseCabinet = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 2), cabinetMaterial);
        baseCabinet.position.set(-1, 1.5, -4);
        baseCabinet.userData.type = 'cabinet';
        baseCabinet.userData.label = 'Base Cabinets';
        roomGroup.add(baseCabinet);

        // Countertop (2.1ft deep, 8.5ft long, 1.5 inches thick)
        const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const countertop = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.125, 2.1), counterMaterial);
        countertop.position.set(-1, 3.0625, -4);
        countertop.userData.type = 'countertop';
        countertop.userData.label = 'Kitchen Countertop';
        roomGroup.add(countertop);

        // Island (4ft x 3ft)
        const islandBase = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), cabinetMaterial);
        islandBase.position.set(0, 1.5, 1);
        islandBase.userData.type = 'island';
        islandBase.userData.label = 'Kitchen Island';
        roomGroup.add(islandBase);

        // Island countertop
        const islandTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.125, 3.5), counterMaterial);
        islandTop.position.set(0, 3.0625, 1);
        islandTop.userData.type = 'countertop';
        islandTop.userData.label = 'Island Countertop';
        roomGroup.add(islandTop);

        // Upper cabinets (1ft deep, 2.5ft high, 8ft long, mounted at 4.5ft)
        const upperCabinet = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 1), cabinetMaterial);
        upperCabinet.position.set(-1, 5.75, -4.5);
        upperCabinet.userData.type = 'cabinet';
        upperCabinet.userData.label = 'Upper Cabinets';
        roomGroup.add(upperCabinet);

        if (this.model) {
            this.scene.remove(this.model);
        }
        this.model = roomGroup;
        this.modelScale = 1; // Demo room is already in feet
        this.scene.add(roomGroup);

        this.showToast('Demo kitchen loaded (12ft x 10ft). Tap to measure!', 'success');
    }

    // ==================== MEASUREMENT SYSTEM ====================

    setMeasureMode(mode) {
        // Toggle off if same mode
        if (this.measureMode === mode) {
            this.measureMode = null;
            this.clearTempMeasurement();
            this.updateMeasureModeUI(null);
            this.showToast('Measurement mode off', 'success');
            return;
        }

        this.measureMode = mode;
        this.measurePoints = [];
        this.clearTempMeasurement();
        this.updateMeasureModeUI(mode);

        const instructions = {
            'distance': 'Tap 2 points to measure distance',
            'area': 'Tap corners to measure area (tap first point again to close)',
            'height': 'Tap floor then ceiling/top to measure height'
        };

        this.showToast(instructions[mode], 'success');
    }

    updateMeasureModeUI(mode) {
        document.querySelectorAll('.measure-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (mode) {
            document.getElementById(`measure-${mode}-btn`)?.classList.add('active');
        }

        const instruction = document.getElementById('measure-instruction');
        if (instruction) {
            const texts = {
                null: 'Select a measurement tool above',
                'distance': 'Tap 2 points to measure linear distance',
                'area': 'Tap corners clockwise, tap first point to close shape',
                'height': 'Tap bottom point, then top point'
            };
            instruction.textContent = texts[mode] || texts[null];
        }
    }

    onModelClick(event) {
        if (!this.measureMode) return;

        const container = this.renderer.domElement;
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.model, true);

        if (intersects.length > 0) {
            const point = intersects[0].point.clone();
            this.addMeasurePoint(point, intersects[0].object);
        }
    }

    onMouseMove(event) {
        if (!this.measureMode || this.measurePoints.length === 0) return;

        const container = this.renderer.domElement;
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.model, true);

        if (intersects.length > 0) {
            this.updateTempLine(intersects[0].point);
        }
    }

    addMeasurePoint(point, object) {
        // Add point marker
        const marker = this.createPointMarker(point);
        this.pointMarkers.push(marker);
        this.scene.add(marker);

        this.measurePoints.push({
            position: point,
            object: object
        });

        if (this.measureMode === 'distance') {
            if (this.measurePoints.length === 2) {
                this.completeMeasurement();
            }
        } else if (this.measureMode === 'height') {
            if (this.measurePoints.length === 2) {
                this.completeMeasurement();
            }
        } else if (this.measureMode === 'area') {
            // Check if clicking near first point to close polygon
            if (this.measurePoints.length > 2) {
                const firstPoint = this.measurePoints[0].position;
                const distance = point.distanceTo(firstPoint);
                if (distance < 0.3) { // Close threshold
                    this.measurePoints.pop(); // Remove duplicate point
                    this.scene.remove(this.pointMarkers.pop());
                    this.completeMeasurement();
                    return;
                }
            }
            this.updateAreaPreview();
        }
    }

    createPointMarker(position) {
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x4299e1 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        return sphere;
    }

    updateTempLine(currentPoint) {
        if (this.tempLine) {
            this.scene.remove(this.tempLine);
        }

        if (this.measurePoints.length === 0) return;

        const lastPoint = this.measurePoints[this.measurePoints.length - 1].position;

        const geometry = new THREE.BufferGeometry().setFromPoints([lastPoint, currentPoint]);
        const material = new THREE.LineBasicMaterial({ color: 0x63b3ed, linewidth: 2 });
        this.tempLine = new THREE.Line(geometry, material);
        this.scene.add(this.tempLine);
    }

    updateAreaPreview() {
        // Draw lines between all points
        if (this.measurePoints.length < 2) return;

        // Clear previous preview lines
        this.clearTempMeasurement();

        const points = this.measurePoints.map(p => p.position);

        for (let i = 0; i < points.length - 1; i++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1]]);
            const material = new THREE.LineBasicMaterial({ color: 0x4299e1, linewidth: 2 });
            const line = new THREE.Line(geometry, material);
            line.userData.temp = true;
            this.scene.add(line);
        }
    }

    clearTempMeasurement() {
        if (this.tempLine) {
            this.scene.remove(this.tempLine);
            this.tempLine = null;
        }

        // Remove temp lines
        this.scene.children.filter(c => c.userData?.temp).forEach(c => this.scene.remove(c));

        // Remove point markers
        this.pointMarkers.forEach(m => this.scene.remove(m));
        this.pointMarkers = [];
    }

    completeMeasurement() {
        let measurement = null;

        if (this.measureMode === 'distance' || this.measureMode === 'height') {
            const p1 = this.measurePoints[0].position;
            const p2 = this.measurePoints[1].position;

            let distance;
            if (this.measureMode === 'height') {
                // Only measure vertical distance
                distance = Math.abs(p2.y - p1.y);
            } else {
                distance = p1.distanceTo(p2);
            }

            // Convert to feet (model units may vary)
            const distanceFeet = distance * this.scaleFactor / this.modelScale;
            const feet = Math.floor(distanceFeet);
            const inches = Math.round((distanceFeet - feet) * 12);

            measurement = {
                id: Date.now(),
                type: this.measureMode,
                points: this.measurePoints.map(p => ({ x: p.position.x, y: p.position.y, z: p.position.z })),
                value: distanceFeet,
                displayValue: `${feet}' ${inches}"`,
                label: this.measureMode === 'height' ? 'Height' : 'Distance',
                timestamp: new Date().toISOString()
            };

            // Create permanent line
            this.createMeasurementLine(p1, p2, measurement.displayValue);

        } else if (this.measureMode === 'area') {
            const points = this.measurePoints.map(p => p.position);
            const area = this.calculatePolygonArea(points);

            // Convert to square feet
            const areaSqFt = area * Math.pow(this.scaleFactor / this.modelScale, 2);

            measurement = {
                id: Date.now(),
                type: 'area',
                points: this.measurePoints.map(p => ({ x: p.position.x, y: p.position.y, z: p.position.z })),
                value: areaSqFt,
                displayValue: `${areaSqFt.toFixed(1)} sq ft`,
                label: 'Area',
                timestamp: new Date().toISOString()
            };

            // Create permanent polygon outline
            this.createAreaVisualization(points, measurement.displayValue);
        }

        if (measurement) {
            this.measurements.push(measurement);
            this.updateMeasurementsList();
            this.saveMeasurements();
            this.showToast(`Measured: ${measurement.displayValue}`, 'success');
        }

        // Reset for next measurement
        this.clearTempMeasurement();
        this.measurePoints = [];
    }

    calculatePolygonArea(points) {
        // Project to XZ plane (floor) and calculate area using Shoelace formula
        if (points.length < 3) return 0;

        let area = 0;
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].z;
            area -= points[j].x * points[i].z;
        }

        return Math.abs(area) / 2;
    }

    createMeasurementLine(p1, p2, label) {
        // Create line
        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const material = new THREE.LineBasicMaterial({ color: 0x48bb78, linewidth: 3 });
        const line = new THREE.Line(geometry, material);
        this.measurementObjects.push(line);
        this.scene.add(line);

        // Create endpoints
        [p1, p2].forEach(p => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x48bb78 })
            );
            sphere.position.copy(p);
            this.measurementObjects.push(sphere);
            this.scene.add(sphere);
        });

        // Create label sprite
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const labelSprite = this.createTextSprite(label);
        labelSprite.position.copy(midpoint);
        labelSprite.position.y += 0.3;
        this.measurementObjects.push(labelSprite);
        this.scene.add(labelSprite);
    }

    createAreaVisualization(points, label) {
        // Create polygon outline
        for (let i = 0; i < points.length; i++) {
            const next = (i + 1) % points.length;
            const geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[next]]);
            const material = new THREE.LineBasicMaterial({ color: 0xf6e05e, linewidth: 3 });
            const line = new THREE.Line(geometry, material);
            this.measurementObjects.push(line);
            this.scene.add(line);
        }

        // Create corner markers
        points.forEach(p => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xf6e05e })
            );
            sphere.position.copy(p);
            this.measurementObjects.push(sphere);
            this.scene.add(sphere);
        });

        // Calculate centroid for label
        const centroid = new THREE.Vector3();
        points.forEach(p => centroid.add(p));
        centroid.divideScalar(points.length);

        const labelSprite = this.createTextSprite(label, 0xf6e05e);
        labelSprite.position.copy(centroid);
        labelSprite.position.y += 0.5;
        this.measurementObjects.push(labelSprite);
        this.scene.add(labelSprite);
    }

    createTextSprite(text, color = 0x48bb78) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 28px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 0.4, 1);

        return sprite;
    }

    clearMeasurements() {
        // Remove all measurement objects from scene
        this.measurementObjects.forEach(obj => this.scene.remove(obj));
        this.measurementObjects = [];

        // Clear data
        this.measurements = [];
        this.measurePoints = [];
        this.clearTempMeasurement();

        this.updateMeasurementsList();
        this.saveMeasurements();
        this.showToast('All measurements cleared', 'success');
    }

    updateMeasurementsList() {
        const list = document.getElementById('measurements-list');
        if (!list) return;

        if (this.measurements.length === 0) {
            list.innerHTML = '<p class="empty-measurements">No measurements yet</p>';
            return;
        }

        list.innerHTML = this.measurements.map((m, i) => `
            <div class="measurement-item" data-id="${m.id}">
                <div class="measurement-icon">
                    ${m.type === 'distance' ? '📏' : m.type === 'area' ? '⬛' : '📐'}
                </div>
                <div class="measurement-details">
                    <input type="text" class="measurement-label" value="${m.label}"
                           onchange="app.updateMeasurementLabel(${m.id}, this.value)">
                    <span class="measurement-value">${m.displayValue}</span>
                </div>
                <button class="measurement-delete" onclick="app.deleteMeasurement(${m.id})">×</button>
            </div>
        `).join('');

        // Update summary
        this.updateMeasurementSummary();
    }

    updateMeasurementSummary() {
        const summary = document.getElementById('measurement-summary');
        if (!summary) return;

        const distances = this.measurements.filter(m => m.type === 'distance');
        const areas = this.measurements.filter(m => m.type === 'area');
        const heights = this.measurements.filter(m => m.type === 'height');

        const totalArea = areas.reduce((sum, m) => sum + m.value, 0);
        const totalLinear = distances.reduce((sum, m) => sum + m.value, 0);

        summary.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Total Area:</span>
                <span class="summary-value">${totalArea.toFixed(1)} sq ft</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Linear:</span>
                <span class="summary-value">${Math.floor(totalLinear)}' ${Math.round((totalLinear % 1) * 12)}"</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Measurements:</span>
                <span class="summary-value">${this.measurements.length}</span>
            </div>
        `;
    }

    updateMeasurementLabel(id, label) {
        const measurement = this.measurements.find(m => m.id === id);
        if (measurement) {
            measurement.label = label;
            this.saveMeasurements();
        }
    }

    deleteMeasurement(id) {
        const index = this.measurements.findIndex(m => m.id === id);
        if (index > -1) {
            this.measurements.splice(index, 1);
            // Note: Would need to track which objects belong to which measurement for full cleanup
            this.updateMeasurementsList();
            this.saveMeasurements();
            this.showToast('Measurement deleted', 'success');
        }
    }

    saveMeasurements() {
        localStorage.setItem('patagon3d_measurements', JSON.stringify(this.measurements));
    }

    loadSavedMeasurements() {
        try {
            const saved = localStorage.getItem('patagon3d_measurements');
            if (saved) {
                this.measurements = JSON.parse(saved);
                this.updateMeasurementsList();
            }
        } catch (e) {
            console.error('Failed to load measurements:', e);
        }
    }

    exportMeasurements() {
        if (this.measurements.length === 0) {
            this.showToast('No measurements to export', 'error');
            return;
        }

        const report = {
            project: 'Patagon3d Measurement Report',
            date: new Date().toLocaleDateString(),
            measurements: this.measurements.map(m => ({
                label: m.label,
                type: m.type,
                value: m.displayValue,
                rawValue: m.value
            })),
            summary: {
                totalArea: this.measurements.filter(m => m.type === 'area').reduce((sum, m) => sum + m.value, 0).toFixed(1) + ' sq ft',
                totalLinear: this.measurements.filter(m => m.type === 'distance').reduce((sum, m) => sum + m.value, 0).toFixed(1) + ' ft',
                measurementCount: this.measurements.length
            }
        };

        // Create downloadable file
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patagon3d-measurements-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Measurements exported!', 'success');
    }

    showCalibrationModal() {
        document.getElementById('calibration-modal')?.classList.remove('hidden');
    }

    hideCalibrationModal() {
        document.getElementById('calibration-modal')?.classList.add('hidden');
    }

    applyCalibration() {
        const knownDistance = parseFloat(document.getElementById('known-distance')?.value);
        if (isNaN(knownDistance) || knownDistance <= 0) {
            this.showToast('Enter a valid distance', 'error');
            return;
        }

        // If we have 2 points, use them for calibration
        if (this.measurePoints.length === 2) {
            const p1 = this.measurePoints[0].position;
            const p2 = this.measurePoints[1].position;
            const measuredDistance = p1.distanceTo(p2);

            // Calculate new scale factor
            this.scaleFactor = knownDistance / measuredDistance * this.modelScale;
            localStorage.setItem('patagon3d_scaleFactor', this.scaleFactor);

            this.showToast(`Calibrated! 1 unit = ${(this.scaleFactor).toFixed(2)} feet`, 'success');
            this.clearTempMeasurement();
            this.measurePoints = [];
        } else {
            this.showToast('First measure a known distance, then calibrate', 'error');
        }

        this.hideCalibrationModal();
    }

    // ==================== OTHER METHODS ====================

    toggleAutoRotate() {
        if (this.controls) {
            this.controls.autoRotate = !this.controls.autoRotate;
            document.getElementById('rotate-btn')?.classList.toggle('active');
        }
    }

    resetView() {
        if (this.camera && this.controls) {
            this.camera.position.set(0, 3, 6);
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
        generateBtn.innerHTML = '<div class="spinner" style="width:24px;height:24px;margin:0"></div> Generating AI designs...';

        try {
            const response = await fetch('/api/renovate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_url: this.modelUrl || '',
                    prompt: prompt,
                    element_type: this.selectedElements.join(','),
                    measurements: this.measurements
                })
            });

            const data = await response.json();

            if (data.job_id) {
                this.showToast('AI generating your renovation designs...', 'success');
                this.pollRenovationStatus(data.job_id, generateBtn);
            } else {
                throw new Error(data.detail || 'Failed to start generation');
            }

        } catch (error) {
            console.error('Generate error:', error);
            this.showToast(error.message || 'Generation failed', 'error');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="btn-icon">✨</span> Generate AI Renovation';
        }
    }

    async pollRenovationStatus(jobId, generateBtn) {
        try {
            const response = await fetch(`/api/renovate/${jobId}`);
            const job = await response.json();

            if (job.status === 'completed') {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<span class="btn-icon">✨</span> Generate AI Renovation';

                if (job.images && job.images.length > 0) {
                    this.showDesignResults(job.images.map((img, i) => ({
                        title: `Option ${i + 1} - ${img.style}`,
                        description: img.revised_prompt?.substring(0, 100) || job.prompt,
                        imageUrl: img.url
                    })));
                    this.showToast('AI renovation designs ready!', 'success');
                } else {
                    this.showToast('No images generated', 'error');
                }

            } else if (job.status === 'failed') {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<span class="btn-icon">✨</span> Generate AI Renovation';
                this.showToast(`Generation failed: ${job.error}`, 'error');

            } else {
                setTimeout(() => this.pollRenovationStatus(jobId, generateBtn), 3000);
            }

        } catch (error) {
            console.error('Poll renovation error:', error);
            setTimeout(() => this.pollRenovationStatus(jobId, generateBtn), 5000);
        }
    }

    showDesignResults(proposals) {
        const resultsContainer = document.getElementById('ai-results');
        const grid = document.getElementById('proposals-grid');

        grid.innerHTML = proposals.map((p, i) => `
            <div class="proposal-card">
                ${p.imageUrl
                    ? `<img src="${p.imageUrl}" alt="${p.title}" style="width:100%;height:250px;object-fit:cover;">`
                    : `<div style="height:200px;background:linear-gradient(135deg,#334155,#1e293b);display:flex;align-items:center;justify-content:center;font-size:48px;">
                        ${['🏠', '✨', '💎'][i]}
                       </div>`
                }
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
