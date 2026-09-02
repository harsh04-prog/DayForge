const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CHALLENGES = [
  {
    code: 'iron_discipline_30',
    title: '30-Day Iron Discipline',
    name: '30-Day Iron Discipline',
    description: '30 days straight with zero excuses. Complete all daily habits without using any shields or skips.',
    category: 'Discipline',
    difficulty: 'hard',
    duration_days: 30,
    daily_target: 1,
    unit: 'days',
    xp_reward: 500,
    daily_xp_reward: 25,
    color: '#EF4444',
    icon: 'flame',
    is_official: true,
  },
  {
    code: 'morning_power_hour',
    title: 'Morning Power Hour',
    name: 'Morning Power Hour',
    description: 'Dedicate the first 60 minutes of every morning to deep work or exercise before checking your phone.',
    category: 'Productivity',
    difficulty: 'medium',
    duration_days: 14,
    daily_target: 1,
    unit: 'hours',
    xp_reward: 200,
    daily_xp_reward: 15,
    color: '#F59E0B',
    icon: 'sun',
    is_official: true,
  },
  {
    code: 'digital_sunset_detox',
    title: 'Digital Sunset Detox',
    name: 'Digital Sunset Detox',
    description: 'Turn off all screens, social media, and blue light 1 hour before bedtime to restore deep, restorative sleep.',
    category: 'Wellness',
    difficulty: 'medium',
    duration_days: 7,
    daily_target: 1,
    unit: 'nights',
    xp_reward: 120,
    daily_xp_reward: 15,
    color: '#8B5CF6',
    icon: 'moon',
    is_official: true,
  },
  {
    code: 'hydration_hero_3l',
    title: 'Hydration Hero 3L',
    name: 'Hydration Hero 3L',
    description: 'Drink at least 3 liters of fresh water daily to boost cellular hydration, metabolism, and mental clarity.',
    category: 'Health',
    difficulty: 'easy',
    duration_days: 7,
    daily_target: 3,
    unit: 'liters',
    xp_reward: 100,
    daily_xp_reward: 10,
    color: '#06B6D4',
    icon: 'droplets',
    is_official: true,
  },
  {
    code: 'steps_10k_daily',
    title: '10,000 Steps Daily Forge',
    name: '10,000 Steps Daily Forge',
    description: 'Hit 10,000 steps every day for 21 consecutive days to build cardiovascular stamina and daily active momentum.',
    category: 'Fitness',
    difficulty: 'medium',
    duration_days: 21,
    daily_target: 10000,
    unit: 'steps',
    xp_reward: 300,
    daily_xp_reward: 20,
    color: '#10B981',
    icon: 'footprints',
    is_official: true,
  },
  {
    code: 'mindful_reader_20',
    title: 'Mindful Reader: 20 Pages',
    name: 'Mindful Reader: 20 Pages',
    description: 'Read at least 20 pages of a non-fiction or growth book every day to expand your knowledge and focus.',
    category: 'Reading',
    difficulty: 'easy',
    duration_days: 14,
    daily_target: 20,
    unit: 'pages',
    xp_reward: 150,
    daily_xp_reward: 15,
    color: '#EC4899',
    icon: 'book-open',
    is_official: true,
  },
];

async function seed() {
  console.log('Seeding predefined challenges into Neon Postgres...');
  for (const c of CHALLENGES) {
    const upserted = await prisma.challenge.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
    console.log(`✅ Seeded Challenge: [${upserted.id}] ${upserted.title} (${upserted.duration_days}d, ${upserted.xp_reward} XP)`);
  }
  console.log('\n🎉 Successfully seeded 6 real challenges into Neon Postgres!');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
