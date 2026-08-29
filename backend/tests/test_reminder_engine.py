import datetime
import pytest
from app.services.reminder_engine import (
    IntelligentReminderEngine,
    CandidateReminder,
    is_in_quiet_hours
)
from app.models.habit import Habit

def test_quiet_hours_cross_midnight():
    # 23:00 to 07:00
    assert is_in_quiet_hours(datetime.time(23, 15), "23:00", "07:00") is True
    assert is_in_quiet_hours(datetime.time(2, 0), "23:00", "07:00") is True
    assert is_in_quiet_hours(datetime.time(6, 45), "23:00", "07:00") is True
    assert is_in_quiet_hours(datetime.time(12, 0), "23:00", "07:00") is False

def test_priority_score_ordering():
    c_streak = CandidateReminder(
        priority_score=95,
        notification_type="streak_reminder",
        category="progress",
        title="🔥 12-day streak at risk",
        message="Take 10 minutes to protect your streak.",
        icon="flame"
    )
    c_wellness = CandidateReminder(
        priority_score=55,
        notification_type="wellness",
        category="wellness",
        title="💧 Hydration check",
        message="Time for some water.",
        icon="droplet"
    )
    c_general = CandidateReminder(
        priority_score=30,
        notification_type="motivation",
        category="motivation",
        title="✨ Level yourself",
        message="Small actions compound.",
        icon="sparkles"
    )

    pool = [c_general, c_streak, c_wellness]
    pool.sort(key=lambda x: x.priority_score, reverse=True)

    assert pool[0].notification_type == "streak_reminder"
    assert pool[1].notification_type == "wellness"
    assert pool[2].notification_type == "motivation"
