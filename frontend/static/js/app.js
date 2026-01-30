/**
 * Patagon3d - AI Renovation Visualizer
 * Real photo upload, AI measurement analysis, and image-to-image renovation
 * Bilingual: English / Spanish
 */

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
    en: {
        // Header
        tagline: "AI Renovation Visualizer",

        // Step 1
        step1_title: "Upload Room Photo",
        step1_instruction: "Take a photo of your kitchen, bathroom, or room for AI analysis and renovation visualization.",
        upload_prompt: "Tap to take photo or select from gallery",
        btn_analyze: "Analyze Measurements",
        btn_skip_renovation: "Skip to Renovation",
        uploading: "Uploading...",
        processing: "Processing...",

        // Step 2
        step2_title: "AI Measurements",
        analyzing_room: "AI is analyzing your room...",
        estimated_measurements: "Estimated Measurements",
        room_dimensions: "Room Dimensions",
        surface_areas: "Surface Areas",
        fixtures_identified: "Fixtures Identified",
        btn_continue_renovation: "Continue to AI Renovation",
        length: "Length",
        width: "Width",
        height: "Height",
        total_area: "Total Area",
        countertop_linear: "Countertop (linear)",
        countertop_area: "Countertop (area)",
        upper_cabinets: "Upper Cabinets",
        lower_cabinets: "Lower Cabinets",
        backsplash_area: "Backsplash",
        floor_area: "Floor Area",
        confidence: "Confidence",

        // Step 3
        step3_title: "AI Renovation",
        your_room: "Your Room",
        what_to_change: "What do you want to change?",
        cabinets: "Cabinets",
        countertops: "Countertops",
        backsplash: "Backsplash",
        flooring: "Flooring",
        appliances: "Appliances",
        style: "Style",
        modern: "Modern",
        farmhouse: "Farmhouse",
        transitional: "Transitional",
        contemporary: "Contemporary",
        cabinet_color: "Cabinet Color",
        countertop_material: "Countertop Material",
        backsplash_style: "Backsplash Style",
        flooring_type: "Flooring Type",
        appliance_finish: "Appliance Finish",
        white_quartz: "White Quartz",
        black_granite: "Black Granite",
        carrara_marble: "Carrara Marble",
        butcher_block: "Butcher Block",
        white_subway: "White Subway",
        herringbone: "Herringbone",
        mosaic: "Mosaic",
        marble_slab: "Marble Slab",
        oak_hardwood: "Oak Hardwood",
        lvp_gray: "LVP Gray",
        tile: "Tile",
        slate: "Slate",
        stainless_steel: "Stainless Steel",
        black_stainless: "Black Stainless",
        white: "White",
        panel_ready: "Panel Ready",
        btn_generate: "Generate AI Renovation",
        ai_proposal: "AI Renovation Proposal",
        transforming_room: "AI is transforming your room...",
        btn_download: "Download",
        btn_try_another: "Try Another",

        // Comparison
        before_after: "Before & After",
        before: "Before",
        after: "After",
        btn_back: "Back to Options",
        btn_new_photo: "New Photo",

        // Errors
        upload_failed: "Upload failed",
        analysis_failed: "Analysis failed",
        renovation_failed: "Renovation failed",
        timeout: "Request timed out. Please try again."
    },
    es: {
        // Header
        tagline: "Visualizador de Renovaciones con IA",

        // Step 1
        step1_title: "Subir Foto del Cuarto",
        step1_instruction: "Toma una foto de tu cocina, baño o habitación para análisis de IA y visualización de renovación.",
        upload_prompt: "Toca para tomar foto o seleccionar de galería",
        btn_analyze: "Analizar Medidas",
        btn_skip_renovation: "Ir a Renovación",
        uploading: "Subiendo...",
        processing: "Procesando...",

        // Step 2
        step2_title: "Medidas con IA",
        analyzing_room: "La IA está analizando tu cuarto...",
        estimated_measurements: "Medidas Estimadas",
        room_dimensions: "Dimensiones del Cuarto",
        surface_areas: "Áreas de Superficie",
        fixtures_identified: "Elementos Identificados",
        btn_continue_renovation: "Continuar a Renovación",
        length: "Largo",
        width: "Ancho",
        height: "Alto",
        total_area: "Área Total",
        countertop_linear: "Encimera (lineal)",
        countertop_area: "Encimera (área)",
        upper_cabinets: "Gabinetes Superiores",
        lower_cabinets: "Gabinetes Inferiores",
        backsplash_area: "Salpicadero",
        floor_area: "Área del Piso",
        confidence: "Confianza",

        // Step 3
        step3_title: "Renovación con IA",
        your_room: "Tu Cuarto",
        what_to_change: "¿Qué quieres cambiar?",
        cabinets: "Gabinetes",
        countertops: "Encimeras",
        backsplash: "Salpicadero",
        flooring: "Piso",
        appliances: "Electrodomésticos",
        style: "Estilo",
        modern: "Moderno",
        farmhouse: "Rústico",
        transitional: "Transicional",
        contemporary: "Contemporáneo",
        cabinet_color: "Color de Gabinetes",
        countertop_material: "Material de Encimera",
        backsplash_style: "Estilo de Salpicadero",
        flooring_type: "Tipo de Piso",
        appliance_finish: "Acabado de Electrodomésticos",
        white_quartz: "Cuarzo Blanco",
        black_granite: "Granito Negro",
        carrara_marble: "Mármol Carrara",
        butcher_block: "Bloque de Carnicero",
        white_subway: "Subway Blanco",
        herringbone: "Espiga",
        mosaic: "Mosaico",
        marble_slab: "Losa de Mármol",
        oak_hardwood: "Roble",
        lvp_gray: "Vinilo Gris",
        tile: "Azulejo",
        slate: "Pizarra",
        stainless_steel: "Acero Inoxidable",
        black_stainless: "Acero Negro",
        white: "Blanco",
        panel_ready: "Panel Integrado",
        btn_generate: "Generar Renovación con IA",
        ai_proposal: "Propuesta de Renovación",
        transforming_room: "La IA está transformando tu cuarto...",
        btn_download: "Descargar",
        btn_try_another: "Probar Otro",

        // Comparison
        before_after: "Antes y Después",
        before: "Antes",
        after: "Después",
        btn_back: "Volver a Opciones",
        btn_new_photo: "Nueva Foto",

        // Errors
        upload_failed: "Error al subir",
        analysis_failed: "Error en análisis",
        renovation_failed: "Error en renovación",
        timeout: "Tiempo agotado. Intenta de nuevo."
    }
};

// Current language
let currentLang = localStorage.getItem('patagon3d_lang') || 'en';

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
    initializeLanguage();
    initializeUpload();
    initializeElementButtons();
    initializeStyleButtons();
    initializeColorButtons();
    initializeMaterialButtons();
    initializeActions();
});

// ============================================================================
// LANGUAGE SYSTEM
// ============================================================================

function initializeLanguage() {
    // Set initial language
    applyTranslations(currentLang);
    updateLanguageButtons();

    // Language button listeners
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('patagon3d_lang', lang);
    applyTranslations(lang);
    updateLanguageButtons();
}

function updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

function applyTranslations(lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) {
            el.textContent = t[key];
        }
    });
}

function t(key) {
    return translations[currentLang]?.[key] || translations.en[key] || key;
}

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
    const overlay = document.getElementById('measurement-overlay');

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

        // Add overlays on image
        if (overlay) {
            overlay.innerHTML = `
                <div class="overlay-measurement" style="top: 10%; left: 50%; transform: translateX(-50%);">
                    Width: ${dims.width_ft || '?'}'
                </div>
                <div class="overlay-measurement" style="top: 50%; right: 5%; transform: translateY(-50%);">
                    Height: ${dims.height_ft || '?'}'
                </div>
                <div class="overlay-measurement" style="bottom: 15%; left: 50%; transform: translateX(-50%);">
                    ${dims.total_sqft || '?'} sq ft
                </div>
            `;
        }
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

        // Add surface overlays
        if (overlay && surf.countertop_sqft) {
            overlay.innerHTML += `
                <div class="overlay-measurement" style="top: 45%; left: 30%;">
                    Countertop: ${surf.countertop_sqft} sq ft
                </div>
            `;
        }
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
