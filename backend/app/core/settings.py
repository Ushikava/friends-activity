import os
from os.path import join, dirname

from dotenv import load_dotenv

dotenv_path = join(dirname(dirname(__file__)), '.env')
load_dotenv(dotenv_path)

ALGORITHM = "HS256"

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))

GAMES_DIR = os.environ.get("GAMES_DIR", "uploads/games")
POSTERS_DIR = os.environ.get("POSTERS_DIR", "uploads/posters")
PHOTOS_DIR = os.environ.get("PHOTOS_DIR", "uploads/photos")
PLACES_DIR = os.environ.get("PLACES_DIR", "uploads/places")
AVATARS_DIR = os.environ.get("AVATARS_DIR", "uploads/avatars")
ALLOWED_EXTENSIONS = set(os.environ.get("ALLOWED_EXTENSIONS", ".jpg,.jpeg,.png,.webp,.gif").split(","))

OLLAMA_URL   = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "my-assistant")

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
