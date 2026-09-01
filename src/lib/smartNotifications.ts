export interface SmartNotificationQuote {
  title: string;
  message: string;
  icon: string;
  category: 'habits' | 'wellness' | 'routine' | 'progress' | 'reflection' | 'motivation';
}

const HABIT_SMART_MESSAGES: Record<string, { title: string; messages: string[]; icon: string }> = {
  water: {
    title: 'Hydration Check 💧',
    icon: 'droplet',
    messages: [
      '💧 Paani piya kya?',
      'Hydration check 💧 Ek glass paani ho jaaye?',
      'Body ko paani chahiye boss 😄',
      'Hydration time! Grab a fresh glass of water.',
      'Stay energized: Time to hydrate and refuel 💧',
    ],
  },
  fitness: {
    title: 'Movement & Fitness 🏃',
    icon: 'activity',
    messages: [
      '🏃 Thoda movement ho jaaye?',
      'Workout ka time ho gaya — 10 minutes bhi count karte hain.',
      'Iron discipline: Time for today’s movement sprint! ⚡',
      'Move your body, sharpen your mind.',
      'Consistency over intensity: Let’s get active!',
    ],
  },
  reading: {
    title: 'Reading Time 📖',
    icon: 'book',
    messages: [
      '📖 Aaj ke pages baaki hain. Bas 10 minutes?',
      'Read 10 pages today to compound your wisdom.',
      'A chapter a day keeps brain fog away 📚',
      'Feed your mind before the day ends.',
    ],
  },
  study: {
    title: 'Focus & Study 🧠',
    icon: 'brain',
    messages: [
      '🧠 Focus mode? Aaj ka study goal complete karte hain.',
      'Deep work block starting: Silence distractions & win 🎯',
      'One focused study session compounds forever.',
      'Time to forge mastery in your study session!',
    ],
  },
  walking: {
    title: 'Step Goal Check 🚶',
    icon: 'map-pin',
    messages: [
      '🚶 Thoda walk ho jaaye? Steps tumhara wait kar rahe hain.',
      'Take a quick fresh-air walk — 1000 steps closer to your goal!',
      'Step away from the screen for a 5-minute movement break.',
    ],
  },
  sleep: {
    title: 'Night Wind Down 🌙',
    icon: 'moon',
    messages: [
      '🌙 DayForge says: screen thodi der mein band karni hai boss.',
      'Wind down time: Rest deeply for tomorrow’s momentum.',
      'Protect your sleep routine to wake up fully charged ⚡',
    ],
  },
  general: {
    title: 'DayForge Check-in ⚡',
    icon: 'zap',
    messages: [
      'Small step. Big difference. Aaj ka habit check kar lo.',
      '👀 DayForge attendance laga raha hai... habit hui ya nahi?',
      'Bro, habit ne tumhe yaad kiya. 😭',
      'Ek chhota check-in. Kal wala version tumhe thank karega.',
      'Consistency is your superpower. Take 60 seconds now ⚡',
      'Your daily streak is waiting for you! Keep the momentum alive 🔥',
    ],
  },
};

export function getSmartHabitNotification(habitName?: string, habitCategory?: string, userName?: string): SmartNotificationQuote {
  const cleanName = (habitName || '').toLowerCase();
  const cleanCat = (habitCategory || '').toLowerCase();

  let selectedGroup = HABIT_SMART_MESSAGES.general;

  if (cleanName.includes('water') || cleanName.includes('hydrate') || cleanName.includes('drink') || cleanCat.includes('health')) {
    selectedGroup = HABIT_SMART_MESSAGES.water;
  } else if (cleanName.includes('workout') || cleanName.includes('exercise') || cleanName.includes('gym') || cleanName.includes('push') || cleanCat.includes('fitness')) {
    selectedGroup = HABIT_SMART_MESSAGES.fitness;
  } else if (cleanName.includes('read') || cleanName.includes('book') || cleanName.includes('page') || cleanCat.includes('reading')) {
    selectedGroup = HABIT_SMART_MESSAGES.reading;
  } else if (cleanName.includes('study') || cleanName.includes('code') || cleanName.includes('focus') || cleanCat.includes('study') || cleanCat.includes('productivity')) {
    selectedGroup = HABIT_SMART_MESSAGES.study;
  } else if (cleanName.includes('walk') || cleanName.includes('step')) {
    selectedGroup = HABIT_SMART_MESSAGES.walking;
  } else if (cleanName.includes('sleep') || cleanName.includes('bed') || cleanName.includes('screen') || cleanCat.includes('sleep')) {
    selectedGroup = HABIT_SMART_MESSAGES.sleep;
  }

  const randomIdx = Math.floor(Math.random() * selectedGroup.messages.length);
  let message = selectedGroup.messages[randomIdx];

  if (userName && message.includes('Harsh')) {
    message = message.replace('Harsh', userName);
  }

  return {
    title: habitName ? `${habitName} · ${selectedGroup.title}` : selectedGroup.title,
    message,
    icon: selectedGroup.icon,
    category: 'habits',
  };
}
