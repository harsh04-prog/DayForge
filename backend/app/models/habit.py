import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="sparkles")
    color = Column(String(20), default="#6366f1")  # Tailwind primary hex
    category = Column(String(50), default="General", index=True)  # Health, Fitness, Study, Career, Productivity, Sleep, Reading, Personal Growth
    
    # Habit type & target
    habit_type = Column(String(20), default="binary")  # "binary" or "quantitative"
    target_value = Column(Float, default=1.0)
    unit = Column(String(30), nullable=True)  # "pages", "liters", "minutes", "reps", "steps", etc.
    
    # Frequency & Scheduling
    frequency_type = Column(String(20), default="daily")  # "daily", "weekdays", "weekends", "custom_days", "times_per_week"
    frequency_days = Column(String(50), default="0,1,2,3,4,5,6")  # 0=Mon, 6=Sun
    target_days_per_week = Column(Integer, default=7)
    preferred_time = Column(String(20), default="anytime")  # "morning", "afternoon", "evening", "anytime"
    reminder_time = Column(String(10), nullable=True)  # "08:00"
    difficulty = Column(String(20), default="medium")  # "easy", "medium", "hard"
    
    # Status
    is_paused = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    archived_at = Column(DateTime, nullable=True)
    sort_order = Column(Integer, default=0)
    
    # Streak metrics (habit specific)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan", order_by="desc(HabitLog.log_date)")
    trigger_for_stacks = relationship("HabitStack", foreign_keys="HabitStack.trigger_habit_id", back_populates="trigger_habit", cascade="all, delete-orphan")
    action_in_stacks = relationship("HabitStack", foreign_keys="HabitStack.action_habit_id", back_populates="action_habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(String(10), nullable=False, index=True)  # "YYYY-MM-DD"
    completed = Column(Boolean, default=True)
    current_value = Column(Float, default=1.0)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    xp_awarded = Column(Integer, default=10)

    habit = relationship("Habit", back_populates="logs")


class HabitStack(Base):
    __tablename__ = "habit_stacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    action_habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    stack_description = Column(String(255), nullable=True)  # e.g. "After Brush teeth -> Then Drink water"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trigger_habit = relationship("Habit", foreign_keys=[trigger_habit_id], back_populates="trigger_for_stacks")
    action_habit = relationship("Habit", foreign_keys=[action_habit_id], back_populates="action_in_stacks")
