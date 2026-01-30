"""
Patagon3d Backend - Video to 3D Reconstruction with AI Renovation
For Hello Projects Pro (CSLB #1135440)
"""
import os
import uuid
import httpx
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64

app = FastAPI(title="Patagon3d", description="3D Scanning & AI Renovation System")

# CORS for mobile browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Luma AI Configuration
LUMA_API_KEY = os.environ.get("LUMA_API_KEY", "")
LUMA_API_BASE = "https://api.lumalabs.ai/dream-machine/v1"

# OpenAI Configuration for AI Renovation
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_BASE = "https://api.openai.com/v1"

# Renovation jobs store
renovation_jobs = {}

# Store job statuses in memory (use Redis in production)
jobs_store = {}

# Templates
templates = Jinja2Templates(directory="frontend/templates")
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")


class JobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    luma_capture_id: Optional[str] = None
    model_url: Optional[str] = None
    preview_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str


class RenovationRequest(BaseModel):
    model_url: str
    prompt: str  # e.g., "modern white cabinets with marble countertops"
    element_type: str  # e.g., "cabinets", "countertops", "walls"


@app.get("/")
async def home(request: Request):
    """Render main page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/upload-video")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a video file and start 3D reconstruction via Luma AI
    """
    if not LUMA_API_KEY:
        raise HTTPException(status_code=500, detail="Luma API key not configured")

    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_types}")

    # Generate job ID
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Read file content
    content = await file.read()

    # Store initial job status
    jobs_store[job_id] = JobStatus(
        job_id=job_id,
        status="pending",
        created_at=now,
        updated_at=now
    )

    # Start background processing
    background_tasks.add_task(process_video_to_3d, job_id, content, file.filename)

    return {"job_id": job_id, "status": "pending", "message": "Video uploaded, processing started"}


async def process_video_to_3d(job_id: str, video_content: bytes, filename: str):
    """
    Background task to process video through Luma AI
    """
    try:
        jobs_store[job_id].status = "processing"
        jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

        async with httpx.AsyncClient(timeout=300.0) as client:
            # Step 1: Create a capture/generation request
            # Using Luma's video-to-3D endpoint
            headers = {
                "Authorization": f"Bearer {LUMA_API_KEY}",
                "Content-Type": "application/json"
            }

            # First, upload the video to get a URL
            # For Luma AI, we need to provide a video URL or use their upload endpoint
            # We'll use their generations endpoint with video input

            # Create generation request
            response = await client.post(
                f"{LUMA_API_BASE}/generations",
                headers=headers,
                json={
                    "prompt": f"3D scan from video: {filename}",
                    "keyframes": {
                        "frame0": {
                            "type": "video",
                            "url": f"data:video/mp4;base64,{base64.b64encode(video_content).decode()}"
                        }
                    }
                }
            )

            if response.status_code != 200 and response.status_code != 201:
                # Try alternative endpoint structure
                # Luma has different API structures for different products
                response = await client.post(
                    "https://api.lumalabs.ai/api/v2/capture",
                    headers={
                        "Authorization": f"luma-api-key={LUMA_API_KEY}",
                        "Content-Type": "application/octet-stream"
                    },
                    content=video_content
                )

            if response.status_code in [200, 201, 202]:
                result = response.json()
                capture_id = result.get("id") or result.get("capture_id") or result.get("uuid")

                jobs_store[job_id].luma_capture_id = capture_id
                jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

                # Poll for completion
                await poll_luma_status(job_id, capture_id, client, headers)
            else:
                jobs_store[job_id].status = "failed"
                jobs_store[job_id].error = f"Luma API error: {response.status_code} - {response.text}"
                jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

    except Exception as e:
        jobs_store[job_id].status = "failed"
        jobs_store[job_id].error = str(e)
        jobs_store[job_id].updated_at = datetime.utcnow().isoformat()


async def poll_luma_status(job_id: str, capture_id: str, client: httpx.AsyncClient, headers: dict):
    """Poll Luma AI for capture completion"""
    max_attempts = 60  # 10 minutes max
    attempt = 0

    while attempt < max_attempts:
        try:
            response = await client.get(
                f"{LUMA_API_BASE}/generations/{capture_id}",
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                state = result.get("state") or result.get("status")

                if state in ["completed", "done", "ready"]:
                    # Get the 3D model URL
                    assets = result.get("assets", {})
                    model_url = assets.get("glb") or assets.get("mesh") or result.get("model_url")
                    preview_url = assets.get("thumbnail") or result.get("preview_url")

                    jobs_store[job_id].status = "completed"
                    jobs_store[job_id].model_url = model_url
                    jobs_store[job_id].preview_url = preview_url
                    jobs_store[job_id].updated_at = datetime.utcnow().isoformat()
                    return

                elif state in ["failed", "error"]:
                    jobs_store[job_id].status = "failed"
                    jobs_store[job_id].error = result.get("error") or "Processing failed"
                    jobs_store[job_id].updated_at = datetime.utcnow().isoformat()
                    return

        except Exception as e:
            print(f"Poll error: {e}")

        attempt += 1
        await asyncio.sleep(10)  # Wait 10 seconds between polls

    # Timeout
    jobs_store[job_id].status = "failed"
    jobs_store[job_id].error = "Processing timeout"
    jobs_store[job_id].updated_at = datetime.utcnow().isoformat()


@app.get("/api/job/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a processing job"""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_store[job_id]


@app.get("/api/jobs")
async def list_jobs():
    """List all jobs"""
    return list(jobs_store.values())


class RenovationJob(BaseModel):
    job_id: str
    status: str
    prompt: str
    element_type: str
    images: list = []
    error: Optional[str] = None
    created_at: str


@app.post("/api/renovate")
async def generate_renovation(background_tasks: BackgroundTasks, request: RenovationRequest):
    """
    Generate AI renovation proposals using OpenAI DALL-E 3
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    renovation_jobs[job_id] = RenovationJob(
        job_id=job_id,
        status="processing",
        prompt=request.prompt,
        element_type=request.element_type,
        created_at=now
    )

    background_tasks.add_task(generate_renovation_images, job_id, request.prompt, request.element_type)

    return {"job_id": job_id, "status": "processing", "message": "Generating renovation proposals..."}


async def generate_renovation_images(job_id: str, prompt: str, element_type: str):
    """Generate renovation images using DALL-E 3"""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }

            # Create detailed renovation prompt
            full_prompt = f"""Professional interior design photo of a kitchen renovation featuring {element_type}.
            Design details: {prompt}.
            High-end architectural photography, natural lighting, realistic materials and textures,
            magazine-quality interior design photography, 8k resolution."""

            images = []
            # Generate 3 design options
            for i in range(3):
                style_variants = [
                    "bright and airy modern style",
                    "warm and cozy transitional style",
                    "sleek contemporary luxury style"
                ]

                variant_prompt = f"{full_prompt} Style: {style_variants[i]}"

                response = await client.post(
                    f"{OPENAI_API_BASE}/images/generations",
                    headers=headers,
                    json={
                        "model": "dall-e-3",
                        "prompt": variant_prompt,
                        "n": 1,
                        "size": "1024x1024",
                        "quality": "standard"
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    if result.get("data") and len(result["data"]) > 0:
                        images.append({
                            "url": result["data"][0].get("url"),
                            "style": style_variants[i],
                            "revised_prompt": result["data"][0].get("revised_prompt", "")
                        })

            renovation_jobs[job_id].images = images
            renovation_jobs[job_id].status = "completed"

    except Exception as e:
        renovation_jobs[job_id].status = "failed"
        renovation_jobs[job_id].error = str(e)


@app.get("/api/renovate/{job_id}")
async def get_renovation_status(job_id: str):
    """Get renovation job status and results"""
    if job_id not in renovation_jobs:
        raise HTTPException(status_code=404, detail="Renovation job not found")
    return renovation_jobs[job_id]


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Patagon3d",
        "luma_configured": bool(LUMA_API_KEY),
        "openai_configured": bool(OPENAI_API_KEY)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
