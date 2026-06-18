import random as rand_mod
from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from db.models import Movie, MovieWatch, UserData
from db import favorites as fav_db


def _build_movie_dicts(
    db: Session, movies: list, user_id: int | None, favorite_ids: set[int] | None = None
) -> list[dict]:
    if not movies:
        return []
    user_count: int = db.query(func.count(UserData.id)).filter(UserData.role != 'observer').scalar() or 0
    movie_ids = [m.id for m in movies]
    watch_counts: dict[int, int] = dict(
        db.query(MovieWatch.movie_id, func.count(MovieWatch.id))
        .filter(MovieWatch.movie_id.in_(movie_ids), MovieWatch.is_watched.is_(True))
        .group_by(MovieWatch.movie_id)
        .all()
    )
    my_watched: set[int] = set()
    if user_id is not None:
        my_watched = {
            w.movie_id
            for w in db.query(MovieWatch.movie_id)
            .filter(MovieWatch.movie_id.in_(movie_ids), MovieWatch.user_id == user_id, MovieWatch.is_watched.is_(True))
            .all()
        }
    favs = favorite_ids or set()
    return [
        {
            'id': m.id,
            'title': m.title,
            'poster': m.poster,
            'watch_count': watch_counts.get(m.id, 0),
            'user_count': user_count,
            'is_watched_by_me': m.id in my_watched,
            'is_favorite': m.id in favs,
            'added_by': m.added_by,
            'created_at': m.created_at,
        }
        for m in movies
    ]


def get_movies(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    user_id: int | None = None,
    q: str | None = None,
    status: str | None = None,
    favorites_only: bool = False,
) -> tuple[list[dict], int]:
    query = db.query(Movie)

    if q:
        query = query.filter(
            or_(
                func.word_similarity(q, Movie.title) > 0.2,
                Movie.title.ilike(f'%{q}%'),
            )
        ).order_by(func.word_similarity(q, Movie.title).desc(), Movie.created_at.desc())
    else:
        query = query.order_by(Movie.created_at.desc())

    if status == 'watched' and user_id is not None:
        watched_ids = db.query(MovieWatch.movie_id).filter(
            MovieWatch.user_id == user_id, MovieWatch.is_watched.is_(True)
        ).subquery()
        query = query.filter(Movie.id.in_(watched_ids))
    elif status == 'unwatched' and user_id is not None:
        watched_ids = db.query(MovieWatch.movie_id).filter(
            MovieWatch.user_id == user_id, MovieWatch.is_watched.is_(True)
        ).subquery()
        query = query.filter(~Movie.id.in_(watched_ids))

    if favorites_only and user_id is not None:
        fav_ids_sq = fav_db.get_favorite_ids(db, user_id, 'movie')
        query = query.filter(Movie.id.in_(fav_ids_sq))

    total: int = query.count()
    movies = query.offset(skip).limit(limit).all()
    fav_ids = fav_db.get_favorite_ids(db, user_id, 'movie') if user_id is not None else set()
    return _build_movie_dicts(db, movies, user_id, fav_ids), total


def get_all_movies(db: Session, skip: int = 0, limit: int = 20, user_id: int | None = None) -> list[dict]:
    user_count: int = db.query(func.count(UserData.id)).filter(UserData.role != 'observer').scalar() or 0
    movies = db.query(Movie).order_by(Movie.created_at.desc()).offset(skip).limit(limit).all()
    if not movies:
        return []
    movie_ids = [m.id for m in movies]
    watch_counts: dict[int, int] = dict(
        db.query(MovieWatch.movie_id, func.count(MovieWatch.id))
        .filter(MovieWatch.movie_id.in_(movie_ids), MovieWatch.is_watched.is_(True))
        .group_by(MovieWatch.movie_id)
        .all()
    )
    my_watched: set[int] = set()
    if user_id is not None:
        my_watched = {
            w.movie_id
            for w in db.query(MovieWatch.movie_id)
            .filter(MovieWatch.movie_id.in_(movie_ids), MovieWatch.user_id == user_id, MovieWatch.is_watched.is_(True))
            .all()
        }
    return [
        {
            'id': m.id,
            'title': m.title,
            'poster': m.poster,
            'watch_count': watch_counts.get(m.id, 0),
            'user_count': user_count,
            'is_watched_by_me': m.id in my_watched,
            'added_by': m.added_by,
            'created_at': m.created_at,
        }
        for m in movies
    ]


def count_movies(db: Session) -> int:
    return db.query(func.count(Movie.id)).scalar()


def create_movie(db: Session, title: str, poster: str | None, user_id: int) -> dict:
    movie = Movie(title=title, poster=poster, added_by=user_id)
    db.add(movie)
    db.flush()
    users = db.query(UserData).filter(UserData.role != 'observer').all()
    for u in users:
        db.add(MovieWatch(movie_id=movie.id, user_id=u.id, is_watched=False))
    db.commit()
    db.refresh(movie)
    return {
        'id': movie.id,
        'title': movie.title,
        'poster': movie.poster,
        'watch_count': 0,
        'user_count': len(users),
        'is_watched_by_me': False,
        'is_favorite': False,
        'added_by': movie.added_by,
        'created_at': movie.created_at,
    }


def get_movie_by_id(db: Session, movie_id: int) -> Movie | None:
    return db.query(Movie).filter(Movie.id == movie_id).first()


def get_movie_page(db: Session, movie_id: int, limit: int = 20) -> int | None:
    movie = get_movie_by_id(db, movie_id)
    if not movie:
        return None
    position = db.query(func.count(Movie.id)).filter(Movie.created_at > movie.created_at).scalar() or 0
    return (position // limit) + 1


def get_movie_detail(db: Session, movie_id: int) -> dict | None:
    movie = get_movie_by_id(db, movie_id)
    if not movie:
        return None
    users = db.query(UserData).filter(UserData.role != 'observer').order_by(UserData.id).all()
    watches = {
        w.user_id: w
        for w in db.query(MovieWatch).filter(MovieWatch.movie_id == movie_id).all()
    }
    return {
        'id': movie.id,
        'title': movie.title,
        'poster': movie.poster,
        'created_at': movie.created_at,
        'statuses': [
            {
                'user_id': u.id,
                'username': u.username,
                'is_watched': watches[u.id].is_watched if u.id in watches else False,
                'rating': watches[u.id].rating if u.id in watches else None,
                'review': watches[u.id].review if u.id in watches else None,
            }
            for u in users
        ],
    }


def toggle_user_watched(
    db: Session, movie_id: int, user_id: int,
    rating: int | None = None, review: str | None = None,
) -> dict | None:
    if not get_movie_by_id(db, movie_id):
        return None
    watch = db.query(MovieWatch).filter(
        MovieWatch.movie_id == movie_id,
        MovieWatch.user_id == user_id,
    ).first()
    if watch:
        new_watched = not watch.is_watched
        watch.is_watched = new_watched
        watch.updated_at = datetime.now(timezone.utc)
        if new_watched:
            if rating is not None:
                watch.rating = rating
            if review is not None:
                watch.review = review.strip() or None
    else:
        db.add(MovieWatch(
            movie_id=movie_id, user_id=user_id, is_watched=True,
            rating=rating,
            review=review.strip() if review else None,
            updated_at=datetime.now(timezone.utc),
        ))
    db.commit()
    return get_movie_detail(db, movie_id)


def update_movie(db: Session, movie_id: int, title: str, poster: str | None) -> Movie | None:
    movie = get_movie_by_id(db, movie_id)
    if not movie:
        return None
    movie.title = title
    movie.poster = poster
    db.commit()
    db.refresh(movie)
    return movie


def delete_movie(db: Session, movie_id: int) -> None:
    db.query(Movie).filter(Movie.id == movie_id).delete()
    db.commit()


def get_random_movie(db: Session, user_id: int | None = None, favorites_only: bool = False) -> dict | None:
    query = db.query(Movie)
    if favorites_only and user_id is not None:
        fav_ids = fav_db.get_favorite_ids(db, user_id, 'movie')
        if not fav_ids:
            return None
        query = query.filter(Movie.id.in_(fav_ids))
    total = query.count()
    if total == 0:
        return None
    movie = query.offset(rand_mod.randint(0, total - 1)).limit(1).first()
    return {'id': movie.id} if movie else None
