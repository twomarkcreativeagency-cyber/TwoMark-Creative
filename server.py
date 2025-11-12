from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Body, Header
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import uuid, bcrypt, logging
from datetime import datetime, timezone, timedelta
from jose import jwt
from PIL import Image
import aiofiles
from bson import ObjectId

# ROOT DIR
ROOT_DIR = Path(__file__).parent

# DATABASE
MONGO_URL = "mongodb+srv://twomarkCRM:Two2.Mark2Tt@twomarkcreativecrm.gdztghj.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "twomarkcrm"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# APP INIT
app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS - Frontend domainleri
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://brown-wolverine-965096.hostingersite.com",
        "https://crm.twomarkcreative.com"
    ],
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

# JWT CONFIG
JWT_SECRET_KEY = "twomark-creative-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

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

# ROUTES

@api_router.get("/ping")
async def ping():
    return {"message": "pong"}

@api_router.post("/upload/{folder}")
async def upload_file(folder: str, file: UploadFile = File(...)):
    if folder not in UPLOAD_DIRS:
        raise HTTPException(status_code=400, detail="Invalid folder")
    url = await save_upload_file(file, folder)
    return {"url": url}

# LOGIN ROUTE
users_collection = db["users"]

@api_router.post("/auth/login")
async def login_route(username: str = Body(...), password: str = Body(...)):
    user = await users_collection.find_one({"username": username})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "user": {"username": user["username"], "id": str(user["_id"])}}

# AUTH/ME ROUTE
@api_router.get("/auth/me")
async def get_me(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = await users_collection.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"username": user["username"], "id": str(user["_id"])}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# SAMPLE ADMIN USER
@api_router.get("/create-sample-user")
async def create_sample_user():
    existing = await users_collection.find_one({"username": "admin"})
    if existing:
        return {"status": "exists", "message": "Admin user already exists"}

    hashed_pw = hash_password("admin123")
    result = await users_collection.insert_one({
        "_id": str(ObjectId()),
        "username": "admin",
        "password": hashed_pw
    })
    return {"status": "ok", "message": "Admin user created", "id": result.inserted_id}

# INCLUDE ROUTER
app.include_router(api_router)

# LOGGING
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SHUTDOWN
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
