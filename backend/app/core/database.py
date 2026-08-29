import asyncio
from typing import AsyncGenerator
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.future import select
from app.core.config import settings

# If sqlite, configure connection args for serverless concurrency
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 30

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

_initialized = False

async def seed_initial_achievements(db: AsyncSession):
    from app.models.gamification import Achievement
    existing = await db.execute(select(Achievement).limit(1))
    if existing.scalar_one_or_none() is not None:
        return

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
            "name": "Century Club",
            "description": "Complete 100 total habit check-ins.",
            "icon": "award",
            "category": "milestones",
            "xp_reward": 1000,
            "required_count": 100,
            "badge_tier": "platinum"
        }
    ]
    for ach in achievements_data:
        db.add(Achievement(**ach))
    await db.commit()

async def ensure_db_initialized():
    global _initialized
    if not _initialized:
        # Import all models to ensure Base.metadata contains all tables
        import app.models.user
        import app.models.habit
        import app.models.gamification
        import app.models.challenge
        import app.models.notification

        async with engine.begin() as conn:
            if "sqlite" in settings.DATABASE_URL:
                await conn.exec_driver_sql("PRAGMA journal_mode=DELETE;")
                await conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")
            await conn.run_sync(Base.metadata.create_all)

        # Seed achievements if needed
        async with AsyncSessionLocal() as session:
            try:
                await seed_initial_achievements(session)
            except Exception as e:
                print(f"Initial seed notice: {e}")

        _initialized = True

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    await ensure_db_initialized()
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
