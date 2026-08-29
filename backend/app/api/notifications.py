import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Profile, UserSettings
from app.models.habit import Habit
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationOut,
    NotificationSnoozeRequest,
    NotificationBudgetOut,
    NotificationSyncResponse
)
from app.services.reminder_engine import IntelligentReminderEngine, is_in_quiet_hours
from app.api.habits import complete_habit

router = APIRouter(prefix="/notifications", tags=["Intelligent Companion Notifications"])

@router.get("/", response_model=List[NotificationOut])
async def get_active_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Run centralized intelligent evaluation to see if a single high-priority reminder is due
    await IntelligentReminderEngine.evaluate_single_best_reminder(db, current_user.id)
    
    # 2. Fetch unread & unsnoozed notifications
    now = datetime.datetime.utcnow()
    query = (
        select(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.status.in_(["unread", "snoozed"]),
        )
        .order_by(Notification.sent_at.desc())
    )
    result = await db.execute(query)
    notifs = result.scalars().all()

    active_notifs = []
    for n in notifs:
        if n.status == "snoozed" and n.snoozed_until and n.snoozed_until > now:
            continue
        active_notifs.append(n)

    return [NotificationOut.model_validate(n) for n in active_notifs]

@router.get("/budget", response_model=NotificationBudgetOut)
async def get_daily_budget(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sent_count, _ = await IntelligentReminderEngine.get_daily_notification_stats(db, current_user.id)
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = settings_res.scalar_one_or_none()
    
    max_budget = min(settings.max_daily_reminders or 12, 12) if settings else 12
    remaining = max(0, max_budget - sent_count)
    
    now_time = datetime.datetime.utcnow().time()
    quiet_active = False
    if settings and settings.quiet_hours_enabled:
        quiet_active = is_in_quiet_hours(
            now_time,
            settings.quiet_hours_start or "23:00",
            settings.quiet_hours_end or "07:00"
        )

    return NotificationBudgetOut(
        sent_today_count=sent_count,
        max_daily_budget=max_budget,
        remaining_today=remaining,
        quiet_hours_active=quiet_active
    )

@router.get("/history", response_model=List[NotificationOut])
async def get_notification_history(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return [NotificationOut.model_validate(n) for n in result.scalars().all()]

@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    notif.status = "read"
    notif.interaction_state = "opened"
    await db.flush()
    return NotificationOut.model_validate(notif)

@router.post("/mark-all-read")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.status.in_(["unread", "snoozed"])
        )
    )
    notifs = res.scalars().all()
    for n in notifs:
        n.status = "read"
        n.interaction_state = "opened"
    await db.flush()
    return {"message": "All notifications marked as read."}

@router.post("/{notification_id}/dismiss")
async def dismiss_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    notif.status = "dismissed"
    notif.interaction_state = "dismissed"
    await db.flush()
    return {"message": "Notification dismissed."}

@router.post("/{notification_id}/snooze", response_model=NotificationOut)
async def snooze_notification(
    notification_id: int,
    payload: NotificationSnoozeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    minutes = payload.minutes if payload.minutes in (15, 30, 60) else 30
    snooze_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=minutes)
    
    notif.status = "snoozed"
    notif.interaction_state = "snoozed"
    notif.snoozed_until = snooze_time
    await db.flush()

    return NotificationOut.model_validate(notif)

@router.post("/{notification_id}/complete")
async def complete_from_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.status = "read"
    notif.interaction_state = "completed_action"

    # If linked to habit, complete it
    habit_complete_data = None
    if notif.habit_id:
        comp_res = await complete_habit(
            habit_id=notif.habit_id,
            payload=None,
            current_user=current_user,
            db=db
        )
        habit_complete_data = comp_res

    await db.flush()

    return {
        "success": True,
        "message": "Action completed!",
        "habit_complete_response": habit_complete_data
    }

@router.post("/test", response_model=NotificationOut)
async def trigger_test_companion_reminder(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Force evaluate the single best candidate right now
    notif = await IntelligentReminderEngine.evaluate_single_best_reminder(
        db, current_user.id, force_preview=True
    )
    if not notif:
        # Create general companion reminder
        notif = Notification(
            user_id=current_user.id,
            notification_type="routine",
            category="routine",
            priority="medium",
            title="🌅 Start your day strong",
            message="Pick one small win to get today's momentum started.",
            icon="sunrise",
            action_url="/",
            status="unread",
            sent_at=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        await db.flush()

    return NotificationOut.model_validate(notif)
