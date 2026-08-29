import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.streak_engine import format_date, calculate_habit_streak, calculate_consistency_rate, parse_date
from app.models.user import User, Profile
from app.models.habit import Habit, HabitLog, HabitStack
from app.models.gamification import StreakShield
from app.schemas.habit import (
    HabitCreate,
    HabitUpdate,
    HabitOut,
    HabitDetailOut,
    HabitLogCreate,
    HabitLogOut,
    HabitStackCreate,
    HabitStackOut,
    HabitCompleteResponse
)
from app.services.gamification_service import GamificationService, get_level_for_xp

router = APIRouter(prefix="/habits", tags=["Habits"])

async def get_user_habit_or_404(habit_id: int, user_id: int, db: AsyncSession) -> Habit:
    query = (
        select(Habit)
        .options(selectinload(Habit.logs))
        .where(Habit.id == habit_id, Habit.user_id == user_id)
    )
    result = await db.execute(query)
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")
    return habit

@router.get("/", response_model=List[HabitOut])
async def list_habits(
    include_archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today_str = format_date(datetime.date.today())
    
    query = select(Habit).options(selectinload(Habit.logs)).where(Habit.user_id == current_user.id)
    if not include_archived:
        query = query.where(Habit.is_archived == False)
    query = query.order_by(Habit.sort_order.asc(), Habit.id.asc())

    result = await db.execute(query)
    habits = result.scalars().all()

    output = []
    for h in habits:
        h_out = HabitOut.model_validate(h)
        today_log = next((l for l in h.logs if l.log_date == today_str), None)
        h_out.today_completed = bool(today_log and today_log.completed)
        h_out.today_progress = today_log.current_value if today_log else 0.0
        output.append(h_out)

    return output

@router.post("/", response_model=HabitOut)
async def create_habit(
    payload: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = Habit(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        icon=payload.icon,
        color=payload.color,
        category=payload.category,
        habit_type=payload.habit_type,
        target_value=payload.target_value,
        unit=payload.unit,
        frequency_type=payload.frequency_type,
        frequency_days=payload.frequency_days,
        target_days_per_week=payload.target_days_per_week,
        preferred_time=payload.preferred_time,
        reminder_time=payload.reminder_time,
        difficulty=payload.difficulty,
    )
    db.add(habit)
    await db.flush()

    h_out = HabitOut.model_validate(habit)
    h_out.today_completed = False
    h_out.today_progress = 0.0
    return h_out

@router.get("/{habit_id}", response_model=HabitDetailOut)
async def get_habit_detail(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    today = datetime.date.today()
    today_str = format_date(today)
    
    completed_dates = {l.log_date for l in habit.logs if l.completed}
    rate_30d = calculate_consistency_rate(
        completed_dates=completed_dates,
        frequency_type=habit.frequency_type,
        frequency_days=habit.frequency_days,
        days_back=30
    )

    # Weekly breakdown (last 7 days)
    weekly_progress = []
    days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        d_str = format_date(d)
        log = next((l for l in habit.logs if l.log_date == d_str), None)
        weekly_progress.append({
            "day": days_map[d.weekday()],
            "date": d_str,
            "completed": bool(log and log.completed),
            "value": log.current_value if log else 0.0,
            "target": habit.target_value
        })

    # Monthly breakdown (last 4 weeks)
    monthly_progress = []
    for w in range(3, -1, -1):
        w_start = today - datetime.timedelta(days=w*7 + 6)
        w_end = today - datetime.timedelta(days=w*7)
        w_logs = [l for l in habit.logs if w_start <= parse_date(l.log_date) <= w_end and l.completed]
        monthly_progress.append({
            "week": f"W-{4-w}",
            "completed_count": len(w_logs)
        })

    # Best day of week
    day_counts = [0] * 7
    for l in habit.logs:
        if l.completed:
            try:
                day_counts[parse_date(l.log_date).weekday()] += 1
            except Exception:
                pass
    max_day_idx = day_counts.index(max(day_counts)) if max(day_counts) > 0 else None
    best_day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][max_day_idx] if max_day_idx is not None else None

    # Real insights based on real data
    insights = []
    if len(completed_dates) >= 5:
        if best_day:
            insights.append(f"You complete '{habit.name}' most consistently on {best_day}s.")
        if habit.current_streak >= 5:
            insights.append(f"You have an impressive {habit.current_streak}-day active streak on this habit!")
        if rate_30d >= 80:
            insights.append(f"High consistency: you've hit {rate_30d}% of scheduled days over the past month.")
    elif len(completed_dates) > 0:
        insights.append(f"Great start! Complete this habit {5 - len(completed_dates)} more times to unlock deeper pattern insights.")
    else:
        insights.append("No completions recorded yet. Tap Complete below to start your streak!")

    recent_logs = [HabitLogOut.model_validate(l) for l in habit.logs[:15]]
    today_log = next((l for l in habit.logs if l.log_date == today_str), None)

    detail = HabitDetailOut(
        id=habit.id,
        user_id=habit.user_id,
        name=habit.name,
        description=habit.description,
        icon=habit.icon,
        color=habit.color,
        category=habit.category,
        habit_type=habit.habit_type,
        target_value=habit.target_value,
        unit=habit.unit,
        frequency_type=habit.frequency_type,
        frequency_days=habit.frequency_days,
        target_days_per_week=habit.target_days_per_week,
        preferred_time=habit.preferred_time,
        reminder_time=habit.reminder_time,
        difficulty=habit.difficulty,
        is_paused=habit.is_paused,
        is_archived=habit.is_archived,
        sort_order=habit.sort_order,
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak,
        total_completions=habit.total_completions,
        created_at=habit.created_at,
        updated_at=habit.updated_at,
        today_completed=bool(today_log and today_log.completed),
        today_progress=today_log.current_value if today_log else 0.0,
        completion_rate_30d=rate_30d,
        weekly_progress=weekly_progress,
        monthly_progress=monthly_progress,
        recent_logs=recent_logs,
        best_day=best_day,
        insights=insights
    )
    return detail

@router.put("/{habit_id}", response_model=HabitOut)
async def update_habit(
    habit_id: int,
    payload: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)
        
    await db.flush()
    
    today_str = format_date(datetime.date.today())
    today_log = next((l for l in habit.logs if l.log_date == today_str), None)
    
    h_out = HabitOut.model_validate(habit)
    h_out.today_completed = bool(today_log and today_log.completed)
    h_out.today_progress = today_log.current_value if today_log else 0.0
    return h_out

@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    await db.delete(habit)
    await db.flush()
    return {"message": "Habit deleted successfully."}

@router.post("/{habit_id}/pause", response_model=HabitOut)
async def pause_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    habit.is_paused = True
    await db.flush()
    return HabitOut.model_validate(habit)

@router.post("/{habit_id}/resume", response_model=HabitOut)
async def resume_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    habit.is_paused = False
    await db.flush()
    return HabitOut.model_validate(habit)

@router.post("/{habit_id}/archive", response_model=HabitOut)
async def archive_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    habit.is_archived = True
    habit.archived_at = datetime.datetime.utcnow()
    await db.flush()
    return HabitOut.model_validate(habit)

@router.post("/{habit_id}/complete", response_model=HabitCompleteResponse)
async def complete_habit(
    habit_id: int,
    payload: Optional[HabitLogCreate] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    today = datetime.date.today()
    log_date_str = payload.log_date if (payload and payload.log_date) else format_date(today)
    
    # Check if log exists for this date
    existing_log = next((l for l in habit.logs if l.log_date == log_date_str), None)
    
    # XP according to difficulty
    base_xp = 10
    if habit.difficulty == "hard":
        base_xp = 15
    elif habit.difficulty == "easy":
        base_xp = 5

    curr_val = payload.current_value if (payload and payload.current_value is not None) else habit.target_value
    is_completed = curr_val >= habit.target_value

    if existing_log:
        existing_log.completed = is_completed
        existing_log.current_value = curr_val
        if payload and payload.notes is not None:
            existing_log.notes = payload.notes
        existing_log.completed_at = datetime.datetime.utcnow()
        log_id = existing_log.id
    else:
        new_log = HabitLog(
            habit_id=habit.id,
            user_id=current_user.id,
            log_date=log_date_str,
            completed=is_completed,
            current_value=curr_val,
            notes=payload.notes if payload else None,
            completed_at=datetime.datetime.utcnow(),
            xp_awarded=base_xp
        )
        db.add(new_log)
        await db.flush()
        log_id = new_log.id

    # Recalculate streak for this habit
    completed_dates = {l.log_date for l in habit.logs if l.completed}
    if is_completed:
        completed_dates.add(log_date_str)
    else:
        completed_dates.discard(log_date_str)

    # Get shield dates
    shields_res = await db.execute(
        select(StreakShield.used_on_date).where(StreakShield.user_id == current_user.id)
    )
    shield_dates = set(shields_res.scalars().all())

    curr_s, long_s = calculate_habit_streak(
        completed_dates=completed_dates,
        frequency_type=habit.frequency_type,
        frequency_days=habit.frequency_days,
        target_days_per_week=habit.target_days_per_week,
        shield_dates=shield_dates
    )
    habit.current_streak = curr_s
    habit.longest_streak = max(habit.longest_streak, long_s)
    habit.total_completions = len(completed_dates)

    # Award XP if completed
    level_up = False
    new_lvl = 1
    if is_completed:
        lvl_up, old_l, new_l = await GamificationService.award_xp(
            db=db,
            user_id=current_user.id,
            amount=base_xp,
            source="habit_completion",
            reference_id=f"habit_{habit.id}_{log_date_str}",
            description=f"Completed {habit.name}"
        )
        level_up = lvl_up
        new_lvl = new_l

        # Check if all active scheduled habits for today are now completed
        all_habits_res = await db.execute(
            select(Habit).options(selectinload(Habit.logs)).where(
                Habit.user_id == current_user.id,
                Habit.is_archived == False,
                Habit.is_paused == False
            )
        )
        all_active = all_habits_res.scalars().all()
        all_done = True
        for h in all_active:
            h_done = any(l.log_date == log_date_str and l.completed for l in h.logs)
            if h.id == habit.id:
                h_done = is_completed
            if not h_done:
                all_done = False
                break
        
        if all_done and len(all_active) > 0:
            # Award +25 XP Daily Goal Complete bonus
            bonus_up, _, b_lvl = await GamificationService.award_xp(
                db=db,
                user_id=current_user.id,
                amount=25,
                source="daily_goal_completed",
                reference_id=f"daily_bonus_{log_date_str}",
                description="Daily Goal Complete! All habits finished."
            )
            if bonus_up:
                level_up = True
                new_lvl = b_lvl

    # Update overall user streak and stats in profile
    prof_res = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        profile.total_habits_completed = profile.total_habits_completed + 1 if is_completed else max(0, profile.total_habits_completed - 1)
        profile.current_streak = max(profile.current_streak, habit.current_streak)
        profile.longest_streak = max(profile.longest_streak, habit.longest_streak)

    # Check achievements
    unlocked_achs = await GamificationService.check_achievements(db, current_user.id)
    await db.flush()

    return HabitCompleteResponse(
        success=True,
        habit_id=habit.id,
        completed=is_completed,
        current_value=curr_val,
        xp_awarded=base_xp if is_completed else 0,
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak,
        level_up=level_up,
        new_level=new_lvl,
        unlocked_achievements=unlocked_achs,
        message=f"'{habit.name}' completed!" if is_completed else "Progress updated."
    )

@router.post("/{habit_id}/undo", response_model=HabitCompleteResponse)
async def undo_habit_completion(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await get_user_habit_or_404(habit_id, current_user.id, db)
    today_str = format_date(datetime.date.today())
    
    # Find today's log
    existing_log = next((l for l in habit.logs if l.log_date == today_str), None)
    if existing_log:
        await db.delete(existing_log)
        await db.flush()

    # Revert XP
    await GamificationService.reverse_xp(
        db=db,
        user_id=current_user.id,
        source="habit_completion",
        reference_id=f"habit_{habit.id}_{today_str}"
    )
    # Also revert daily bonus if it was awarded
    await GamificationService.reverse_xp(
        db=db,
        user_id=current_user.id,
        source="daily_goal_completed",
        reference_id=f"daily_bonus_{today_str}"
    )

    # Recalculate streak
    completed_dates = {l.log_date for l in habit.logs if l.completed and l.log_date != today_str}
    curr_s, long_s = calculate_habit_streak(
        completed_dates=completed_dates,
        frequency_type=habit.frequency_type,
        frequency_days=habit.frequency_days,
        target_days_per_week=habit.target_days_per_week
    )
    habit.current_streak = curr_s
    habit.longest_streak = long_s
    habit.total_completions = len(completed_dates)

    # Update profile
    prof_res = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        profile.total_habits_completed = max(0, profile.total_habits_completed - 1)
        profile.current_streak = habit.current_streak

    await db.flush()

    return HabitCompleteResponse(
        success=True,
        habit_id=habit.id,
        completed=False,
        current_value=0.0,
        xp_awarded=0,
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak,
        level_up=False,
        new_level=profile.level if profile else 1,
        unlocked_achievements=[],
        message=f"'{habit.name}' completion undone."
    )

# Habit Stacks
@router.get("/stacks/all", response_model=List[HabitStackOut])
async def list_habit_stacks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(HabitStack)
        .options(selectinload(HabitStack.trigger_habit), selectinload(HabitStack.action_habit))
        .where(HabitStack.user_id == current_user.id)
    )
    res = await db.execute(query)
    stacks = res.scalars().all()
    
    output = []
    for s in stacks:
        output.append(HabitStackOut(
            id=s.id,
            trigger_habit_id=s.trigger_habit_id,
            action_habit_id=s.action_habit_id,
            trigger_habit_name=s.trigger_habit.name if s.trigger_habit else "Unknown",
            action_habit_name=s.action_habit.name if s.action_habit else "Unknown",
            stack_description=s.stack_description or f"After {s.trigger_habit.name if s.trigger_habit else '...'}, then {s.action_habit.name if s.action_habit else '...'}"
        ))
    return output

@router.post("/stacks", response_model=HabitStackOut)
async def create_habit_stack(
    payload: HabitStackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    trigger_habit = await get_user_habit_or_404(payload.trigger_habit_id, current_user.id, db)
    action_habit = await get_user_habit_or_404(payload.action_habit_id, current_user.id, db)
    
    desc = payload.stack_description or f"After {trigger_habit.name}, then {action_habit.name}"
    
    stack = HabitStack(
        user_id=current_user.id,
        trigger_habit_id=trigger_habit.id,
        action_habit_id=action_habit.id,
        stack_description=desc
    )
    db.add(stack)
    await db.flush()

    # Check achievements for habit stacker
    await GamificationService.check_achievements(db, current_user.id)

    return HabitStackOut(
        id=stack.id,
        trigger_habit_id=trigger_habit.id,
        action_habit_id=action_habit.id,
        trigger_habit_name=trigger_habit.name,
        action_habit_name=action_habit.name,
        stack_description=desc
    )

@router.delete("/stacks/{stack_id}")
async def delete_habit_stack(
    stack_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(HabitStack).where(HabitStack.id == stack_id, HabitStack.user_id == current_user.id)
    )
    stack = res.scalar_one_or_none()
    if not stack:
        raise HTTPException(status_code=404, detail="Habit stack not found.")
    await db.delete(stack)
    await db.flush()
    return {"message": "Habit stack deleted."}
