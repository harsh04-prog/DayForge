import datetime
import pytest
from app.core.streak_engine import (
    calculate_habit_streak,
    calculate_consistency_rate,
    calculate_daily_score,
    is_day_scheduled,
    format_date
)

def test_daily_streak_consecutive_days():
    today = datetime.date(2026, 8, 26)
    dates = {
        "2026-08-22",
        "2026-08-23",
        "2026-08-24",
        "2026-08-25",
        "2026-08-26",
    }
    curr_streak, longest_streak = calculate_habit_streak(
        completed_dates=dates,
        frequency_type="daily",
        reference_date=today
    )
    assert curr_streak == 5
    assert longest_streak == 5

def test_daily_streak_today_not_yet_done_preserves_streak():
    # If today is not done yet, but yesterday was, current streak should be 4
    today = datetime.date(2026, 8, 26)
    dates = {
        "2026-08-22",
        "2026-08-23",
        "2026-08-24",
        "2026-08-25",
    }
    curr_streak, longest_streak = calculate_habit_streak(
        completed_dates=dates,
        frequency_type="daily",
        reference_date=today
    )
    assert curr_streak == 4
    assert longest_streak == 4

def test_daily_streak_broken_if_yesterday_missed():
    today = datetime.date(2026, 8, 26)
    dates = {
        "2026-08-20",
        "2026-08-21",
        # 2026-08-22 to 2026-08-25 missed
    }
    curr_streak, longest_streak = calculate_habit_streak(
        completed_dates=dates,
        frequency_type="daily",
        reference_date=today
    )
    assert curr_streak == 0
    assert longest_streak == 2

def test_streak_shield_protects_missed_day():
    today = datetime.date(2026, 8, 26)
    dates = {
        "2026-08-23",
        # 2026-08-24 missed but shielded!
        "2026-08-25",
        "2026-08-26",
    }
    shield_dates = {"2026-08-24"}
    curr_streak, longest_streak = calculate_habit_streak(
        completed_dates=dates,
        frequency_type="daily",
        reference_date=today,
        shield_dates=shield_dates
    )
    assert curr_streak == 4
    assert longest_streak == 4

def test_weekday_schedule_skips_weekends():
    # 2026-08-24 is Mon, 2026-08-25 is Tue, 2026-08-26 is Wed
    # 2026-08-21 was Fri, 2026-08-22 was Sat, 2026-08-23 was Sun
    today = datetime.date(2026, 8, 26)
    dates = {
        "2026-08-21", # Fri
        "2026-08-24", # Mon
        "2026-08-25", # Tue
        "2026-08-26", # Wed
    }
    curr_streak, longest_streak = calculate_habit_streak(
        completed_dates=dates,
        frequency_type="weekdays",
        reference_date=today
    )
    assert curr_streak == 4
    assert longest_streak == 4

def test_consistency_rate():
    today = datetime.date(2026, 8, 26)
    # 5 completions in last 10 days
    dates = {format_date(today - datetime.timedelta(days=i)) for i in [0, 2, 4, 6, 8]}
    rate = calculate_consistency_rate(dates, days_back=10, reference_date=today)
    assert rate == 50

def test_daily_score_calculation():
    # 4 out of 4 completed, 10-day streak, 90% consistency -> score near 100
    score = calculate_daily_score(total_scheduled=4, total_completed=4, active_streak=10, recent_consistency=90)
    assert score >= 95
    assert score <= 100

    # 0 completed out of 4 -> lower score
    score_zero = calculate_daily_score(total_scheduled=4, total_completed=0, active_streak=0, recent_consistency=50)
    assert score_zero < 30
