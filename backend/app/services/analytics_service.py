import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User, Profile
from app.models.habit import Habit, HabitLog
from app.models.challenge import WeeklyReview
from app.core.streak_engine import format_date, parse_date, is_day_scheduled
from app.schemas.analytics import HeatmapDay, HeatmapResponse, CategoryBreakdown, TrendPoint, WeeklyReviewOut, RecommendationOut

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class AnalyticsService:
    @staticmethod
    async def get_heatmap(db: AsyncSession, user_id: int, days_count: int = 365) -> HeatmapResponse:
        today = datetime.date.today()
        start_date = today - datetime.timedelta(days=days_count - 1)
        
        # Query all habit logs in the date window
        logs_res = await db.execute(
            select(HabitLog)
            .where(
                HabitLog.user_id == user_id,
                HabitLog.completed == True,
                HabitLog.log_date >= format_date(start_date)
            )
        )
        logs = logs_res.scalars().all()
        
        # Count completions per date
        counts_by_date = defaultdict(int)
        for log in logs:
            counts_by_date[log.log_date] += 1
            
        # Get user's active habit count to gauge level
        habits_res = await db.execute(
            select(Habit).where(Habit.user_id == user_id, Habit.is_archived == False)
        )
        active_habits_count = max(1, len(habits_res.scalars().all()))
        
        days_list: List[HeatmapDay] = []
        total_active_days = 0
        
        curr = start_date
        while curr <= today:
            d_str = format_date(curr)
            count = counts_by_date.get(d_str, 0)
            if count > 0:
                total_active_days += 1
                
            rate = int(min(100, (count / active_habits_count) * 100))
            if count == 0:
                level = 0
            elif rate <= 33:
                level = 1
            elif rate <= 66:
                level = 2
            elif rate < 100:
                level = 3
            else:
                level = 4
                
            days_list.append(HeatmapDay(
                date=d_str,
                count=count,
                completion_rate=rate,
                level=level
            ))
            curr += datetime.timedelta(days=1)
            
        prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        current_streak = profile.current_streak if profile else 0
        longest_streak = profile.longest_streak if profile else 0

        return HeatmapResponse(
            days=days_list,
            total_active_days=total_active_days,
            longest_streak=longest_streak,
            current_streak=current_streak
        )

    @staticmethod
    async def get_insights_and_trends(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        today = datetime.date.today()
        
        # Habits
        habits_res = await db.execute(
            select(Habit).options(selectinload(Habit.logs)).where(Habit.user_id == user_id)
        )
        habits = habits_res.scalars().all()
        
        # All logs
        logs_res = await db.execute(
            select(HabitLog).where(HabitLog.user_id == user_id, HabitLog.completed == True)
        )
        all_logs = logs_res.scalars().all()
        
        # Day of week distribution
        day_counts = defaultdict(int)
        hour_counts = defaultdict(int)
        for log in all_logs:
            if log.completed_at:
                day_counts[DAYS_OF_WEEK[log.completed_at.weekday()]] += 1
                hour_counts[log.completed_at.hour] += 1
            elif log.log_date:
                try:
                    d = parse_date(log.log_date)
                    day_counts[DAYS_OF_WEEK[d.weekday()]] += 1
                except Exception:
                    pass
                    
        best_day = max(day_counts, key=day_counts.get) if day_counts else "Any day"
        weakest_day = min(day_counts, key=day_counts.get) if day_counts else "Sunday"
        
        best_hour = max(hour_counts, key=hour_counts.get) if hour_counts else 9
        best_time_str = f"{best_hour % 12 or 12} {'AM' if best_hour < 12 else 'PM'}"
        
        # Category breakdown
        category_map = defaultdict(lambda: {"total_habits": 0, "completions": 0, "color": "#6366f1"})
        CATEGORY_COLORS = {
            "Health": "#10b981",
            "Fitness": "#f97316",
            "Study": "#3b82f6",
            "Career": "#8b5cf6",
            "Productivity": "#06b6d4",
            "Sleep": "#6366f1",
            "Reading": "#ec4899",
            "Personal Growth": "#eab308",
            "General": "#64748b"
        }
        
        for h in habits:
            cat = h.category or "General"
            category_map[cat]["total_habits"] += 1
            category_map[cat]["color"] = CATEGORY_COLORS.get(cat, "#6366f1")
            
        for log in all_logs:
            # Match habit category
            h_match = next((h for h in habits if h.id == log.habit_id), None)
            if h_match:
                cat = h_match.category or "General"
                category_map[cat]["completions"] += 1
                
        categories: List[CategoryBreakdown] = []
        for cat_name, data in category_map.items():
            rate = int(min(100, (data["completions"] / max(1, data["total_habits"] * 10)) * 100))
            categories.append(CategoryBreakdown(
                category=cat_name,
                total_habits=data["total_habits"],
                completions=data["completions"],
                completion_rate=rate,
                color=data["color"]
            ))
            
        # Weekly trends for last 7 days
        trend_points: List[TrendPoint] = []
        active_habits = [h for h in habits if not h.is_archived and not h.is_paused]
        for i in range(6, -1, -1):
            d = today - datetime.timedelta(days=i)
            d_str = format_date(d)
            scheduled = sum(1 for h in active_habits if is_day_scheduled(d, h.frequency_type, h.frequency_days))
            completed = sum(1 for log in all_logs if log.log_date == d_str)
            rate = int(min(100, (completed / max(1, scheduled)) * 100)) if scheduled > 0 else (100 if completed > 0 else 0)
            trend_points.append(TrendPoint(
                period=DAYS_OF_WEEK[d.weekday()][:3],
                completed=completed,
                scheduled=scheduled,
                rate=rate
            ))
            
        # Most and least consistent habits
        habit_consistency = []
        for h in active_habits:
            h_logs = {l.log_date for l in h.logs if l.completed}
            rate = int(min(100, (len(h_logs) / max(1, 14)) * 100)) # 14-day window
            habit_consistency.append((h, rate))
            
        habit_consistency.sort(key=lambda x: x[1], reverse=True)
        most_consistent = habit_consistency[0][0].name if habit_consistency else None
        least_consistent = habit_consistency[-1][0].name if len(habit_consistency) > 1 else None

        return {
            "best_day": best_day,
            "weakest_day": weakest_day,
            "best_time": best_time_str,
            "categories": categories,
            "trends": trend_points,
            "most_consistent_habit": most_consistent,
            "least_consistent_habit": least_consistent
        }

    @staticmethod
    async def get_weekly_review(db: AsyncSession, user_id: int) -> WeeklyReviewOut:
        today = datetime.date.today()
        # Monday of current week
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end = week_start + datetime.timedelta(days=6)
        
        start_str = format_date(week_start)
        end_str = format_date(week_end)
        
        # Check if already generated in DB
        res = await db.execute(
            select(WeeklyReview).where(
                WeeklyReview.user_id == user_id,
                WeeklyReview.week_start_date == start_str
            )
        )
        existing = res.scalar_one_or_none()
        if existing:
            return WeeklyReviewOut(
                id=existing.id,
                week_start_date=existing.week_start_date,
                week_end_date=existing.week_end_date,
                completion_rate=existing.completion_rate,
                total_completed=existing.total_completed,
                total_scheduled=existing.total_scheduled,
                best_habit=existing.best_habit,
                needs_attention_habit=existing.needs_attention_habit,
                best_day=existing.best_day,
                weakest_day=existing.weakest_day,
                xp_earned=existing.xp_earned,
                actionable_insight=existing.actionable_insight
            )

        # Generate fresh weekly review
        insights = await AnalyticsService.get_insights_and_trends(db, user_id)
        
        # Calculate weekly stats
        logs_res = await db.execute(
            select(HabitLog).where(
                HabitLog.user_id == user_id,
                HabitLog.completed == True,
                HabitLog.log_date >= start_str,
                HabitLog.log_date <= end_str
            )
        )
        week_logs = logs_res.scalars().all()
        total_completed = len(week_logs)
        
        habits_res = await db.execute(
            select(Habit).where(Habit.user_id == user_id, Habit.is_archived == False, Habit.is_paused == False)
        )
        active_habits = habits_res.scalars().all()
        
        total_scheduled = 0
        curr = week_start
        while curr <= min(today, week_end):
            for h in active_habits:
                if is_day_scheduled(curr, h.frequency_type, h.frequency_days):
                    total_scheduled += 1
            curr += datetime.timedelta(days=1)
            
        rate = int(min(100, (total_completed / max(1, total_scheduled)) * 100)) if total_scheduled > 0 else (100 if total_completed > 0 else 0)
        
        best_habit = insights.get("most_consistent_habit") or "Your habits"
        needs_attention = insights.get("least_consistent_habit")
        best_day = insights.get("best_day")
        weakest_day = insights.get("weakest_day")
        
        insight_msg = f"You perform most consistently on {best_day}. Keep building momentum on {weakest_day} by starting with your smallest habit first."
        if needs_attention and needs_attention != best_habit:
            insight_msg = f"'{needs_attention}' had fewer completions this week. Try pairing it with '{best_habit}' using Habit Stacking to make it automatic!"

        review = WeeklyReview(
            user_id=user_id,
            week_start_date=start_str,
            week_end_date=end_str,
            completion_rate=rate,
            total_completed=total_completed,
            total_scheduled=total_scheduled,
            best_habit=best_habit,
            needs_attention_habit=needs_attention,
            best_day=best_day,
            weakest_day=weakest_day,
            xp_earned=total_completed * 10,
            actionable_insight=insight_msg
        )
        db.add(review)
        await db.flush()

        return WeeklyReviewOut(
            id=review.id,
            week_start_date=start_str,
            week_end_date=end_str,
            completion_rate=rate,
            total_completed=total_completed,
            total_scheduled=total_scheduled,
            best_habit=best_habit,
            needs_attention_habit=needs_attention,
            best_day=best_day,
            weakest_day=weakest_day,
            xp_earned=review.xp_earned,
            actionable_insight=insight_msg
        )

    @staticmethod
    async def get_smart_recommendations(db: AsyncSession, user_id: int) -> List[RecommendationOut]:
        recs: List[RecommendationOut] = []
        
        # 1. Check active habits count
        habits_res = await db.execute(
            select(Habit).where(Habit.user_id == user_id, Habit.is_archived == False)
        )
        habits = habits_res.scalars().all()
        active_habits = [h for h in habits if not h.is_paused]
        
        if len(active_habits) >= 8:
            recs.append(RecommendationOut(
                id="routine_overload",
                type="overload",
                title="Optimize Your Routine",
                message=f"You currently have {len(active_habits)} active habits. Research shows focusing on 3–5 high-leverage habits accelerates long-term consistency.",
                action_label="Review Habits",
                action_type="navigate_habits"
            ))
            
        # 2. Check for long streak celebration
        for h in active_habits:
            if h.current_streak >= 14:
                recs.append(RecommendationOut(
                    id=f"streak_celebration_{h.id}",
                    type="celebration",
                    title="Incredible Momentum!",
                    message=f"You've sustained a {h.current_streak}-day streak on '{h.name}'. Consider raising the difficulty or stacking a new habit onto it.",
                    action_label="View Habit",
                    action_type="view_habit",
                    habit_id=h.id
                ))
                break
                
        # 3. Check for missed yesterday recovery
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        yest_str = format_date(yesterday)
        
        for h in active_habits:
            if is_day_scheduled(yesterday, h.frequency_type, h.frequency_days):
                # Check log
                log_res = await db.execute(
                    select(HabitLog).where(HabitLog.habit_id == h.id, HabitLog.log_date == yest_str, HabitLog.completed == True)
                )
                if not log_res.scalar_one_or_none() and h.current_streak == 0:
                    recs.append(RecommendationOut(
                        id=f"recovery_{h.id}",
                        type="recovery",
                        title="Bounce Back Strong",
                        message=f"You missed '{h.name}' yesterday. Complete it today to reignite your streak instantly.",
                        action_label="Complete Today",
                        action_type="complete_habit",
                        habit_id=h.id
                    ))
                    break

        if not recs:
            recs.append(RecommendationOut(
                id="daily_focus",
                type="streak",
                title="Daily Mastery",
                message="Small daily improvements compound over time. Complete your morning routine to secure your daily score.",
                action_label="View Dashboard",
                action_type="navigate_dashboard"
            ))

        return recs
