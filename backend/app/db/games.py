from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from db.models import Game, GamePlay, UserData


def _build_game_dicts(db: Session, games: list, user_id: int | None) -> list[dict]:
    if not games:
        return []
    user_count: int = db.query(func.count(UserData.id)).filter(UserData.role != 'observer').scalar() or 0
    game_ids = [g.id for g in games]
    play_counts: dict[int, int] = dict(
        db.query(GamePlay.game_id, func.count(GamePlay.id))
        .filter(GamePlay.game_id.in_(game_ids), GamePlay.is_played.is_(True))
        .group_by(GamePlay.game_id)
        .all()
    )
    my_played: set[int] = set()
    if user_id is not None:
        my_played = {
            w.game_id
            for w in db.query(GamePlay.game_id)
            .filter(GamePlay.game_id.in_(game_ids), GamePlay.user_id == user_id, GamePlay.is_played.is_(True))
            .all()
        }
    return [
        {
            'id': g.id,
            'title': g.title,
            'poster': g.poster,
            'steam_link': g.steam_link,
            'play_count': play_counts.get(g.id, 0),
            'user_count': user_count,
            'is_played_by_me': g.id in my_played,
            'added_by': g.added_by,
            'created_at': g.created_at,
        }
        for g in games
    ]


def get_games(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    user_id: int | None = None,
    q: str | None = None,
    status: str | None = None,
) -> tuple[list[dict], int]:
    query = db.query(Game)

    if q:
        query = query.filter(
            or_(
                func.word_similarity(q, Game.title) > 0.2,
                Game.title.ilike(f'%{q}%'),
            )
        ).order_by(func.word_similarity(q, Game.title).desc(), Game.created_at.desc())
    else:
        query = query.order_by(Game.created_at.desc())

    if status == 'played' and user_id is not None:
        played_ids = db.query(GamePlay.game_id).filter(
            GamePlay.user_id == user_id, GamePlay.is_played.is_(True)
        ).subquery()
        query = query.filter(Game.id.in_(played_ids))
    elif status == 'unplayed' and user_id is not None:
        played_ids = db.query(GamePlay.game_id).filter(
            GamePlay.user_id == user_id, GamePlay.is_played.is_(True)
        ).subquery()
        query = query.filter(~Game.id.in_(played_ids))

    total: int = query.count()
    games = query.offset(skip).limit(limit).all()
    return _build_game_dicts(db, games, user_id), total


def get_all_games(db: Session, skip: int = 0, limit: int = 20, user_id: int | None = None) -> list[dict]:
    user_count: int = db.query(func.count(UserData.id)).filter(UserData.role != 'observer').scalar() or 0
    games = db.query(Game).order_by(Game.created_at.desc()).offset(skip).limit(limit).all()
    if not games:
        return []
    game_ids = [g.id for g in games]
    play_counts: dict[int, int] = dict(
        db.query(GamePlay.game_id, func.count(GamePlay.id))
        .filter(GamePlay.game_id.in_(game_ids), GamePlay.is_played.is_(True))
        .group_by(GamePlay.game_id)
        .all()
    )
    my_played: set[int] = set()
    if user_id is not None:
        my_played = {
            w.game_id
            for w in db.query(GamePlay.game_id)
            .filter(GamePlay.game_id.in_(game_ids), GamePlay.user_id == user_id, GamePlay.is_played.is_(True))
            .all()
        }
    return [
        {
            'id': g.id,
            'title': g.title,
            'poster': g.poster,
            'steam_link': g.steam_link,
            'play_count': play_counts.get(g.id, 0),
            'user_count': user_count,
            'is_played_by_me': g.id in my_played,
            'added_by': g.added_by,
            'created_at': g.created_at,
        }
        for g in games
    ]


def count_games(db: Session) -> int:
    return db.query(func.count(Game.id)).scalar()


def create_game(db: Session, title: str, poster: str | None, user_id: int, steam_link: str | None) -> dict:
    game = Game(title=title, poster=poster, added_by=user_id, steam_link=steam_link)
    db.add(game)
    db.flush()
    users = db.query(UserData).filter(UserData.role != 'observer').all()
    for u in users:
        db.add(GamePlay(game_id=game.id, user_id=u.id, is_played=False))
    db.commit()
    db.refresh(game)
    return {
        'id': game.id,
        'title': game.title,
        'poster': game.poster,
        'steam_link': game.steam_link,
        'play_count': 0,
        'user_count': len(users),
        'is_played_by_me': False,
        'added_by': game.added_by,
        'created_at': game.created_at,
    }


def get_game_by_id(db: Session, game_id: int) -> Game | None:
    return db.query(Game).filter(Game.id == game_id).first()


def get_game_page(db: Session, game_id: int, limit: int = 20) -> int | None:
    game = get_game_by_id(db, game_id)
    if not game:
        return None
    position = db.query(func.count(Game.id)).filter(Game.created_at > game.created_at).scalar() or 0
    return (position // limit) + 1


def get_game_detail(db: Session, game_id: int) -> dict | None:
    game = get_game_by_id(db, game_id)
    if not game:
        return None
    users = db.query(UserData).filter(UserData.role != 'observer').order_by(UserData.id).all()
    watches = {
        w.user_id: w
        for w in db.query(GamePlay).filter(GamePlay.game_id == game_id).all()
    }
    return {
        'id': game.id,
        'title': game.title,
        'poster': game.poster,
        'steam_link': game.steam_link,
        'created_at': game.created_at,
        'statuses': [
            {
                'user_id': u.id,
                'username': u.username,
                'is_played': watches[u.id].is_played if u.id in watches else False,
                'rating': watches[u.id].rating if u.id in watches else None,
                'review': watches[u.id].review if u.id in watches else None,
            }
            for u in users
        ],
    }


def toggle_user_played(
    db: Session, game_id: int, user_id: int,
    rating: int | None = None, review: str | None = None,
) -> dict | None:
    if not get_game_by_id(db, game_id):
        return None
    watch = db.query(GamePlay).filter(
        GamePlay.game_id == game_id,
        GamePlay.user_id == user_id,
    ).first()
    if watch:
        new_played = not watch.is_played
        watch.is_played = new_played
        watch.updated_at = datetime.now(timezone.utc)
        if new_played:
            if rating is not None:
                watch.rating = rating
            if review is not None:
                watch.review = review.strip() or None
    else:
        db.add(GamePlay(
            game_id=game_id, user_id=user_id, is_played=True,
            rating=rating,
            review=review.strip() if review else None,
            updated_at=datetime.now(timezone.utc),
        ))
    db.commit()
    return get_game_detail(db, game_id)


def update_game(db: Session, game_id: int, title: str, poster: str | None, steam_link: str | None) -> Game | None:
    game = get_game_by_id(db, game_id)
    if not game:
        return None
    game.title = title
    game.poster = poster
    game.steam_link = steam_link
    db.commit()
    db.refresh(game)
    return game


def delete_game(db: Session, game_id: int) -> None:
    db.query(Game).filter(Game.id == game_id).delete()
    db.commit()
