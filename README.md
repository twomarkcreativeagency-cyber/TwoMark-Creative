# My FastAPI App

## Setup for Render

1. Create a new Render Web Service.
2. Connect your GitHub repo.
3. Set Environment Variables:
   - `MONGO_URL`
   - `DB_NAME`
   - `JWT_SECRET_KEY` (optional)
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

Uploads will be stored in `uploads/avatars`, `uploads/logos`, `uploads/posts`.
