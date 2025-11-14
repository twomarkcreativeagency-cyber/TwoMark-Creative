from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Body, Header, Depends
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

# ======================================================
# TEMEL AYARLAR
# ======================================================

ROOT_DIR = Path(__file__).parent

MONGO_URL = "mongodb+srv://twomarkCRM:Two2.Mark2Tt@twomarkcreativecrm.gdztghj.mongodb.net/?retryWrites=true&w=majority"
DB_NAME   = "twomarkcrm"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

JWT_SECRET_KEY = "twomark-creative-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# FastAPI
app = FastAPI()
api = APIRouter(prefix="/api")

# ======================================================
# CORS
# ======================================================
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

# ======================================================
# Upload Klasörleri
# ======================================================
UPLOAD_DIRS = ["avatars", "logos", "posts", "media"]
for d in UPLOAD_DIRS:
    (ROOT_DIR / "uploads" / d).mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=ROOT_DIR / "uploads"), name="uploads")

# ======================================================
# UTIL
# ======================================================
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


# ======================================================
# AUTH HELPERS
# ======================================================
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        # Hem string hem ObjectId olarak bulur
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


# ======================================================
# BASE ROUTES
# ======================================================
@api.get("/ping")
async def ping():
    return {"message": "pong"}


# ======================================================
# AUTH ROUTES
# ======================================================
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
    return {
        "username": current["username"],
        "id": current["id"],
        "role": current["role"]
    }


# ======================================================
# USERS (frontend ile uyumlu)
# ======================================================
@api.get("/users")
async def compat_list_users(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    items = []
    cursor = db["users"].find({}, {"password": 0})
    async for u in cursor:
        u["id"] = str(u["_id"])
        items.append(u)
    return {"items": items, "count": len(items)}


# ======================================================
# COMPANIES (firms) - FRONTEND UYUMLU
# ======================================================
@api.get("/companies")
async def compat_list_companies(current=Depends(get_current_user)):
    items = []
    cursor = db["firms"].find({})
    async for f in cursor:
        f["id"] = str(f["_id"])
        items.append(f)
    return {"items": items, "count": len(items)}


@api.post("/companies")
async def compat_create_company(
    name: str = Body(...),
    contact: str = Body(""),
    description: str = Body(""),
    current=Depends(get_current_user)
):
    require_role(current, ["administration", "editor"])
    _id = ObjectId()
    await db["firms"].insert_one({
        "_id": _id,
        "name": name,
        "contact": contact,
        "description": description,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": str(_id)}


# ======================================================
# EVENTS (frontend ile tamamen uyumlu)
# ======================================================
@api.get("/events")
async def compat_list_events(current=Depends(get_current_user)):
    items = []
    cursor = db["events"].find({}).sort("date", 1)
    async for e in cursor:
        e["id"] = str(e["_id"])
        items.append(e)
    return {"items": items, "count": len(items)}


@api.post("/events")
async def compat_create_event(
    title: str = Body(...),
    description: str = Body(""),
    date: str = Body(...),
    start_time: str = Body("00:00"),
    end_time: str = Body("00:00"),
    location: str = Body(""),
    firm_id: str = Body(None),
    assigned_editors: list[str] = Body(default=[]),
    color: str = Body("#1CFF00"),
    current=Depends(get_current_user)
):
    require_role(current, ["administration", "editor"])
    _id = ObjectId()
    await db["events"].insert_one({
        "_id": _id,
        "title": title,
        "description": description,
        "date": date,
        "start_time": start_time,
        "end_time": end_time,
        "location": location,
        "firm_id": firm_id,
        "assigned_editors": assigned_editors,
        "color": color,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": str(_id)}


# ======================================================
# MEDIA
# ======================================================
@api.get("/media")
async def list_media(current=Depends(get_current_user)):
    items = []
    cursor = db["media"].find({}).sort("created_at", -1)
    async for m in cursor:
        m["id"] = str(m["_id"])
        items.append(m)
    return {"items": items, "count": len(items)}


@api.post("/media/upload")
async def media_upload(file: UploadFile = File(...), current=Depends(get_current_user)):
    url = await save_upload_file(file, "media")
    _id = ObjectId()
    await db["media"].insert_one({
        "_id": _id,
        "url": url,
        "uploaded_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": str(_id), "url": url}


# ======================================================
# DEBUG
# ======================================================
@api.get("/debug/test-db")
async def test_db_connection():
    collections = await db.list_collection_names()
    return {"status": "ok", "collections": collections}


@api.get("/_version")
async def version():
    return {"version": "crm-backend-master-2025-11-14"}


# ======================================================
# Register Router
# ======================================================
app.include_router(api)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

logging.basicConfig(level=logging.INFO)
