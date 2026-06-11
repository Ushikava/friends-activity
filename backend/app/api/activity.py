from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import Photo, Place, Movie, Game

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
