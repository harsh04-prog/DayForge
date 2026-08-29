from typing import Optional, List
import datetime
from pydantic import BaseModel, ConfigDict

class ChallengeBase(BaseModel):
    title: str
    description: str
    category: str = "General"
    icon: str = "flag"
    duration_days: int = 7
    xp_reward: int = 250
    badge_name: Optional[str] = None
    required_habit_category: Optional[str] = None
    daily_target_completions: int = 1

class ChallengeOut(ChallengeBase):
    id: int
    is_active: bool
    is_official: bool
    is_joined: bool = False
    is_completed: bool = False
    current_day: int = 0
    completed_days: int = 0
    progress_percentage: int = 0
    member_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class ChallengeJoinResponse(BaseModel):
    success: bool
    challenge_id: int
    is_joined: bool
    message: str
