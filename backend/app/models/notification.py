import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="SET NULL"), nullable=True, index=True)
    
    notification_type = Column(String(50), nullable=False)  # habit_reminder, wellness, routine, progress, reflection, motivation, achievement, level_up, weekly_review
    category = Column(String(50), default="habits")  # habits, wellness, routine, progress, reflection, motivation
    priority = Column(String(20), default="medium")  # high, medium, low
    
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    icon = Column(String(50), default="sparkles")
    action_url = Column(String(255), nullable=True)  # Deep link e.g. "/habits/3" or "/progress"
    action_type = Column(String(50), nullable=True)  # complete_habit, drink_water, take_break, view_progress, open_url
    
    scheduled_for = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="unread")  # unread, read, dismissed, snoozed, cancelled
    interaction_state = Column(String(30), default="sent")  # sent, opened, completed_action, snoozed, dismissed, ignored
    snoozed_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")
    habit = relationship("Habit")
