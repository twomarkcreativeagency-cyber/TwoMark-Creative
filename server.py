from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Body, Header, Depends
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import uuid, bcrypt, logging, os
from datetime import datetime, timezone, timedelta
from jose import jwt
from PIL import Image
import aiofiles
from bson import ObjectId

# =========================
#  Temel Ayarlar
# =========================
ROOT_DIR = Path(__file__).parent

# 🔧 MONGO URL tam formatta (veritabanı sonuna /twomarkcrm eklendi)
MONGO_URL = "mongodb+srv://twomarkCRM:Two2.Mark2Tt@twomarkcreativecrm.gdztghj.mongodb.net/twomarkcrm?retryWrites=true&w=majority"
DB_NAME = "twomarkcrm"

# 🔧 TLS izinli bağlantı (Render ortamında sertifika sorunlarını önler)
client = AsyncIOMotorClient(
    MONGO_URL,
    tls=True,
    tlsAllowInvalidCertificates=True
)
db = client[DB_NAME]

JWT_SECRET_KEY = "twomark-creative-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

app = FastAPI()
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://brown-wolverine-965096.hostingersite.com",
        "https://crm.twomarkcreative.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIRS = ["avatars", "logos", "posts", "media"]
for d in UPLOAD_DIRS:
    (ROOT_DIR / "uploads" / d).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=ROOT_DIR / "uploads"), name="uploads")

# =========================
#  UTIL
# =========================
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
    ext = Path(upload_file.filename).suffix
    unique = f"{uuid.uuid4()}{ext}"
    folder = ROOT_DIR / "uploads" / directory
    fpath = folder / unique

    async with aiofiles.open(fpath, 'wb') as out:
        await out.write(await upload_file.read())

    if ext.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
        try:
            img = Image.open(fpath)
            img.thumbnail((300, 300))
            img.save(folder / f"thumb_{unique}")
        except:
            pass

    return f"/uploads/{directory}/{unique}"

# =========================
#  AUTH HELPERS
# =========================
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        user = await db["users"].find_one(
            {"$or": [{"_id": user_id}, {"_id": ObjectId(user_id)}]}
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user["id"] = str(user["_id"])
        user["role"] = user.get("role", "company")
        return user

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def require_role(user: dict, allowed: list[str]):
    if user.get("role", "company") not in allowed:
        raise HTTPException(status_code=403, detail="Permission denied")

# =========================
#  ROUTES
# =========================
@api.get("/ping")
async def ping():
    return {"message": "pong"}

# ---- AUTH ----
@api.post("/auth/login")
async def login_route(username: str = Body(...), password: str = Body(...)):
    user = await db["users"].find_one({"username": username})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": token,
        "user": {
            "username": user["username"],
            "id": str(user["_id"]),
            "role": user.get("role", "company")
        }
    }

@api.get("/auth/me")
async def get_me(current=Depends(get_current_user)):
    return {"username": current["username"], "id": current["id"], "role": current["role"]}

@api.get("/create-sample-user")
async def create_sample_user():
    existing = await db["users"].find_one({"username": "admin"})
    if existing:
        return {"status": "exists", "message": "Admin already exists"}
    hashed_pw = hash_password("admin123")
    _id = str(ObjectId())
    await db["users"].insert_one({
        "_id": ObjectId(_id),
        "username": "admin",
        "password": hashed_pw,
        "role": "administration",
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id}

# ---- FIRMS ----
@api.post("/firms/create")
async def create_firm(
    name: str = Body(...),
    contact: str = Body(""),
    description: str = Body(""),
    current=Depends(get_current_user)
):
    require_role(current, ["administration", "editor"])
    _id = str(ObjectId())
    await db["firms"].insert_one({
        "_id": ObjectId(_id),
        "name": name,
        "contact": contact,
        "description": description,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id}

# ---- DEBUG ----
@api.get("/debug/test-db")
async def test_db_connection():
    try:
        collections = await db.list_collection_names()
        return {"status": "ok", "collections": collections}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@api.get("/debug/test-insert")
async def test_insert():
    try:
        _id = ObjectId()
        test_doc = {
            "_id": _id,
            "collection": "debug_test",
            "insert_check": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        result = await db["debug_test"].insert_one(test_doc)
        print("✅ Insert Result:", result.inserted_id)
        return {"status": "ok", "inserted_id": str(result.inserted_id)}
    except Exception as e:
        print("❌ Insert Error:", e)
        return {"status": "error", "message": str(e)}

# ---- VERSION ----
@api.get("/_version")
async def version():
    return {"version": "crm-backend-v3", "timestamp": datetime.utcnow().isoformat()}

# ---- REGISTER ROUTER ----
app.include_router(api)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

logging.basicConfig(level=logging.INFO)
