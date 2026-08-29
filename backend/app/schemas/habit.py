from typing import Optional, List
import datetime
from pydantic import BaseModel, Field, ConfigDict

class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    icon: str = "sparkles"
    color: str = "#6366f1"
    category: str = "General"
    habit_type: str = "binary"  # "binary" | "quantitative"
    target_value: float = 1.0
    unit: Optional[str] = None
    frequency_type: str = "daily"  # "daily", "weekdays", "weekends", "custom_days", "times_per_week"
    frequency_days: str = "0,1,2,3,4,5,6"
    target_days_per_week: int = 7
    preferred_time: str = "anytime"  # "morning", "afternoon", "evening", "anytime"
    reminder_time: Optional[str] = None
    difficulty: str = "medium"  # "easy", "medium", "hard"

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    habit_type: Optional[str] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    frequency_type: Optional[str] = None
    frequency_days: Optional[str] = None
    target_days_per_week: Optional[int] = None
    preferred_time: Optional[str] = None
    reminder_time: Optional[str] = None
    difficulty: Optional[str] = None
    is_paused: Optional[bool] = None
    is_archived: Optional[bool] = None
    sort_order: Optional[int] = None

class HabitLogCreate(BaseModel):
    log_date: Optional[str] = None  # "YYYY-MM-DD", defaults to today
    completed: bool = True
    current_value: Optional[float] = None
    notes: Optional[str] = None

class HabitLogOut(BaseModel):
    id: int
    habit_id: int
    user_id: int
    log_date: str
    completed: bool
    current_value: float
    notes: Optional[str] = None
    completed_at: datetime.datetime
    xp_awarded: int
    model_config = ConfigDict(from_attributes=True)

class HabitStackCreate(BaseModel):
    trigger_habit_id: int
    action_habit_id: int
    stack_description: Optional[str] = None

class HabitStackOut(BaseModel):
    id: int
    trigger_habit_id: int
    action_habit_id: int
    trigger_habit_name: Optional[str] = None
    action_habit_name: Optional[str] = None
    stack_description: Optional[str] = None

class HabitOut(HabitBase):
    id: int
    user_id: int
    is_paused: bool
    is_archived: bool
    sort_order: int
    current_streak: int
    longest_streak: int
    total_completions: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    today_completed: bool = False
    today_progress: float = 0.0
    model_config = ConfigDict(from_attributes=True)

class HabitDetailOut(HabitOut):
    completion_rate_30d: int = 0
    weekly_progress: List[dict] = []
    monthly_progress: List[dict] = []
    recent_logs: List[HabitLogOut] = []
    best_day: Optional[str] = None
    best_time: Optional[str] = None
    insights: List[str] = []

class HabitCompleteResponse(BaseModel):
    success: bool
    habit_id: int
    completed: bool
    current_value: float
    xp_awarded: int
    current_streak: int
    longest_streak: int
    level_up: bool = False
    new_level: int = 1
    unlocked_achievements: List[dict] = []
    message: str = "Habit completed!"
