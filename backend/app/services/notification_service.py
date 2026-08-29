import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User, Profile, UserSettings
from app.models.habit import Habit, HabitLog
from app.models.notification import Notification
from app.core.streak_engine import format_date, is_day_scheduled

# Category-specific rotating message pools
CATEGORY_MESSAGES: Dict[str, List[Tuple[str, str]]] = {
    "Reading": [
        ("📚 Your next chapter is waiting", "Just a few pages today. Your future self will thank you."),
        ("📖 Keep the story going", "Small reading progress compounds into massive knowledge."),
        ("📚 Reading time is here", "A few pages today beats zero pages. Let's make time for your mind."),
        ("✨ Feed your curiosity", "One chapter at a time. Keep your reading momentum strong."),
        ("📖 Chapter check-in", "Pause the noise, open the book, and dive in for a few minutes."),
    ],
    "Fitness": [
        ("🏋️ Time to move", "30 minutes today. Let's keep your body energized and your streak alive."),
        ("💪 Show up for your body", "The hardest part is starting. Once you begin, momentum takes over."),
        ("⚡ Energy check-in", "A quick workout today pays dividends in focus and vitality."),
        ("🏃 Build physical discipline", "Consistency beats intensity every single time. Let's get moving."),
        ("🔥 Keep your movement streak", "Your future strength is forged in today's session."),
    ],
    "Health": [
        ("💧 Hydration check", "Your body is asking for a refill. Time to hit today's target!"),
        ("🌿 Nourish your health", "Small healthy choices throughout the day create lifelong vitality."),
        ("💧 Drink water check-in", "Stay refreshed and energized. Take a mindful sip right now."),
        ("🌱 Health check-in", "One mindful health action keeps your body running at its peak."),
    ],
    "Study": [
        ("💻 Forge your skills", "Focus on one problem or topic today. Small daily practice unlocks mastery."),
        ("🧠 Deep focus session", "Block out the distractions and give yourself 30 minutes of real learning."),
        ("📚 Knowledge compounding", "Show up for your study block today. Every insight builds on the last."),
        ("💻 Skill building time", "Your future expertise is built one dedicated session at a time."),
    ],
    "Productivity": [
        ("🎯 Priority focus", "Identify your high-leverage task and execute. You've got this."),
        ("⚡ Momentum builder", "Small consistent progress today clears the path for tomorrow."),
        ("✨ Deep work check-in", "A short distraction-free block creates unmatched clarity."),
        ("🧠 Take control of your day", "Finish your top priority habit to secure today's score."),
    ],
    "Sleep": [
        ("🌙 Wind down routine", "Power down screens and prepare your mind for deep, restorative sleep."),
        ("😴 Rest is where you recharge", "Good sleep is the foundation for tomorrow's discipline."),
        ("🌙 Evening calm", "Unplug, relax, and give your body the rest it earned today."),
    ],
    "Personal Growth": [
        ("📝 Evening reflection & wins", "Take 5 minutes to capture today's key wins and insights."),
        ("🧘 Mindful pause", "Take a deep breath. Reset. One small habit keeps your compass true."),
        ("✨ Daily growth check", "Consistency over perfection. Step forward today."),
        ("🌿 Character forging", "You are what you repeatedly do. Let's complete today's routine."),
    ],
    "General": [
        ("✨ One small action", "One small action today keeps your momentum alive and well."),
        ("🎯 Show up today", "Progress doesn't need to be perfect. Showing up is the win."),
        ("🔥 Level yourself", "Another day, another chance to forge your discipline."),
        ("⚡ Future self check-in", "Your future self is counting on today's version of you."),
    ],
}

TIME_BASED_PREFIXES = {
    "morning": "🌅 Start your day strong",
    "afternoon": "☀️ Quick progress check",
    "evening": "🌙 One last win for today",
    "anytime": "✨ Time to forge ahead",
}

def is_in_quiet_hours(now_time: datetime.time, start_str: str = "23:00", end_str: str = "07:00") -> bool:
    try:
        sh, sm = map(int, start_str.split(":"))
        eh, em = map(int, end_str.split(":"))
        start_time = datetime.time(sh, sm)
        end_time = datetime.time(eh, em)

        if start_time < end_time:
            return start_time <= now_time <= end_time
        else:  # Crosses midnight (e.g. 23:00 to 07:00)
            return now_time >= start_time or now_time <= end_time
    except Exception:
        return False

class NotificationService:
    @staticmethod
    def generate_motivational_message(
        habit: Habit,
        current_streak: int,
        is_partial: bool = False,
        current_val: float = 0.0,
        target_val: float = 1.0,
        unit: Optional[str] = None
    ) -> Tuple[str, str, str]:
        """
        Generates (title, message, icon)
        """
        icon = habit.icon or "sparkles"
        day_of_year = datetime.date.today().timetuple().tm_yday

        # 1. Progress-Aware message for quantitative habits
        if is_partial and habit.habit_type == "quantitative" and current_val > 0 and current_val < target_val:
            remaining = target_val - current_val
            rem_str = f"{remaining:g} {unit or habit.unit or ''}".strip()
            
            if current_val >= target_val * 0.5:
                title = f"Almost there: {habit.name}"
                message = f"You're halfway there! Just {rem_str} left to complete today's target."
            else:
                title = f"Keep going with {habit.name}"
                message = f"{current_val:g} of {target_val:g} {unit or habit.unit or ''} done. Finish strong today!"
            return title, message, icon

        # 2. Streak-Aware messages if user has an active streak
        if current_streak >= 30:
            title = f"🔥 {current_streak}-day streak on {habit.name}"
            message = "You've built serious, unstoppable momentum. Complete today to protect your streak!"
            return title, message, "flame"
        elif current_streak >= 7:
            title = f"🔥 {current_streak} days strong"
            message = f"Your {habit.name} streak is waiting for today's check-in. Keep the fire burning!"
            return title, message, "flame"
        elif current_streak >= 3:
            title = f"🔥 {current_streak}-day streak active"
            message = f"Complete {habit.name} today to keep your compounding streak alive!"
            return title, message, "flame"

        # 3. Category & Time rotation
        category = habit.category or "General"
        pool = CATEGORY_MESSAGES.get(category, CATEGORY_MESSAGES["General"])
        
        # Rotate deterministically based on habit id + day of year
        rot_idx = (habit.id * 7 + day_of_year) % len(pool)
        title, msg = pool[rot_idx]

        # Contextualize with habit name if general
        if "{habit.name}" in msg:
            msg = msg.format(habit=habit)

        return title, msg, icon

    @staticmethod
    async def evaluate_and_generate_reminders(
        db: AsyncSession,
        user_id: int
    ) -> List[Notification]:
        """
        Evaluates active habits for today and creates due notifications.
        Avoids duplicates, respects quiet hours, skips completed habits.
        """
        # Fetch user settings
        settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
        user_settings = settings_res.scalar_one_or_none()
        
        if user_settings and not user_settings.habit_reminders:
            return []

        # Check quiet hours
        now_dt = datetime.datetime.utcnow()
        now_time = now_dt.time()
        if user_settings and user_settings.quiet_hours_enabled:
            if is_in_quiet_hours(
                now_time,
                user_settings.quiet_hours_start or "23:00",
                user_settings.quiet_hours_end or "07:00"
            ):
                return []

        today = datetime.date.today()
        today_str = format_date(today)

        # Fetch active habits
        habits_res = await db.execute(
            select(Habit)
            .options(selectinload(Habit.logs))
            .where(
                Habit.user_id == user_id,
                Habit.is_archived == False,
                Habit.is_paused == False
            )
        )
        habits = habits_res.scalars().all()

        generated_notifications = []

        for h in habits:
            # Check if habit is scheduled for today
            if not is_day_scheduled(today, h.frequency_type, h.frequency_days, h.target_days_per_week):
                continue

            # Check if habit is already completed today
            today_log = next((l for l in h.logs if l.log_date == today_str), None)
            if today_log and today_log.completed:
                continue  # Already done! Do not send reminder.

            # Check if a notification was already sent today for this habit
            existing_notif = await db.execute(
                select(Notification).where(
                    Notification.user_id == user_id,
                    Notification.habit_id == h.id,
                    Notification.created_at >= datetime.datetime.combine(today, datetime.time.min),
                    Notification.status.in_(["unread", "read", "snoozed"])
                )
            )
            if existing_notif.scalar_one_or_none():
                continue  # Already reminded today

            is_partial = bool(today_log and today_log.current_value > 0)
            current_val = today_log.current_value if today_log else 0.0

            title, message, icon = NotificationService.generate_motivational_message(
                habit=h,
                current_streak=h.current_streak,
                is_partial=is_partial,
                current_val=current_val,
                target_val=h.target_value,
                unit=h.unit
            )

            notif = Notification(
                user_id=user_id,
                habit_id=h.id,
                notification_type="progress_reminder" if is_partial else ("streak_reminder" if h.current_streak >= 3 else "habit_reminder"),
                title=title,
                message=message,
                icon=icon,
                action_url=f"/habits/{h.id}",
                status="unread",
                sent_at=datetime.datetime.utcnow(),
                created_at=datetime.datetime.utcnow()
            )
            db.add(notif)
            generated_notifications.append(notif)

        if generated_notifications:
            await db.flush()

        return generated_notifications

    @staticmethod
    async def cancel_habit_reminders(db: AsyncSession, user_id: int, habit_id: int):
        """
        When a habit is completed, cancel any pending/unread reminders for it today.
        """
        today = datetime.date.today()
        res = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.habit_id == habit_id,
                Notification.created_at >= datetime.datetime.combine(today, datetime.time.min),
                Notification.status.in_(["unread", "snoozed"])
            )
        )
        notifs = res.scalars().all()
        for n in notifs:
            n.status = "cancelled"
        await db.flush()
