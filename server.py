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

# MongoDB (Atlas)
MONGO_URL = "mongodb+srv://twomarkCRM:Two2.Mark2Tt@twomarkcreativecrm.gdztghj.mongodb.net/?retryWrites=true&w=majority"
DB_NAME   = "twomarkcrm"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT
JWT_SECRET_KEY = "twomark-creative-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# App
app = FastAPI()
api = APIRouter(prefix="/api")

# CORS
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

# Upload klasörleri
UPLOAD_DIRS = ["avatars", "logos", "posts", "media"]
for d in UPLOAD_DIRS:
    (ROOT_DIR / "uploads" / d).mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=ROOT_DIR / "uploads"), name="uploads")

# =========================
#  Util Fonksiyonlar
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
    folder.mkdir(parents=True, exist_ok=True)
    fpath = folder / unique

    async with aiofiles.open(fpath, 'wb') as out:
        content = await upload_file.read()
        await out.write(content)

    # Küçük görsel thumb
    if ext.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
        try:
            img = Image.open(fpath)
            img.thumbnail((300, 300))
            img.save(folder / f"thumb_{unique}")
        except:
            pass

    return f"/uploads/{directory}/{unique}"

# =========================
#  Auth Helper
# =========================
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = await db["users"].find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # normalize id string
        user["id"] = str(user["_id"])
        user["role"] = user.get("role", "company")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(user: dict, allowed: list[str]):
    role = user.get("role", "company")
    if role not in allowed:
        raise HTTPException(status_code=403, detail="Permission denied")

# =========================
#  ROUTES: Genel
# =========================
@api.get("/ping")
async def ping():
    return {"message": "pong"}

# =========================
#  ROUTES: Auth
# =========================
@api.post("/auth/login")
async def login_route(username: str = Body(...), password: str = Body(...)):
    users = db["users"]
    user = await users.find_one({"username": username})
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

# Örnek admin oluşturma (güvenlik için iş bittikten sonra silebilirsin)
@api.get("/create-sample-user")
async def create_sample_user():
    users = db["users"]
    existing = await users.find_one({"username": "admin"})
    if existing:
        return {"status": "exists", "message": "Admin user already exists"}

    hashed_pw = hash_password("admin123")
    _id = str(ObjectId())
    await users.insert_one({
        "_id": _id,
        "username": "admin",
        "password": hashed_pw,
        "role": "administration",
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "message": "Admin user created", "id": _id}

# =========================
#  ROUTES: Kullanıcılar
# =========================
@api.get("/users")
async def list_users(current=Depends(get_current_user)):
    # sadece admin tüm kullanıcıları görür
    require_role(current, ["administration"])
    cursor = db["users"].find({}, {"password": 0})
    items = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        u["role"] = u.get("role", "company")
        items.append(u)
    return {"items": items, "count": len(items)}

@api.post("/users/create")
async def create_user(
    username: str = Body(...),
    password: str = Body(...),
    role: str = Body("company"),
    current=Depends(get_current_user)
):
    require_role(current, ["administration"])
    users = db["users"]
    if await users.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    _id = str(ObjectId())
    await users.insert_one({
        "_id": _id,
        "username": username,
        "password": hash_password(password),
        "role": role,
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id}

@api.delete("/users/delete/{user_id}")
async def delete_user(user_id: str, current=Depends(get_current_user)):
    require_role(current, ["administration"])
    res = await db["users"].delete_one({"_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}

# =========================
#  ROUTES: Firmalar
# =========================
@api.get("/firms")
async def list_firms(current=Depends(get_current_user)):
    cursor = db["firms"].find({})
    items = []
    async for f in cursor:
        f["id"] = str(f["_id"])
        items.append(f)
    return {"items": items, "count": len(items)}

@api.post("/firms/create")
async def create_firm(
    name: str = Body(...),
    contact: str = Body(""),
    description: str = Body(""),
    current=Depends(get_current_user)
):
    # admin ve editor firma oluşturabilir
    require_role(current, ["administration", "editor"])
    _id = str(ObjectId())
    await db["firms"].insert_one({
        "_id": _id,
        "name": name,
        "contact": contact,
        "description": description,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id}

@api.delete("/firms/delete/{firm_id}")
async def delete_firm(firm_id: str, current=Depends(get_current_user)):
    require_role(current, ["administration"])
    res = await db["firms"].delete_one({"_id": firm_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Firm not found")
    return {"status": "ok"}

# =========================
#  ROUTES: Takvim / Olaylar
# =========================
@api.get("/events")
async def list_events(current=Depends(get_current_user)):
    cursor = db["events"].find({}).sort("date", 1)
    items = []
    async for e in cursor:
        e["id"] = str(e["_id"])
        items.append(e)
    return {"items": items, "count": len(items)}

@api.post("/events/create")
async def create_event(
    title: str = Body(...),
    description: str = Body(""),
    date: str = Body(...),          # "YYYY-MM-DD"
    start_time: str = Body("00:00"),
    end_time: str = Body("00:00"),
    location: str = Body(""),
    firm_id: str = Body(None),
    assigned_editors: list[str] = Body(default=[]),
    color: str = Body("#1CFF00"),
    current=Depends(get_current_user)
):
    # admin & editor ekleyebilir
    require_role(current, ["administration", "editor"])
    _id = str(ObjectId())
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
    return {"status": "ok", "id": _id}

@api.delete("/events/delete/{event_id}")
async def delete_event(event_id: str, current=Depends(get_current_user)):
    require_role(current, ["administration", "editor"])
    res = await db["events"].delete_one({"_id": event_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "ok"}

# =========================
#  ROUTES: Kazanç (Stats)
# =========================
@api.get("/stats")
async def list_stats(current=Depends(get_current_user)):
    cursor = db["stats"].find({}).sort("date", -1)
    items = []
    async for s in cursor:
        s["id"] = str(s["_id"])
        items.append(s)
    return {"items": items, "count": len(items)}

@api.post("/stats/create")
async def create_stat(
    title: str = Body(...),
    amount: float = Body(...),
    date: str = Body(...),         # "YYYY-MM-DD"
    note: str = Body(""),
    current=Depends(get_current_user)
):
    # sadece admin ekleyebilir
    require_role(current, ["administration"])
    _id = str(ObjectId())
    await db["stats"].insert_one({
        "_id": _id,
        "title": title,
        "amount": amount,
        "date": date,
        "note": note,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id}

@api.delete("/stats/delete/{stat_id}")
async def delete_stat(stat_id: str, current=Depends(get_current_user)):
    require_role(current, ["administration"])
    res = await db["stats"].delete_one({"_id": stat_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stat not found")
    return {"status": "ok"}

# =========================
#  ROUTES: Medya / Görsellik
# =========================
@api.get("/media")
async def list_media(current=Depends(get_current_user)):
    cursor = db["media"].find({}).sort("created_at", -1)
    items = []
    async for m in cursor:
        m["id"] = str(m["_id"])
        items.append(m)
    return {"items": items, "count": len(items)}

@api.post("/media/upload")
async def media_upload(file: UploadFile = File(...), current=Depends(get_current_user)):
    # herkes yükleyebilsin (gerekirse role kısıtlarınız)
    url = await save_upload_file(file, "media")
    _id = str(ObjectId())
    await db["media"].insert_one({
        "_id": _id,
        "url": url,
        "uploaded_by": current["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "ok", "id": _id, "url": url}

# =========================
#  Var olan upload endpointi (genel)
# =========================
@api.post("/upload/{folder}")
async def upload_file(folder: str, file: UploadFile = File(...), current=Depends(get_current_user)):
    if folder not in UPLOAD_DIRS:
        raise HTTPException(status_code=400, detail="Invalid folder")
    url = await save_upload_file(file, folder)
    return {"url": url}

# Router'ı ekle
app.include_router(api)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Shutdown
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
