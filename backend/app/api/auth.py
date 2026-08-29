import os
import shutil
import uuid
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.models.user import User, Profile, UserSettings
from app.models.habit import Habit
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserOut,
    ProfileOut,
    ProfileUpdate,
    UserSettingsOut,
    UserSettingsUpdate,
    PasswordChange,
    OnboardingRequest,
    TokenResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check email uniqueness
    existing_email = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Check username uniqueness
    existing_user = await db.execute(select(User).where(User.username == payload.username.lower()))
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose another."
        )

    # Create User
    new_user = User(
        email=payload.email.lower(),
        username=payload.username.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        is_onboarded=False,
    )
    db.add(new_user)
    await db.flush()

    # Create Default Profile
    profile = Profile(
        user_id=new_user.id,
        avatar_url=payload.avatar_url,
        level=1,
        xp=0,
        current_streak=0,
        longest_streak=0,
        total_habits_completed=0,
        overall_consistency=0,
        available_shields=2,
    )
    db.add(profile)

    # Create Default Settings
    user_settings = UserSettings(
        user_id=new_user.id,
        theme="light",
        week_start_day="monday",
        time_format="12h",
    )
    db.add(user_settings)
    await db.flush()

    # Create JWT Token
    access_token = create_access_token(subject=str(new_user.id))

    # Reload with relationships
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.settings))
        .where(User.id == new_user.id)
    )
    user_full = (await db.execute(query)).scalar_one()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user_full)
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.settings))
        .where(User.email == payload.email.lower())
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled."
        )

    expires_delta = datetime.timedelta(days=30) if payload.remember_me else datetime.timedelta(days=7)
    access_token = create_access_token(subject=str(user.id), expires_delta=expires_delta)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/session", response_model=UserOut)
async def get_session(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.put("/profile", response_model=UserOut)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.username is not None and payload.username.lower() != current_user.username:
        # Check uniqueness
        ex = await db.execute(select(User).where(User.username == payload.username.lower(), User.id != current_user.id))
        if ex.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username is already taken.")
        current_user.username = payload.username.lower()

    if current_user.profile:
        if payload.bio is not None:
            current_user.profile.bio = payload.bio
        if payload.primary_goal is not None:
            current_user.profile.primary_goal = payload.primary_goal
        if payload.focus_areas is not None:
            current_user.profile.focus_areas = payload.focus_areas
        if payload.avatar_url is not None:
            current_user.profile.avatar_url = payload.avatar_url

    await db.flush()
    return UserOut.model_validate(current_user)

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF."
        )

    # Read and check size
    contents = await file.read()
    if len(contents) > settings.MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit."
        )

    # Generate unique filename
    ext = Path(file.filename or "avatar.png").suffix or ".png"
    file_id = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = settings.UPLOAD_PATH / file_id

    # Write file
    with open(dest_path, "wb") as f:
        f.write(contents)

    avatar_url = f"/api/v1/uploads/{file_id}"
    
    if current_user.profile:
        current_user.profile.avatar_url = avatar_url
    await db.flush()

    return {"avatar_url": avatar_url, "message": "Avatar updated successfully."}

@router.delete("/avatar")
async def remove_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.profile:
        current_user.profile.avatar_url = None
    await db.flush()
    return {"message": "Avatar removed successfully."}

@router.post("/password")
async def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match.")
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.flush()
    return {"message": "Password updated successfully."}

@router.post("/onboarding", response_model=UserOut)
async def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.is_onboarded = True
    if current_user.profile:
        current_user.profile.primary_goal = payload.primary_goal
        current_user.profile.focus_areas = ",".join(payload.focus_areas)

    # Create starter habits if provided
    if payload.starter_habits:
        for idx, h_data in enumerate(payload.starter_habits):
            habit = Habit(
                user_id=current_user.id,
                name=h_data.get("name", "New Habit"),
                description=h_data.get("description", ""),
                icon=h_data.get("icon", "sparkles"),
                color=h_data.get("color", "#6366f1"),
                category=h_data.get("category", "General"),
                habit_type=h_data.get("habit_type", "binary"),
                target_value=float(h_data.get("target_value", 1.0)),
                unit=h_data.get("unit"),
                frequency_type=h_data.get("frequency_type", "daily"),
                frequency_days=h_data.get("frequency_days", "0,1,2,3,4,5,6"),
                preferred_time=h_data.get("preferred_time", "anytime"),
                difficulty=h_data.get("difficulty", "medium"),
                sort_order=idx
            )
            db.add(habit)

    await db.flush()
    return UserOut.model_validate(current_user)
