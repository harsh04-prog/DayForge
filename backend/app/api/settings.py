from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserSettings
from app.schemas.user import UserSettingsOut, UserSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings & Preferences"])

@router.get("/", response_model=UserSettingsOut)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = res.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        await db.flush()
    return UserSettingsOut.model_validate(settings)

@router.put("/", response_model=UserSettingsOut)
async def update_settings(
    payload: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = res.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            setattr(settings, field, val)

    await db.flush()
    return UserSettingsOut.model_validate(settings)
