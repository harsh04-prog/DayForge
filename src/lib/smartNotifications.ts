export interface SmartNotificationQuote {
  title: string;
  message: string;
  icon: string;
  category: 'habits' | 'wellness' | 'routine' | 'progress' | 'reflection' | 'motivation' | 'todo';
}

export interface SmartNotificationData {
  title: string;
  message: string;
  icon: string;
}

// Swiggy / Zomato / CRED style witty Hinglish content bank (at least 8-10 variations per category)
export const NOTIFICATION_CONTENT_BANK: Record<
  string,
  { title: string; messages: string[]; icon: string }
> = {
  health: {
    title: 'Hydration & Health 💧',
    icon: 'droplets',
    messages: [
      'Bhai paani pi le, dehydration se glow nahi aayega 💧',
      'Paani peena bhool gaye? Ek glass gatak lo jaldi, body will thank you! 🥤',
      'Chai-coffee thik hai dost, par paani kaun piyega? Drink up! 🧊',
      'Plants bhi paani bina murjha jaate hain, aur tu toh insaan hai. Hydrate now! 🌱',
      'Hydration check: Glass uthao, bottle bharo, aur pee jao! 💧⚡',
      'Water break le lo boss! Dimag ko 100% cooling chahiye 🧠💦',
      'Khali pet aur bina paani ke productive banna impossible hai. Drink water now!',
      'Ek sip aur ek streak — dono miss mat hone do! Paani piyo jaldi 💧',
      'Reminder from your future self: Aaj paani pi lo, kal headache nahi hoga! 🥤',
      'Thoda paani pi lo yaar, kidney dua degi! 🧊',
    ],
  },
  fitness: {
    title: 'Fitness & Workout 🏋️',
    icon: 'flame',
    messages: [
      'Dumbbell bula rahe hain, aur tu phone chala raha hai? Uth ja gym ke liye! 🏋️',
      'Excuses burn 0 calories bro. 20 minute ka workout kar le jaldi! 🔥',
      'Bhai gym ka outfit pehankar reel mat dekh, ab workout start kar! 💪',
      'Post-workout dopamine hit chahiye ya guilt? Choose wisely, start now! ⚡',
      'Aaj workout miss kiya toh body kal complaint karegi. Let’s crush it! 🏃',
      'Aalas ko side me rakho aur thode pushups laga lo champ! 💥',
      'Shape me aana hai ya bas gym memberships renew karni hai? Hit the workout! 🏋️‍♂️',
      'Consistency is the king! Sirf 15 minute ka sprint bhi count hota hai 🔥',
      'Cardio time boss! Thoda paseena baha le, confidence double ho jayega 🏃‍♂️',
      'Iron discipline mode ON. Aaj ka fitness goal niptao jaldi! 🏆',
    ],
  },
  study: {
    title: 'Focus & Reading 📚',
    icon: 'book-open',
    messages: [
      'Phone chhod aur 20 panne padh le. Gyan hi shakti hai dost! 📚',
      'Book open karo boss, brain ko high-leverage food chahiye 🧠📖',
      'Netflix kal bhi yahi rahega, pehle aaj ka study target finish kar le! 🎯',
      'One chapter a day keeps brain fog away. Padhai shuru karo champ! 📖',
      'Reel scroll karne se degree nahi milegi, kitabein bula rahi hain! 📚⚡',
      'Ek topic lock in karo. 25 minutes deep focus, zero phone check! 💡',
      'Knowledge compounds daily! 10 pages today = 1 complete book this month 📖',
      'Bro, aaj ka study goal bacha hai. Table pe aao aur focus karo! 🎯',
      'Future leader banna hai toh padhai toh karni padegi. Let’s study! 🧠',
      'Padhai ka timer start karo: 30 minutes of undisturbed deep study ⏱️',
    ],
  },
  sleep: {
    title: 'Sleep & Night Recovery 🌙',
    icon: 'moon',
    messages: [
      'Raat ke 11 baj gaye hain. Screen band kar aur so ja champ! 😴',
      'Reels subah bhi wahin rahengi dost, dark circles kal subah aa jayenge. So jao! 🌙',
      'Bedtime alert: Dimag ka off button dabao aur restorative sleep lo 💤',
      'Night owl banna band karo, kal subah productive day wait kar raha hai! 🛌',
      'Sleep is your superpower. Put the phone down and close your eyes now 😴✨',
      '8 ghante ki sleep = 100% mental clarity. Good night boss! 🌙',
      'Charging sirf phone ko nahi, tumhari body ko bhi chahiye. So jao jaldi! 🔋',
      'Sleep schedule fix karoge toh streaks automatically badhengi. Sweet dreams! 🌟',
      'Late night overthinking cancel karo, pillow pe sir rakho aur relax karo 💤',
      'Sleep debt badhta ja raha hai boss. Wrap up everything and hit the bed! 😴',
    ],
  },
  mindfulness: {
    title: 'Mindfulness & Mental Peace 🧘',
    icon: 'sparkles',
    messages: [
      'Take a deep breath. 5 minute shaanti se baitho, dimaag reset karo 🧘',
      'Overthinking pause karo boss. 3 deep breaths lo aur present moment me aao ✨',
      'Breathe in clarity, breathe out stress. Aaj ka mindfulness check-in karo 🌿',
      'Gratitude check: Aaj ka ek achha pal yaad karo aur smile karo 😊',
      'World fast chal raha hai, tum 2 minute ke liye slow down ho jao 🧘‍♂️',
      'Mental reset time: Apne shoulders relax karo, jaw unclench karo aur saans lo 🌿',
      'Peace of mind is luxury. 5 minutes of quiet time right now ✨',
      'Thoda pause lo dost. Hustle ke beech sukoon zaroori hai 🕊️',
      'Mindful moment: Screen se aankhein hatao aur bahar dekho thodi der 🍃',
      'Breathe deeply: Inhale confidence, exhale all doubts. You got this! 🧘',
    ],
  },
  productivity: {
    title: 'Productivity & Deep Work ⚡',
    icon: 'zap',
    messages: [
      'Target achieve karna hai ya bas sochna hai? Let’s finish this task! ⚡',
      'Procrastination ko tata bye-bye bolo aur agla task complete karo! 🚀',
      'High-leverage action time: Tab band karo, deep work shuru karo! 💻',
      'Aadha ghanta bina distraction ke kaam kar lo, relief alag level hoga 🎯',
      'Bro, "kal karunga" wali date calendar me exist nahi karti. Do it now! 🔥',
      'Checklist pe strike marne ka maza hi alag hai. Finish that pending task! ⚡',
      'Focus mode activated! Distractions zero, execution 100% 🚀',
      'Small daily wins make legendary careers. Today’s task is waiting! 💼',
      'Kaam khatam karo aur shaam ko guilt-free chill karo boss! 🎯',
      'Discipline = Freedom. Ek important task complete karo aur XP kama lo! 🔥',
    ],
  },
};

const GENERIC_HABIT_TEMPLATES: string[] = [
  'Hey {name}! {habitName} ka time ho gaya hai — ek checkmark aur streak bachao! 🔥',
  'Kahan busy ho {name}? {habitName} tumhara wait kar raha hai, jaldi niptao! ⚡',
  '{name}, streak tutne mat dena! {habitName} complete karo aur XP paao 🏆',
  'Ek micro-win for today: {habitName}! Bas 2 minute lagenge, complete it now! 🚀',
  'Discipline test alert! Kya aap aaj {habitName} complete karenge? Let’s go! 💪',
  '{name} ji, reminder aaya hai: {habitName} finish karke relax karo 🎯',
  'Consistency streak is on the line: {habitName} is waiting for you! 🌟',
  'Level up yourself! {habitName} complete karo aur leaderboard pe aage badho ⚡',
  'Aaj ka commitment yaad hai na {name}? {habitName} mark karke dikhao! 🔥',
  'Don’t break the chain! Complete {habitName} right now and level up! 🛡️',
];

export function getWittyNotification(
  habitOrTaskTitle: string,
  category?: string,
  userName: string = 'Friend'
): SmartNotificationData {
  const cleanTitle = (habitOrTaskTitle || '').trim();
  const lower = cleanTitle.toLowerCase();
  const catLower = (category || '').toLowerCase();

  let matchedGroup: { title: string; messages: string[]; icon: string } | null = null;

  if (
    lower.includes('water') ||
    lower.includes('paani') ||
    lower.includes('drink') ||
    lower.includes('hydrat') ||
    lower.includes('liquid') ||
    catLower.includes('health')
  ) {
    matchedGroup = NOTIFICATION_CONTENT_BANK.health;
  } else if (
    lower.includes('gym') ||
    lower.includes('workout') ||
    lower.includes('run') ||
    lower.includes('exercise') ||
    lower.includes('pushup') ||
    lower.includes('fitness') ||
    catLower.includes('fitness')
  ) {
    matchedGroup = NOTIFICATION_CONTENT_BANK.fitness;
  } else if (
    lower.includes('read') ||
    lower.includes('book') ||
    lower.includes('study') ||
    lower.includes('page') ||
    lower.includes('learn') ||
    catLower.includes('reading') ||
    catLower.includes('study')
  ) {
    matchedGroup = NOTIFICATION_CONTENT_BANK.study;
  } else if (
    lower.includes('sleep') ||
    lower.includes('bed') ||
    lower.includes('rest') ||
    lower.includes('soja') ||
    catLower.includes('sleep')
  ) {
    matchedGroup = NOTIFICATION_CONTENT_BANK.sleep;
  } else if (
    lower.includes('meditat') ||
    lower.includes('mindful') ||
    lower.includes('breath') ||
    lower.includes('peace') ||
    lower.includes('gratitude') ||
    catLower.includes('mindfulness')
  ) {
    matchedGroup = NOTIFICATION_CONTENT_BANK.mindfulness;
  } else if (
    lower.includes('work') ||
    lower.includes('code') ||
    lower.includes('task') ||
    lower.includes('project') ||
    lower.includes('email') ||
    catLower.includes('productivity') ||
    catLower.includes('career')
  ) {
    matchedGroup = NOTIFICATION_CONTENT_BANK.productivity;
  }

  if (matchedGroup && matchedGroup.messages.length > 0) {
    const randomIndex = Math.floor(Math.random() * matchedGroup.messages.length);
    const message = matchedGroup.messages[randomIndex];
    return {
      title: matchedGroup.title,
      message,
      icon: matchedGroup.icon,
    };
  }

  // Dynamic Fallback
  const randomTemplate =
    GENERIC_HABIT_TEMPLATES[Math.floor(Math.random() * GENERIC_HABIT_TEMPLATES.length)];
  const personalized = randomTemplate
    .replace('{name}', userName)
    .replace('{habitName}', cleanTitle || 'Your daily routine');

  return {
    title: `${cleanTitle} Time ⚡`,
    message: personalized,
    icon: 'zap',
  };
}

export function getSmartHabitNotification(
  habitName: string,
  category?: string,
  userName?: string,
  isTodo: boolean = false
): SmartNotificationData {
  return getWittyNotification(habitName, category, userName);
}
