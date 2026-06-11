from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import Movie


def get_all_movies(db: Session, skip: int = 0, limit: int = 20) -> list[Movie]:
    return db.query(Movie).order_by(Movie.created_at.desc()).offset(skip).limit(limit).all()


def count_movies(db: Session) -> int:
    return db.query(func.count(Movie.id)).scalar()


def create_movie(db: Session, title: str, poster: str | None, user_id: int) -> Movie:
    movie = Movie(title=title, poster=poster, added_by=user_id)
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


def get_movie_by_id(db: Session, movie_id: int) -> Movie | None:
    return db.query(Movie).filter(Movie.id == movie_id).first()


def toggle_watched(db: Session, movie_id: int) -> Movie | None:
    movie = get_movie_by_id(db, movie_id)
    if not movie:
        return None
    movie.is_watched = not movie.is_watched
    db.commit()
    db.refresh(movie)
    return movie


def delete_movie(db: Session, movie_id: int) -> None:
    db.query(Movie).filter(Movie.id == movie_id).delete()
    db.commit()
