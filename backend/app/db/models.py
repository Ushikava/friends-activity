from datetime import datetime, timezone

from sqlalchemy.orm import relationship
from sqlalchemy import ( 
    Column, 
    String, 
    Text, 
    DateTime, 
    Integer, 
    Boolean, 
    ForeignKey, 
    UniqueConstraint, 
    Numeric,
)

from db.base import Base


class UserData(Base):
    __tablename__ = "users_data"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    role = Column(String, nullable=False, default="user")
    avatar_url = Column(String, nullable=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    poster = Column(Text, nullable=True)
    added_by = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MovieWatch(Base):
    __tablename__ = "movie_watches"

    id = Column(Integer, primary_key=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    is_watched = Column(Boolean, default=False, nullable=False)
    rating = Column(Integer, nullable=True)
    review = Column(Text, nullable=True)
    updated_at = Column(DateTime, nullable=True)

    __table_args__ = (UniqueConstraint("movie_id", "user_id", name="uq_movie_user_watch"),)


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    poster = Column(Text, nullable=True)
    steam_link = Column(Text, nullable=True)
    added_by = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GamePlay(Base):
    __tablename__ = "game_plays"

    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    is_played = Column(Boolean, default=False, nullable=False)
    rating = Column(Integer, nullable=True)
    review = Column(Text, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    __table_args__ = (UniqueConstraint("game_id", "user_id", name="uq_game_user_play"),)


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, default="Новый чат")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)   # "user" | "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="SET NULL"), nullable=True)
    username = Column(String, nullable=True)
    action = Column(String, nullable=False)
    entity_title = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    sender_username = Column(String, nullable=False)
    recipient_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String, nullable=False)   # "movie" | "game"
    entity_id = Column(Integer, nullable=False)
    entity_title = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    scheduled_at = Column(DateTime, nullable=True)


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String, nullable=False)   # "movie" | "game"
    entity_id = Column(Integer, nullable=False)
    __table_args__ = (UniqueConstraint('user_id', 'entity_type', 'entity_id', name='uq_favorites'),)


class Whishlist(Base):
    __tablename__ = "whishlist"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id", ondelete="CASCADE"), nullable=False)
    wish_name = Column(String, nullable=False)
    wish_url = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), nullable=False, default='RUB')
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
