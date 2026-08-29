from typing import List, Optional, Dict, Any
import datetime
from pydantic import BaseModel

class HeatmapDay(BaseModel):
    date: str  # YYYY-MM-DD
    count: int
    completion_rate: int
    level: int  # 0=none, 1=low, 2=medium, 3=high, 4=perfect

class HeatmapResponse(BaseModel):
    days: List[HeatmapDay]
    total_active_days: int
    longest_streak: int
    current_streak: int

class CategoryBreakdown(BaseModel):
    category: str
    total_habits: int
    completions: int
    completion_rate: int
    color: str

class TrendPoint(BaseModel):
    period: str  # "Mon", "Tue" or "Week 1", etc.
    completed: int
    scheduled: int
    rate: int

class WeeklyReviewOut(BaseModel):
    id: Optional[int] = None
    week_start_date: str
    week_end_date: str
    completion_rate: int
    total_completed: int
    total_scheduled: int
    best_habit: Optional[str] = None
    needs_attention_habit: Optional[str] = None
    best_day: Optional[str] = None
    weakest_day: Optional[str] = None
    xp_earned: int
    actionable_insight: Optional[str] = None

class RecommendationOut(BaseModel):
    id: str
    type: str  # "overload", "timing", "recovery", "celebration", "streak"
    title: str
    message: str
    action_label: Optional[str] = None
    action_type: Optional[str] = None
    habit_id: Optional[int] = None
