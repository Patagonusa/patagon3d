"""
Patagon3d Backend - Real Photo AI Renovation & Measurement System
For Hello Projects Pro

Features:
- User authentication with admin management
- Upload real room photos/videos
- AI-powered measurement estimation using GPT-4 Vision
- Real image modification using Google Vertex AI Imagen 3.0
- PDF generation for client proposals
"""
import os
import uuid
import httpx
import base64
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form, Depends, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel

# Google Auth for Vertex AI OAuth2
from google.oauth2 import service_account
from google.auth.transport import requests as google_requests

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
GOOGLE_CLOUD_LOCATION = "us-central1"
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")

# Cached credentials
_google_credentials = None

def get_vertex_access_token():
    """Get OAuth2 access token for Vertex AI using service account"""
    global _google_credentials

    if not GOOGLE_SERVICE_ACCOUNT_JSON:
        raise Exception("GOOGLE_SERVICE_ACCOUNT_JSON not configured")

    try:
        if _google_credentials is None:
            sa_info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
            _google_credentials = service_account.Credentials.from_service_account_info(
                sa_info,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )

        # Refresh token if needed
        if not _google_credentials.valid:
            _google_credentials.refresh(google_requests.Request())

        return _google_credentials.token
    except Exception as e:
        raise Exception(f"Failed to get access token: {str(e)}")

# OpenAI Configuration (GPT-4 Vision for measurements)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Supabase Configuration (Image Storage)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Job stores
renovation_jobs = {}
measurement_jobs = {}
uploaded_images = {}

# Session store (in production, use Redis or database)
sessions = {}

# User store (in production, use database)
# Password is hashed using SHA256
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

users_db = {
    "felipe@patagonusa.com": {
        "email": "felipe@patagonusa.com",
        "password_hash": hash_password("Solar2025$"),
        "name": "Felipe",
        "role": "admin",
        "approved": True,
        "created_at": datetime.utcnow().isoformat()
    }
}

# Pending user registrations
pending_users = {}

# Templates
templates = Jinja2Templates(directory="frontend/templates")
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")


# ============================================================================
# MODELS
# ============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class UserApprovalRequest(BaseModel):
    email: str
    approve: bool

class MeasurementRequest(BaseModel):
    image_url: str
    room_type: str = "kitchen"

class RenovationRequest(BaseModel):
    image_url: str
    element_type: str
    style: str
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


# ============================================================================
# AUTHENTICATION
# ============================================================================

def get_current_user(session_id: Optional[str] = Cookie(None, alias="session_id")):
    """Get current user from session"""
    if not session_id or session_id not in sessions:
        return None

    session = sessions[session_id]
    if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        del sessions[session_id]
        return None

    email = session["email"]
    if email in users_db:
        return users_db[email]
    return None

def require_auth(session_id: Optional[str] = Cookie(None, alias="session_id")):
    """Require authenticated user"""
    user = get_current_user(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.get("approved"):
        raise HTTPException(status_code=403, detail="Account pending approval")
    return user

def require_admin(session_id: Optional[str] = Cookie(None, alias="session_id")):
    """Require admin user"""
    user = require_auth(session_id)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@app.get("/")
async def home(request: Request, session_id: Optional[str] = Cookie(None, alias="session_id")):
    """Render main page or redirect to login"""
    user = get_current_user(session_id)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    if not user.get("approved"):
        return templates.TemplateResponse("pending.html", {"request": request, "user": user})
    return templates.TemplateResponse("index.html", {"request": request, "user": user})


@app.get("/login")
async def login_page(request: Request, session_id: Optional[str] = Cookie(None, alias="session_id")):
    """Render login page"""
    user = get_current_user(session_id)
    if user and user.get("approved"):
        return RedirectResponse(url="/", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request})


@app.post("/api/auth/login")
async def login(request: LoginRequest, response: Response):
    """Authenticate user"""
    email = request.email.lower().strip()
    password_hash = hash_password(request.password)

    if email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = users_db[email]
    if user["password_hash"] != password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("approved"):
        raise HTTPException(status_code=403, detail="Account pending approval")

    # Create session
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "email": email,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        max_age=7*24*60*60,
        samesite="lax"
    )

    return {
        "success": True,
        "user": {
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }


@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register new user (requires admin approval)"""
    email = request.email.lower().strip()

    if email in users_db or email in pending_users:
        raise HTTPException(status_code=400, detail="Email already registered")

    pending_users[email] = {
        "email": email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "role": "user",
        "approved": False,
        "created_at": datetime.utcnow().isoformat()
    }

    return {"success": True, "message": "Registration submitted. Waiting for admin approval."}


@app.post("/api/auth/logout")
async def logout(response: Response, session_id: Optional[str] = Cookie(None, alias="session_id")):
    """Logout user"""
    if session_id and session_id in sessions:
        del sessions[session_id]

    response.delete_cookie("session_id")
    return {"success": True}


@app.get("/api/auth/me")
async def get_me(user: dict = Depends(require_auth)):
    """Get current user info"""
    return {
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }


# ============================================================================
# ADMIN USER MANAGEMENT
# ============================================================================

@app.get("/admin")
async def admin_page(request: Request, user: dict = Depends(require_admin)):
    """Render admin page"""
    return templates.TemplateResponse("admin.html", {"request": request, "user": user})


@app.get("/api/admin/users")
async def list_users(user: dict = Depends(require_admin)):
    """List all users and pending registrations"""
    approved_users = [
        {
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "approved": u["approved"],
            "created_at": u["created_at"]
        }
        for u in users_db.values()
    ]

    pending = [
        {
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "approved": u["approved"],
            "created_at": u["created_at"]
        }
        for u in pending_users.values()
    ]

    return {
        "users": approved_users,
        "pending": pending
    }


@app.post("/api/admin/approve")
async def approve_user(request: UserApprovalRequest, admin: dict = Depends(require_admin)):
    """Approve or reject pending user"""
    email = request.email.lower().strip()

    if email not in pending_users:
        raise HTTPException(status_code=404, detail="Pending user not found")

    if request.approve:
        # Move to approved users
        users_db[email] = pending_users[email]
        users_db[email]["approved"] = True
        del pending_users[email]
        return {"success": True, "message": f"User {email} approved"}
    else:
        # Reject
        del pending_users[email]
        return {"success": True, "message": f"User {email} rejected"}


@app.delete("/api/admin/users/{email}")
async def delete_user(email: str, admin: dict = Depends(require_admin)):
    """Delete a user"""
    email = email.lower().strip()

    if email == admin["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    if email in users_db:
        del users_db[email]
        return {"success": True, "message": f"User {email} deleted"}

    if email in pending_users:
        del pending_users[email]
        return {"success": True, "message": f"Pending user {email} deleted"}

    raise HTTPException(status_code=404, detail="User not found")


@app.post("/api/admin/users/{email}/role")
async def change_role(email: str, role: str = Form(...), admin: dict = Depends(require_admin)):
    """Change user role"""
    email = email.lower().strip()

    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    users_db[email]["role"] = role
    return {"success": True, "message": f"User {email} role changed to {role}"}


# ============================================================================
# IMAGE UPLOAD
# ============================================================================

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(require_auth)):
    """Upload a room photo for analysis and renovation"""
    image_id = str(uuid.uuid4())
    content = await file.read()
    content_type = file.content_type or "image/jpeg"

    uploaded_images[image_id] = {
        "content": content,
        "content_type": content_type,
        "filename": file.filename,
        "user_email": user["email"],
        "created_at": datetime.utcnow().isoformat()
    }

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
async def analyze_measurements(background_tasks: BackgroundTasks, request: MeasurementRequest, user: dict = Depends(require_auth)):
    """Analyze a room photo using GPT-4 Vision to estimate measurements"""
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
        image_base64 = await get_image_base64(image_url)

        async with httpx.AsyncClient(timeout=120.0) as client:
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

                try:
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
async def generate_renovation(background_tasks: BackgroundTasks, request: RenovationRequest, user: dict = Depends(require_auth)):
    """Generate AI renovation by modifying the REAL uploaded photo"""
    if not GOOGLE_SERVICE_ACCOUNT_JSON:
        raise HTTPException(status_code=500, detail="Google Service Account not configured")

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
    """Use Google Vertex AI Imagen 3.0 to modify the real photo"""
    try:
        image_base64 = await get_image_base64(image_url)

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
            prompt = f"Edit this room photo: {description or 'modernize the space'}. {preserve_clause}"

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
            # Get OAuth2 access token
            access_token = get_vertex_access_token()
            imagen_url = f"https://{GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT_ID}/locations/{GOOGLE_CLOUD_LOCATION}/publishers/google/models/imagen-3.0-capability-001:predict"

            response = await client.post(
                imagen_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                },
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

                generated_url = f"data:image/jpeg;base64,{generated_base64}"

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

    if image_url.startswith("/api/image/"):
        image_id = image_url.split("/")[-1]
        if image_id in uploaded_images:
            return base64.b64encode(uploaded_images[image_id]["content"]).decode()

    if image_url.startswith("data:"):
        return image_url.split(",")[1]

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
        "google_imagen_configured": bool(GOOGLE_SERVICE_ACCOUNT_JSON),
        "openai_configured": bool(OPENAI_API_KEY),
        "supabase_configured": bool(SUPABASE_URL)
    }


@app.get("/api/config")
async def get_config():
    """Get client-side configuration"""
    return {
        "features": {
            "measurements": bool(OPENAI_API_KEY),
            "renovation": bool(GOOGLE_SERVICE_ACCOUNT_JSON),
            "storage": bool(SUPABASE_URL)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
