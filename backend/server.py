from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt, JWTError
import aiofiles
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    username: str
    password: str
    role: Literal["Yönetici", "Editör", "Firma"]
    permissions: List[str] = []
    avatar_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    full_name: str
    username: str
    password: str
    role: Literal["Yönetici", "Editör", "Firma"]
    permissions: List[str] = []

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    role: str
    permissions: List[str]
    avatar_url: Optional[str] = None

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    username: str
    password: str
    brand_color_hex: str = "#1CFF00"
    logo_url: Optional[str] = None
    contact_info: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CompanyCreate(BaseModel):
    name: str
    username: str
    password: str
    brand_color_hex: str = "#1CFF00"
    contact_info: Optional[str] = None

class CompanyResponse(BaseModel):
    id: str
    name: str
    username: str
    brand_color_hex: str
    logo_url: Optional[str] = None
    contact_info: Optional[str] = None

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    media: Optional[str] = None
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    feed_type: Literal["ana_akis", "firma_akisi"] = "ana_akis"
    target_company: Optional[str] = None

class PostCreate(BaseModel):
    title: str
    content: str
    feed_type: Literal["ana_akis", "firma_akisi"] = "ana_akis"
    target_company: Optional[str] = None

class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    media: Optional[str] = None
    created_by: str
    created_at: str
    feed_type: str
    target_company: Optional[str] = None
    creator_name: Optional[str] = None
    company_name: Optional[str] = None

class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    location: Optional[str] = None
    created_by: str
    assigned_company: Optional[str] = None
    assigned_editors: List[str] = []
    type: Literal["personal", "company", "shared"] = "personal"
    color_hex: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    location: Optional[str] = None
    assigned_company: Optional[str] = None
    assigned_editors: List[str] = []
    type: Literal["personal", "company", "shared"] = "personal"
    color_hex: Optional[str] = None

class CalendarEventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    location: Optional[str] = None
    created_by: str
    assigned_company: Optional[str] = None
    assigned_editors: List[str] = []
    type: str
    color_hex: Optional[str] = None
    company_name: Optional[str] = None

class ProfitRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    type: Literal["gelir", "gider"]
    amount: float
    company_id: Optional[str] = None
    company_text: Optional[str] = None
    description: str
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProfitRecordCreate(BaseModel):
    type: Literal["gelir", "gider"]
    amount: float
    company_id: Optional[str] = None
    company_text: Optional[str] = None
    description: str
    date: str

class ProfitRecordResponse(BaseModel):
    id: str
    admin_id: str
    type: str
    amount: float
    company_id: Optional[str] = None
    company_text: Optional[str] = None
    description: str
    date: str
    company_name: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    company_id: str
    title: str
    amount: float
    status: Literal["odenecek", "odendi"] = "odenecek"
    date: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentCreate(BaseModel):
    company_id: str
    title: str
    amount: float
    date: str
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    created_by: str
    company_id: str
    title: str
    amount: float
    status: str
    date: str
    notes: Optional[str] = None
    company_name: Optional[str] = None

class Visuals(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    admin_id: str
    logo_url: str = "/uploads/logos/default-logo.png"
    logo_width: int = 150
    logo_height: int = 50
    preserve_aspect_ratio: bool = True
    primary_color: str = "#000000"
    accent_color: str = "#1CFF00"
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VisualsUpdate(BaseModel):
    logo_width: Optional[int] = None
    logo_height: Optional[int] = None
    preserve_aspect_ratio: Optional[bool] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None

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
# AUTH ENDPOINTS
# ========================

@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı adı zaten mevcut")
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user.password)
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    await db.users.insert_one(doc)
    
    return UserResponse(**doc)

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if user_doc and verify_password(credentials.password, user_doc['password']):
        token = create_access_token({"sub": user_doc['id'], "type": "user"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse(**user_doc).model_dump()
        }
    
    company_doc = await db.companies.find_one({"username": credentials.username}, {"_id": 0})
    if company_doc and verify_password(credentials.password, company_doc['password']):
        token = create_access_token({"sub": company_doc['id'], "type": "company"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": company_doc['id'],
                "username": company_doc['username'],
                "role": "Firma",
                "full_name": company_doc['name'],
                "permissions": ["Firma Akışı", "Firma Takvimi", "Firma Ödemeleri"]
            }
        }
    
    raise HTTPException(status_code=401, detail="Geçersiz kimlik bilgileri")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user['type'] == 'user':
        return UserResponse(**current_user['data'])
    else:
        company = current_user['data']
        return {
            "id": company['id'],
            "username": company['username'],
            "role": "Firma",
            "full_name": company['name'],
            "permissions": ["Firma Akışı", "Firma Takvimi", "Firma Ödemeleri"]
        }

# ========================
# USER ENDPOINTS
# ========================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı adı zaten mevcut")
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user.password)
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    await db.users.insert_one(doc)
    
    await manager.broadcast({"type": "user_created", "data": doc})
    
    return UserResponse(**doc)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: dict, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    if 'password' in user_update and user_update['password']:
        user_update['password'] = hash_password(user_update['password'])
    else:
        user_update.pop('password', None)
    
    await db.users.update_one({"id": user_id}, {"$set": user_update})
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(**user_doc)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "Kullanıcı silindi"}

@api_router.post("/users/{user_id}/avatar")
async def upload_user_avatar(user_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    avatar_url = await save_upload_file(file, "avatars")
    await db.users.update_one({"id": user_id}, {"$set": {"avatar_url": avatar_url}})
    return {"avatar_url": avatar_url}

# ========================
# COMPANY ENDPOINTS
# ========================

@api_router.get("/companies", response_model=List[CompanyResponse])
async def get_companies(current_user: dict = Depends(get_current_user)):
    companies = await db.companies.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return companies

@api_router.post("/companies", response_model=CompanyResponse)
async def create_company(company: CompanyCreate, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    existing = await db.companies.find_one({"username": company.username})
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı adı zaten mevcut")
    
    company_dict = company.model_dump()
    company_dict['password'] = hash_password(company.password)
    company_obj = Company(**company_dict)
    
    doc = company_obj.model_dump()
    await db.companies.insert_one(doc)
    
    return CompanyResponse(**doc)

@api_router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, company_update: dict, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    if 'password' in company_update and company_update['password']:
        company_update['password'] = hash_password(company_update['password'])
    else:
        company_update.pop('password', None)
    
    await db.companies.update_one({"id": company_id}, {"$set": company_update})
    company_doc = await db.companies.find_one({"id": company_id}, {"_id": 0})
    return CompanyResponse(**company_doc)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    await db.companies.delete_one({"id": company_id})
    return {"message": "Firma silindi"}

@api_router.post("/companies/{company_id}/logo")
async def upload_company_logo(company_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    logo_url = await save_upload_file(file, "logos")
    await db.companies.update_one({"id": company_id}, {"$set": {"logo_url": logo_url}})
    return {"logo_url": logo_url}

# ========================
# POST ENDPOINTS
# ========================

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts(current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user['type'] == 'company':
        company_id = current_user['data']['id']
        query = {
            "feed_type": "firma_akisi",
            "target_company": company_id
        }
    elif current_user['data']['role'] in ['Yönetici', 'Editör']:
        pass
    
    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for post in posts:
        user = await db.users.find_one({"id": post['created_by']}, {"_id": 0})
        if user:
            post['creator_name'] = user['full_name']
        
        if post.get('target_company'):
            company = await db.companies.find_one({"id": post['target_company']}, {"_id": 0})
            if company:
                post['company_name'] = company['name']
    
    return posts

@api_router.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] not in ['Yönetici', 'Editör']:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    post_dict = post.model_dump()
    post_dict['created_by'] = current_user['data']['id']
    post_obj = Post(**post_dict)
    
    doc = post_obj.model_dump()
    await db.posts.insert_one(doc)
    
    await manager.broadcast({"type": "new_post", "data": doc})
    
    doc['creator_name'] = current_user['data']['full_name']
    
    if doc.get('target_company'):
        company = await db.companies.find_one({"id": doc['target_company']}, {"_id": 0})
        if company:
            doc['company_name'] = company['name']
    
    return PostResponse(**doc)

@api_router.post("/posts/{post_id}/media")
async def upload_post_media(post_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    media_url = await save_upload_file(file, "posts")
    await db.posts.update_one({"id": post_id}, {"$set": {"media": media_url}})
    return {"media_url": media_url}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    await db.posts.delete_one({"id": post_id})
    return {"message": "Gönderi silindi"}

# ========================
# CALENDAR EVENT ENDPOINTS
# ========================

@api_router.get("/events", response_model=List[CalendarEventResponse])
async def get_events(current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user['type'] == 'company':
        company_id = current_user['data']['id']
        query = {"assigned_company": company_id}
    elif current_user['data']['role'] == 'Editör':
        user_id = current_user['data']['id']
        query = {
            "$or": [
                {"assigned_editors": user_id},
                {"type": "shared"},
                {"created_by": user_id}
            ]
        }
    elif current_user['data']['role'] == 'Yönetici':
        pass
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    
    for event in events:
        if event.get('assigned_company'):
            company = await db.companies.find_one({"id": event['assigned_company']}, {"_id": 0})
            if company:
                event['company_name'] = company['name']
                if not event.get('color_hex'):
                    event['color_hex'] = company.get('brand_color_hex', '#1CFF00')
    
    return events

@api_router.post("/events", response_model=CalendarEventResponse)
async def create_event(event: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    event_dict = event.model_dump()
    event_dict['created_by'] = current_user['data']['id'] if current_user['type'] == 'user' else current_user['data']['id']
    
    if event.assigned_company and not event.color_hex:
        company = await db.companies.find_one({"id": event.assigned_company}, {"_id": 0})
        if company:
            event_dict['color_hex'] = company.get('brand_color_hex', '#1CFF00')
    
    event_obj = CalendarEvent(**event_dict)
    doc = event_obj.model_dump()
    await db.events.insert_one(doc)
    
    await manager.broadcast({"type": "new_event", "data": doc})
    
    if doc.get('assigned_company'):
        company = await db.companies.find_one({"id": doc['assigned_company']}, {"_id": 0})
        if company:
            doc['company_name'] = company['name']
    
    return CalendarEventResponse(**doc)

@api_router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(event_id: str, event_update: dict, current_user: dict = Depends(get_current_user)):
    await db.events.update_one({"id": event_id}, {"$set": event_update})
    event_doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    
    if event_doc.get('assigned_company'):
        company = await db.companies.find_one({"id": event_doc['assigned_company']}, {"_id": 0})
        if company:
            event_doc['company_name'] = company['name']
    
    return CalendarEventResponse(**event_doc)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    await db.events.delete_one({"id": event_id})
    return {"message": "Etkinlik silindi"}

# ========================
# PROFIT RECORD ENDPOINTS
# ========================

@api_router.get("/profits", response_model=List[ProfitRecordResponse])
async def get_profit_records(start_date: Optional[str] = None, end_date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    admin_id = current_user['data']['id']
    query = {"admin_id": admin_id}
    
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    records = await db.profits.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for record in records:
        if record.get('company_id'):
            company = await db.companies.find_one({"id": record['company_id']}, {"_id": 0})
            if company:
                record['company_name'] = company['name']
    
    return records

@api_router.post("/profits", response_model=ProfitRecordResponse)
async def create_profit_record(profit: ProfitRecordCreate, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    profit_dict = profit.model_dump()
    profit_dict['admin_id'] = current_user['data']['id']
    profit_obj = ProfitRecord(**profit_dict)
    
    doc = profit_obj.model_dump()
    await db.profits.insert_one(doc)
    
    if doc.get('company_id'):
        company = await db.companies.find_one({"id": doc['company_id']}, {"_id": 0})
        if company:
            doc['company_name'] = company['name']
    
    return ProfitRecordResponse(**doc)

@api_router.put("/profits/{profit_id}", response_model=ProfitRecordResponse)
async def update_profit_record(profit_id: str, profit_update: dict, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    await db.profits.update_one({"id": profit_id}, {"$set": profit_update})
    profit_doc = await db.profits.find_one({"id": profit_id}, {"_id": 0})
    
    if profit_doc.get('company_id'):
        company = await db.companies.find_one({"id": profit_doc['company_id']}, {"_id": 0})
        if company:
            profit_doc['company_name'] = company['name']
    
    return ProfitRecordResponse(**profit_doc)

@api_router.delete("/profits/{profit_id}")
async def delete_profit_record(profit_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    await db.profits.delete_one({"id": profit_id})
    return {"message": "Kayıt silindi"}

# ========================
# PAYMENT ENDPOINTS
# ========================

@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(start_date: Optional[str] = None, end_date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user['type'] == 'company':
        company_id = current_user['data']['id']
        query = {"company_id": company_id}
    elif current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    payments = await db.payments.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for payment in payments:
        company = await db.companies.find_one({"id": payment['company_id']}, {"_id": 0})
        if company:
            payment['company_name'] = company['name']
    
    return payments

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    payment_dict = payment.model_dump()
    payment_dict['created_by'] = current_user['data']['id']
    payment_obj = Payment(**payment_dict)
    
    doc = payment_obj.model_dump()
    await db.payments.insert_one(doc)
    
    await manager.broadcast({"type": "new_payment", "data": doc})
    
    company = await db.companies.find_one({"id": doc['company_id']}, {"_id": 0})
    if company:
        doc['company_name'] = company['name']
    
    return PaymentResponse(**doc)

@api_router.put("/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, payment_update: dict, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    await db.payments.update_one({"id": payment_id}, {"$set": payment_update})
    payment_doc = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    
    await manager.broadcast({"type": "payment_updated", "data": payment_doc})
    
    company = await db.companies.find_one({"id": payment_doc['company_id']}, {"_id": 0})
    if company:
        payment_doc['company_name'] = company['name']
    
    return PaymentResponse(**payment_doc)

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    await db.payments.delete_one({"id": payment_id})
    return {"message": "Ödeme silindi"}

# ========================
# VISUALS ENDPOINTS
# ========================

@api_router.get("/visuals", response_model=Visuals)
async def get_visuals(current_user: dict = Depends(get_current_user)):
    admin_id = current_user['data']['id']
    visuals = await db.visuals.find_one({"admin_id": admin_id}, {"_id": 0})
    if not visuals:
        default_visuals = Visuals(admin_id=admin_id)
        await db.visuals.insert_one(default_visuals.model_dump())
        return default_visuals
    return Visuals(**visuals)

@api_router.put("/visuals", response_model=Visuals)
async def update_visuals(visuals_update: VisualsUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    admin_id = current_user['data']['id']
    update_dict = visuals_update.model_dump(exclude_unset=True)
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.visuals.update_one(
        {"admin_id": admin_id},
        {"$set": update_dict},
        upsert=True
    )
    
    visuals = await db.visuals.find_one({"admin_id": admin_id}, {"_id": 0})
    return Visuals(**visuals)

@api_router.post("/visuals/logo")
async def upload_visuals_logo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user['type'] != 'user' or current_user['data']['role'] != 'Yönetici':
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    
    logo_url = await save_upload_file(file, "logos")
    admin_id = current_user['data']['id']
    
    await db.visuals.update_one(
        {"admin_id": admin_id},
        {"$set": {"logo_url": logo_url, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"logo_url": logo_url}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
