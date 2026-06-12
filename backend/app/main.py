import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from core.exceptions import AppError, app_error_handler
from api.auth import router as auth_router
from api.photo import router as photo_router
from api.movie import router as movie_router
from api.games import router as games_router
from api.place import router as place_router
from api.activity import router as activity_router
from api.chat import router as chat_router

os.makedirs("uploads/photos", exist_ok=True)
os.makedirs("uploads/posters", exist_ok=True)
os.makedirs("uploads/games", exist_ok=True)
os.makedirs("uploads/places", exist_ok=True)

app = FastAPI(title="FriendsActivity API")
app.add_exception_handler(AppError, app_error_handler)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(photo_router, prefix="/api")
app.include_router(movie_router, prefix="/api")
app.include_router(games_router, prefix="/api")
app.include_router(place_router, prefix="/api")
app.include_router(activity_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
