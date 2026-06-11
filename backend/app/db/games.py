from sqlalchemy.orm import Session

from db.models import Game


def get_all_games(db: Session) -> list[Game]:
    return db.query(Game).order_by(Game.created_at.desc()).all()


def create_game(db: Session, title: str, poster: str | None, user_id: int, steam_link: str | None) -> Game:
    game = Game(title=title, poster=poster, added_by=user_id, steam_link=steam_link)
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


def get_game_by_id(db: Session, game_id: int) -> Game | None:
    return db.query(Game).filter(Game.id == game_id).first()


def toggle_played(db: Session, game_id: int) -> Game | None:
    game = get_game_by_id(db, game_id)
    if not game:
        return None
    game.is_played = not game.is_played
    db.commit()
    db.refresh(game)
    return game


def delete_game(db: Session, game_id: int) -> None:
    db.query(Game).filter(Game.id == game_id).delete()
    db.commit()
