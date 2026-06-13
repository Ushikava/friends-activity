from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import get_db
from db.models import Photo, Place, Movie, Game, MovieWatch

router = APIRouter(tags=["activity"])


@router.get("/activity")
def get_activity(db: Session = Depends(get_db)):
    cutoff = date.today() - timedelta(days=365)
    counts: dict[str, int] = {}

    for Model, col in (
        (Photo, Photo.uploaded_at),
        (Place, Place.uploaded_at),
        (Movie, Movie.created_at),
        (Game, Game.created_at),
    ):
        for (d,) in db.query(func.date(col)).filter(col >= cutoff).all():
            key = str(d)
            counts[key] = counts.get(key, 0) + 1

    return counts


@router.get("/stats")
def get_stats(
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return {
        "photos": db.query(func.count(Photo.id)).scalar(),
        "places": db.query(func.count(Place.id)).scalar(),
        "movies": {
            "total": db.query(func.count(Movie.id)).scalar(),
            "watched": db.query(func.count(MovieWatch.id))
                       .filter(MovieWatch.user_id == user_id, MovieWatch.is_watched.is_(True)).scalar(),
        },
        "games": {
            "total": db.query(func.count(Game.id)).scalar(),
            "played": db.query(func.count(Game.id)).filter(Game.is_played.is_(True)).scalar(),
        },
    }
