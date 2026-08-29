import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class NotificationOut(BaseModel):
    id: int
    user_id: int
    habit_id: Optional[int] = None
    notification_type: str
    category: str = "habits"
    priority: str = "medium"
    title: str
    message: str
    icon: str
    action_url: Optional[str] = None
    action_type: Optional[str] = None
    status: str
    interaction_state: str = "sent"
    snoozed_until: Optional[datetime.datetime] = None
    sent_at: datetime.datetime
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationSnoozeRequest(BaseModel):
    minutes: int = 30  # 15, 30, 60 min

class NotificationBudgetOut(BaseModel):
    sent_today_count: int
    max_daily_budget: int
    remaining_today: int
    quiet_hours_active: bool

class NotificationSyncResponse(BaseModel):
    new_notification: Optional[NotificationOut] = None
    budget: NotificationBudgetOut
    active_notifications: List[NotificationOut]
