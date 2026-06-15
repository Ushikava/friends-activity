from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import get_db
from db.models import Photo, Place, Movie, Game, MovieWatch, GamePlay
from db.activity_log import get_feed

router = APIRouter(tags=["activity"])


@router.get("/activity")
def get_activity(db: Session = Depends(get_db)):
    cutoff = date.today() - timedelta(days=365)
    counts: dict[str, int] = {}

    for Model, col, extra_filter in (
        (Photo,       Photo.uploaded_at,      None),
        (Place,       Place.uploaded_at,      None),
        (Movie,       Movie.created_at,       None),
        (Game,        Game.created_at,        None),
        (MovieWatch,  MovieWatch.updated_at,  MovieWatch.is_watched.is_(True)),
        (GamePlay,    GamePlay.updated_at,    GamePlay.is_played.is_(True)),
    ):
        q = db.query(func.date(col)).filter(col >= cutoff)
        if extra_filter is not None:
            q = q.filter(extra_filter)
        for (d,) in q.all():
            key = str(d)
            counts[key] = counts.get(key, 0) + 1

    return counts


@router.get("/feed")
def get_feed_endpoint(
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return get_feed(db, limit=50)


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
            "played": db.query(func.count(GamePlay.id))
                      .filter(GamePlay.user_id == user_id, GamePlay.is_played.is_(True)).scalar(),
        },
    }
