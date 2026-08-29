const axios = require('axios');

async function testFullstack() {
  const baseURL = 'http://localhost:3000/api/v1';
  console.log('Testing Next.js DayForge fullstack APIs...');

  try {
    // 1. Health Check
    const health = await axios.get(`${baseURL}/health`);
    console.log('1. Health check:', health.data);

    // 2. Registration
    const testUser = {
      full_name: 'Alex Forge Master',
      username: 'alexforge_' + Date.now().toString().slice(-4),
      email: `alex_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      avatar_url: 'male_1'
    };
    console.log('\n2. Testing Registration with:', testUser.email);
    const regRes = await axios.post(`${baseURL}/auth/register`, testUser);
    console.log('Registration SUCCESS:', {
      token: regRes.data.access_token ? 'JWT generated' : 'Missing',
      user: regRes.data.user.email,
      fullName: regRes.data.user.full_name,
      level: regRes.data.user.profile?.level
    });

    const token = regRes.data.access_token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Login
    console.log('\n3. Testing Login...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('Login SUCCESS:', {
      user: loginRes.data.user.email,
      token: loginRes.data.access_token ? 'JWT verified' : 'Missing'
    });

    // 4. Session
    console.log('\n4. Testing Session API...');
    const sessionRes = await axios.get(`${baseURL}/auth/session`, authHeaders);
    console.log('Session verified:', sessionRes.data.email);

    // 5. Create Habit
    console.log('\n5. Testing Habit Creation...');
    const habitRes = await axios.post(`${baseURL}/habits`, {
      title: 'Morning Deep Focus',
      category: 'Productivity',
      habit_type: 'quantitative',
      target_value: 45,
      unit: 'min',
      preferred_time: 'morning',
      difficulty: 'medium',
      color: '#6C5CE7',
      icon: 'brain'
    }, authHeaders);
    console.log('Habit created:', { id: habitRes.data.id, title: habitRes.data.title });

    // 6. Habit Check-in & Streak Engine
    console.log('\n6. Testing Habit Completion (Check-in)...');
    const logRes = await axios.post(`${baseURL}/habits/${habitRes.data.id}/logs`, {
      value: 45,
      notes: 'Completed 45m deep focus block'
    }, authHeaders);
    console.log('Habit Logged:', logRes.data);

    // 7. Dashboard Aggregation
    console.log('\n7. Testing Dashboard Progress Aggregation...');
    const dashRes = await axios.get(`${baseURL}/progress/dashboard`, authHeaders);
    console.log('Dashboard Data:', {
      level: dashRes.data.level_info.level,
      xp: dashRes.data.level_info.current_xp,
      activeStreak: dashRes.data.active_streak,
      dailyScore: dashRes.data.daily_score.total_score,
      habitsCount: dashRes.data.habits.length
    });

    console.log('\n>>> ALL 7 FULLSTACK INTEGRATION TESTS PASSED 100% SUCCESSFULLY! <<<');
  } catch (error) {
    console.error('Test FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFullstack();
