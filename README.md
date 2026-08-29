# DayForge — Production Habit & Personal Growth Platform

> **"Build habits. Level yourself."**  
> DayForge is a production-grade personal growth and habit-tracking application designed as a character-sheet progression system for real life.

---

## 🌟 Key Features

1. **Character Progression Loop**:
   - **Set Goal $\rightarrow$ Complete Habit $\rightarrow$ Earn XP $\rightarrow$ Maintain Streak $\rightarrow$ Unlock Achievement $\rightarrow$ Level Up $\rightarrow$ Return Tomorrow**.
   - Level milestones: Level 1 Beginner, Level 3 Apprentice, Level 5 Consistent, Level 10 Disciplined, Level 20 Habit Builder, Level 50 Master.
   - Anti-farming transaction ledger: safely reverses XP and streak on undo without generating negative artifacts or duplicate rewards.

2. **Reliable Streak Engine & Streak Shields**:
   - Algorithmic daily and custom weekday streak calculations.
   - Streak Shield protection mechanism: prevents broken streaks on qualified missed days.
   - Pure algorithmic consistency scoring (0–100%) and daily focus index.

3. **Habit Architecture & Stacking**:
   - Binary ("Yes/No") and Quantitative measured habits (pages, minutes, liters, reps, tasks).
   - Dynamic steppers and sliders for instant logging.
   - **Habit Stacking**: Connect anchor trigger habits to new action habits ("After X $\rightarrow$ Then Y").

4. **Behavioral Matrix & Insights**:
   - 365-Day GitHub-style Yearly Consistency Heatmap.
   - 7-Day Completion Velocity Charts (Recharts).
   - Category distribution tracking (Fitness, Reading, Health, Productivity, Study, Sleep, Personal Growth).
   - Peak productivity analytics: detects your best execution days and peak completion hours from real timestamp data.

5. **Automated Weekly Reviews & Smart Recommendations**:
   - Generates automated weekly report cards with completion rates, best habits, and habits needing attention.
   - Data-backed actionable recommendations (detects routine overload when active habits $\ge 8$, celebrates long momentum, suggests rebound actions on missed days).

6. **Challenges & Quests**:
   - Joinable structured sprints (7-Day Reading Sprint, 30-Day Fitness Odyssey, 14-Day Hydration Hero, 21-Day Mindful Focus) with bonus XP rewards.

7. **Security & Authentication**:
   - Secure JWT tokens with bcrypt password hashing.
   - Session persistence and full user data isolation.
   - Avatar image upload with file type/size validation and static hosting.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Canvas Confetti.
- **Backend**: FastAPI (Python 3.13), SQLAlchemy 2.0 Async ORM, Pydantic v2, PyJWT, Passlib / Bcrypt.
- **Database**: PostgreSQL ready with automatic SQLite (`sqlite+aiosqlite`) zero-friction fallback.

---

## 🚀 Running the Application

### 1. Backend
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 5050
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Running Automated Tests
```bash
cd backend
.\.venv\Scripts\pytest -v
```
All 11 automated test suites cover streak engines, XP level curves, authentication, habit creation, completion, and undo.

---

## 🔑 Demo Account
- **Email**: `alex@dayforge.com`
- **Password**: `dayforge123`
Or click **"1-Click Demo Preview"** on the Welcome / Login screens to instantly explore the pre-seeded 20-day historical heatmap, level 6 character stats, active streak, and achievements!
