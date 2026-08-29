import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    is_onboarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    xp_transactions = relationship("XPTransaction", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    shields = relationship("StreakShield", back_populates="user", cascade="all, delete-orphan")
    challenge_memberships = relationship("ChallengeMember", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_habits_completed = Column(Integer, default=0)
    overall_consistency = Column(Integer, default=0)  # percentage 0-100
    available_shields = Column(Integer, default=2)     # Starting shields
    primary_goal = Column(String(255), nullable=True)
    focus_areas = Column(String(255), nullable=True)   # Comma-separated categories

    user = relationship("User", back_populates="profile")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Notification preferences & Daily Budget
    habit_reminders = Column(Boolean, default=True)
    streak_reminders = Column(Boolean, default=True)
    wellness_reminders = Column(Boolean, default=True)
    progress_reminders = Column(Boolean, default=True)
    motivational_messages = Column(Boolean, default=True)
    weekly_review = Column(Boolean, default=True)
    challenge_notifications = Column(Boolean, default=True)
    
    max_daily_reminders = Column(Integer, default=12)  # Maximum budget (4, 6, 8, 10, 12, max 12)
    sound_enabled = Column(Boolean, default=True)
    sound_type = Column(String(30), default="soft")  # default, soft, motivational, silent
    
    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=True)
    quiet_hours_start = Column(String(10), default="23:00")
    quiet_hours_end = Column(String(10), default="07:00")
    
    # Appearance & Locale
    theme = Column(String(20), default="light")  # light, dark, system
    week_start_day = Column(String(10), default="monday")  # monday, sunday
    time_format = Column(String(10), default="12h")  # 12h, 24h
    preferred_units = Column(String(10), default="metric")
    profile_visibility = Column(String(20), default="private")  # public, private

    user = relationship("User", back_populates="settings")
