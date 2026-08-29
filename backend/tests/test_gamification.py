import pytest
from app.services.gamification_service import get_level_for_xp, get_level_title

def test_level_calculation_curve():
    # Level 1 at 0 XP
    lvl, title, cur_xp, next_xp, pct = get_level_for_xp(0)
    assert lvl == 1
    assert title == "Beginner"
    assert next_xp == 100
    assert pct == 0

    # Level 2 at 100 XP
    lvl2, title2, cur_xp2, next_xp2, pct2 = get_level_for_xp(100)
    assert lvl2 == 2
    assert cur_xp2 == 100

    # Level 5 at 1000 XP
    lvl5, title5, _, _, _ = get_level_for_xp(1000)
    assert lvl5 >= 4
    assert title5 in ["Apprentice", "Consistent", "Dedicated"]

    # High XP
    lvl_high, title_high, _, _, _ = get_level_for_xp(35000)
    assert lvl_high >= 15

def test_level_titles_monotonic():
    t1 = get_level_title(1)
    t5 = get_level_title(5)
    t10 = get_level_title(10)
    t20 = get_level_title(20)
    t50 = get_level_title(50)

    assert t1 == "Beginner"
    assert t5 == "Consistent"
    assert t10 == "Disciplined"
    assert t20 == "Habit Builder"
    assert t50 == "Master"
