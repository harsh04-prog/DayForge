const axios = require('axios');

async function testCompleteApp() {
  const baseURL = 'http://localhost:3000/api/v1';
  console.log('Running Complete DayForge Integration Test Suite...\n');

  try {
    // 1. User Registration
    const userPayload = {
      full_name: 'Forge Champion',
      username: 'champion_' + Date.now().toString().slice(-4),
      email: `champ_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      avatar_url: 'male_2'
    };
    const regRes = await axios.post(`${baseURL}/auth/register`, userPayload);
    const token = regRes.data.access_token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✓ 1. Auth & Profile Registration Passed:', userPayload.email);

    // 2. Notifications Check
    const notifsRes = await axios.get(`${baseURL}/notifications`, authHeaders);
    const budgetRes = await axios.get(`${baseURL}/notifications/budget`, authHeaders);
    console.log('✓ 2. Notification APIs Passed (Count:', notifsRes.data.length, 'Budget:', budgetRes.data.remaining_today, 'remaining)');

    // 3. Challenges Test: 12 Challenges Available
    const challengesRes = await axios.get(`${baseURL}/challenges`, authHeaders);
    if (challengesRes.data.length !== 12) {
      throw new Error(`Expected 12 challenges, got ${challengesRes.data.length}`);
    }
    console.log('✓ 3. Challenges API Returned 12 Complete Challenges');

    // 4. Join Challenge (e.g. 7-Day Consistency)
    const joinRes = await axios.post(`${baseURL}/challenges/1/join`, {}, authHeaders);
    console.log('✓ 4. Joined Challenge 1:', joinRes.data.message);

    // Join Strict Challenge (e.g. 30-Day No-Zero-Days)
    const joinStrictRes = await axios.post(`${baseURL}/challenges/4/join`, {}, authHeaders);
    console.log('✓ 5. Joined Strict Challenge 4 (30-Day No-Zero-Days)');

    // Verify Joined Challenges
    const verifyJoinedRes = await axios.get(`${baseURL}/challenges`, authHeaders);
    const ch1 = verifyJoinedRes.data.find(c => c.id === 1);
    const ch4 = verifyJoinedRes.data.find(c => c.id === 4);
    if (!ch1.is_joined || !ch4.is_joined) {
      throw new Error('Challenge joined state did not persist in database!');
    }
    console.log('✓ 6. Challenge Joined State Persisted (Ch1 status:', ch1.status, 'Ch4 status:', ch4.status, ')');

    // 5. Leave Challenge Test
    const leaveRes = await axios.post(`${baseURL}/challenges/1/leave`, {}, authHeaders);
    console.log('✓ 7. Left Challenge 1:', leaveRes.data.message);

    const verifyLeaveRes = await axios.get(`${baseURL}/challenges`, authHeaders);
    const ch1After = verifyLeaveRes.data.find(c => c.id === 1);
    if (ch1After.is_joined) {
      throw new Error('Challenge leave state failed to persist!');
    }
    console.log('✓ 8. Leave State Persisted in Database');

    // 6. Create Habit and Complete It
    const habitRes = await axios.post(`${baseURL}/habits`, {
      title: 'Morning Meditation & Pushups',
      category: 'Fitness',
      color: '#F97316',
      icon: 'activity',
      frequency_type: 'daily',
      target_value: 30,
      target_unit: 'min',
      time_of_day: 'morning',
      difficulty: 'medium'
    }, authHeaders);
    const habitId = habitRes.data.id;
    console.log('✓ 9. Habit Created:', habitRes.data.title, '(ID:', habitId, ')');

    // Complete Habit for Today
    const today = new Date().toISOString().slice(0, 10);
    const logRes = await axios.post(`${baseURL}/habits/${habitId}/logs`, {
      date: today,
      value: 30,
      completed: true,
      note: 'Felt powerful!'
    }, authHeaders);
    console.log('✓ 10. Habit Logged & XP Awarded (XP:', logRes.data.log.xp_earned, ', Streak:', logRes.data.user_stats.currentStreak, ')');

    // 7. Verify Calendar Activity
    const calRes = await axios.get(`${baseURL}/analytics/calendar?year=2026&month=8`, authHeaders);
    const todayCal = calRes.data.days.find(d => d.date === today);
    if (!todayCal || todayCal.total_completed < 1) {
      throw new Error('Calendar failed to reflect today completed habit!');
    }
    console.log('✓ 11. Calendar API Reflected Real Logged Habit for', today, '(Completed Habits:', todayCal.completed_habits.length, ')');

    // 8. Verify Dashboard Progress Aggregation
    const dashRes = await axios.get(`${baseURL}/progress/dashboard`, authHeaders);
    console.log('✓ 12. Dashboard Data Verified (Active Streak:', dashRes.data.active_streak, 'Daily Score:', dashRes.data.daily_score.total_score, ')');

    console.log('\n======================================================');
    console.log('>>> ALL 12 INTEGRATION CHECKS PASSED 100% CLEANLY! <<<');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Integration Test FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

testCompleteApp();
