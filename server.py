from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os, uuid, bcrypt, logging
from datetime import datetime, timezone, timedelta
from jose import jwt
from PIL import Image
import aiofiles

# ROOT DIR
ROOT_DIR = Path(__file__).parent

# ENV VARIABLES
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "mydb")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "twomark-creative-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# MONGO CLIENT
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# APP INIT
app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# UPLOADS
UPLOAD_DIRS = ["avatars", "logos", "posts"]
for d in UPLOAD_DIRS:
    path = ROOT_DIR / "uploads" / d
    path.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=ROOT_DIR / "uploads"), name="uploads")

# UTILITIES
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

async def save_upload_file(upload_file: UploadFile, directory: str) -> str:
    file_extension = Path(upload_file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    folder_path = ROOT_DIR / "uploads" / directory
    folder_path.mkdir(parents=True, exist_ok=True)
    file_path = folder_path / unique_filename

    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await upload_file.read()
        await out_file.write(content)

    # thumbnail
    if file_extension.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
        try:
            img = Image.open(file_path)
            img.thumbnail((300, 300))
            thumb_path = folder_path / f"thumb_{unique_filename}"
            img.save(thumb_path)
        except:
            pass

    return f"/uploads/{directory}/{unique_filename}"

# TEST ROUTES
@api_router.get("/ping")
async def ping():
    return {"message": "pong"}

@api_router.post("/upload/{folder}")
async def upload_file(folder: str, file: UploadFile = File(...)):
    if folder not in UPLOAD_DIRS:
        raise HTTPException(status_code=400, detail="Invalid folder")
    url = await save_upload_file(file, folder)
    return {"url": url}

# INCLUDE ROUTER
app.include_router(api_router)

# LOGGING
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SHUTDOWN
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
