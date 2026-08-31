const axios = require('axios');

async function testNotifications() {
  const baseURL = 'http://localhost:3000/api/v1';
  console.log('Testing DayForge Next.js Notification Endpoints...');

  try {
    // 1. Authenticate / Login or Register a test user
    const testUser = {
      full_name: 'Notification Tester',
      username: 'notif_user_' + Date.now().toString().slice(-4),
      email: `notif_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      avatar_url: 'male_1'
    };
    const regRes = await axios.post(`${baseURL}/auth/register`, testUser);
    const token = regRes.data.access_token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('1. User Authenticated:', testUser.email);

    // 2. Test GET /notifications
    const notifsRes = await axios.get(`${baseURL}/notifications`, authHeaders);
    console.log('2. GET /notifications -> 200 OK, count:', notifsRes.data.length);

    // 3. Test GET /notifications/budget
    const budgetRes = await axios.get(`${baseURL}/notifications/budget`, authHeaders);
    console.log('3. GET /notifications/budget -> 200 OK:', budgetRes.data);

    // 4. Test POST /notifications/test (create a test reminder)
    const testNotifRes = await axios.post(`${baseURL}/notifications/test`, {}, authHeaders);
    console.log('4. POST /notifications/test -> 200 OK, id:', testNotifRes.data.id, 'title:', testNotifRes.data.title);

    const notifId = testNotifRes.data.id;

    // 5. Test POST /notifications/:id/read
    const readRes = await axios.post(`${baseURL}/notifications/${notifId}/read`, {}, authHeaders);
    console.log('5. POST /notifications/:id/read -> 200 OK:', readRes.data);

    // 6. Test POST /notifications/:id/snooze
    const snoozeRes = await axios.post(`${baseURL}/notifications/${notifId}/snooze`, { minutes: 30 }, authHeaders);
    console.log('6. POST /notifications/:id/snooze -> 200 OK:', snoozeRes.data);

    // 7. Test POST /notifications/mark-all-read
    const markAllRes = await axios.post(`${baseURL}/notifications/mark-all-read`, {}, authHeaders);
    console.log('7. POST /notifications/mark-all-read -> 200 OK:', markAllRes.data);

    // 8. Test POST /notifications/:id/dismiss
    const dismissRes = await axios.post(`${baseURL}/notifications/${notifId}/dismiss`, {}, authHeaders);
    console.log('8. POST /notifications/:id/dismiss -> 200 OK:', dismissRes.data);

    console.log('\n>>> ALL NOTIFICATION ENDPOINTS WORKING 100% WITH ZERO 404s! <<<');
  } catch (error) {
    console.error('Test FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

testNotifications();
