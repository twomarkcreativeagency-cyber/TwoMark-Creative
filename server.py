from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt, JWTError
import aiofiles
from PIL import Image
import os
import logging

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is not set.")
db_name = os.environ.get('DB_NAME')
if not db_name:
    raise ValueError("DB_NAME environment variable is not set.")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'twomark-creative-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve uploads directory
app.mount("/uploads", StaticFiles(directory=ROOT_DIR / "uploads"), name="uploads")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except:
                await self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ========================
# MODELS
# ========================
# (Bütün modeller User, Company, Post, CalendarEvent, ProfitRecord, Payment, Visuals)
# Aynı şekilde daha önce verdiğimiz modelleri buraya kopyalayabilirsin
# ========================

# ========================
# AUTH UTILITIES
# ========================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user_type = payload.get("type")
        if user_type == "user":
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
            if not user_doc:
                raise HTTPException(status_code=401, detail="Invalid authentication")
            return {"type": "user", "data": user_doc}
        elif user_type == "company":
            company_doc = await db.companies.find_one({"id": user_id}, {"_id": 0})
            if not company_doc:
                raise HTTPException(status_code=401, detail="Invalid authentication")
            return {"type": "company", "data": company_doc}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# ========================
# FILE UPLOAD UTILITIES
# ========================
async def save_upload_file(upload_file: UploadFile, directory: str) -> str:
    file_extension = Path(upload_file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = Path(ROOT_DIR) / "uploads" / directory / unique_filename

    file_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await upload_file.read()
        await out_file.write(content)

    if file_extension.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
        try:
            img = Image.open(file_path)
            img.thumbnail((300, 300))
            thumb_path = Path(ROOT_DIR) / "uploads" / directory / f"thumb_{unique_filename}"
            img.save(thumb_path)
        except:
            pass

    return f"/uploads/{directory}/{unique_filename}"

# ========================
# ROUTES
# ========================
# Burada önceki tüm auth, user, company, post, event, profit, payment, visuals endpoint’leri aynı şekilde kullanılacak.
# Daha önce verdiğim uzun kodu buraya direkt yapıştırabilirsin.

app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
