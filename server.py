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

# =========================
#  CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://brown-wolverine-965096.hostingersite.com",
        "https://crm.twomarkcreative.com",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
#  Upload Klasörleri
# =========================
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

    # Thumbnail
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

        # hem string hem ObjectId dene
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
    user = await db["users"].find_one({"username": username})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": token,
        "user": {
            "username": user["username"],
            "id": str(user["_id"]),
            "role": user.get("role", "company"),
        },
    }

@api.get("/auth/me")
async def get_me(current=Depends(get_current_user)):
    return {
        "username": current["username"],
        "id": current["id"],
        "role": current["role"],
    }

# Admin oluşturma (güvenlik için sonra kapatabilirsin)
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
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"status": "ok", "id": _id}

# =========================
#  ROUTES: Users (Yetkilendirme)
# =========================
@api.get("/users")
async def list_users(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    cursor = db["users"].find({}, {"password": 0})
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        u["role"] = u.get("role", "company")
        users.append(u)
    return {"items": users, "count": len(users)}

# İleride gerekirse create/update/delete user’ları da buraya ekleyebiliriz.

# =========================
#  ROUTES: Firms (bizim kullandığımız)
# =========================
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
    current=Depends(get_current_user),
):
    require_role(current, ["administration", "editor"])
    _id = str(ObjectId())
    await db["firms"].insert_one({
        "_id": ObjectId(_id),
        "name": name,
        "contact": contact,
        "description": description,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"status": "ok", "id": _id}

# =========================
#  ✅ COMPAT LAYER: /companies (frontend buna istek atıyor)
# =========================
@api.get("/companies")
async def companies_list(current=Depends(get_current_user)):
    """
    Frontend'te /companies istekleri var.
    Bunları Mongo'da 'companies' collection'ına yönlendiriyoruz.
    """
    cursor = db["companies"].find({})
    items = []
    async for c in cursor:
        c["id"] = str(c["_id"])
        items.append(c)
    return {"items": items, "count": len(items)}

@api.post("/companies")
async def companies_create(
    payload: dict = Body(...),
    current=Depends(get_current_user),
):
    """
    Gelen body'yi olduğu gibi kaydediyoruz.
    Admin & editor ekleyebilsin.
    """
    require_role(current, ["administration", "editor"])
    doc = payload.copy()
    _id = ObjectId()
    doc["_id"] = _id
    doc["created_by"] = current["id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    await db["companies"].insert_one(doc)
    return {"status": "ok", "id": str(_id)}

# =========================
#  ROUTES: Events (Ortak Takvim / Firma Takvimi)
# =========================
@api.get("/events")
async def list_events(current=Depends(get_current_user)):
    events = []
    cursor = db["events"].find({}).sort("date", 1)
    async for e in cursor:
        e["id"] = str(e["_id"])
        events.append(e)
    return {"items": events, "count": len(events)}

@api.post("/events")
async def create_event(
    payload: dict = Body(...),
    current=Depends(get_current_user),
):
    """
    Frontend muhtemelen /events'e karma bir body yolluyor.
    Esnek olsun diye dict alıyoruz.
    """
    require_role(current, ["administration", "editor"])
    doc = payload.copy()
    _id = ObjectId()
    doc["_id"] = _id
    doc["created_by"] = current["id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    await db["events"].insert_one(doc)
    return {"status": "ok", "id": str(_id)}

# =========================
#  ROUTES: Media / Posts / Görsellik
# =========================
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
    _id = ObjectId()
    await db["media"].insert_one({
        "_id": _id,
        "url": url,
        "uploaded_by": current["id"],
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"status": "ok", "id": str(_id), "url": url}

# ✅ COMPAT: /posts (Görsellik, içerikler vs)
@api.get("/posts")
async def posts_list(current=Depends(get_current_user)):
    cursor = db["posts"].find({}).sort("created_at", -1)
    items = []
    async for p in cursor:
        p["id"] = str(p["_id"])
        items.append(p)
    return {"items": items, "count": len(items)}

@api.post("/posts")
async def posts_create(payload: dict = Body(...), current=Depends(get_current_user)):
    doc = payload.copy()
    _id = ObjectId()
    doc["_id"] = _id
    doc["created_by"] = current["id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    await db["posts"].insert_one(doc)
    return {"status": "ok", "id": str(_id)}

# =========================
#  ROUTES: Kazanç / Ödemeler
# =========================
# Orijinal bizim endpoint: /stats
@api.get("/stats")
async def list_stats(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    stats = []
    cursor = db["stats"].find({}).sort("date", -1)
    async for s in cursor:
        s["id"] = str(s["_id"])
        stats.append(s)
    return {"items": stats, "count": len(stats)}

@api.post("/stats")
async def create_stat(
    payload: dict = Body(...),
    current=Depends(get_current_user),
):
    require_role(current, ["administration"])
    doc = payload.copy()
    _id = ObjectId()
    doc["_id"] = _id
    doc["created_by"] = current["id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    await db["stats"].insert_one(doc)
    return {"status": "ok", "id": str(_id)}

# ✅ COMPAT: /payments (frontend buraya istek atıyor)
@api.get("/payments")
async def payments_list(current=Depends(get_current_user)):
    """
    Ödemeleri ayrı collection’da tutalım.
    """
    require_role(current, ["administration"])
    cursor = db["payments"].find({}).sort("date", -1)
    items = []
    async for p in cursor:
        p["id"] = str(p["_id"])
        items.append(p)
    return {"items": items, "count": len(items)}

@api.post("/payments")
async def payments_create(
    payload: dict = Body(...),
    current=Depends(get_current_user),
):
    require_role(current, ["administration"])
    doc = payload.copy()
    _id = ObjectId()
    doc["_id"] = _id
    doc["created_by"] = current["id"]
    doc["created_at"] = datetime.utcnow().isoformat()
    await db["payments"].insert_one(doc)
    return {"status": "ok", "id": str(_id)}

# =========================
#  Genel Upload
# =========================
@api.post("/upload/{folder}")
async def upload_file(folder: str, file: UploadFile = File(...), current=Depends(get_current_user)):
    if folder not in UPLOAD_DIRS:
        raise HTTPException(status_code=400, detail="Invalid folder")
    url = await save_upload_file(file, folder)
    return {"url": url}

# =========================
#  DEBUG & VERSION
# =========================
@api.get("/debug/test-db")
async def test_db_connection():
    try:
        collections = await db.list_collection_names()
        # küçük bir test insert de yapalım
        res = await db["debug_test"].insert_one({
            "created_at": datetime.utcnow().isoformat(),
            "note": "connection_ok",
        })
        return {"status": "ok", "collections": collections, "inserted_id": str(res.inserted_id)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@api.get("/_version")
async def version():
    return {"version": "crm-backend-v3-compat-2025-11-14"}

# =========================
#  REGISTER ROUTER & SHUTDOWN
# =========================
app.include_router(api)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

logging.basicConfig(level=logging.INFO)
