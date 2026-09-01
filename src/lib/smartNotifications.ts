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
      'Bhai paani peena mat bhool, energy level high rahega ⚡',
      'DayForge reminder: Glass uthao aur paani piyo boss 😄',
      'Water break time: Stay hydrated and energized 💧',
      'Paani peena zaroori hai! Refill your bottle now 🧊',
    ],
  },
  fitness: {
    title: 'Movement & Fitness 🏃',
    icon: 'activity',
    messages: [
      'Bhai gym jaana bhoola kya? Ya thoda workout ho jaaye? 🏃',
      'Aalas mat kar yaar, bas 15-20 minute ka workout kar le 🔥',
      'Iron discipline mode on! Let’s get that fitness goal done 💪',
      'Thoda movement ho jaaye? Muscles are calling you ⚡',
      'Consistency over intensity: Time for today’s workout sprint 🏋️',
      'Workout ka time ho gaya — 15 minutes bhi count karte hain 🔥',
    ],
  },
  reading: {
    title: 'Reading Time 📖',
    icon: 'book',
    messages: [
      'Ek page padh le yaar 📖 10 pages today = 1 book this month!',
      'Book open karo boss, brain ko high-leverage food chahiye 🧠',
      'Aaj ke pages baaki hain dost. 5-10 minutes nikal lo 📚',
      'A chapter a day keeps brain fog away 📖',
      'Feed your mind before the day ends: Open your book 📚',
      'Wisdom compounds daily! Time for a quick reading session 💡',
    ],
  },
  study: {
    title: 'Focus & Study 🧠',
    icon: 'brain',
    messages: [
      'Ek topic complete kar le yaar 🧠 Focus mode on!',
      'Padhai ka time! Silence distractions and conquer today’s study goal 🎯',
      'Bro, aaj ka study target complete kiya kya? Time to level up 📚',
      'Future self is waiting: 30 minutes of deep study now 💡',
      'One focused study session compounds forever 🧠',
      'Padhai shuru karo! 25 minutes of deep focus timer on ⏱️',
    ],
  },
  health: {
    title: 'Health & Wellness 🌱',
    icon: 'heart',
    messages: [
      'Health first boss! 🥗 Aaj ka healthy routine complete kiya kya?',
      'Bhai daily vitamins & healthy nutrition lena mat bhoolna 💊',
      'Your body is your temple: Keep your health habits locked in 🥑',
      'Self-care check! 5 minutes for your health routine 🌱',
      'Healthy habits = unstoppable energy. Let’s do this ⚡',
      'Nourish yourself today: Consistency in health compounds 🍏',
    ],
  },
  mindfulness: {
    title: 'Mindfulness & Growth 🧘',
    icon: 'sparkles',
    messages: [
      '2 minute shaant baith jao yaar 🧘 Mind reset zaroori hai!',
      'Meditation & mindfulness time: Breathe in clarity, exhale stress ✨',
      'Gratitude check: Write down 1 good thing about today 📝',
      'Mental peace is a superpower. Take a 5-minute breather 🌿',
      'Center your mind: Daily reflection routine is ready for you 🧘',
      'Breathe deeply: Relax your shoulders and reset your focus ✨',
    ],
  },
  productivity: {
    title: 'Deep Work & Career 🎯',
    icon: 'zap',
    messages: [
      'Deep work mode on! 🎯 Aaj ka primary task niptate hain.',
      'Bro, distraction band karo aur 30 minutes full focus lock in karo 🚀',
      'Career progression starts with daily micro-wins! Let’s conquer this 💻',
      'High-leverage action time: Time to execute your goals 🔥',
      'No zero days: Level up your career and projects today ⚡',
      'Discipline = Freedom. Execute your top priority now 🎯',
    ],
  },
  walking: {
    title: 'Step Goal Check 🚶',
    icon: 'map-pin',
    messages: [
      'Bhai thoda walk ho jaaye? 🚶 Steps tumhara wait kar rahe hain.',
      'Take a quick fresh-air walk — 1000 steps closer to your daily target!',
      'Step away from the screen for a 5-minute walking reset 🌿',
      'Chalo thoda ghoom aao, fresh air and clear mind guaranteed ⚡',
    ],
  },
  sleep: {
    title: 'Night Wind Down 🌙',
    icon: 'moon',
    messages: [
      'Phone rakh de bhai! 🌙 8 hours of deep sleep unlocks maximum energy tomorrow.',
      'Night routine complete karo aur screen off kar do boss 😴',
      'Calm mind, deep sleep. Kal fir se conquer karna hai ⚡',
      'DayForge says: screen thodi der mein band karni hai boss 🌙',
      'Wind down time: Rest deeply for tomorrow’s momentum 😴',
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
    title: 'Habit Check-in ⚡',
    icon: 'zap',
    messages: [
      'Bhai "{habitName}" karna bhi zaroori hai! ⚡ 2 minutes nikal lo.',
      '"{habitName}" check-in time! Kal wala version tumhe thank karega 🚀',
      'Consistency is your superpower! Let’s complete "{habitName}" today 🔥',
      '👀 DayForge attendance laga raha hai... "{habitName}" hui ya nahi?',
      'Bro, "{habitName}" ne tumhe yaad kiya! Quick check-in kar lo ⚡',
      'Small micro-step for "{habitName}" keeps your streak locked in 🏆',
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

  const name = (habitName || '').trim();
  const cleanName = name.toLowerCase();
  const cleanCat = (habitCategory || '').toLowerCase();

  let selectedGroup: { title: string; messages: string[]; icon: string };

  // 1. Water / Hydration (ONLY when name or category specifically references water/hydration)
  if (
    cleanName.includes('water') ||
    cleanName.includes('hydrate') ||
    cleanName.includes('paani') ||
    cleanCat === 'water' ||
    cleanCat === 'hydration'
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.water;
  }
  // 2. Fitness / Gym / Workout / Exercise
  else if (
    cleanName.includes('workout') ||
    cleanName.includes('gym') ||
    cleanName.includes('exercise') ||
    cleanName.includes('pushup') ||
    cleanName.includes('run') ||
    cleanName.includes('train') ||
    cleanName.includes('lift') ||
    cleanCat.includes('fitness')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.fitness;
  }
  // 3. Reading / Books
  else if (
    cleanName.includes('read') ||
    cleanName.includes('book') ||
    cleanName.includes('page') ||
    cleanName.includes('novel') ||
    cleanCat.includes('reading')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.reading;
  }
  // 4. Study / Learning / Courses / Revision
  else if (
    cleanName.includes('study') ||
    cleanName.includes('learn') ||
    cleanName.includes('revision') ||
    cleanName.includes('exam') ||
    cleanName.includes('homework') ||
    cleanCat.includes('study')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.study;
  }
  // 5. Mindfulness / Meditation / Gratitude / Journal / Personal Growth
  else if (
    cleanName.includes('meditat') ||
    cleanName.includes('gratitude') ||
    cleanName.includes('journal') ||
    cleanName.includes('mindful') ||
    cleanName.includes('breathe') ||
    cleanCat.includes('growth') ||
    cleanCat.includes('mindful')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.mindfulness;
  }
  // 6. Walking / Steps
  else if (cleanName.includes('walk') || cleanName.includes('step')) {
    selectedGroup = HABIT_SMART_MESSAGES.walking;
  }
  // 7. Sleep / Night
  else if (
    cleanName.includes('sleep') ||
    cleanName.includes('bed') ||
    cleanName.includes('night') ||
    cleanCat.includes('sleep')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.sleep;
  }
  // 8. Productivity / Career / Deep Work
  else if (
    cleanName.includes('code') ||
    cleanName.includes('work') ||
    cleanName.includes('project') ||
    cleanCat.includes('productivity') ||
    cleanCat.includes('career')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.productivity;
  }
  // 9. General Health / Vitamins / Nutrition
  else if (
    cleanName.includes('vitamin') ||
    cleanName.includes('diet') ||
    cleanName.includes('nutrition') ||
    cleanName.includes('meal') ||
    cleanCat.includes('health')
  ) {
    selectedGroup = HABIT_SMART_MESSAGES.health;
  }
  // 10. Generic Dynamic Fallback with Habit's Actual Name
  else {
    selectedGroup = HABIT_SMART_MESSAGES.general;
  }

  const randomIdx = Math.floor(Math.random() * selectedGroup.messages.length);
  let rawMessage = selectedGroup.messages[randomIdx];

  // Dynamically inject habit name into general templates
  const displayHabitName = name || 'Daily Habit';
  let formattedMessage = rawMessage.replace(/\{habitName\}/g, displayHabitName);

  if (userName && formattedMessage.includes('bhai')) {
    formattedMessage = formattedMessage.replace('bhai', userName);
  }

  return {
    title: name ? `${name} · ${selectedGroup.title}` : selectedGroup.title,
    message: formattedMessage,
    icon: selectedGroup.icon,
    category: 'habits',
  };
}
