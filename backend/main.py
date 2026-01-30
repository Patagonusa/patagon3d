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
import json

app = FastAPI(title="Patagon3d", description="3D Scanning & AI Renovation System")

# CORS for mobile browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Luma AI Configuration - Genie API for 3D
LUMA_API_KEY = os.environ.get("LUMA_API_KEY", "")
# Luma Genie API endpoint for 3D generation
LUMA_GENIE_API = "https://webapp.engineeringlumalabs.com/api"

# OpenAI Configuration for AI Renovation
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_BASE = "https://api.openai.com/v1"

# Renovation jobs store
renovation_jobs = {}

# Store job statuses in memory (use Redis in production)
jobs_store = {}

# Uploaded files store (for demo - use cloud storage in production)
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


@app.get("/")
async def home(request: Request):
    """Render main page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/upload-video")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a video file and start 3D reconstruction via Luma AI Genie
    """
    if not LUMA_API_KEY:
        raise HTTPException(status_code=500, detail="Luma API key not configured")

    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-m4v"]
    content_type = file.content_type or "video/mp4"

    # Generate job ID
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Read file content
    content = await file.read()

    # Store file temporarily
    uploaded_files[job_id] = {
        "content": content,
        "filename": file.filename,
        "content_type": content_type
    }

    # Store initial job status
    jobs_store[job_id] = JobStatus(
        job_id=job_id,
        status="pending",
        created_at=now,
        updated_at=now
    )

    # Start background processing
    background_tasks.add_task(process_video_to_3d, job_id)

    return {"job_id": job_id, "status": "pending", "message": "Video uploaded, processing started"}


async def process_video_to_3d(job_id: str):
    """
    Background task to process video through Luma AI Genie API
    """
    try:
        jobs_store[job_id].status = "processing"
        jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

        file_data = uploaded_files.get(job_id)
        if not file_data:
            raise Exception("File data not found")

        video_content = file_data["content"]
        filename = file_data["filename"]

        async with httpx.AsyncClient(timeout=600.0) as client:
            # Luma Genie API - Create capture from video
            # Step 1: Get upload URL
            headers = {
                "Authorization": f"luma-api-key={LUMA_API_KEY}",
                "Content-Type": "application/json"
            }

            # Try the Luma Genie/Capture API
            # First, create a new capture
            create_response = await client.post(
                "https://webapp.engineeringlumalabs.com/api/v3/captures",
                headers=headers,
                json={
                    "title": f"Patagon3d Scan - {filename}",
                }
            )

            if create_response.status_code in [200, 201]:
                capture_data = create_response.json()
                capture_id = capture_data.get("capture", {}).get("uuid") or capture_data.get("uuid") or capture_data.get("id")
                upload_url = capture_data.get("signedUrls", {}).get("source") or capture_data.get("uploadUrl")

                if upload_url:
                    # Step 2: Upload the video to the signed URL
                    upload_response = await client.put(
                        upload_url,
                        content=video_content,
                        headers={"Content-Type": "video/mp4"}
                    )

                    if upload_response.status_code in [200, 201, 204]:
                        # Step 3: Trigger processing
                        trigger_response = await client.post(
                            f"https://webapp.engineeringlumalabs.com/api/v3/captures/{capture_id}/trigger",
                            headers=headers
                        )

                        jobs_store[job_id].luma_capture_id = capture_id
                        jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

                        # Poll for completion
                        await poll_luma_genie_status(job_id, capture_id, client, headers)
                        return

            # If v3 API didn't work, try v2 API
            v2_response = await client.post(
                "https://webapp.engineeringlumalabs.com/api/v2/capture",
                headers={
                    "Authorization": f"luma-api-key={LUMA_API_KEY}",
                },
                files={"file": (filename, video_content, "video/mp4")}
            )

            if v2_response.status_code in [200, 201, 202]:
                result = v2_response.json()
                capture_id = result.get("uuid") or result.get("id") or result.get("capture_id")

                jobs_store[job_id].luma_capture_id = capture_id
                jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

                await poll_luma_genie_status(job_id, capture_id, client, {
                    "Authorization": f"luma-api-key={LUMA_API_KEY}"
                })
                return

            # If all Luma APIs fail, use demo mode
            jobs_store[job_id].status = "completed"
            jobs_store[job_id].model_url = None  # Will trigger demo mode in frontend
            jobs_store[job_id].error = f"Luma API unavailable - using demo mode. API Response: {create_response.status_code}"
            jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

    except Exception as e:
        jobs_store[job_id].status = "failed"
        jobs_store[job_id].error = str(e)
        jobs_store[job_id].updated_at = datetime.utcnow().isoformat()
    finally:
        # Clean up uploaded file
        if job_id in uploaded_files:
            del uploaded_files[job_id]


async def poll_luma_genie_status(job_id: str, capture_id: str, client: httpx.AsyncClient, headers: dict):
    """Poll Luma Genie API for capture completion"""
    max_attempts = 120  # 20 minutes max (10 second intervals)
    attempt = 0

    while attempt < max_attempts:
        try:
            # Check capture status
            response = await client.get(
                f"https://webapp.engineeringlumalabs.com/api/v3/captures/{capture_id}",
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                capture = result.get("capture", result)
                state = capture.get("state") or capture.get("status")

                if state in ["complete", "completed", "done", "ready"]:
                    # Get the 3D model URL
                    assets = capture.get("assets", {})
                    model_url = (
                        assets.get("glb") or
                        assets.get("mesh") or
                        assets.get("source") or
                        capture.get("model_url") or
                        capture.get("latestRun", {}).get("artifacts", [{}])[0].get("url")
                    )
                    preview_url = assets.get("thumbnail") or capture.get("preview_url")

                    jobs_store[job_id].status = "completed"
                    jobs_store[job_id].model_url = model_url
                    jobs_store[job_id].preview_url = preview_url
                    jobs_store[job_id].updated_at = datetime.utcnow().isoformat()
                    return

                elif state in ["failed", "error"]:
                    jobs_store[job_id].status = "failed"
                    jobs_store[job_id].error = capture.get("error") or capture.get("failureReason") or "Processing failed"
                    jobs_store[job_id].updated_at = datetime.utcnow().isoformat()
                    return

                # Update status
                jobs_store[job_id].status = f"processing ({state})"
                jobs_store[job_id].updated_at = datetime.utcnow().isoformat()

        except Exception as e:
            print(f"Poll error: {e}")

        attempt += 1
        await asyncio.sleep(10)  # Wait 10 seconds between polls

    # Timeout - but mark as completed with demo mode
    jobs_store[job_id].status = "completed"
    jobs_store[job_id].model_url = None
    jobs_store[job_id].error = "Processing timeout - using demo mode"
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
