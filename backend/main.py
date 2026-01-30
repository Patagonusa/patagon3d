"""
Patagon3d Backend - 3D Visualization & AI Renovation System
For Hello Projects Pro (CSLB #1135440)

Features:
- 3D space visualization with interactive demo kitchen
- Precision measurement tools (distance, area, height)
- AI renovation proposals via DALL-E 3 (images)
- AI renovation videos via Luma Dream Machine
"""
import os
import uuid
import httpx
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64
import json

app = FastAPI(title="Patagon3d", description="3D Visualization & AI Renovation System")

# CORS for mobile browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Luma AI Configuration - Dream Machine API (for video generation)
LUMA_API_KEY = os.environ.get("LUMA_API_KEY", "")
LUMA_API_BASE = "https://api.lumalabs.ai/dream-machine/v1"

# OpenAI Configuration for AI Renovation
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_BASE = "https://api.openai.com/v1"

# Job stores
renovation_jobs = {}
video_jobs = {}
jobs_store = {}
uploaded_files = {}

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
    prompt: str
    element_type: str


class VideoGenerationRequest(BaseModel):
    prompt: str
    element_type: str
    style: Optional[str] = "modern"


class VideoJob(BaseModel):
    job_id: str
    status: str
    prompt: str
    luma_generation_id: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str


@app.get("/")
async def home(request: Request):
    """Render main page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file - currently loads interactive demo kitchen for measurement.
    Note: Video-to-3D conversion requires Luma iOS app or enterprise API access.
    """
    # Generate job ID
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Store job - demo mode (model_url=None triggers interactive demo kitchen)
    jobs_store[job_id] = JobStatus(
        job_id=job_id,
        status="completed",
        model_url=None,
        created_at=now,
        updated_at=now
    )

    return {
        "job_id": job_id,
        "status": "completed",
        "message": "Video received. Loading interactive demo kitchen with measurement tools.",
        "note": "For actual video-to-3D scanning, use Luma AI iOS app to capture and export GLB models."
    }


# ============================================================================
# LUMA DREAM MACHINE API - AI Renovation Video Generation
# ============================================================================

@app.post("/api/generate-video")
async def generate_renovation_video(background_tasks: BackgroundTasks, request: VideoGenerationRequest):
    """
    Generate AI renovation visualization video using Luma Dream Machine API.
    Creates a cinematic walkthrough video of the proposed renovation.
    """
    if not LUMA_API_KEY:
        raise HTTPException(status_code=500, detail="Luma API key not configured")

    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Create the video generation prompt
    full_prompt = f"""Cinematic interior design video walkthrough of a beautiful kitchen renovation.
    Element focus: {request.element_type}.
    Design details: {request.prompt}.
    Style: {request.style}.
    Professional real estate video quality, smooth camera movement, natural lighting,
    high-end finishes, magazine-worthy interior design."""

    video_jobs[job_id] = VideoJob(
        job_id=job_id,
        status="processing",
        prompt=full_prompt,
        created_at=now
    )

    background_tasks.add_task(process_luma_video_generation, job_id, full_prompt)

    return {"job_id": job_id, "status": "processing", "message": "Generating AI renovation video..."}


async def process_luma_video_generation(job_id: str, prompt: str):
    """Generate video using Luma Dream Machine API"""
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            headers = {
                "Authorization": f"Bearer {LUMA_API_KEY}",
                "Content-Type": "application/json"
            }

            # Create video generation request
            response = await client.post(
                f"{LUMA_API_BASE}/generations",
                headers=headers,
                json={
                    "prompt": prompt,
                    "aspect_ratio": "16:9",
                    "loop": False
                }
            )

            if response.status_code in [200, 201, 202]:
                result = response.json()
                generation_id = result.get("id")
                video_jobs[job_id].luma_generation_id = generation_id

                # Poll for completion
                await poll_luma_video_status(job_id, generation_id, client, headers)
            else:
                video_jobs[job_id].status = "failed"
                video_jobs[job_id].error = f"Luma API error: {response.status_code} - {response.text}"

    except Exception as e:
        video_jobs[job_id].status = "failed"
        video_jobs[job_id].error = str(e)


async def poll_luma_video_status(job_id: str, generation_id: str, client: httpx.AsyncClient, headers: dict):
    """Poll Luma Dream Machine API for video generation completion"""
    max_attempts = 60  # 5 minutes max
    attempt = 0

    while attempt < max_attempts:
        try:
            response = await client.get(
                f"{LUMA_API_BASE}/generations/{generation_id}",
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                state = result.get("state") or result.get("status")

                if state in ["completed", "complete", "done"]:
                    # Get the video URL
                    assets = result.get("assets", {})
                    video_url = assets.get("video") or result.get("video", {}).get("url")
                    thumbnail_url = assets.get("thumbnail") or result.get("thumbnail", {}).get("url")

                    video_jobs[job_id].status = "completed"
                    video_jobs[job_id].video_url = video_url
                    video_jobs[job_id].thumbnail_url = thumbnail_url
                    return

                elif state in ["failed", "error"]:
                    video_jobs[job_id].status = "failed"
                    video_jobs[job_id].error = result.get("failure_reason") or "Video generation failed"
                    return

        except Exception as e:
            print(f"Poll error: {e}")

        attempt += 1
        await asyncio.sleep(5)

    video_jobs[job_id].status = "failed"
    video_jobs[job_id].error = "Video generation timeout"


@app.get("/api/video/{job_id}")
async def get_video_status(job_id: str):
    """Get AI video generation job status"""
    if job_id not in video_jobs:
        raise HTTPException(status_code=404, detail="Video job not found")
    return video_jobs[job_id]


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
            style_variants = [
                "bright and airy modern style",
                "warm and cozy transitional style",
                "sleek contemporary luxury style"
            ]

            for i, style in enumerate(style_variants):
                variant_prompt = f"{full_prompt} Style: {style}"

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
                            "style": style,
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


# Demo endpoint to test 3D viewer without Luma
@app.post("/api/demo-scan")
async def create_demo_scan():
    """Create a demo scan that loads the built-in demo room"""
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    jobs_store[job_id] = JobStatus(
        job_id=job_id,
        status="completed",
        model_url=None,  # None triggers demo mode
        created_at=now,
        updated_at=now
    )

    return {"job_id": job_id, "status": "completed", "message": "Demo scan created"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
