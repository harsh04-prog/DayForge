import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.streak_engine import format_date, calculate_daily_score, is_day_scheduled, calculate_habit_streak
from app.models.user import User, Profile
from app.models.habit import Habit, HabitLog
from app.models.gamification import Achievement, UserAchievement, StreakShield, XPTransaction
from app.schemas.progress import (
    DashboardResponse,
    DailyScoreBreakdown,
    LevelInfo,
    AchievementOut,
    XPTransactionOut
)
from app.schemas.user import ProfileOut
from app.schemas.habit import HabitOut
from app.services.gamification_service import get_level_for_xp

router = APIRouter(prefix="/progress", tags=["Progress & Gamification"])

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.date.today()
    today_str = format_date(today)

    # 1. Fetch user habits & logs
    habits_query = (
        select(Habit)
        .options(selectinload(Habit.logs))
        .where(Habit.user_id == current_user.id, Habit.is_archived == False)
        .order_by(Habit.sort_order.asc(), Habit.id.asc())
    )
    habits_res = await db.execute(habits_query)
    habits = habits_res.scalars().all()

    # Active habits for today with dynamically calculated streaks based on current date
    today_scheduled_habits = []
    today_completed_count = 0
    habits_out: List[HabitOut] = []

    for h in habits:
        # Dynamically recalculate streak on every fetch based on current calendar date
        completed_dates = {l.log_date for l in h.logs if l.completed}
        curr_s, long_s = calculate_habit_streak(
            completed_dates=completed_dates,
            frequency_type=h.frequency_type,
            frequency_days=h.frequency_days,
            target_days_per_week=h.target_days_per_week,
            reference_date=today
        )
        h.current_streak = curr_s
        h.longest_streak = max(h.longest_streak or 0, long_s)

        h_out = HabitOut.model_validate(h)
        today_log = next((l for l in h.logs if l.log_date == today_str), None)
        h_out.today_completed = bool(today_log and today_log.completed)
        h_out.today_progress = today_log.current_value if today_log else 0.0
        habits_out.append(h_out)

        if not h.is_paused and is_day_scheduled(today, h.frequency_type, h.frequency_days, h.target_days_per_week):
            today_scheduled_habits.append(h)
            if h_out.today_completed:
                today_completed_count += 1

    total_scheduled = len(today_scheduled_habits)
    completion_rate = int(min(100, (today_completed_count / max(1, total_scheduled)) * 100)) if total_scheduled > 0 else (100 if today_completed_count > 0 else 0)

    # 2. User profile & level info
    prof_res = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        await db.flush()

    lvl, title, cur_xp, next_xp, lvl_pct = get_level_for_xp(profile.xp)
    level_info = LevelInfo(
        level=lvl,
        title=title,
        current_xp=cur_xp,
        next_level_xp=next_xp,
        level_progress_percentage=lvl_pct
    )

    # 3. Active Streak across habits
    active_streak = max([h.current_streak for h in habits], default=0)
    profile.current_streak = active_streak
    profile.longest_streak = max(profile.longest_streak or 0, active_streak)

    # 4. Daily score calculation
    raw_score = calculate_daily_score(
        total_scheduled=total_scheduled,
        total_completed=today_completed_count,
        active_streak=active_streak,
        recent_consistency=profile.overall_consistency or 80
    )
    
    # Calculate score breakdown
    comp_score = int(min(60, (today_completed_count / max(1, total_scheduled)) * 60)) if total_scheduled > 0 else 60
    cons_score = int((min(100, profile.overall_consistency or 80) / 100) * 25)
    stk_bonus = raw_score - comp_score - cons_score
    stk_bonus = max(0, stk_bonus)

    score_summary = "Outstanding consistency!" if raw_score >= 80 else ("Strong start — finish today's habits to boost your score" if raw_score >= 50 else "Start with one habit to forge momentum today")

    daily_score = DailyScoreBreakdown(
        total_score=raw_score,
        completion_score=comp_score,
        consistency_score=cons_score,
        streak_bonus=stk_bonus,
        summary=score_summary
    )

    # 5. Check for unseen achievements
    unseen_query = (
        select(UserAchievement)
        .options(selectinload(UserAchievement.achievement))
        .where(UserAchievement.user_id == current_user.id, UserAchievement.is_seen == False)
    )
    unseen_res = await db.execute(unseen_query)
    unseen_user_achs = unseen_res.scalars().all()
    unseen_achs: List[AchievementOut] = []
    for ua in unseen_user_achs:
        if ua.achievement:
            unseen_achs.append(AchievementOut(
                id=ua.achievement.id,
                code=ua.achievement.code,
                name=ua.achievement.name,
                description=ua.achievement.description,
                icon=ua.achievement.icon,
                category=ua.achievement.category,
                xp_reward=ua.achievement.xp_reward,
                required_count=ua.achievement.required_count,
                badge_tier=ua.achievement.badge_tier,
                unlocked=True,
                unlocked_at=ua.unlocked_at,
                progress=1,
                max_progress=1
            ))

    return DashboardResponse(
        profile=ProfileOut.model_validate(profile),
        level_info=level_info,
        daily_score=daily_score,
        today_completed_count=today_completed_count,
        today_scheduled_count=total_scheduled,
        today_completion_rate=completion_rate,
        active_streak=active_streak,
        habits=habits_out,
        unseen_achievements=unseen_achs,
        recovery_card=None
    )

@router.get("/achievements", response_model=List[AchievementOut])
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    achs_res = await db.execute(select(Achievement).order_by(Achievement.id.asc()))
    all_achs = achs_res.scalars().all()

    user_achs_res = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    )
    unlocked_map = {ua.achievement_id: ua for ua in user_achs_res.scalars().all()}

    output = []
    for a in all_achs:
        ua = unlocked_map.get(a.id)
        is_unlocked = ua is not None
        output.append(AchievementOut(
            id=a.id,
            code=a.code,
            name=a.name,
            description=a.description,
            icon=a.icon,
            category=a.category,
            xp_reward=a.xp_reward,
            required_count=a.required_count,
            badge_tier=a.badge_tier,
            unlocked=is_unlocked,
            unlocked_at=ua.unlocked_at if ua else None,
            progress=1 if is_unlocked else 0,
            max_progress=1
        ))
    return output

@router.get("/transactions", response_model=List[XPTransactionOut])
async def get_xp_transactions(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(XPTransaction)
        .where(XPTransaction.user_id == current_user.id)
        .order_by(XPTransaction.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    return [XPTransactionOut.model_validate(tx) for tx in res.scalars().all()]

@router.post("/shields/use")
async def use_streak_shield(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile or profile.available_shields <= 0:
        raise HTTPException(status_code=400, detail="No streak shields available.")

    profile.available_shields -= 1
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    
    shield = StreakShield(
        user_id=current_user.id,
        shield_date=format_date(yesterday),
        used_at=datetime.datetime.utcnow()
    )
    db.add(shield)
    await db.flush()

    return {
        "success": True,
        "message": f"Streak shield used for {format_date(yesterday)}. Your streak is protected!",
        "available_shields": profile.available_shields
    }
