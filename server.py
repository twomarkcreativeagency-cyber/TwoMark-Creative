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

MONGO_URL = "mongodb+srv://twomarkCRM:Two2.Mark2Tt@twomarkcreativecrm.gdztghj.mongodb.net/?retryWrites=true&w=majority"
DB_NAME   = "twomarkcrm"

client = AsyncIOMotorClient(MONGO_URL)
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
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
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

# ---- USERS ----
@api.get("/users")
async def list_users(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    cursor = db["users"].find({}, {"password": 0})
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        users.append(u)
    return {"items": users, "count": len(users)}

# ---- FIRMS ----
@api.get("/firms")
async def list_firms(current=Depends(get_current_user)):
    firms = []
    cursor = db["firms"].find({})
    async for f in cursor:
        f["id"] = str(f["_id"])
        firms.append(f)
    return {"items": firms, "count": len(firms)}

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

# ---- EVENTS ----
@api.get("/events")
async def list_events(current=Depends(get_current_user)):
    events = []
    cursor = db["events"].find({}).sort("date", 1)
    async for e in cursor:
        e["id"] = str(e["_id"])
        events.append(e)
    return {"items": events, "count": len(events)}

@api.post("/events/create")
async def create_event(
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
    _id = str(ObjectId())
    await db["events"].insert_one({
        "_id": ObjectId(_id),
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
    return {"status": "ok", "id": _id}

# ---- STATS ----
@api.get("/stats")
async def list_stats(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    stats = []
    cursor = db["stats"].find({}).sort("date", -1)
    async for s in cursor:
        s["id"] = str(s["_id"])
        stats.append(s)
    return {"items": stats, "count": len(stats)}

# ---- MEDIA ----
@api.get("/media")
async def list_media(current=Depends(get_current_user)):
    media = []
    cursor = db["media"].find({}).sort("created_at", -1)
    async for m in cursor:
        m["id"] = str(m["_id"])
        media.append(m)
    return {"items": media, "count": len(media)}

@api.post("/media/upload")
async def media_upload(file: UploadFile = File(...), current=Depends(get_current_user)):
    url = await save_upload_file(file, "media")
    _id = str(ObjectId())
    await db["media"].insert_one({
        "_id": ObjectId(_id),
        "url": url,
        "uploaded_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id, "url": url}

# ---- DEBUG ----
@api.get("/debug/test-db")
async def test_db_connection():
    try:
        collections = await db.list_collection_names()
        return {"status": "ok", "collections": collections}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ---- VERSION ----
@api.get("/_version")
async def version():
    return {"version": "crm-backend-v2-2025-11-12"}

# ---- REGISTER ROUTER ----
app.include_router(api)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

logging.basicConfig(level=logging.INFO)
