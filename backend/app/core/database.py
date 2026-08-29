import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# If sqlite, pass check_same_thread=False
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
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
_init_lock = asyncio.Lock()

async def ensure_db_initialized():
    global _initialized
    if not _initialized:
        async with _init_lock:
            if not _initialized:
                # Ensure all models are imported so Base.metadata is fully populated
                import app.models.user
                import app.models.habit
                import app.models.gamification
                import app.models.challenge
                import app.models.notification

                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
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
