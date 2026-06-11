from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey

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
    user_id = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users_data.id"), nullable=False)
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
    is_watched = Column(Boolean, default=False, nullable=False)
    added_by = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    poster = Column(Text, nullable=True)
    is_played = Column(Boolean, default=False, nullable=False)
    steam_link = Column(Text, nullable=True)
    added_by = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
