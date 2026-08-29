from typing import List, Optional
import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.habit import HabitOut
from app.schemas.user import ProfileOut

class DailyScoreBreakdown(BaseModel):
    total_score: int
    completion_score: int
    consistency_score: int
    streak_bonus: int
    summary: str

class LevelInfo(BaseModel):
    level: int
    title: str
    current_xp: int
    next_level_xp: int
    level_progress_percentage: int

class AchievementOut(BaseModel):
    id: int
    code: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    required_count: int
    badge_tier: str
    unlocked: bool = False
    unlocked_at: Optional[datetime.datetime] = None
    progress: int = 0
    max_progress: int = 1
    model_config = ConfigDict(from_attributes=True)

class XPTransactionOut(BaseModel):
    id: int
    amount: int
    source: str
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardResponse(BaseModel):
    profile: ProfileOut
    level_info: LevelInfo
    daily_score: DailyScoreBreakdown
    today_completed_count: int
    today_scheduled_count: int
    today_completion_rate: int
    active_streak: int
    habits: List[HabitOut]
    unseen_achievements: List[AchievementOut] = []
    recovery_card: Optional[dict] = None
