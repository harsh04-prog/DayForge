import os
import datetime
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.user import User, Profile, UserSettings
from app.models.habit import Habit, HabitLog, HabitStack
from app.models.gamification import Achievement, UserAchievement, StreakShield, XPTransaction
from app.models.challenge import Challenge, ChallengeMember
from app.core.security import get_password_hash

from app.api.auth import router as auth_router
from app.api.habits import router as habits_router
from app.api.progress import router as progress_router
from app.api.analytics import router as analytics_router
from app.api.challenges import router as challenges_router
from app.api.settings import router as settings_router

async def seed_initial_data():
    async with AsyncSessionLocal() as db:
        # Seed Achievements
        achievements_data = [
            {
                "code": "first_step",
                "name": "First Step",
                "description": "Complete your first habit and take charge of your routine.",
                "icon": "footprints",
                "category": "milestones",
                "xp_reward": 50,
                "required_count": 1,
                "badge_tier": "bronze"
            },
            {
                "code": "week_one",
                "name": "Week One",
                "description": "Maintain a 7-day streak on any habit.",
                "icon": "flame",
                "category": "streaks",
                "xp_reward": 100,
                "required_count": 7,
                "badge_tier": "silver"
            },
            {
                "code": "unstoppable",
                "name": "Unstoppable",
                "description": "Achieve an uninterrupted 30-day streak.",
                "icon": "zap",
                "category": "streaks",
                "xp_reward": 500,
                "required_count": 30,
                "badge_tier": "gold"
            },
            {
                "code": "century",
                "name": "Century",
                "description": "Complete 100 total habit sessions.",
                "icon": "award",
                "category": "milestones",
                "xp_reward": 350,
                "required_count": 100,
                "badge_tier": "diamond"
            },
            {
                "code": "perfect_week",
                "name": "Perfect Week",
                "description": "Complete all scheduled habits every day for an entire week.",
                "icon": "sparkles",
                "category": "consistency",
                "xp_reward": 250,
                "required_count": 7,
                "badge_tier": "gold"
            },
            {
                "code": "early_bird",
                "name": "Early Bird",
                "description": "Complete morning habits consistently before 10 AM.",
                "icon": "sunrise",
                "category": "special",
                "xp_reward": 150,
                "required_count": 5,
                "badge_tier": "silver"
            },
            {
                "code": "night_owl",
                "name": "Night Owl",
                "description": "Complete evening reflections and routines after 8 PM.",
                "icon": "moon",
                "category": "special",
                "xp_reward": 150,
                "required_count": 5,
                "badge_tier": "silver"
            },
            {
                "code": "xp_1000",
                "name": "1,000 XP Club",
                "description": "Accumulate 1,000 lifetime experience points.",
                "icon": "crown",
                "category": "milestones",
                "xp_reward": 200,
                "required_count": 1000,
                "badge_tier": "gold"
            },
            {
                "code": "habit_stacker",
                "name": "Habit Architect",
                "description": "Build your first chained habit stack.",
                "icon": "layers",
                "category": "special",
                "xp_reward": 100,
                "required_count": 1,
                "badge_tier": "bronze"
            },
            {
                "code": "shield_bearer",
                "name": "Shield Bearer",
                "description": "Use a streak shield to protect your hard-earned progress.",
                "icon": "shield",
                "category": "special",
                "xp_reward": 75,
                "required_count": 1,
                "badge_tier": "bronze"
            }
        ]

        for ach_dict in achievements_data:
            exists = await db.execute(select(Achievement).where(Achievement.code == ach_dict["code"]))
            if not exists.scalar_one_or_none():
                db.add(Achievement(**ach_dict))

        # Seed Challenges
        challenges_data = [
            {
                "title": "7-Day Reading Sprint",
                "description": "Immerse yourself in literature. Read at least 20 pages every day for 7 consecutive days.",
                "category": "Reading",
                "icon": "book-open",
                "duration_days": 7,
                "xp_reward": 250,
                "badge_name": "Avid Reader",
                "required_habit_category": "Reading"
            },
            {
                "title": "30-Day Fitness Odyssey",
                "description": "Build physical endurance and resilience by working out or moving for 30 minutes daily.",
                "category": "Fitness",
                "icon": "dumbbell",
                "duration_days": 30,
                "xp_reward": 1000,
                "badge_name": "Iron Discipline",
                "required_habit_category": "Fitness"
            },
            {
                "title": "14-Day Hydration Hero",
                "description": "Drink at least 2 liters of water daily to keep your mind sharp and body energized.",
                "category": "Health",
                "icon": "droplets",
                "duration_days": 14,
                "xp_reward": 350,
                "badge_name": "Hydro Champion",
                "required_habit_category": "Health"
            },
            {
                "title": "21-Day Mindful Focus",
                "description": "Practice deep focus or meditation for 20 minutes without digital distractions.",
                "category": "Productivity",
                "icon": "brain",
                "duration_days": 21,
                "xp_reward": 600,
                "badge_name": "Zen Master",
                "required_habit_category": "Productivity"
            }
        ]

        for chal_dict in challenges_data:
            exists = await db.execute(select(Challenge).where(Challenge.title == chal_dict["title"]))
            if not exists.scalar_one_or_none():
                db.add(Challenge(**chal_dict))

        # Seed Demo User for rapid testing / preview
        demo_email = "alex@dayforge.com"
        demo_user_res = await db.execute(select(User).where(User.email == demo_email))
        if not demo_user_res.scalar_one_or_none():
            demo_user = User(
                email=demo_email,
                username="alex_forge",
                full_name="Alex Mercer",
                hashed_password=get_password_hash("dayforge123"),
                is_active=True,
                is_onboarded=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=25)
            )
            db.add(demo_user)
            await db.flush()

            demo_profile = Profile(
                user_id=demo_user.id,
                bio="Building relentless habits in fitness, reading, and deep work.",
                level=6,
                xp=1480,
                current_streak=8,
                longest_streak=18,
                total_habits_completed=64,
                overall_consistency=88,
                available_shields=2,
                primary_goal="Reach peak physical fitness and complete 24 books this year.",
                focus_areas="Fitness,Reading,Productivity,Health"
            )
            db.add(demo_profile)

            demo_settings = UserSettings(
                user_id=demo_user.id,
                theme="light",
                week_start_day="monday",
                time_format="12h",
                sound_enabled=True
            )
            db.add(demo_settings)
            await db.flush()

            # Seed realistic habits for demo user
            sample_habits = [
                {
                    "name": "Morning Workout",
                    "description": "30 minutes HIIT or strength training",
                    "icon": "dumbbell",
                    "color": "#f97316",
                    "category": "Fitness",
                    "habit_type": "quantitative",
                    "target_value": 30,
                    "unit": "min",
                    "frequency_type": "daily",
                    "preferred_time": "morning",
                    "difficulty": "medium",
                    "current_streak": 8,
                    "longest_streak": 18,
                    "total_completions": 21
                },
                {
                    "name": "Read Non-Fiction",
                    "description": "Read 20 pages of business or philosophy",
                    "icon": "book-open",
                    "color": "#ec4899",
                    "category": "Reading",
                    "habit_type": "quantitative",
                    "target_value": 20,
                    "unit": "pages",
                    "frequency_type": "daily",
                    "preferred_time": "evening",
                    "difficulty": "easy",
                    "current_streak": 12,
                    "longest_streak": 14,
                    "total_completions": 23
                },
                {
                    "name": "Drink 2.5L Water",
                    "description": "Stay hydrated throughout the day",
                    "icon": "droplet",
                    "color": "#06b6d4",
                    "category": "Health",
                    "habit_type": "quantitative",
                    "target_value": 2.5,
                    "unit": "L",
                    "frequency_type": "daily",
                    "preferred_time": "anytime",
                    "difficulty": "easy",
                    "current_streak": 15,
                    "longest_streak": 15,
                    "total_completions": 24
                },
                {
                    "name": "Deep Work Session",
                    "description": "90 minutes distraction-free coding & architecture",
                    "icon": "brain",
                    "color": "#8b5cf6",
                    "category": "Productivity",
                    "habit_type": "quantitative",
                    "target_value": 90,
                    "unit": "min",
                    "frequency_type": "weekdays",
                    "preferred_time": "morning",
                    "difficulty": "hard",
                    "current_streak": 6,
                    "longest_streak": 10,
                    "total_completions": 16
                },
                {
                    "name": "Evening Reflection & Journal",
                    "description": "Review top 3 wins and plan tomorrow",
                    "icon": "pen-tool",
                    "color": "#6366f1",
                    "category": "Personal Growth",
                    "habit_type": "binary",
                    "target_value": 1,
                    "unit": "entry",
                    "frequency_type": "daily",
                    "preferred_time": "evening",
                    "difficulty": "easy",
                    "current_streak": 4,
                    "longest_streak": 9,
                    "total_completions": 18
                }
            ]

            created_habits = []
            for h_info in sample_habits:
                h_obj = Habit(user_id=demo_user.id, **h_info)
                db.add(h_obj)
                created_habits.append(h_obj)
            await db.flush()

            # Seed realistic logs for the past 20 days
            today = datetime.date.today()
            for day_offset in range(19, -1, -1):
                log_day = today - datetime.timedelta(days=day_offset)
                log_date_str = log_day.strftime("%Y-%m-%d")
                
                # If today (offset == 0), log 3 out of 5 to show partial daily progress
                for idx, h_obj in enumerate(created_habits):
                    if day_offset == 0 and idx >= 3:
                        continue  # Keep last 2 incomplete for interactive testing
                    
                    # High completion rate with occasional skip
                    if (day_offset + idx) % 7 != 0 or day_offset < 8:
                        log = HabitLog(
                            habit_id=h_obj.id,
                            user_id=demo_user.id,
                            log_date=log_date_str,
                            completed=True,
                            current_value=h_obj.target_value,
                            completed_at=datetime.datetime.combine(log_day, datetime.time(9 + idx * 2, 15)),
                            xp_awarded=15 if h_obj.difficulty == "hard" else (5 if h_obj.difficulty == "easy" else 10)
                        )
                        db.add(log)

            # Seed Habit Stack
            if len(created_habits) >= 2:
                stack = HabitStack(
                    user_id=demo_user.id,
                    trigger_habit_id=created_habits[0].id,
                    action_habit_id=created_habits[2].id,
                    stack_description="After Morning Workout -> Then Drink 2.5L Water"
                )
                db.add(stack)

            # Unlock initial achievements for demo user
            first_step_ach = (await db.execute(select(Achievement).where(Achievement.code == "first_step"))).scalar_one_or_none()
            week_one_ach = (await db.execute(select(Achievement).where(Achievement.code == "week_one"))).scalar_one_or_none()
            if first_step_ach:
                db.add(UserAchievement(user_id=demo_user.id, achievement_id=first_step_ach.id, is_seen=True))
            if week_one_ach:
                db.add(UserAchievement(user_id=demo_user.id, achievement_id=week_one_ach.id, is_seen=True))

            # Join 1 challenge
            first_chal = (await db.execute(select(Challenge))).scalars().first()
            if first_chal:
                db.add(ChallengeMember(
                    user_id=demo_user.id,
                    challenge_id=first_chal.id,
                    current_day=5,
                    completed_days=4,
                    is_completed=False
                ))

        await db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables & seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DayForge — Build habits. Level yourself. Production Habit & Personal Growth API",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for static avatar serving
os.makedirs(str(settings.UPLOAD_PATH), exist_ok=True)
app.mount("/api/v1/uploads", StaticFiles(directory=str(settings.UPLOAD_PATH)), name="uploads")

from app.api.notifications import router as notifications_router
from fastapi import Request
from fastapi.responses import JSONResponse

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(habits_router, prefix=settings.API_V1_STR)
app.include_router(progress_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(challenges_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

import sys
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_trace = traceback.format_exc()
    print(f"CRITICAL ERROR on {request.method} {request.url.path}:\n{error_trace}", file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Please try again."}
    )

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
