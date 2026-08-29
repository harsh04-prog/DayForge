import datetime
from typing import List, Set, Optional, Tuple, Dict, Any

def parse_date(date_str: str) -> datetime.date:
    """Safely parse YYYY-MM-DD string to datetime.date."""
    return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

def format_date(d: datetime.date) -> str:
    """Format datetime.date to YYYY-MM-DD."""
    return d.strftime("%Y-%m-%d")

def is_day_scheduled(
    date_val: datetime.date,
    frequency_type: str = "daily",
    frequency_days: str = "0,1,2,3,4,5,6",
    target_days_per_week: int = 7
) -> bool:
    """
    Check if a specific date is scheduled for a habit.
    Python weekday: 0 = Monday, 6 = Sunday.
    """
    weekday = date_val.weekday()
    
    if frequency_type == "daily":
        return True
    elif frequency_type == "weekdays":
        return weekday < 5  # Mon-Fri
    elif frequency_type == "weekends":
        return weekday >= 5 # Sat-Sun
    elif frequency_type in ("custom_days", "specific_days"):
        try:
            scheduled_days = {int(x.strip()) for x in frequency_days.split(",") if x.strip()}
            return weekday in scheduled_days
        except Exception:
            return True
    elif frequency_type == "times_per_week":
        # For times per week, any day can potentially be an active day
        return True
    return True

def calculate_habit_streak(
    completed_dates: Set[str],
    frequency_type: str = "daily",
    frequency_days: str = "0,1,2,3,4,5,6",
    target_days_per_week: int = 7,
    reference_date: Optional[datetime.date] = None,
    shield_dates: Optional[Set[str]] = None,
    created_at_date: Optional[datetime.date] = None
) -> Tuple[int, int]:
    """
    Computes (current_streak, longest_streak) for a habit.
    - Streak counts consecutive scheduled days that were completed or shielded.
    - If today is not completed yet, streak is intact if yesterday (or the previous scheduled day) was completed.
    """
    if reference_date is None:
        reference_date = datetime.date.today()
    if shield_dates is None:
        shield_dates = set()

    if not completed_dates:
        return 0, 0

    sorted_dates = sorted([parse_date(d) for d in completed_dates])
    earliest_date = sorted_dates[0] if not created_at_date else min(sorted_dates[0], created_at_date)
    
    # Generate scheduled days from earliest_date to reference_date
    scheduled_days: List[datetime.date] = []
    curr = earliest_date
    while curr <= reference_date:
        if is_day_scheduled(curr, frequency_type, frequency_days, target_days_per_week):
            scheduled_days.append(curr)
        curr += datetime.timedelta(days=1)

    if not scheduled_days:
        return 0, 0

    # Calculate historical longest streak
    longest_streak = 0
    running_streak = 0
    for day in scheduled_days:
        day_str = format_date(day)
        if day_str in completed_dates or day_str in shield_dates:
            running_streak += 1
            if running_streak > longest_streak:
                longest_streak = running_streak
        else:
            running_streak = 0

    # Calculate current streak backwards from reference_date
    current_streak = 0
    ref_str = format_date(reference_date)
    
    # Filter only scheduled days up to reference date
    sched_rev = list(reversed(scheduled_days))
    if not sched_rev:
        return 0, longest_streak

    idx = 0
    # If today is scheduled and NOT completed, we give a grace window: if previous scheduled day was completed, count from there
    if sched_rev[0] == reference_date and ref_str not in completed_dates and ref_str not in shield_dates:
        idx = 1  # start evaluating from previous scheduled day

    while idx < len(sched_rev):
        day_str = format_date(sched_rev[idx])
        if day_str in completed_dates or day_str in shield_dates:
            current_streak += 1
            idx += 1
        else:
            break

    if current_streak > longest_streak:
        longest_streak = current_streak

    return current_streak, longest_streak

def calculate_consistency_rate(
    completed_dates: Set[str],
    frequency_type: str = "daily",
    frequency_days: str = "0,1,2,3,4,5,6",
    days_back: int = 30,
    reference_date: Optional[datetime.date] = None
) -> int:
    """
    Calculate the percentage (0-100) of scheduled days that were completed in the last N days.
    """
    if reference_date is None:
        reference_date = datetime.date.today()

    start_date = reference_date - datetime.timedelta(days=days_back - 1)
    scheduled_count = 0
    completed_count = 0

    curr = start_date
    while curr <= reference_date:
        if is_day_scheduled(curr, frequency_type, frequency_days):
            scheduled_count += 1
            if format_date(curr) in completed_dates:
                completed_count += 1
        curr += datetime.timedelta(days=1)

    if scheduled_count == 0:
        return 100 if completed_count > 0 else 0

    rate = int(round((completed_count / scheduled_count) * 100))
    return min(100, max(0, rate))

def calculate_daily_score(
    total_scheduled: int,
    total_completed: int,
    active_streak: int,
    recent_consistency: int = 80
) -> int:
    """
    Calculate a daily score (0 - 100) from real activity:
    - 60% weight on today's scheduled completion (completed / scheduled)
    - 25% weight on recent overall consistency
    - 15% weight on maintaining an active streak (bonus up to 15 pts)
    """
    if total_scheduled == 0:
        return 100 if total_completed > 0 else 85

    completion_ratio = min(1.0, total_completed / total_scheduled)
    completion_component = completion_ratio * 60.0

    consistency_component = (recent_consistency / 100.0) * 25.0

    # Streak bonus: 1 day = 3pts, 3 days = 8pts, 7+ days = 15pts
    if active_streak >= 7:
        streak_component = 15.0
    elif active_streak >= 3:
        streak_component = 10.0
    elif active_streak >= 1:
        streak_component = 5.0
    else:
        streak_component = 0.0

    raw_score = completion_component + consistency_component + streak_component
    return int(round(min(100.0, max(0.0, raw_score))))
