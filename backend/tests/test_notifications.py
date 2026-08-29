import datetime
import pytest
from app.services.notification_service import NotificationService, is_in_quiet_hours
from app.models.habit import Habit

def test_quiet_hours_detection():
    # Quiet hours from 23:00 to 07:00
    assert is_in_quiet_hours(datetime.time(23, 30), "23:00", "07:00") is True
    assert is_in_quiet_hours(datetime.time(3, 0), "23:00", "07:00") is True
    assert is_in_quiet_hours(datetime.time(6, 59), "23:00", "07:00") is True
    assert is_in_quiet_hours(datetime.time(8, 0), "23:00", "07:00") is False
    assert is_in_quiet_hours(datetime.time(14, 0), "23:00", "07:00") is False

def test_motivational_message_reading():
    habit = Habit(
        id=1,
        name="Read Non-Fiction",
        category="Reading",
        icon="book-open",
        habit_type="quantitative",
        target_value=20,
        unit="pages",
        current_streak=0
    )
    title, message, icon = NotificationService.generate_motivational_message(
        habit=habit,
        current_streak=0,
        is_partial=False
    )
    assert "Reading" in title or "chapter" in title or "story" in title or "book" in title or "curiosity" in title or "Read" in title or "reading" in title
    assert len(message) > 10

def test_progress_aware_motivational_message():
    habit = Habit(
        id=2,
        name="Drink 2L Water",
        category="Health",
        icon="droplet",
        habit_type="quantitative",
        target_value=2.0,
        unit="L",
        current_streak=5
    )
    title, message, icon = NotificationService.generate_motivational_message(
        habit=habit,
        current_streak=5,
        is_partial=True,
        current_val=1.5,
        target_val=2.0,
        unit="L"
    )
    assert "Almost there" in title or "halfway" in message
    assert "0.5 L" in message

def test_streak_aware_motivational_message():
    habit = Habit(
        id=3,
        name="Morning Workout",
        category="Fitness",
        icon="dumbbell",
        habit_type="quantitative",
        target_value=30,
        unit="min",
        current_streak=14
    )
    title, message, icon = NotificationService.generate_motivational_message(
        habit=habit,
        current_streak=14,
        is_partial=False
    )
    assert "14 days strong" in title or "14-day streak" in title
    assert "streak" in message.lower()
