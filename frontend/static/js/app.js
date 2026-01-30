/**
 * Patagon3d - AI Renovation Visualizer
 * Real photo upload, AI measurement analysis, and image-to-image renovation
 */

// State
let currentImageUrl = null;
let currentImageId = null;
let selectedElement = 'cabinets';
let selectedStyle = 'modern';
let selectedColor = 'white';
let selectedMaterial = null;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const measurementsSection = document.getElementById('measurements-section');
const renovationSection = document.getElementById('renovation-section');
const comparisonSection = document.getElementById('comparison-section');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUpload();
    initializeElementButtons();
    initializeStyleButtons();
    initializeColorButtons();
    initializeMaterialButtons();
    initializeActions();
});

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

function initializeUpload() {
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // Handle file selection
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleImageUpload(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await handleImageUpload(file);
        }
    });
}

async function handleImageUpload(file) {
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    const uploadArea = document.getElementById('upload-area');

    // Show progress
    uploadArea.classList.add('hidden');
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '30%';
    progressText.textContent = 'Uploading image...';

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload to server
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '70%';
        progressText.textContent = 'Processing...';

        const result = await response.json();

        if (result.success) {
            currentImageUrl = result.url;
            currentImageId = result.image_id;

            // Show preview
            progressFill.style.width = '100%';

            // Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            previewImage.src = objectUrl;

            // Store base64 for later use
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageUrl = e.target.result; // Store as data URL
            };
            reader.readAsDataURL(file);

            setTimeout(() => {
                uploadProgress.classList.add('hidden');
                imagePreview.classList.remove('hidden');
            }, 500);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        progressText.textContent = 'Upload failed: ' + error.message;
        progressFill.style.background = '#ef4444';

        setTimeout(() => {
            uploadProgress.classList.add('hidden');
            uploadArea.classList.remove('hidden');
        }, 2000);
    }
}

// ============================================================================
// AI MEASUREMENT ANALYSIS
// ============================================================================

async function analyzeMeasurements() {
    // Switch to measurements section
    showSection('measurements');

    const measurementPhoto = document.getElementById('measurement-photo');
    const loadingIndicator = document.getElementById('measurements-loading');
    const resultsContainer = document.getElementById('measurements-results');

    measurementPhoto.src = currentImageUrl;
    loadingIndicator.classList.remove('hidden');
    resultsContainer.classList.add('hidden');

    try {
        const response = await fetch('/api/analyze-measurements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: currentImageUrl,
                room_type: 'kitchen'
            })
        });

        const result = await response.json();

        // Poll for completion
        await pollMeasurementStatus(result.job_id);
    } catch (error) {
        console.error('Measurement error:', error);
        loadingIndicator.innerHTML = '<p class="error">Analysis failed: ' + error.message + '</p>';
    }
}

async function pollMeasurementStatus(jobId) {
    const loadingIndicator = document.getElementById('measurements-loading');
    const resultsContainer = document.getElementById('measurements-results');

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`/api/measurements/${jobId}`);
            const result = await response.json();

            if (result.status === 'completed') {
                loadingIndicator.classList.add('hidden');
                resultsContainer.classList.remove('hidden');
                displayMeasurements(result.measurements);
                return;
            } else if (result.status === 'failed') {
                throw new Error(result.error || 'Analysis failed');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        } catch (error) {
            loadingIndicator.innerHTML = '<p class="error">Analysis failed: ' + error.message + '</p>';
            return;
        }
    }

    loadingIndicator.innerHTML = '<p class="error">Analysis timed out. Please try again.</p>';
}

function displayMeasurements(measurements) {
    const roomDimensions = document.getElementById('room-dimensions');
    const surfaceAreas = document.getElementById('surface-areas');
    const fixturesList = document.getElementById('fixtures-list');
    const confidenceIndicator = document.getElementById('confidence-indicator');

    // Room dimensions
    if (measurements.room_dimensions) {
        const dims = measurements.room_dimensions;
        roomDimensions.innerHTML = `
            <div class="measurement-item">
                <span class="label">Length</span>
                <span class="value">${dims.length_ft || 'N/A'}' </span>
            </div>
            <div class="measurement-item">
                <span class="label">Width</span>
                <span class="value">${dims.width_ft || 'N/A'}' </span>
            </div>
            <div class="measurement-item">
                <span class="label">Height</span>
                <span class="value">${dims.height_ft || 'N/A'}' </span>
            </div>
            <div class="measurement-item highlight">
                <span class="label">Total Area</span>
                <span class="value">${dims.total_sqft || 'N/A'} sq ft</span>
            </div>
        `;
    }

    // Surface areas
    if (measurements.surfaces) {
        const surf = measurements.surfaces;
        surfaceAreas.innerHTML = `
            <div class="measurement-item">
                <span class="label">Countertop (linear)</span>
                <span class="value">${surf.countertop_linear_ft || 'N/A'}' </span>
            </div>
            <div class="measurement-item">
                <span class="label">Countertop (area)</span>
                <span class="value">${surf.countertop_sqft || 'N/A'} sq ft</span>
            </div>
            <div class="measurement-item">
                <span class="label">Upper Cabinets</span>
                <span class="value">${surf.upper_cabinets_linear_ft || 'N/A'}' </span>
            </div>
            <div class="measurement-item">
                <span class="label">Lower Cabinets</span>
                <span class="value">${surf.lower_cabinets_linear_ft || 'N/A'}' </span>
            </div>
            <div class="measurement-item">
                <span class="label">Backsplash</span>
                <span class="value">${surf.backsplash_sqft || 'N/A'} sq ft</span>
            </div>
            <div class="measurement-item">
                <span class="label">Floor Area</span>
                <span class="value">${surf.floor_sqft || 'N/A'} sq ft</span>
            </div>
        `;
    }

    // Fixtures
    if (measurements.fixtures && measurements.fixtures.length > 0) {
        fixturesList.innerHTML = measurements.fixtures.map(f => `
            <div class="fixture-item">
                <span class="fixture-name">${f.name}</span>
                <span class="fixture-size">${f.size}</span>
            </div>
        `).join('');
    } else {
        fixturesList.innerHTML = '<p>No fixtures identified</p>';
    }

    // Confidence
    const confidence = measurements.confidence || 'medium';
    const confidenceColors = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' };
    confidenceIndicator.innerHTML = `
        <div class="confidence-badge" style="background: ${confidenceColors[confidence]}">
            Confidence: ${confidence.toUpperCase()}
        </div>
        ${measurements.notes ? `<p class="notes">${measurements.notes}</p>` : ''}
    `;
}

// ============================================================================
// AI RENOVATION
// ============================================================================

function initializeElementButtons() {
    const buttons = document.querySelectorAll('.element-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedElement = btn.dataset.element;
            updateElementOptions();
        });
    });
}

function initializeStyleButtons() {
    const buttons = document.querySelectorAll('.style-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStyle = btn.dataset.style;
        });
    });
}

function initializeColorButtons() {
    const buttons = document.querySelectorAll('.color-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
        });
    });
}

function initializeMaterialButtons() {
    const buttons = document.querySelectorAll('.material-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.element-options');
            parent.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMaterial = btn.dataset.material;
            selectedColor = btn.dataset.color;
        });
    });
}

function updateElementOptions() {
    // Hide all element options
    document.querySelectorAll('.element-options').forEach(el => {
        el.classList.add('hidden');
    });

    // Show selected element options
    const optionsEl = document.getElementById(`${selectedElement}-options`);
    if (optionsEl) {
        optionsEl.classList.remove('hidden');

        // Select first option
        const firstBtn = optionsEl.querySelector('.material-btn, .color-btn');
        if (firstBtn) {
            firstBtn.click();
        }
    }
}

async function generateRenovation() {
    const renovationResult = document.getElementById('renovation-result');
    const renovationLoading = document.getElementById('renovation-loading');
    const renovationImageContainer = document.getElementById('renovation-image-container');
    const renovationImage = document.getElementById('renovation-image');

    // Show loading
    renovationResult.classList.remove('hidden');
    renovationLoading.classList.remove('hidden');
    renovationImageContainer.classList.add('hidden');

    try {
        const response = await fetch('/api/renovate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: currentImageUrl,
                element_type: selectedElement,
                style: selectedStyle,
                color: selectedColor,
                material: selectedMaterial
            })
        });

        const result = await response.json();

        // Poll for completion
        await pollRenovationStatus(result.job_id);
    } catch (error) {
        console.error('Renovation error:', error);
        renovationLoading.innerHTML = '<p class="error">Renovation failed: ' + error.message + '</p>';
    }
}

async function pollRenovationStatus(jobId) {
    const renovationLoading = document.getElementById('renovation-loading');
    const renovationImageContainer = document.getElementById('renovation-image-container');
    const renovationImage = document.getElementById('renovation-image');

    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`/api/renovation/${jobId}`);
            const result = await response.json();

            if (result.status === 'completed') {
                renovationLoading.classList.add('hidden');
                renovationImageContainer.classList.remove('hidden');
                renovationImage.src = result.generated_url;

                // Store for comparison
                document.getElementById('compare-before').src = currentImageUrl;
                document.getElementById('compare-after').src = result.generated_url;

                return;
            } else if (result.status === 'failed') {
                throw new Error(result.error || 'Renovation failed');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        } catch (error) {
            renovationLoading.innerHTML = '<p class="error">Renovation failed: ' + error.message + '</p>';
            return;
        }
    }

    renovationLoading.innerHTML = '<p class="error">Renovation timed out. Please try again.</p>';
}

// ============================================================================
// NAVIGATION & ACTIONS
// ============================================================================

function initializeActions() {
    // Analyze measurements button
    document.getElementById('analyze-btn')?.addEventListener('click', analyzeMeasurements);

    // Skip to renovation button
    document.getElementById('continue-btn')?.addEventListener('click', () => {
        document.getElementById('original-photo').src = currentImageUrl;
        showSection('renovation');
    });

    // Continue to renovation from measurements
    document.getElementById('to-renovation-btn')?.addEventListener('click', () => {
        document.getElementById('original-photo').src = currentImageUrl;
        showSection('renovation');
    });

    // Generate renovation
    document.getElementById('generate-renovation')?.addEventListener('click', generateRenovation);

    // Download button
    document.getElementById('download-btn')?.addEventListener('click', () => {
        const renovationImage = document.getElementById('renovation-image');
        const link = document.createElement('a');
        link.href = renovationImage.src;
        link.download = `patagon3d-renovation-${Date.now()}.jpg`;
        link.click();
    });

    // Try another renovation
    document.getElementById('new-renovation-btn')?.addEventListener('click', () => {
        document.getElementById('renovation-result').classList.add('hidden');
    });

    // Back to options from comparison
    document.getElementById('back-to-options')?.addEventListener('click', () => {
        showSection('renovation');
    });

    // New photo button
    document.getElementById('new-photo-btn')?.addEventListener('click', () => {
        resetApp();
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('active');
    }
}

function resetApp() {
    currentImageUrl = null;
    currentImageId = null;

    // Reset UI
    document.getElementById('upload-area').classList.remove('hidden');
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('upload-progress').classList.add('hidden');
    document.getElementById('image-input').value = '';

    showSection('upload');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatFeetInches(totalFeet) {
    const feet = Math.floor(totalFeet);
    const inches = Math.round((totalFeet - feet) * 12);
    return `${feet}' ${inches}"`;
}
