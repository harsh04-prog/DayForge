export interface SmartNotificationQuote {
  title: string;
  message: string;
  icon: string;
  category: 'habits' | 'wellness' | 'routine' | 'progress' | 'reflection' | 'motivation' | 'todo';
}

const HABIT_SMART_MESSAGES: Record<string, { title: string; messages: string[]; icon: string }> = {
  water: {
    title: 'Hydration Check 💧',
    icon: 'droplet',
    messages: [
      'Paani piya kya? 💧 Body ko hydration chahiye boss!',
      'Hydration check! Ek glass paani gatak le jaldi 🥤',
      'Bhai paani peena mat bhool, glowing skin and energy guaranteed ⚡',
      'DayForge reminder: Glass uthao aur paani piyo boss 😄',
      'Hydration time! Grab a fresh glass of water.',
      'Stay energized: Time to hydrate and refuel 💧',
    ],
  },
  fitness: {
    title: 'Movement & Fitness 🏃',
    icon: 'activity',
    messages: [
      'Bhai gym jaana bhoola kya? Ya thoda walk ho jaaye? 🏃',
      'Aalas mat kar yaar, bas 10-15 minute ka workout kar le 🔥',
      'Iron discipline mode on! Let’s get that workout done 💪',
      'Thoda movement ho jaaye? Muscles are calling you ⚡',
      'Workout ka time ho gaya — 10 minutes bhi count karte hain.',
      'Consistency over intensity: Let’s get active!',
    ],
  },
  reading: {
    title: 'Reading Time 📖',
    icon: 'book',
    messages: [
      'Ek page padh le yaar 📖 10 pages today = 1 book this month!',
      'Book open karo boss, brain ko high-leverage food chahiye 🧠',
      'Aaj ke pages baaki hain dost. 5-10 minutes nikal lo 📚',
      'A chapter a day keeps brain fog away 📚',
      'Read 10 pages today to compound your wisdom.',
    ],
  },
  study: {
    title: 'Focus & Study 🧠',
    icon: 'brain',
    messages: [
      'Ek topic complete kar le yaar 🧠 Focus mode on!',
      'Padhai ka time! Silence distractions and let’s conquer today’s study goal 🎯',
      'Bro, aaj ka study goal complete kiya kya? Time to level up 📚',
      'Future self is waiting: 30 minutes of deep study now 💡',
      'Deep work block starting: Silence distractions & win 🎯',
    ],
  },
  walking: {
    title: 'Step Goal Check 🚶',
    icon: 'map-pin',
    messages: [
      'Bhai thoda walk ho jaaye? 🚶 Steps tumhara wait kar rahe hain.',
      'Take a quick fresh-air walk — 1000 steps closer to your daily target!',
      'Step away from the screen for a 5-minute walking reset.',
      'Chalo thoda ghoom aao, mind fresh ho jayega ⚡',
    ],
  },
  sleep: {
    title: 'Night Wind Down 🌙',
    icon: 'moon',
    messages: [
      'Phone rakh de bhai! 🌙 8 hours of deep sleep unlocks maximum energy tomorrow.',
      'Night routine complete karo aur screen off kar do boss 😴',
      'Calm mind, deep sleep. Kal fir se conquer karna hai ⚡',
      'DayForge says: screen thodi der mein band karni hai boss.',
      'Wind down time: Rest deeply for tomorrow’s momentum.',
    ],
  },
  todo: {
    title: 'To-Do Reminder 📝',
    icon: 'check-square',
    messages: [
      'Ye task pending hai boss! ⚡ 5 minute mein nipta do.',
      'To-do reminder: Aaj ka important task complete karne ka time aa gaya 🎯',
      'Bro, ye task check off kar lo aur stress free ho jao!',
      'Quick action: Finish this task and keep your momentum high 🔥',
    ],
  },
  general: {
    title: 'DayForge Check-in ⚡',
    icon: 'zap',
    messages: [
      'Bro, habit ne tumhe yaad kiya. 😭 Kaha gayab ho?',
      'Ek chhota check-in. Kal wala version tumhe thank karega 🚀',
      'Consistency is your superpower! 60 seconds check-in kar lo ⚡',
      '👀 DayForge attendance laga raha hai... habit hui ya nahi?',
      'Small step. Big difference. Aaj ka habit check kar lo.',
      'Your daily streak is waiting for you! Keep the momentum alive 🔥',
    ],
  },
};

export function getSmartHabitNotification(
  habitName?: string,
  habitCategory?: string,
  userName?: string,
  isTodo: boolean = false
): SmartNotificationQuote {
  if (isTodo) {
    const todoGroup = HABIT_SMART_MESSAGES.todo;
    const randomIdx = Math.floor(Math.random() * todoGroup.messages.length);
    return {
      title: habitName ? `Task: ${habitName}` : todoGroup.title,
      message: todoGroup.messages[randomIdx],
      icon: 'check-square',
      category: 'todo',
    };
  }

  const cleanName = (habitName || '').toLowerCase();
  const cleanCat = (habitCategory || '').toLowerCase();

  let selectedGroup = HABIT_SMART_MESSAGES.general;

  if (
    cleanName.includes('water') ||
    cleanName.includes('hydrate') ||
    cleanName.includes('drink') ||
    cleanCat.includes('health')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.water;
  } else if (
    cleanName.includes('workout') ||
    cleanName.includes('exercise') ||
    cleanName.includes('gym') ||
    cleanName.includes('push') ||
    cleanCat.includes('fitness')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.fitness;
  } else if (
    cleanName.includes('read') ||
    cleanName.includes('book') ||
    cleanName.includes('page') ||
    cleanCat.includes('reading')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.reading;
  } else if (
    cleanName.includes('study') ||
    cleanName.includes('code') ||
    cleanName.includes('focus') ||
    cleanCat.includes('study') ||
    cleanCat.includes('productivity')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.study;
  } else if (cleanName.includes('walk') || cleanName.includes('step')) {
    selectedGroup = HABIT_SMART_MESSAGES.walking;
  } else if (
    cleanName.includes('sleep') ||
    cleanName.includes('bed') ||
    cleanName.includes('screen') ||
    cleanCat.includes('sleep')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.sleep;
  }

  const randomIdx = Math.floor(Math.random() * selectedGroup.messages.length);
  let message = selectedGroup.messages[randomIdx];

  if (userName && message.includes('bhai')) {
    message = message.replace('bhai', userName);
  }

  return {
    title: habitName ? `${habitName} · ${selectedGroup.title}` : selectedGroup.title,
    message,
    icon: selectedGroup.icon,
    category: 'habits',
  };
}
