"""
Patagon3d Backend - Real Photo AI Renovation & Measurement System
For Hello Projects Pro (CSLB #1135440)

Features:
- Upload real room photos/videos
- AI-powered measurement estimation using GPT-4 Vision
- Real image modification using Google Vertex AI Imagen 3.0
- Same approach as land-roof-measure project
"""
import os
import uuid
import httpx
import base64
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Patagon3d", description="Real Photo AI Renovation & Measurement System")

# CORS for mobile browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Vertex AI Configuration (Imagen 3.0 for image-to-image)
GOOGLE_CLOUD_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT_ID", "")
GOOGLE_CLOUD_API_KEY = os.environ.get("GOOGLE_CLOUD_API_KEY", "")
GOOGLE_CLOUD_LOCATION = "us-central1"

# OpenAI Configuration (GPT-4 Vision for measurements)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Supabase Configuration (Image Storage)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Job stores
renovation_jobs = {}
measurement_jobs = {}
uploaded_images = {}

# Templates
templates = Jinja2Templates(directory="frontend/templates")
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")


class MeasurementRequest(BaseModel):
    image_url: str
    room_type: str = "kitchen"  # kitchen, bathroom, bedroom, living_room


class RenovationRequest(BaseModel):
    image_url: str
    element_type: str  # cabinets, countertops, backsplash, flooring, appliances
    style: str  # modern, transitional, farmhouse, contemporary
    color: Optional[str] = None
    material: Optional[str] = None
    description: Optional[str] = None


class MeasurementResult(BaseModel):
    job_id: str
    status: str
    image_url: str
    measurements: Optional[dict] = None
    error: Optional[str] = None
    created_at: str


class RenovationResult(BaseModel):
    job_id: str
    status: str
    original_url: str
    generated_url: Optional[str] = None
    prompt_used: Optional[str] = None
    error: Optional[str] = None
    created_at: str


@app.get("/")
async def home(request: Request):
    """Render main page"""
    return templates.TemplateResponse("index.html", {"request": request})


# ============================================================================
# IMAGE UPLOAD
# ============================================================================

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a room photo for analysis and renovation
    Stores image and returns URL for further processing
    """
    # Generate unique ID
    image_id = str(uuid.uuid4())

    # Read file content
    content = await file.read()
    content_type = file.content_type or "image/jpeg"

    # Store in memory (for demo - use Supabase in production)
    uploaded_images[image_id] = {
        "content": content,
        "content_type": content_type,
        "filename": file.filename,
        "created_at": datetime.utcnow().isoformat()
    }

    # If Supabase is configured, upload there
    image_url = f"/api/image/{image_id}"

    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            async with httpx.AsyncClient() as client:
                file_path = f"patagon3d/{image_id}.jpg"
                response = await client.post(
                    f"{SUPABASE_URL}/storage/v1/object/visualizer-images/{file_path}",
                    headers={
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        "Content-Type": content_type
                    },
                    content=content
                )
                if response.status_code in [200, 201]:
                    image_url = f"{SUPABASE_URL}/storage/v1/object/public/visualizer-images/{file_path}"
        except Exception as e:
            print(f"Supabase upload error: {e}")

    return {
        "success": True,
        "image_id": image_id,
        "url": image_url,
        "filename": file.filename
    }


@app.get("/api/image/{image_id}")
async def get_image(image_id: str):
    """Serve uploaded image from memory"""
    if image_id not in uploaded_images:
        raise HTTPException(status_code=404, detail="Image not found")

    image_data = uploaded_images[image_id]
    return JSONResponse(
        content={"error": "Use direct URL"},
        status_code=302,
        headers={"Location": f"data:{image_data['content_type']};base64,{base64.b64encode(image_data['content']).decode()}"}
    )


# ============================================================================
# AI MEASUREMENT ANALYSIS (GPT-4 Vision)
# ============================================================================

@app.post("/api/analyze-measurements")
async def analyze_measurements(background_tasks: BackgroundTasks, request: MeasurementRequest):
    """
    Analyze a room photo using GPT-4 Vision to estimate measurements
    Recognizes surfaces, dimensions, and provides estimates
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    measurement_jobs[job_id] = MeasurementResult(
        job_id=job_id,
        status="processing",
        image_url=request.image_url,
        created_at=now
    )

    background_tasks.add_task(process_measurement_analysis, job_id, request.image_url, request.room_type)

    return {"job_id": job_id, "status": "processing", "message": "Analyzing image for measurements..."}


async def process_measurement_analysis(job_id: str, image_url: str, room_type: str):
    """Use GPT-4 Vision to analyze room and estimate measurements"""
    try:
        # Get image as base64
        image_base64 = await get_image_base64(image_url)

        async with httpx.AsyncClient(timeout=120.0) as client:
            # GPT-4 Vision analysis prompt
            analysis_prompt = f"""Analyze this {room_type} photo and provide detailed measurements and estimates.

You are an expert contractor estimator. Analyze the image and provide:

1. **Room Dimensions** (estimate based on standard fixtures as reference):
   - Approximate length and width in feet
   - Ceiling height estimate
   - Total square footage

2. **Surface Measurements** (for {room_type}):
   - Countertop linear feet and square footage (if visible)
   - Cabinet linear feet (upper and lower separately)
   - Backsplash square footage
   - Floor area visible
   - Wall area visible

3. **Fixture Identification**:
   - List all visible fixtures (sink, stove, fridge, etc.)
   - Note their approximate sizes

4. **Reference Points Used**:
   - What standard items did you use to estimate scale?
   - (e.g., standard cabinet height 34.5", standard countertop depth 25")

Provide measurements in feet and inches format (e.g., 12' 6").
If uncertain, provide a range (e.g., 10-12 feet).

Return as JSON with this structure:
{{
  "room_dimensions": {{
    "length_ft": number,
    "width_ft": number,
    "height_ft": number,
    "total_sqft": number
  }},
  "surfaces": {{
    "countertop_linear_ft": number,
    "countertop_sqft": number,
    "upper_cabinets_linear_ft": number,
    "lower_cabinets_linear_ft": number,
    "backsplash_sqft": number,
    "floor_sqft": number
  }},
  "fixtures": [
    {{"name": "string", "size": "string"}}
  ],
  "confidence": "high|medium|low",
  "notes": "string with any important observations"
}}"""

            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": analysis_prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}",
                                        "detail": "high"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2000
                }
            )

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]

                # Parse JSON from response
                import json
                try:
                    # Extract JSON from response (may be wrapped in markdown)
                    if "```json" in content:
                        json_str = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        json_str = content.split("```")[1].split("```")[0].strip()
                    else:
                        json_str = content

                    measurements = json.loads(json_str)
                except:
                    measurements = {"raw_analysis": content}

                measurement_jobs[job_id].status = "completed"
                measurement_jobs[job_id].measurements = measurements
            else:
                measurement_jobs[job_id].status = "failed"
                measurement_jobs[job_id].error = f"OpenAI API error: {response.status_code}"

    except Exception as e:
        measurement_jobs[job_id].status = "failed"
        measurement_jobs[job_id].error = str(e)


@app.get("/api/measurements/{job_id}")
async def get_measurement_status(job_id: str):
    """Get measurement analysis results"""
    if job_id not in measurement_jobs:
        raise HTTPException(status_code=404, detail="Measurement job not found")
    return measurement_jobs[job_id]


# ============================================================================
# AI RENOVATION (Google Vertex AI Imagen 3.0 - Image-to-Image)
# ============================================================================

@app.post("/api/renovate")
async def generate_renovation(background_tasks: BackgroundTasks, request: RenovationRequest):
    """
    Generate AI renovation by modifying the REAL uploaded photo
    Uses Google Vertex AI Imagen 3.0 for image-to-image transformation
    """
    if not GOOGLE_CLOUD_API_KEY:
        raise HTTPException(status_code=500, detail="Google Cloud API key not configured")

    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    renovation_jobs[job_id] = RenovationResult(
        job_id=job_id,
        status="processing",
        original_url=request.image_url,
        created_at=now
    )

    background_tasks.add_task(
        process_renovation,
        job_id,
        request.image_url,
        request.element_type,
        request.style,
        request.color,
        request.material,
        request.description
    )

    return {"job_id": job_id, "status": "processing", "message": "Generating AI renovation..."}


async def process_renovation(
    job_id: str,
    image_url: str,
    element_type: str,
    style: str,
    color: Optional[str],
    material: Optional[str],
    description: Optional[str]
):
    """
    Use Google Vertex AI Imagen 3.0 to modify the real photo
    Same approach as land-roof-measure project
    """
    try:
        # Get image as base64
        image_base64 = await get_image_base64(image_url)

        # Build the modification prompt based on element type
        preserve_clause = "DO NOT change any other elements in the room. Keep walls, windows, doors, ceiling, lighting, and all other fixtures exactly the same."

        if element_type == "cabinets":
            color_desc = color or "white"
            style_desc = style or "modern shaker"
            prompt = f"Edit this kitchen photo: replace ONLY the kitchen cabinets with {color_desc} {style_desc} style cabinets. {preserve_clause}"

        elif element_type == "countertops":
            material_desc = material or "quartz"
            color_desc = color or "white with gray veining"
            prompt = f"Edit this kitchen photo: replace ONLY the countertops with {color_desc} {material_desc} countertops. {preserve_clause}"

        elif element_type == "backsplash":
            material_desc = material or "subway tile"
            color_desc = color or "white"
            prompt = f"Edit this kitchen photo: replace ONLY the backsplash with {color_desc} {material_desc}. {preserve_clause}"

        elif element_type == "flooring":
            material_desc = material or "hardwood"
            color_desc = color or "medium oak"
            prompt = f"Edit this kitchen photo: replace ONLY the floor with {color_desc} {material_desc} flooring with visible wood grain. {preserve_clause}"

        elif element_type == "appliances":
            style_desc = style or "stainless steel"
            prompt = f"Edit this kitchen photo: replace ONLY the visible appliances with modern {style_desc} appliances. {preserve_clause}"

        else:
            # Custom description
            prompt = f"Edit this room photo: {description or 'modernize the space'}. {preserve_clause}"

        # Add style enhancement
        style_additions = {
            "modern": "Clean lines, minimalist hardware, contemporary fixtures.",
            "farmhouse": "Rustic wood elements, vintage-inspired hardware, warm tones.",
            "transitional": "Blend of traditional and modern, neutral palette, classic shapes.",
            "contemporary": "Bold design, luxury materials, high-end finishes."
        }
        if style in style_additions:
            prompt += f" Style: {style_additions[style]}"

        renovation_jobs[job_id].prompt_used = prompt

        async with httpx.AsyncClient(timeout=120.0) as client:
            # Call Google Vertex AI Imagen 3.0
            imagen_url = f"https://{GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT_ID}/locations/{GOOGLE_CLOUD_LOCATION}/publishers/google/models/imagen-3.0-capability-001:predict?key={GOOGLE_CLOUD_API_KEY}"

            response = await client.post(
                imagen_url,
                headers={"Content-Type": "application/json"},
                json={
                    "instances": [
                        {
                            "prompt": prompt,
                            "referenceImages": [
                                {
                                    "referenceType": "REFERENCE_TYPE_RAW",
                                    "referenceId": 1,
                                    "referenceImage": {
                                        "bytesBase64Encoded": image_base64
                                    }
                                }
                            ]
                        }
                    ],
                    "parameters": {
                        "sampleCount": 1
                    }
                }
            )

            if response.status_code == 200:
                result = response.json()
                generated_base64 = result["predictions"][0]["bytesBase64Encoded"]

                # Store generated image
                generated_url = f"data:image/jpeg;base64,{generated_base64}"

                # Try to upload to Supabase for permanent storage
                if SUPABASE_URL and SUPABASE_SERVICE_KEY:
                    try:
                        generated_bytes = base64.b64decode(generated_base64)
                        file_path = f"patagon3d/generated/{job_id}.jpg"

                        upload_response = await client.post(
                            f"{SUPABASE_URL}/storage/v1/object/visualizer-images/{file_path}",
                            headers={
                                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                                "Content-Type": "image/jpeg"
                            },
                            content=generated_bytes
                        )

                        if upload_response.status_code in [200, 201]:
                            generated_url = f"{SUPABASE_URL}/storage/v1/object/public/visualizer-images/{file_path}"
                    except Exception as e:
                        print(f"Supabase upload error: {e}")

                renovation_jobs[job_id].status = "completed"
                renovation_jobs[job_id].generated_url = generated_url
            else:
                error_text = response.text
                renovation_jobs[job_id].status = "failed"
                renovation_jobs[job_id].error = f"Imagen API error: {response.status_code} - {error_text}"

    except Exception as e:
        renovation_jobs[job_id].status = "failed"
        renovation_jobs[job_id].error = str(e)


@app.get("/api/renovation/{job_id}")
async def get_renovation_status(job_id: str):
    """Get renovation job status and results"""
    if job_id not in renovation_jobs:
        raise HTTPException(status_code=404, detail="Renovation job not found")
    return renovation_jobs[job_id]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_image_base64(image_url: str) -> str:
    """Get image as base64 string from URL or memory"""

    # Check if it's a local image ID
    if image_url.startswith("/api/image/"):
        image_id = image_url.split("/")[-1]
        if image_id in uploaded_images:
            return base64.b64encode(uploaded_images[image_id]["content"]).decode()

    # Check if it's already base64
    if image_url.startswith("data:"):
        return image_url.split(",")[1]

    # Fetch from URL
    async with httpx.AsyncClient() as client:
        response = await client.get(image_url)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode()
        raise Exception(f"Failed to fetch image: {response.status_code}")


# ============================================================================
# HEALTH & CONFIG
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Patagon3d",
        "google_imagen_configured": bool(GOOGLE_CLOUD_API_KEY),
        "openai_configured": bool(OPENAI_API_KEY),
        "supabase_configured": bool(SUPABASE_URL)
    }


@app.get("/api/config")
async def get_config():
    """Get client-side configuration"""
    return {
        "features": {
            "measurements": bool(OPENAI_API_KEY),
            "renovation": bool(GOOGLE_CLOUD_API_KEY),
            "storage": bool(SUPABASE_URL)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
