from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Body, Header, Depends
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import uuid, bcrypt, logging
from datetime import datetime, timezone, timedelta
from jose import jwt
import aiofiles
from bson import ObjectId
from PIL import Image

# =======================================
# CONFIG
# =======================================
ROOT_DIR = Path(__file__).parent

MONGO_URL = "mongodb+srv://twomarkCRM:Two2.Mark2Tt@twomarkcreativecrm.gdztghj.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "twomarkcrm"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

JWT_SECRET_KEY = "twomark-creative-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# =======================================
# FASTAPI APP
# =======================================
app = FastAPI()
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "http://localhost:3000",
        "https://brown-wolverine-965096.hostingersite.com",
        "https://crm.twomarkcreative.com",
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

# =======================================
# UTILS
# =======================================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, JWT_SECRET_KEY, algorithm=ALGORITHM)

async def save_upload_file(upload_file: UploadFile, directory: str) -> str:
    ext = Path(upload_file.filename).suffix
    unique = f"{uuid.uuid4()}{ext}"
    folder = ROOT_DIR / "uploads" / directory
    fpath = folder / unique

    async with aiofiles.open(fpath, "wb") as out:
        await out.write(await upload_file.read())

    return f"/uploads/{directory}/{unique}"

# =======================================
# AUTH HELPERS
# =======================================
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Missing token")

    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(404, "User not found")

        user["id"] = str(user["_id"])
        user["role"] = user.get("role", "company")
        return user

    except Exception as e:
        raise HTTPException(401, f"Invalid token: {e}")

def require_role(user: dict, allowed: list[str]):
    if user.get("role") not in allowed:
        raise HTTPException(403, "Permission denied")

# =======================================
# ROUTES
# =======================================

@api.get("/ping")
async def ping():
    return {"message": "pong"}

# ------------------ AUTH ------------------
@api.post("/auth/login")
async def login_route(username: str = Body(...), password: str = Body(...)):
    user = await db["users"].find_one({"username": username})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

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
async def get_me(current = Depends(get_current_user)):
    return current

# ------------------ USERS ------------------
@api.get("/users")
async def list_users(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    users = []
    async for u in db["users"].find({}, {"password": 0}):
        u["id"] = str(u["_id"])
        users.append(u)
    return users

# ------------------ COMPANIES (UYUMLU) ------------------
@api.get("/companies")
async def companies_list(current=Depends(get_current_user)):
    data = []
    async for f in db["firms"].find({}):
        f["id"] = str(f["_id"])
        data.append(f)
    return data

@api.post("/companies")
async def companies_create(
    name: str = Body(...),
    username: str = Body(...),
    password: str = Body(...),
    brand_color_hex: str = Body("#1CFF00"),
    contact_info: str = Body(""),
    current=Depends(get_current_user)
):
    require_role(current, ["administration", "editor"])
    _id = ObjectId()

    await db["firms"].insert_one({
        "_id": _id,
        "name": name,
        "username": username,
        "password": hash_password(password),
        "brand_color_hex": brand_color_hex,
        "contact_info": contact_info,
        "created_by": current["id"],
        "created_at": datetime.utcnow().isoformat(),
    })

    return {"status": "ok", "id": str(_id)}

@api.put("/companies/{cid}")
async def companies_update(
    cid: str,
    name: str = Body(...),
    brand_color_hex: str = Body("#1CFF00"),
    contact_info: str = Body(""),
    password: str = Body(None),
    current=Depends(get_current_user)
):
    require_role(current, ["administration"])

    update_data = {
        "name": name,
        "brand_color_hex": brand_color_hex,
        "contact_info": contact_info
    }

    if password:
        update_data["password"] = hash_password(password)

    await db["firms"].update_one({"_id": ObjectId(cid)}, {"$set": update_data})

    return {"status": "ok"}

@api.delete("/companies/{cid}")
async def companies_delete(cid: str, current=Depends(get_current_user)):
    require_role(current, ["administration"])
    await db["firms"].delete_one({"_id": ObjectId(cid)})
    return {"status": "ok"}

# ------------------ EVENTS ------------------
@api.get("/events")
async def list_events(current=Depends(get_current_user)):
    data = []
    async for e in db["events"].find({}).sort("date", 1):
        e["id"] = str(e["_id"])
        data.append(e)
    return data

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
        "created_at": datetime.utcnow().isoformat(),
    })

    return {"status": "ok", "id": str(_id)}

# ------------------ STATS ------------------
@api.get("/stats")
async def list_stats(current=Depends(get_current_user)):
    require_role(current, ["administration"])
    data = []
    async for s in db["stats"].find({}).sort("date", -1):
        s["id"] = str(s["_id"])
        data.append(s)
    return data

# ------------------ MEDIA ------------------
@api.get("/media")
async def list_media(current=Depends(get_current_user)):
    data = []
    async for m in db["media"].find({}).sort("created_at", -1):
        m["id"] = str(m["_id"])
        data.append(m)
    return data

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

# ------------------ DEBUG ------------------
@api.get("/debug/test-db")
async def test_db_connection():
    try:
        collections = await db.list_collection_names()
        return {"status": "ok", "collections": collections}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ------------------ REGISTER ROUTER ------------------
app.include_router(api)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

logging.basicConfig(level=logging.INFO)
