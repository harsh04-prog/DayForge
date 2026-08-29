import datetime
import math
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User, Profile
from app.models.habit import Habit, HabitLog, HabitStack
from app.models.gamification import XPTransaction, Achievement, UserAchievement, StreakShield
from app.schemas.progress import LevelInfo

# Level Title Thresholds
LEVEL_TITLES = {
    1: "Beginner",
    3: "Apprentice",
    5: "Consistent",
    8: "Dedicated",
    10: "Disciplined",
    15: "Trailblazer",
    20: "Habit Builder",
    30: "Unyielding",
    40: "Centurion",
    50: "Master",
}

def get_level_title(level: int) -> str:
    current_title = "Beginner"
    for lvl in sorted(LEVEL_TITLES.keys()):
        if level >= lvl:
            current_title = LEVEL_TITLES[lvl]
    return current_title

def get_level_for_xp(xp: int) -> Tuple[int, str, int, int, int]:
    """
    Level curve: xp_for_level(L) = 50 * L * (L + 1)
    Returns: (level, title, xp_in_current_level, xp_needed_for_next, percentage)
    """
    if xp <= 0:
        return (1, "Beginner", 0, 100, 0)
    
    # Quadratic inversion: 50*L^2 + 50*L - xp = 0 -> L = (-50 + sqrt(2500 + 200*xp)) / 100
    level = math.floor((-50 + math.sqrt(2500 + 200 * xp)) / 100) + 1
    level = max(1, level)
    
    # XP required to reach start of current level
    prev_level_xp = 50 * (level - 1) * level if level > 1 else 0
    # XP required to reach next level
    next_level_xp = 50 * level * (level + 1)
    
    xp_in_level = xp - prev_level_xp
    xp_needed = next_level_xp - prev_level_xp
    
    percentage = int(min(100, max(0, (xp_in_level / xp_needed) * 100))) if xp_needed > 0 else 100
    title = get_level_title(level)
    
    return (level, title, xp, next_level_xp, percentage)

class GamificationService:
    @staticmethod
    async def award_xp(
        db: AsyncSession,
        user_id: int,
        amount: int,
        source: str,
        reference_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> Tuple[bool, int, int]:
        """
        Awards XP and records transaction.
        Returns (level_up, old_level, new_level)
        """
        # Prevent duplicate transactions for same source & reference_id if provided
        if reference_id:
            existing_tx = await db.execute(
                select(XPTransaction).where(
                    XPTransaction.user_id == user_id,
                    XPTransaction.source == source,
                    XPTransaction.reference_id == reference_id
                )
            )
            if existing_tx.scalar_one_or_none():
                return (False, 1, 1)

        # Record transaction
        tx = XPTransaction(
            user_id=user_id,
            amount=amount,
            source=source,
            reference_id=reference_id,
            description=description or f"Earned {amount} XP from {source}",
            created_at=datetime.datetime.utcnow()
        )
        db.add(tx)

        # Update profile
        prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return (False, 1, 1)

        old_xp = profile.xp
        old_level, _, _, _, _ = get_level_for_xp(old_xp)

        new_xp = max(0, old_xp + amount)
        profile.xp = new_xp
        
        new_level, _, _, _, _ = get_level_for_xp(new_xp)
        profile.level = new_level

        level_up = new_level > old_level
        return (level_up, old_level, new_level)

    @staticmethod
    async def reverse_xp(
        db: AsyncSession,
        user_id: int,
        source: str,
        reference_id: str
    ) -> None:
        """
        Safely reverses awarded XP when an action (e.g. habit completion) is undone.
        """
        tx_res = await db.execute(
            select(XPTransaction).where(
                XPTransaction.user_id == user_id,
                XPTransaction.source == source,
                XPTransaction.reference_id == reference_id
            )
        )
        tx = tx_res.scalar_one_or_none()
        if tx:
            amount = tx.amount
            await db.delete(tx)
            
            prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
            profile = prof_res.scalar_one_or_none()
            if profile:
                profile.xp = max(0, profile.xp - amount)
                new_level, _, _, _, _ = get_level_for_xp(profile.xp)
                profile.level = new_level

    @staticmethod
    async def check_achievements(
        db: AsyncSession,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Evaluates criteria and unlocks newly qualified achievements.
        Returns list of newly unlocked achievements.
        """
        # Fetch all achievements
        all_ach_res = await db.execute(select(Achievement))
        all_achievements = all_ach_res.scalars().all()

        # Fetch already unlocked
        user_ach_res = await db.execute(
            select(UserAchievement).where(UserAchievement.user_id == user_id)
        )
        user_unlocked_ids = {ua.achievement_id for ua in user_ach_res.scalars().all()}

        # Fetch user profile & habits data
        prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return []

        # Count completed habit logs
        logs_res = await db.execute(
            select(HabitLog).where(HabitLog.user_id == user_id, HabitLog.completed == True)
        )
        logs = logs_res.scalars().all()
        total_logs_count = len(logs)

        # Habit stacks count
        stacks_res = await db.execute(
            select(HabitStack).where(HabitStack.user_id == user_id)
        )
        stacks_count = len(stacks_res.scalars().all())

        newly_unlocked = []

        for ach in all_achievements:
            if ach.id in user_unlocked_ids:
                continue

            qualifies = False
            code = ach.code

            if code == "first_step" and total_logs_count >= 1:
                qualifies = True
            elif code == "week_one" and profile.longest_streak >= 7:
                qualifies = True
            elif code == "unstoppable" and profile.longest_streak >= 30:
                qualifies = True
            elif code == "century" and total_logs_count >= 100:
                qualifies = True
            elif code == "xp_1000" and profile.xp >= 1000:
                qualifies = True
            elif code == "habit_stacker" and stacks_count >= 1:
                qualifies = True
            elif code == "shield_bearer" and profile.available_shields < 2:
                qualifies = True
            elif code == "early_bird":
                morning_logs = [l for l in logs if l.completed_at and l.completed_at.hour < 10]
                if len(morning_logs) >= 5:
                    qualifies = True
            elif code == "night_owl":
                night_logs = [l for l in logs if l.completed_at and l.completed_at.hour >= 20]
                if len(night_logs) >= 5:
                    qualifies = True
            elif code == "perfect_week" and profile.longest_streak >= 7:
                qualifies = True

            if qualifies:
                ua = UserAchievement(
                    user_id=user_id,
                    achievement_id=ach.id,
                    unlocked_at=datetime.datetime.utcnow(),
                    is_seen=False
                )
                db.add(ua)
                
                # Award achievement XP
                await GamificationService.award_xp(
                    db=db,
                    user_id=user_id,
                    amount=ach.xp_reward,
                    source="achievement_unlocked",
                    reference_id=f"ach_{ach.id}",
                    description=f"Unlocked achievement: {ach.name}"
                )

                newly_unlocked.append({
                    "id": ach.id,
                    "code": ach.code,
                    "name": ach.name,
                    "description": ach.description,
                    "icon": ach.icon,
                    "xp_reward": ach.xp_reward,
                    "badge_tier": ach.badge_tier
                })

        return newly_unlocked
