from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.analytics import HeatmapResponse, WeeklyReviewOut, RecommendationOut, CategoryBreakdown, TrendPoint
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    days: int = 365,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_heatmap(db, current_user.id, days_count=days)

@router.get("/insights")
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_insights_and_trends(db, current_user.id)

@router.get("/weekly-review", response_model=WeeklyReviewOut)
async def get_weekly_review(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_weekly_review(db, current_user.id)

@router.get("/recommendations", response_model=List[RecommendationOut])
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_smart_recommendations(db, current_user.id)
