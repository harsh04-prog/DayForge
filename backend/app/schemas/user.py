from typing import Optional, List
import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Profile Schemas
class ProfileBase(BaseModel):
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    level: int = 1
    xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    total_habits_completed: int = 0
    overall_consistency: int = 0
    available_shields: int = 2
    primary_goal: Optional[str] = None
    focus_areas: Optional[str] = None

class ProfileOut(ProfileBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    primary_goal: Optional[str] = None
    focus_areas: Optional[str] = None
    avatar_url: Optional[str] = None

# Settings Schemas
class UserSettingsBase(BaseModel):
    habit_reminders: bool = True
    streak_reminders: bool = True
    wellness_reminders: bool = True
    progress_reminders: bool = True
    motivational_messages: bool = True
    weekly_review: bool = True
    challenge_notifications: bool = True
    max_daily_reminders: int = 12
    sound_enabled: bool = True
    sound_type: str = "soft"  # default, soft, motivational, silent
    quiet_hours_enabled: bool = True
    quiet_hours_start: str = "23:00"
    quiet_hours_end: str = "07:00"
    theme: str = "light"
    week_start_day: str = "monday"
    time_format: str = "12h"
    preferred_units: str = "metric"
    profile_visibility: str = "private"

class UserSettingsOut(UserSettingsBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class UserSettingsUpdate(BaseModel):
    habit_reminders: Optional[bool] = None
    streak_reminders: Optional[bool] = None
    wellness_reminders: Optional[bool] = None
    progress_reminders: Optional[bool] = None
    motivational_messages: Optional[bool] = None
    weekly_review: Optional[bool] = None
    challenge_notifications: Optional[bool] = None
    max_daily_reminders: Optional[int] = None
    sound_enabled: Optional[bool] = None
    sound_type: Optional[str] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    theme: Optional[str] = None
    week_start_day: Optional[str] = None
    time_format: Optional[str] = None
    preferred_units: Optional[str] = None
    profile_visibility: Optional[str] = None

# User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    avatar_url: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class OnboardingRequest(BaseModel):
    focus_areas: List[str]
    primary_goal: str
    target_habit_count: int = Field(default=3, ge=1, le=10)
    starter_habits: Optional[List[dict]] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    is_active: bool
    is_onboarded: bool
    created_at: datetime.datetime
    profile: Optional[ProfileOut] = None
    settings: Optional[UserSettingsOut] = None
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
