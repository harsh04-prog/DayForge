import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.challenge import Challenge, ChallengeMember
from app.schemas.challenge import ChallengeOut, ChallengeJoinResponse
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/challenges", tags=["Challenges"])

@router.get("/", response_model=List[ChallengeOut])
async def list_challenges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all challenges
    c_res = await db.execute(
        select(Challenge).options(selectinload(Challenge.members)).where(Challenge.is_active == True)
    )
    challenges = c_res.scalars().all()

    # User memberships
    m_res = await db.execute(
        select(ChallengeMember).where(ChallengeMember.user_id == current_user.id)
    )
    user_memberships = {m.challenge_id: m for m in m_res.scalars().all()}

    output = []
    for c in challenges:
        mem = user_memberships.get(c.id)
        is_joined = mem is not None
        is_comp = mem.is_completed if mem else False
        cur_day = mem.current_day if mem else 0
        comp_days = mem.completed_days if mem else 0
        prog_pct = int(min(100, (comp_days / max(1, c.duration_days)) * 100)) if mem else 0

        c_out = ChallengeOut(
            id=c.id,
            title=c.title,
            description=c.description,
            category=c.category,
            icon=c.icon,
            duration_days=c.duration_days,
            xp_reward=c.xp_reward,
            badge_name=c.badge_name,
            required_habit_category=c.required_habit_category,
            daily_target_completions=c.daily_target_completions,
            is_active=c.is_active,
            is_official=c.is_official,
            is_joined=is_joined,
            is_completed=is_comp,
            current_day=cur_day,
            completed_days=comp_days,
            progress_percentage=prog_pct,
            member_count=len(c.members)
        )
        output.append(c_out)

    return output

@router.post("/{challenge_id}/join", response_model=ChallengeJoinResponse)
async def join_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    c_res = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = c_res.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    m_res = await db.execute(
        select(ChallengeMember).where(
            ChallengeMember.challenge_id == challenge_id,
            ChallengeMember.user_id == current_user.id
        )
    )
    existing = m_res.scalar_one_or_none()
    if existing:
        return ChallengeJoinResponse(
            success=True,
            challenge_id=challenge_id,
            is_joined=True,
            message="You are already participating in this challenge!"
        )

    new_member = ChallengeMember(
        user_id=current_user.id,
        challenge_id=challenge_id,
        current_day=1,
        completed_days=0,
        is_completed=False,
    )
    db.add(new_member)
    await db.flush()

    return ChallengeJoinResponse(
        success=True,
        challenge_id=challenge_id,
        is_joined=True,
        message=f"Successfully joined '{challenge.title}'! Complete your daily habit to progress."
    )

@router.post("/{challenge_id}/leave", response_model=ChallengeJoinResponse)
async def leave_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m_res = await db.execute(
        select(ChallengeMember).where(
            ChallengeMember.challenge_id == challenge_id,
            ChallengeMember.user_id == current_user.id
        )
    )
    existing = m_res.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=400, detail="You are not a member of this challenge.")

    await db.delete(existing)
    await db.flush()

    return ChallengeJoinResponse(
        success=True,
        challenge_id=challenge_id,
        is_joined=False,
        message="Left the challenge."
    )
