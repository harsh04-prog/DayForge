import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="General")
    icon = Column(String(50), default="flag")
    duration_days = Column(Integer, default=7)
    xp_reward = Column(Integer, default=250)
    badge_name = Column(String(100), nullable=True)
    required_habit_category = Column(String(50), nullable=True)  # e.g. "Reading", "Fitness", "Study"
    daily_target_completions = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    is_official = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    members = relationship("ChallengeMember", back_populates="challenge", cascade="all, delete-orphan")


class ChallengeMember(Base):
    __tablename__ = "challenge_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    current_day = Column(Integer, default=1)
    completed_days = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    last_log_date = Column(String(10), nullable=True)

    user = relationship("User", back_populates="challenge_memberships")
    challenge = relationship("Challenge", back_populates="members")


class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start_date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    week_end_date = Column(String(10), nullable=False)    # "YYYY-MM-DD"
    completion_rate = Column(Integer, default=0)          # 0 - 100%
    total_completed = Column(Integer, default=0)
    total_scheduled = Column(Integer, default=0)
    best_habit = Column(String(150), nullable=True)
    needs_attention_habit = Column(String(150), nullable=True)
    best_day = Column(String(20), nullable=True)
    weakest_day = Column(String(20), nullable=True)
    xp_earned = Column(Integer, default=0)
    actionable_insight = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
