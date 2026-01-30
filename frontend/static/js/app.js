/**
 * Patagon3d - AI Renovation Visualizer
 * Real photo upload, AI measurement analysis, and image-to-image renovation
 * Bilingual: English / Spanish
 * PDF Generation for client proposals
 */

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
    en: {
        tagline: "AI Renovation Visualizer",
        step1_title: "Upload Room Photo",
        step1_instruction: "Take a photo of your kitchen, bathroom, or room for AI analysis and renovation visualization.",
        upload_prompt: "Tap to take photo or select from gallery",
        btn_analyze: "Analyze Measurements",
        btn_skip_renovation: "Skip to Renovation",
        uploading: "Uploading...",
        processing: "Processing...",
        step2_title: "AI Measurements",
        analyzing_room: "AI is analyzing your room...",
        estimated_measurements: "Estimated Measurements",
        room_dimensions: "Room Dimensions",
        surface_areas: "Surface Areas",
        fixtures_identified: "Fixtures Identified",
        btn_continue_renovation: "Continue to AI Renovation",
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
        btn_save: "Save",
        btn_download: "Download",
        btn_try_another: "Try Another",
        saved_options: "Saved Options",
        btn_generate_pdf: "Generate PDF for Client",
        before_after: "Before & After",
        before: "Before",
        after: "After",
        btn_back: "Back to Options",
        btn_new_photo: "New Photo",
        pdf_client_info: "Client Information",
        client_name: "Client Name",
        client_address: "Address",
        client_phone: "Phone",
        project_type: "Project Type",
        sales_rep: "Sales Representative",
        btn_cancel: "Cancel"
    },
    es: {
        tagline: "Visualizador de Renovaciones con IA",
        step1_title: "Subir Foto del Cuarto",
        step1_instruction: "Toma una foto de tu cocina, bano o habitacion para analisis de IA y visualizacion de renovacion.",
        upload_prompt: "Toca para tomar foto o seleccionar de galeria",
        btn_analyze: "Analizar Medidas",
        btn_skip_renovation: "Ir a Renovacion",
        uploading: "Subiendo...",
        processing: "Procesando...",
        step2_title: "Medidas con IA",
        analyzing_room: "La IA esta analizando tu cuarto...",
        estimated_measurements: "Medidas Estimadas",
        room_dimensions: "Dimensiones del Cuarto",
        surface_areas: "Areas de Superficie",
        fixtures_identified: "Elementos Identificados",
        btn_continue_renovation: "Continuar a Renovacion",
        step3_title: "Renovacion con IA",
        your_room: "Tu Cuarto",
        what_to_change: "Que quieres cambiar?",
        cabinets: "Gabinetes",
        countertops: "Encimeras",
        backsplash: "Salpicadero",
        flooring: "Piso",
        appliances: "Electrodomesticos",
        style: "Estilo",
        modern: "Moderno",
        farmhouse: "Rustico",
        transitional: "Transicional",
        contemporary: "Contemporaneo",
        cabinet_color: "Color de Gabinetes",
        countertop_material: "Material de Encimera",
        backsplash_style: "Estilo de Salpicadero",
        flooring_type: "Tipo de Piso",
        appliance_finish: "Acabado de Electrodomesticos",
        white_quartz: "Cuarzo Blanco",
        black_granite: "Granito Negro",
        carrara_marble: "Marmol Carrara",
        butcher_block: "Bloque de Carnicero",
        white_subway: "Subway Blanco",
        herringbone: "Espiga",
        mosaic: "Mosaico",
        marble_slab: "Losa de Marmol",
        oak_hardwood: "Roble",
        lvp_gray: "Vinilo Gris",
        tile: "Azulejo",
        slate: "Pizarra",
        stainless_steel: "Acero Inoxidable",
        black_stainless: "Acero Negro",
        white: "Blanco",
        panel_ready: "Panel Integrado",
        btn_generate: "Generar Renovacion con IA",
        ai_proposal: "Propuesta de Renovacion",
        transforming_room: "La IA esta transformando tu cuarto...",
        btn_save: "Guardar",
        btn_download: "Descargar",
        btn_try_another: "Probar Otro",
        saved_options: "Opciones Guardadas",
        btn_generate_pdf: "Generar PDF para Cliente",
        before_after: "Antes y Despues",
        before: "Antes",
        after: "Despues",
        btn_back: "Volver a Opciones",
        btn_new_photo: "Nueva Foto",
        pdf_client_info: "Informacion del Cliente",
        client_name: "Nombre del Cliente",
        client_address: "Direccion",
        client_phone: "Telefono",
        project_type: "Tipo de Proyecto",
        sales_rep: "Representante de Ventas",
        btn_cancel: "Cancelar"
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
let currentUser = null;
let visualizationHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeLanguage();
    initializeUser();
    initializeUpload();
    initializeElementButtons();
    initializeStyleButtons();
    initializeColorButtons();
    initializeMaterialButtons();
    initializeActions();
    initializeUserMenu();
    initializePdfModal();
});

// ============================================================================
// LANGUAGE SYSTEM
// ============================================================================

function initializeLanguage() {
    applyTranslations(currentLang);
    updateLanguageButtons();
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('patagon3d_lang', lang);
    applyTranslations(lang);
    updateLanguageButtons();
}

function updateLanguageButtons() {
    const langEn = document.getElementById('lang-en');
    const langEs = document.getElementById('lang-es');

    if (langEn) {
        if (currentLang === 'en') {
            langEn.classList.add('active');
        } else {
            langEn.classList.remove('active');
        }
    }

    if (langEs) {
        if (currentLang === 'es') {
            langEs.classList.add('active');
        } else {
            langEs.classList.remove('active');
        }
    }
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
// USER SYSTEM
// ============================================================================

async function initializeUser() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            currentUser = await response.json();

            // Show user email
            const userEmail = document.getElementById('user-email');
            if (userEmail) {
                userEmail.textContent = currentUser.email;
            }

            // Show admin button only for admins
            const adminLink = document.getElementById('admin-link');
            if (adminLink) {
                adminLink.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
            }
        }
    } catch (err) {
        console.error('Error fetching user:', err);
    }
}

function initializeUserMenu() {
    // Logout is now handled by onclick in HTML
    // This function kept for compatibility
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/login';
    }
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

function initializeUpload() {
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');

    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await handleImageUpload(file);
            }
        });
    }

    if (uploadArea) {
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
}

async function handleImageUpload(file) {
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    const uploadArea = document.getElementById('upload-area');

    uploadArea.classList.add('hidden');
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '30%';
    progressText.textContent = t('uploading');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '70%';
        progressText.textContent = t('processing');

        const result = await response.json();

        if (result.success) {
            currentImageUrl = result.url;
            currentImageId = result.image_id;

            progressFill.style.width = '100%';

            const objectUrl = URL.createObjectURL(file);
            previewImage.src = objectUrl;

            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageUrl = e.target.result;
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

    if (measurements.room_dimensions) {
        const dims = measurements.room_dimensions;
        roomDimensions.innerHTML = `
            <div class="measurement-item">
                <span class="label">Length</span>
                <span class="value">${dims.length_ft || 'N/A'}'</span>
            </div>
            <div class="measurement-item">
                <span class="label">Width</span>
                <span class="value">${dims.width_ft || 'N/A'}'</span>
            </div>
            <div class="measurement-item">
                <span class="label">Height</span>
                <span class="value">${dims.height_ft || 'N/A'}'</span>
            </div>
            <div class="measurement-item highlight">
                <span class="label">Total Area</span>
                <span class="value">${dims.total_sqft || 'N/A'} sq ft</span>
            </div>
        `;

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

    if (measurements.surfaces) {
        const surf = measurements.surfaces;
        surfaceAreas.innerHTML = `
            <div class="measurement-item">
                <span class="label">Countertop</span>
                <span class="value">${surf.countertop_sqft || 'N/A'} sq ft</span>
            </div>
            <div class="measurement-item">
                <span class="label">Upper Cabinets</span>
                <span class="value">${surf.upper_cabinets_linear_ft || 'N/A'}'</span>
            </div>
            <div class="measurement-item">
                <span class="label">Lower Cabinets</span>
                <span class="value">${surf.lower_cabinets_linear_ft || 'N/A'}'</span>
            </div>
            <div class="measurement-item">
                <span class="label">Floor Area</span>
                <span class="value">${surf.floor_sqft || 'N/A'} sq ft</span>
            </div>
        `;
    }

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
    document.querySelectorAll('.element-options').forEach(el => {
        el.classList.add('hidden');
    });

    const optionsEl = document.getElementById(`${selectedElement}-options`);
    if (optionsEl) {
        optionsEl.classList.remove('hidden');
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
// HISTORY & PDF
// ============================================================================

function saveToHistory() {
    const renovationImage = document.getElementById('renovation-image');
    if (!renovationImage.src) return;

    const item = {
        id: Date.now(),
        originalUrl: currentImageUrl,
        generatedUrl: renovationImage.src,
        element: selectedElement,
        style: selectedStyle,
        color: selectedColor,
        material: selectedMaterial,
        timestamp: new Date().toISOString()
    };

    visualizationHistory.push(item);
    updateHistoryPanel();
}

function updateHistoryPanel() {
    const historyPanel = document.getElementById('history-panel');
    const historyItems = document.getElementById('history-items');
    const historyCount = document.getElementById('history-count');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');

    if (visualizationHistory.length > 0) {
        historyPanel.classList.remove('hidden');
        historyCount.textContent = visualizationHistory.length;
        generatePdfBtn.disabled = false;

        historyItems.innerHTML = visualizationHistory.map((item, index) => `
            <div class="history-item" data-id="${item.id}">
                <img src="${item.generatedUrl}" alt="Option ${index + 1}">
                <div class="history-item-info">
                    <span class="history-item-title">Option ${index + 1}</span>
                    <span class="history-item-desc">${item.element} - ${item.color || item.material}</span>
                </div>
                <button class="history-item-delete" onclick="removeFromHistory(${item.id})">×</button>
            </div>
        `).join('');
    } else {
        historyPanel.classList.add('hidden');
        generatePdfBtn.disabled = true;
    }
}

function removeFromHistory(id) {
    visualizationHistory = visualizationHistory.filter(item => item.id !== id);
    updateHistoryPanel();
}

function initializePdfModal() {
    const modal = document.getElementById('pdf-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const form = document.getElementById('pdf-form');
    const generateBtn = document.getElementById('generate-pdf-btn');

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            if (visualizationHistory.length > 0) {
                modal.classList.remove('hidden');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await generateClientPDF();
            modal.classList.add('hidden');
        });
    }
}

async function generateClientPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'letter');

    const clientName = document.getElementById('client-name').value;
    const clientAddress = document.getElementById('client-address').value;
    const clientPhone = document.getElementById('client-phone').value;
    const projectType = document.getElementById('client-project').value;
    const salesRep = document.getElementById('sales-rep').value;

    const now = new Date();
    const quoteNumber = `P3D-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    function addHeader() {
        pdf.setFillColor(26, 54, 93);
        pdf.rect(0, 0, pageWidth, 35, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('HELLO PROJECTS PRO', margin, 18);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Patagon3d - AI Renovation Visualizer', margin, 28);

        pdf.setTextColor(79, 172, 254);
        pdf.text('helloprojectspro.com', pageWidth - margin, 28, { align: 'right' });

        return 45;
    }

    function addFooter(pageNum, totalPages) {
        pdf.setFillColor(26, 54, 93);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('This document is an AI-generated visualization proposal. Final results may vary.', margin, pageHeight - 7);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    // Page 1 - Cover
    yPos = addHeader();

    pdf.setTextColor(26, 54, 93);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Renovation Visualization', margin, yPos + 20);
    pdf.text('Proposal', margin, yPos + 32);

    pdf.setDrawColor(79, 172, 254);
    pdf.setLineWidth(1);
    pdf.line(margin, yPos + 40, margin + 60, yPos + 40);

    yPos += 60;

    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');

    const clientInfo = [
        ['Client:', clientName],
        ['Address:', clientAddress],
        ['Phone:', clientPhone || 'N/A'],
        ['Project:', projectType],
        ['Quote #:', quoteNumber],
        ['Date:', now.toLocaleDateString()],
        ['Representative:', salesRep]
    ];

    clientInfo.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 40, yPos);
        yPos += 8;
    });

    addFooter(1, visualizationHistory.length + 1);

    // Visualization pages
    for (let i = 0; i < visualizationHistory.length; i++) {
        const item = visualizationHistory[i];
        pdf.addPage();
        yPos = addHeader();

        pdf.setTextColor(26, 54, 93);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Option ${i + 1}: ${item.element.charAt(0).toUpperCase() + item.element.slice(1)}`, margin, yPos);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Style: ${item.style} | ${item.color || item.material || ''}`, margin, yPos + 8);

        yPos += 20;

        const imgWidth = (contentWidth - 10) / 2;
        const imgHeight = 80;

        // Original image
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text('ORIGINAL', margin + imgWidth / 2, yPos, { align: 'center' });

        try {
            const originalBase64 = await loadImageAsBase64(item.originalUrl);
            pdf.addImage(originalBase64, 'JPEG', margin, yPos + 5, imgWidth, imgHeight);
        } catch (e) {
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPos + 5, imgWidth, imgHeight, 'F');
            pdf.text('Image unavailable', margin + imgWidth / 2, yPos + 45, { align: 'center' });
        }

        // Generated image
        pdf.text('AI VISUALIZATION', margin + imgWidth + 10 + imgWidth / 2, yPos, { align: 'center' });

        try {
            const generatedBase64 = await loadImageAsBase64(item.generatedUrl);
            pdf.addImage(generatedBase64, 'JPEG', margin + imgWidth + 10, yPos + 5, imgWidth, imgHeight);
        } catch (e) {
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin + imgWidth + 10, yPos + 5, imgWidth, imgHeight, 'F');
            pdf.text('Image unavailable', margin + imgWidth + 10 + imgWidth / 2, yPos + 45, { align: 'center' });
        }

        addFooter(i + 2, visualizationHistory.length + 1);
    }

    // Save
    const fileName = `Visualization_${clientName.replace(/\s+/g, '_')}_${quoteNumber}.pdf`;
    pdf.save(fileName);

    alert('PDF generated successfully!');
}

async function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
}

// ============================================================================
// NAVIGATION & ACTIONS
// ============================================================================

function initializeActions() {
    document.getElementById('analyze-btn')?.addEventListener('click', analyzeMeasurements);

    document.getElementById('continue-btn')?.addEventListener('click', () => {
        document.getElementById('original-photo').src = currentImageUrl;
        showSection('renovation');
    });

    document.getElementById('to-renovation-btn')?.addEventListener('click', () => {
        document.getElementById('original-photo').src = currentImageUrl;
        showSection('renovation');
    });

    document.getElementById('generate-renovation')?.addEventListener('click', generateRenovation);

    document.getElementById('save-to-history-btn')?.addEventListener('click', saveToHistory);

    document.getElementById('download-btn')?.addEventListener('click', () => {
        const renovationImage = document.getElementById('renovation-image');
        const link = document.createElement('a');
        link.href = renovationImage.src;
        link.download = `patagon3d-renovation-${Date.now()}.jpg`;
        link.click();
    });

    document.getElementById('new-renovation-btn')?.addEventListener('click', () => {
        document.getElementById('renovation-result').classList.add('hidden');
    });

    document.getElementById('back-to-options')?.addEventListener('click', () => {
        showSection('renovation');
    });

    document.getElementById('new-photo-btn')?.addEventListener('click', () => {
        resetApp();
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('active');
    }
}

function resetApp() {
    currentImageUrl = null;
    currentImageId = null;
    visualizationHistory = [];

    document.getElementById('upload-area').classList.remove('hidden');
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('upload-progress').classList.add('hidden');
    document.getElementById('image-input').value = '';

    updateHistoryPanel();
    showSection('upload');
}
