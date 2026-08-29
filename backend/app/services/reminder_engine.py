import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User, Profile, UserSettings
from app.models.habit import Habit, HabitLog
from app.models.notification import Notification
from app.core.streak_engine import format_date, is_day_scheduled

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

# Category-specific rotating message pools
CATEGORY_MOTIVATIONS: Dict[str, List[Tuple[str, str]]] = {
    "Reading": [
        ("📚 Your next chapter is waiting", "Just a few pages today. Your future self will thank you."),
        ("📖 Keep the story going", "Small reading progress compounds into massive knowledge."),
        ("📚 Reading check-in", "A few pages today beats zero pages. Dive in for 15 minutes."),
        ("✨ Feed your curiosity", "One chapter at a time. Keep your reading momentum strong."),
    ],
    "Fitness": [
        ("🏋️ Time to move", "You don't need a perfect workout. You just need to start."),
        ("💪 Show up for your body", "The hardest part is starting. Once you begin, momentum takes over."),
        ("⚡ Energy check-in", "A quick workout today pays dividends in focus and vitality."),
        ("🏃 Physical discipline", "Consistency beats intensity every single time."),
    ],
    "Health": [
        ("💧 Hydration check", "Time for some water. Your body is asking for a refill."),
        ("🌿 Nourish your health", "Small healthy choices throughout the day create lifelong vitality."),
        ("💧 Stay refreshed", "Take a mindful sip right now and keep moving."),
    ],
    "Study": [
        ("💻 Forge your skills", "30 focused minutes today becomes a stronger skill tomorrow."),
        ("🧠 Deep focus session", "Block out distractions and give yourself 30 minutes of real learning."),
        ("📚 Knowledge compounding", "Every insight builds on the last. Show up for your study block."),
    ],
    "Productivity": [
        ("🎯 Priority focus", "Identify your high-leverage task and execute. You've got this."),
        ("⚡ Momentum builder", "Small consistent progress today clears the path for tomorrow."),
        ("🧠 Take control of your day", "Finish your top priority habit to secure today's score."),
    ],
    "Sleep": [
        ("🌙 Wind down routine", "Power down screens and prepare your mind for restorative sleep."),
        ("😴 Rest is where you recharge", "Good sleep is the foundation for tomorrow's discipline."),
    ],
    "Personal Growth": [
        ("📝 Evening reflection & wins", "Take 5 minutes to capture today's key wins and insights."),
        ("🧘 Mindful pause", "Pause. Breathe. Reset. One small habit keeps your compass true."),
        ("🌿 Character forging", "You are what you repeatedly do. Let's finish today's routine."),
    ],
    "General": [
        ("✨ One small action", "One small action today keeps your momentum alive."),
        ("🎯 Show up today", "Progress doesn't need to be perfect. Showing up is the win."),
        ("🔥 Level yourself", "Another day, another chance to forge your discipline."),
        ("⚡ Future self check-in", "Your future self is counting on today's version of you."),
    ],
}

class CandidateReminder:
    def __init__(
        self,
        priority_score: int,  # 0 to 100
        notification_type: str,
        category: str,
        title: str,
        message: str,
        icon: str,
        habit_id: Optional[int] = None,
        action_url: Optional[str] = None,
        action_type: Optional[str] = None
    ):
        self.priority_score = priority_score
        self.notification_type = notification_type
        self.category = category
        self.title = title
        self.message = message
        self.icon = icon
        self.habit_id = habit_id
        self.action_url = action_url
        self.action_type = action_type


class IntelligentReminderEngine:
    """
    Centralized daily scheduler that limits to max 12 reminders/day,
    enforces 2-hour spacing, prioritizes highest leverage items,
    and synthesizes non-bunching companion notifications.
    """

    @staticmethod
    async def get_daily_notification_stats(db: AsyncSession, user_id: int) -> Tuple[int, Optional[datetime.datetime]]:
        """Returns (sent_count_today, last_sent_at)"""
        today = datetime.date.today()
        today_start = datetime.datetime.combine(today, datetime.time.min)

        res = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.created_at >= today_start,
                Notification.status.in_(["unread", "read", "snoozed", "dismissed"])
            ).order_by(Notification.sent_at.desc())
        )
        notifs = res.scalars().all()
        sent_count = len(notifs)
        last_sent_at = notifs[0].sent_at if notifs else None
        return sent_count, last_sent_at

    @staticmethod
    async def evaluate_single_best_reminder(
        db: AsyncSession,
        user_id: int,
        force_preview: bool = False
    ) -> Optional[Notification]:
        # 1. Fetch user & settings
        user_res = await db.execute(
            select(User)
            .options(
                selectinload(User.settings),
                selectinload(User.profile),
                selectinload(User.habits).selectinload(Habit.logs)
            )
            .where(User.id == user_id)
        )
        user = user_res.scalar_one_or_none()
        if not user or not user.settings:
            return None

        settings = user.settings
        if not settings.habit_reminders and not settings.wellness_reminders and not settings.progress_reminders:
            return None

        max_daily = min(settings.max_daily_reminders or 12, 12)
        now_dt = datetime.datetime.utcnow()
        now_time = now_dt.time()
        hour = now_dt.hour
        today = datetime.date.today()
        today_str = format_date(today)

        # 2. Check Quiet Hours
        if settings.quiet_hours_enabled and not force_preview:
            if is_in_quiet_hours(
                now_time,
                settings.quiet_hours_start or "23:00",
                settings.quiet_hours_end or "07:00"
            ):
                return None

        # 3. Check Daily Budget & Spacing (unless forced)
        sent_today_count, last_sent_at = await IntelligentReminderEngine.get_daily_notification_stats(db, user_id)
        if sent_today_count >= max_daily and not force_preview:
            return None

        if last_sent_at and not force_preview:
            minutes_since_last = (now_dt - last_sent_at).total_seconds() / 60.0
            # Target ~2h (allow 90m minimum spacing)
            if minutes_since_last < 90:
                return None

        # 4. Gather today's active & incomplete habits
        active_habits = [h for h in user.habits if not h.is_archived and not h.is_paused]
        scheduled_habits = [
            h for h in active_habits
            if is_day_scheduled(today, h.frequency_type, h.frequency_days, h.target_days_per_week)
        ]
        
        incomplete_habits = []
        partially_completed_habits = []
        completed_habits = []

        for h in scheduled_habits:
            today_log = next((l for l in h.logs if l.log_date == today_str), None)
            if today_log and today_log.completed:
                completed_habits.append(h)
            elif today_log and today_log.current_value > 0:
                partially_completed_habits.append((h, today_log))
            else:
                incomplete_habits.append(h)

        # 5. Build Candidates with Priority Scores
        candidates: List[CandidateReminder] = []
        day_of_year = today.timetuple().tm_yday

        # A. High Priority: Streak at Risk (Streak >= 3, afternoon/evening, not yet done)
        if settings.streak_reminders:
            for h in incomplete_habits:
                if h.current_streak >= 3:
                    p_score = 95 if hour >= 17 else (85 if hour >= 13 else 70)
                    candidates.append(CandidateReminder(
                        priority_score=p_score,
                        notification_type="streak_reminder",
                        category="progress",
                        title=f"🔥 Keep your {h.current_streak}-day {h.name} streak",
                        message=f"Take a few minutes today to protect your {h.current_streak}-day momentum.",
                        icon="flame",
                        habit_id=h.id,
                        action_url=f"/habits/{h.id}",
                        action_type="complete_habit"
                    ))

        # B. High Priority: Multiple Incomplete Evening Synthesizer (NO BUNCHING)
        if hour >= 19 and len(incomplete_habits) >= 2:
            top_h = max(incomplete_habits, key=lambda x: (x.current_streak, x.target_value))
            candidates.append(CandidateReminder(
                priority_score=92,
                notification_type="routine",
                category="routine",
                title="🌙 Before you call it a day",
                message=f"You've got {len(incomplete_habits)} habits left. Start with your {top_h.name} session.",
                icon="moon",
                habit_id=top_h.id,
                action_url=f"/habits/{top_h.id}",
                action_type="complete_habit"
            ))

        # C. Medium Priority: Partial Progress on Quantitative Habit
        if settings.progress_reminders:
            for h, log in partially_completed_habits:
                rem = h.target_value - log.current_value
                unit_str = h.unit or "units"
                candidates.append(CandidateReminder(
                    priority_score=78,
                    notification_type="progress_reminder",
                    category="habits",
                    title=f"Almost there: {h.name}",
                    message=f"Just {rem:g} {unit_str} left to complete today's goal. Finish strong!",
                    icon=h.icon or "sparkles",
                    habit_id=h.id,
                    action_url=f"/habits/{h.id}",
                    action_type="complete_habit"
                ))

        # D. Medium Priority: Daily Goal Near Complete
        if len(scheduled_habits) >= 3 and len(incomplete_habits) == 1 and len(completed_habits) >= 2:
            last_h = incomplete_habits[0]
            candidates.append(CandidateReminder(
                priority_score=80,
                notification_type="progress_reminder",
                category="progress",
                title="🎯 One habit away from a Perfect Day",
                message=f"Complete {last_h.name} to finish 100% of today's planned habits and earn bonus XP!",
                icon="target",
                habit_id=last_h.id,
                action_url=f"/habits/{last_h.id}",
                action_type="complete_habit"
            ))

        # E. Medium Priority: Scheduled Habit Reminder
        if settings.habit_reminders and incomplete_habits:
            # Pick highest streak or first incomplete
            top_h = max(incomplete_habits, key=lambda x: x.current_streak)
            pool = CATEGORY_MOTIVATIONS.get(top_h.category, CATEGORY_MOTIVATIONS["General"])
            rot_idx = (top_h.id * 5 + day_of_year) % len(pool)
            t_title, t_msg = pool[rot_idx]

            candidates.append(CandidateReminder(
                priority_score=65,
                notification_type="habit_reminder",
                category="habits",
                title=t_title,
                message=t_msg,
                icon=top_h.icon or "sparkles",
                habit_id=top_h.id,
                action_url=f"/habits/{top_h.id}",
                action_type="complete_habit"
            ))

        # F. Medium/Low Priority: Wellness (Hydration / Screen Reset / Walk)
        if settings.wellness_reminders:
            if 10 <= hour <= 16:
                candidates.append(CandidateReminder(
                    priority_score=55,
                    notification_type="wellness",
                    category="wellness",
                    title="💧 Hydration check",
                    message="Time for some water. Take a mindful sip and stay energized.",
                    icon="droplet",
                    action_type="drink_water",
                    action_url="/"
                ))
            elif 14 <= hour <= 18:
                candidates.append(CandidateReminder(
                    priority_score=48,
                    notification_type="wellness",
                    category="wellness",
                    title="👀 5-minute screen reset",
                    message="You've been focused for a while. Step away, stretch, and rest your eyes.",
                    icon="sun",
                    action_type="take_break",
                    action_url="/"
                ))

        # G. Routine: Morning Launch
        if 7 <= hour <= 10 and len(completed_habits) == 0:
            candidates.append(CandidateReminder(
                priority_score=68,
                notification_type="routine",
                category="routine",
                title="🌅 Start your day strong",
                message="Pick one small win to get today's momentum started.",
                icon="sunrise",
                action_url="/"
            ))

        # H. End of Day: Perfect Day Celebration
        if hour >= 18 and len(scheduled_habits) > 0 and len(incomplete_habits) == 0 and len(partially_completed_habits) == 0:
            candidates.append(CandidateReminder(
                priority_score=75,
                notification_type="progress",
                category="progress",
                title="🏆 Day complete!",
                message="You finished everything you planned today. Outstanding consistency.",
                icon="trophy",
                action_url="/progress"
            ))

        # I. Motivational Thought (Fallback / Low priority)
        if settings.motivational_messages:
            gen_pool = CATEGORY_MOTIVATIONS["General"]
            m_title, m_msg = gen_pool[day_of_year % len(gen_pool)]
            candidates.append(CandidateReminder(
                priority_score=30,
                notification_type="motivation",
                category="motivation",
                title=m_title,
                message=m_msg,
                icon="sparkles",
                action_url="/"
            ))

        if not candidates:
            return None

        # 6. Sort Candidates by Priority Score (Highest first)
        candidates.sort(key=lambda x: x.priority_score, reverse=True)

        # 7. Check Deduplication against recently sent notifications today
        recent_res = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.created_at >= datetime.datetime.combine(today, datetime.time.min)
            )
        )
        recent_notifs = recent_res.scalars().all()
        recent_titles = {n.title for n in recent_notifs}

        best_candidate: Optional[CandidateReminder] = None
        for c in candidates:
            if c.title not in recent_titles or force_preview:
                best_candidate = c
                break

        if not best_candidate:
            return None

        # 8. Create and Persist the Single Best Notification
        notif = Notification(
            user_id=user_id,
            habit_id=best_candidate.habit_id,
            notification_type=best_candidate.notification_type,
            category=best_candidate.category,
            priority="high" if best_candidate.priority_score >= 80 else ("medium" if best_candidate.priority_score >= 50 else "low"),
            title=best_candidate.title,
            message=best_candidate.message,
            icon=best_candidate.icon,
            action_url=best_candidate.action_url,
            action_type=best_candidate.action_type,
            status="unread",
            sent_at=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        await db.flush()

        return notif
