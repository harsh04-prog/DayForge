export interface AvatarOption {
  id: string;
  name: string;
  category: string;
  gender: 'male' | 'female';
  style: string;
  svg: string;
}

// Generates high-fidelity, photorealistic 3D human character portrait renders
// Featuring realistic facial proportions, 3D volumetric lighting, layered depth, studio ambient lighting, and modern professional attire.
const createRealistic3dAvatar = (options: {
  id: string;
  skinBase: string;
  skinShadow: string;
  skinHighlight: string;
  hairColor: string;
  hairHighlight: string;
  hairStyle: 'fade' | 'textured' | 'executive' | 'modern-crop' | 'buzz' | 'sleek-bun' | 'soft-waves' | 'bob' | 'layered-lob' | 'braids' | 'smart-ponytail' | 'pixie';
  eyeColor: string;
  apparelType: 'navy-blazer' | 'charcoal-suit' | 'oxford-shirt' | 'merino-crew' | 'black-turtleneck' | 'hoodie' | 'athletic-zip' | 'silk-blouse' | 'cashmere-knit' | 'emerald-knit';
  apparelColor: string;
  accessory?: 'executive-glasses' | 'modern-frames' | 'subtle-earrings' | 'stubble' | 'beard';
  studioBg: [string, string];
}): string => {
  const {
    id,
    skinBase,
    skinShadow,
    skinHighlight,
    hairColor,
    hairHighlight,
    hairStyle,
    eyeColor,
    apparelType,
    apparelColor,
    accessory,
    studioBg,
  } = options;

  const uid = id.replace(/[^a-zA-Z0-9]/g, '');

  // Realistic 3D Hair Rendering
  let hairSvg = '';
  switch (hairStyle) {
    case 'fade':
      hairSvg = `
        <path d="M26 44 C26 22, 74 22, 74 44 C72 26, 66 18, 50 17 C34 18, 28 26, 26 44 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M24 45 C24 35, 28 28, 36 24 C30 29, 26 36, 26 46 Z" fill="${hairColor}" opacity="0.6"/>
        <path d="M76 45 C76 35, 72 28, 64 24 C70 29, 74 36, 74 46 Z" fill="${hairColor}" opacity="0.6"/>
        <path d="M35 24 C45 19, 55 19, 65 24 C55 21, 45 21, 35 24 Z" fill="${hairHighlight}" opacity="0.5"/>
      `;
      break;
    case 'textured':
      hairSvg = `
        <path d="M25 43 C24 20, 76 20, 75 43 C73 24, 66 16, 50 15 C34 16, 27 24, 25 43 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M32 20 C38 15, 48 14, 56 16 C62 17, 68 22, 70 26 C64 20, 54 18, 44 19 C38 20, 34 23, 32 26 Z" fill="${hairHighlight}" opacity="0.6"/>
        <path d="M28 35 C28 28, 32 22, 38 18 C33 22, 29 27, 29 35 Z" fill="${hairColor}"/>
      `;
      break;
    case 'executive':
      hairSvg = `
        <path d="M26 42 C26 21, 74 21, 74 42 C70 24, 62 18, 50 18 C38 18, 30 24, 26 42 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M34 23 C44 19, 58 19, 68 25 C58 21, 44 21, 34 25 Z" fill="${hairHighlight}" opacity="0.4"/>
      `;
      break;
    case 'modern-crop':
      hairSvg = `
        <path d="M27 42 C27 22, 73 22, 73 42 C71 25, 65 19, 50 18 C35 19, 29 25, 27 42 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M30 26 C40 22, 60 22, 70 26 L68 29 C60 25, 40 25, 32 29 Z" fill="${hairHighlight}" opacity="0.5"/>
      `;
      break;
    case 'sleek-bun':
      hairSvg = `
        <!-- High Bun Top -->
        <circle cx="50" cy="14" r="9" fill="url(#hairGrad-${uid})"/>
        <circle cx="50" cy="14" r="8" fill="${hairHighlight}" opacity="0.25"/>
        <path d="M25 44 C25 24, 75 24, 75 44 C72 26, 66 22, 50 21 C34 22, 28 26, 25 44 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M32 26 C42 22, 58 22, 68 26 C58 23, 42 23, 32 26 Z" fill="${hairHighlight}" opacity="0.4"/>
      `;
      break;
    case 'soft-waves':
      hairSvg = `
        <path d="M24 45 C23 20, 77 20, 76 45 C80 62, 74 76, 70 76 C69 52, 68 30, 50 28 C32 30, 31 52, 30 76 C26 76, 20 62, 24 45 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M28 35 C32 25, 42 22, 50 22 C58 22, 68 25, 72 35 C68 27, 58 24, 50 24 C42 24, 32 27, 28 35 Z" fill="${hairHighlight}" opacity="0.45"/>
        <path d="M28 50 C26 60, 28 68, 31 72 C29 67, 28 58, 29 50 Z" fill="${hairHighlight}" opacity="0.3"/>
        <path d="M72 50 C74 60, 72 68, 69 72 C71 67, 72 58, 71 50 Z" fill="${hairHighlight}" opacity="0.3"/>
      `;
      break;
    case 'bob':
      hairSvg = `
        <path d="M24 46 C24 22, 76 22, 76 46 C77 62, 73 68, 70 66 C70 48, 68 32, 50 30 C32 32, 30 48, 30 66 C27 68, 23 62, 24 46 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M30 32 C38 25, 62 25, 70 32 C62 27, 38 27, 30 32 Z" fill="${hairHighlight}" opacity="0.4"/>
      `;
      break;
    case 'layered-lob':
      hairSvg = `
        <path d="M24 44 C24 20, 76 20, 76 44 C79 64, 75 74, 71 74 C70 50, 68 32, 50 30 C32 32, 30 50, 29 74 C25 74, 21 64, 24 44 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M32 28 C42 23, 58 23, 68 28 C58 25, 42 25, 32 28 Z" fill="${hairHighlight}" opacity="0.45"/>
      `;
      break;
    case 'braids':
      hairSvg = `
        <path d="M26 42 C26 22, 74 22, 74 42 Z" fill="url(#hairGrad-${uid})"/>
        <rect x="25" y="42" width="5" height="34" rx="2.5" fill="url(#hairGrad-${uid})"/>
        <rect x="70" y="42" width="5" height="34" rx="2.5" fill="url(#hairGrad-${uid})"/>
        <path d="M32 25 C42 22, 58 22, 68 25" stroke="${hairHighlight}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.4"/>
      `;
      break;
    case 'smart-ponytail':
      hairSvg = `
        <path d="M26 43 C26 23, 74 23, 74 43 C70 26, 64 22, 50 21 C36 22, 30 26, 26 43 Z" fill="url(#hairGrad-${uid})"/>
        <path d="M70 34 C84 28, 88 48, 80 62 C84 50, 78 38, 70 34 Z" fill="url(#hairGrad-${uid})"/>
        <circle cx="70" cy="34" r="3" fill="#6C5CE7"/>
      `;
      break;
    default:
      hairSvg = `<path d="M26 43 C26 22, 74 22, 74 43 C70 24, 62 18, 50 18 C38 18, 30 24, 26 43 Z" fill="url(#hairGrad-${uid})"/>`;
  }

  // Realistic 3D Clothing & Attire
  let apparelSvg = '';
  switch (apparelType) {
    case 'navy-blazer':
    case 'charcoal-suit':
      apparelSvg = `
        <path d="M20 90 C20 74, 80 74, 80 90 L88 100 L12 100 Z" fill="${apparelColor}"/>
        <path d="M42 74 L50 90 L58 74 Z" fill="#F8FAFC"/>
        <path d="M48 84 L50 100 L52 84 Z" fill="#6C5CE7"/>
        <path d="M34 76 L46 95 L26 100 Z" fill="url(#shadowGrad-${uid})" opacity="0.3"/>
        <path d="M66 76 L54 95 L74 100 Z" fill="url(#shadowGrad-${uid})" opacity="0.3"/>
        <path d="M36 75 L46 94 L42 100 L24 100 Z" fill="${apparelColor}"/>
        <path d="M64 75 L54 94 L58 100 L76 100 Z" fill="${apparelColor}"/>
      `;
      break;
    case 'black-turtleneck':
    case 'merino-crew':
      apparelSvg = `
        <path d="M20 90 C20 74, 80 74, 80 90 L88 100 L12 100 Z" fill="${apparelColor}"/>
        <rect x="38" y="68" width="24" height="12" rx="5" fill="${apparelColor}"/>
        <path d="M38 72 C44 76, 56 76, 62 72" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" fill="none"/>
      `;
      break;
    case 'silk-blouse':
    case 'cashmere-knit':
    case 'emerald-knit':
      apparelSvg = `
        <path d="M20 90 C20 74, 80 74, 80 90 L88 100 L12 100 Z" fill="${apparelColor}"/>
        <path d="M38 74 C42 84, 58 84, 62 74 Z" fill="url(#skinGrad-${uid})"/>
        <path d="M36 75 C42 86, 58 86, 64 75" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none"/>
      `;
      break;
    case 'athletic-zip':
      apparelSvg = `
        <path d="M20 90 C20 74, 80 74, 80 90 L88 100 L12 100 Z" fill="${apparelColor}"/>
        <path d="M44 74 L50 86 L56 74 Z" fill="url(#skinGrad-${uid})"/>
        <line x1="50" y1="86" x2="50" y2="100" stroke="#6C5CE7" stroke-width="2.5" stroke-linecap="round"/>
      `;
      break;
    default:
      apparelSvg = `
        <path d="M20 90 C20 74, 80 74, 80 90 L88 100 L12 100 Z" fill="${apparelColor}"/>
        <path d="M40 74 C40 82, 60 82, 60 74 Z" fill="url(#skinGrad-${uid})"/>
      `;
  }

  // Accessories & Details
  let accessorySvg = '';
  if (accessory === 'executive-glasses' || accessory === 'modern-frames') {
    accessorySvg = `
      <rect x="32" y="47" width="15" height="11" rx="4" fill="none" stroke="#1E293B" stroke-width="2.2"/>
      <rect x="53" y="47" width="15" height="11" rx="4" fill="none" stroke="#1E293B" stroke-width="2.2"/>
      <line x1="47" y1="51" x2="53" y2="51" stroke="#1E293B" stroke-width="2"/>
      <line x1="33" y1="49" x2="41" y2="54" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/>
      <line x1="54" y1="49" x2="62" y2="54" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/>
    `;
  } else if (accessory === 'subtle-earrings') {
    accessorySvg = `
      <circle cx="28" cy="55" r="2.2" fill="#FFB547" stroke="#FFFFFF" stroke-width="0.8"/>
      <circle cx="72" cy="55" r="2.2" fill="#FFB547" stroke="#FFFFFF" stroke-width="0.8"/>
    `;
  } else if (accessory === 'stubble' || accessory === 'beard') {
    accessorySvg = `
      <path d="M36 58 C36 68, 64 68, 64 58 L64 56 C60 63, 40 63, 36 56 Z" fill="${hairColor}" opacity="0.35"/>
      <path d="M43 56 C46 58, 54 58, 57 56" stroke="${hairColor}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.4"/>
    `;
  }

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <defs>
      <!-- Studio Ambient Background Gradient -->
      <linearGradient id="bgGrad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${studioBg[0]}"/>
        <stop offset="100%" stop-color="${studioBg[1]}"/>
      </linearGradient>

      <!-- Volumetric 3D Skin Gradient -->
      <radialGradient id="skinGrad-${uid}" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${skinHighlight}"/>
        <stop offset="65%" stop-color="${skinBase}"/>
        <stop offset="100%" stop-color="${skinShadow}"/>
      </radialGradient>

      <!-- 3D Hair Texture Gradient -->
      <linearGradient id="hairGrad-${uid}" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="${hairHighlight}"/>
        <stop offset="50%" stop-color="${hairColor}"/>
        <stop offset="100%" stop-color="${hairColor}"/>
      </linearGradient>

      <!-- Ambient Shadow Gradient -->
      <linearGradient id="shadowGrad-${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Studio Background Backdrop with subtle soft rim lighting -->
    <rect width="100" height="100" rx="32" fill="url(#bgGrad-${uid})"/>
    
    <!-- 3D Neck & Shoulder Structure -->
    <path d="M43 64 L43 78 L57 78 L57 64 Z" fill="url(#skinGrad-${uid})"/>
    <path d="M43 69 C47 74, 53 74, 57 69 Z" fill="${skinShadow}" opacity="0.4"/>
    
    <!-- Professional Apparel -->
    ${apparelSvg}
    
    <!-- 3D Head Structure with Realistic Contours -->
    <path d="M29 46 C29 30, 71 30, 71 46 C71 63, 59 69, 50 69 C41 69, 29 63, 29 46 Z" fill="url(#skinGrad-${uid})"/>
    
    <!-- Left & Right Ears with 3D Depth -->
    <circle cx="28.5" cy="50" r="4.5" fill="url(#skinGrad-${uid})"/>
    <circle cx="29" cy="50" r="2.5" fill="${skinShadow}" opacity="0.3"/>
    <circle cx="71.5" cy="50" r="4.5" fill="url(#skinGrad-${uid})"/>
    <circle cx="71" cy="50" r="2.5" fill="${skinShadow}" opacity="0.3"/>
    
    <!-- Realistic Eyes: Sclera + Iris + Specular Reflection -->
    <!-- Left Eye -->
    <ellipse cx="40.5" cy="49" rx="4.5" ry="3.2" fill="#FFFFFF"/>
    <circle cx="41" cy="49" r="2.4" fill="${eyeColor}"/>
    <circle cx="41" cy="49" r="1.2" fill="#0F172A"/>
    <circle cx="42" cy="48" r="0.7" fill="#FFFFFF"/>
    
    <!-- Right Eye -->
    <ellipse cx="59.5" cy="49" rx="4.5" ry="3.2" fill="#FFFFFF"/>
    <circle cx="59" cy="49" r="2.4" fill="${eyeColor}"/>
    <circle cx="59" cy="49" r="1.2" fill="#0F172A"/>
    <circle cx="60" cy="48" r="0.7" fill="#FFFFFF"/>
    
    <!-- Eye Crease & Soft 3D Shadow -->
    <path d="M36 45 C39 43.5, 44 44, 46 45.5" stroke="${skinShadow}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.6"/>
    <path d="M64 45 C61 43.5, 56 44, 54 45.5" stroke="${skinShadow}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.6"/>

    <!-- Eyebrows -->
    <path d="M35 43 C39 41.5, 45 42, 47 43.5" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M65 43 C61 41.5, 55 42, 53 43.5" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" fill="none"/>
    
    <!-- Realistic 3D Nose Bridge & Tip -->
    <path d="M50 46 L48.2 54 C48.5 55.5, 51.5 55.5, 51.8 54" stroke="${skinShadow}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.7"/>
    <circle cx="50" cy="53.8" r="1" fill="${skinHighlight}" opacity="0.8"/>
    
    <!-- Realistic Natural Lips -->
    <path d="M43.5 60 C46.5 59.2, 53.5 59.2, 56.5 60" stroke="#9A3412" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.4"/>
    <path d="M43.5 60.5 C46.8 63.5, 53.2 63.5, 56.5 60.5 C53 61.8, 47 61.8, 43.5 60.5 Z" fill="#C2410C" opacity="0.5"/>
    <path d="M45.5 61.8 C48 62.6, 52 62.6, 54.5 61.8" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" stroke-linecap="round" fill="none"/>

    <!-- Accessories (Glasses, Facial Hair, etc.) -->
    ${accessorySvg}
    
    <!-- Hair Volume -->
    ${hairSvg}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const MALE_AVATARS: AvatarOption[] = [
  {
    id: 'male-3d-1',
    name: 'Alex',
    category: 'Executive',
    gender: 'male',
    style: 'Navy Structured Blazer · Modern Fade',
    svg: createRealistic3dAvatar({
      id: 'm1',
      skinBase: '#E8B997',
      skinShadow: '#C28F6C',
      skinHighlight: '#F8D3B8',
      hairColor: '#1E293B',
      hairHighlight: '#334155',
      hairStyle: 'fade',
      eyeColor: '#3B82F6',
      apparelType: 'navy-blazer',
      apparelColor: '#1E293B',
      accessory: 'stubble',
      studioBg: ['#F1F5F9', '#E2E8F0'],
    }),
  },
  {
    id: 'male-3d-2',
    name: 'Marcus',
    category: 'Tech Lead',
    gender: 'male',
    style: 'Charcoal Knit · Designer Frames',
    svg: createRealistic3dAvatar({
      id: 'm2',
      skinBase: '#8D5524',
      skinShadow: '#6B3A11',
      skinHighlight: '#A86D3B',
      hairColor: '#0F172A',
      hairHighlight: '#27272A',
      hairStyle: 'textured',
      eyeColor: '#451A03',
      apparelType: 'merino-crew',
      apparelColor: '#18181B',
      accessory: 'modern-frames',
      studioBg: ['#EDE9FE', '#DDD6FE'],
    }),
  },
  {
    id: 'male-3d-3',
    name: 'David',
    category: 'Creator',
    gender: 'male',
    style: 'Sand Knit Hoodie · Natural Waves',
    svg: createRealistic3dAvatar({
      id: 'm3',
      skinBase: '#FCD3B6',
      skinShadow: '#D89E78',
      skinHighlight: '#FFE4CF',
      hairColor: '#5C381E',
      hairHighlight: '#7D4F2D',
      hairStyle: 'textured',
      eyeColor: '#065F46',
      apparelType: 'hoodie',
      apparelColor: '#475569',
      studioBg: ['#FEF3C7', '#FDE68A'],
    }),
  },
  {
    id: 'male-3d-4',
    name: 'Ethan',
    category: 'Strategist',
    gender: 'male',
    style: 'Slate Oxford · Clean Taper',
    svg: createRealistic3dAvatar({
      id: 'm4',
      skinBase: '#D8A075',
      skinShadow: '#B3784F',
      skinHighlight: '#F0BA93',
      hairColor: '#18181B',
      hairHighlight: '#3F3F46',
      hairStyle: 'executive',
      eyeColor: '#1E293B',
      apparelType: 'navy-blazer',
      apparelColor: '#334155',
      accessory: 'executive-glasses',
      studioBg: ['#E0F2FE', '#BAE6FD'],
    }),
  },
  {
    id: 'male-3d-5',
    name: 'Ryan',
    category: 'Athlete',
    gender: 'male',
    style: 'Performance Zip · Athletic Crop',
    svg: createRealistic3dAvatar({
      id: 'm5',
      skinBase: '#E0A97E',
      skinShadow: '#B87E53',
      skinHighlight: '#F4C5A0',
      hairColor: '#27272A',
      hairHighlight: '#52525B',
      hairStyle: 'modern-crop',
      eyeColor: '#1E3A8A',
      apparelType: 'athletic-zip',
      apparelColor: '#0F172A',
      studioBg: ['#ECFDF5', '#D1FAE5'],
    }),
  },
  {
    id: 'male-3d-6',
    name: 'Leo',
    category: 'Designer',
    gender: 'male',
    style: 'Minimal Black Turtleneck · Styled Crop',
    svg: createRealistic3dAvatar({
      id: 'm6',
      skinBase: '#C68642',
      skinShadow: '#9A5B20',
      skinHighlight: '#E0A360',
      hairColor: '#09090B',
      hairHighlight: '#27272A',
      hairStyle: 'textured',
      eyeColor: '#451A03',
      apparelType: 'black-turtleneck',
      apparelColor: '#18181B',
      accessory: 'stubble',
      studioBg: ['#F3E8FF', '#E9D5FF'],
    }),
  },
  {
    id: 'male-3d-7',
    name: 'James',
    category: 'Founder',
    gender: 'male',
    style: 'Charcoal Tailored Suit · Distinguished',
    svg: createRealistic3dAvatar({
      id: 'm7',
      skinBase: '#F0BA93',
      skinShadow: '#C88D65',
      skinHighlight: '#FFD7B8',
      hairColor: '#334155',
      hairHighlight: '#64748B',
      hairStyle: 'executive',
      eyeColor: '#1E293B',
      apparelType: 'charcoal-suit',
      apparelColor: '#1E293B',
      accessory: 'beard',
      studioBg: ['#F1F5F9', '#E2E8F0'],
    }),
  },
  {
    id: 'male-3d-8',
    name: 'Lucas',
    category: 'Scholar',
    gender: 'male',
    style: 'Merino Wool Knit · Tortoise Frames',
    svg: createRealistic3dAvatar({
      id: 'm8',
      skinBase: '#FFE0BD',
      skinShadow: '#D8AB83',
      skinHighlight: '#FFF0DB',
      hairColor: '#451A03',
      hairHighlight: '#78350F',
      hairStyle: 'textured',
      eyeColor: '#166534',
      apparelType: 'merino-crew',
      apparelColor: '#334155',
      accessory: 'modern-frames',
      studioBg: ['#EFF6FF', '#DBEAFE'],
    }),
  },
  {
    id: 'male-3d-9',
    name: 'Noah',
    category: 'Explorer',
    gender: 'male',
    style: 'Field Canvas Shirt · Confident Fade',
    svg: createRealistic3dAvatar({
      id: 'm9',
      skinBase: '#E8B997',
      skinShadow: '#BF8863',
      skinHighlight: '#FFD5B8',
      hairColor: '#1E293B',
      hairHighlight: '#475569',
      hairStyle: 'fade',
      eyeColor: '#1E3A8A',
      apparelType: 'merino-crew',
      apparelColor: '#1E3A8A',
      studioBg: ['#FEF2F2', '#FEE2E2'],
    }),
  },
  {
    id: 'male-3d-10',
    name: 'Sam',
    category: 'Visionary',
    gender: 'male',
    style: 'Studio Knitwear · Defined Structure',
    svg: createRealistic3dAvatar({
      id: 'm10',
      skinBase: '#5C381E',
      skinShadow: '#3D2210',
      skinHighlight: '#7A4D2B',
      hairColor: '#09090B',
      hairHighlight: '#27272A',
      hairStyle: 'modern-crop',
      eyeColor: '#18181B',
      apparelType: 'black-turtleneck',
      apparelColor: '#18181B',
      accessory: 'stubble',
      studioBg: ['#F5F3FF', '#EDE9FE'],
    }),
  },
];

export const FEMALE_AVATARS: AvatarOption[] = [
  {
    id: 'female-3d-1',
    name: 'Sophia',
    category: 'Executive',
    gender: 'female',
    style: 'Royal Plum Blazer · Sleek High Bun',
    svg: createRealistic3dAvatar({
      id: 'f1',
      skinBase: '#F5C6A5',
      skinShadow: '#D09A76',
      skinHighlight: '#FFDECA',
      hairColor: '#18181B',
      hairHighlight: '#3F3F46',
      hairStyle: 'sleek-bun',
      eyeColor: '#1E3A8A',
      apparelType: 'navy-blazer',
      apparelColor: '#4C1D95',
      accessory: 'subtle-earrings',
      studioBg: ['#FDF4FF', '#FAE8FF'],
    }),
  },
  {
    id: 'female-3d-2',
    name: 'Maya',
    category: 'Tech Lead',
    gender: 'female',
    style: 'Emerald Knit · Chic Modern Bob',
    svg: createRealistic3dAvatar({
      id: 'f2',
      skinBase: '#8D5524',
      skinShadow: '#69380F',
      skinHighlight: '#AC6F3B',
      hairColor: '#09090B',
      hairHighlight: '#27272A',
      hairStyle: 'bob',
      eyeColor: '#451A03',
      apparelType: 'emerald-knit',
      apparelColor: '#064E3B',
      accessory: 'modern-frames',
      studioBg: ['#ECFDF5', '#D1FAE5'],
    }),
  },
  {
    id: 'female-3d-3',
    name: 'Elena',
    category: 'Product Director',
    gender: 'female',
    style: 'Silk Blouse · Soft Radiant Waves',
    svg: createRealistic3dAvatar({
      id: 'f3',
      skinBase: '#FCD3B6',
      skinShadow: '#D89E78',
      skinHighlight: '#FFE4CF',
      hairColor: '#78350F',
      hairHighlight: '#9A3412',
      hairStyle: 'soft-waves',
      eyeColor: '#065F46',
      apparelType: 'silk-blouse',
      apparelColor: '#6C5CE7',
      accessory: 'subtle-earrings',
      studioBg: ['#EDE9FE', '#DDD6FE'],
    }),
  },
  {
    id: 'female-3d-4',
    name: 'Chloe',
    category: 'Creative Lead',
    gender: 'female',
    style: 'Sage Crewneck · Layered Modern Lob',
    svg: createRealistic3dAvatar({
      id: 'f4',
      skinBase: '#E8B997',
      skinShadow: '#C08A64',
      skinHighlight: '#FFD7B8',
      hairColor: '#B45309',
      hairHighlight: '#D97706',
      hairStyle: 'layered-lob',
      eyeColor: '#1E293B',
      apparelType: 'merino-crew',
      apparelColor: '#334155',
      studioBg: ['#F0FDF4', '#DCFCE7'],
    }),
  },
  {
    id: 'female-3d-5',
    name: 'Zara',
    category: 'Athlete',
    gender: 'female',
    style: 'Performance Jacket · Athletic Ponytail',
    svg: createRealistic3dAvatar({
      id: 'f5',
      skinBase: '#D29B71',
      skinShadow: '#A86E42',
      skinHighlight: '#EBB48B',
      hairColor: '#18181B',
      hairHighlight: '#3F3F46',
      hairStyle: 'smart-ponytail',
      eyeColor: '#1E3A8A',
      apparelType: 'athletic-zip',
      apparelColor: '#0F172A',
      studioBg: ['#F0F9FF', '#E0F2FE'],
    }),
  },
  {
    id: 'female-3d-6',
    name: 'Olivia',
    category: 'Strategist',
    gender: 'female',
    style: 'Charcoal Tailored Suit · Refined Bun',
    svg: createRealistic3dAvatar({
      id: 'f6',
      skinBase: '#FFE0BD',
      skinShadow: '#D8AA80',
      skinHighlight: '#FFF0DD',
      hairColor: '#1E293B',
      hairHighlight: '#475569',
      hairStyle: 'sleek-bun',
      eyeColor: '#047857',
      apparelType: 'charcoal-suit',
      apparelColor: '#1E293B',
      accessory: 'executive-glasses',
      studioBg: ['#F8FAFC', '#E2E8F0'],
    }),
  },
  {
    id: 'female-3d-7',
    name: 'Mia',
    category: 'Founder',
    gender: 'female',
    style: 'Structured Navy Blazer · Long Waves',
    svg: createRealistic3dAvatar({
      id: 'f7',
      skinBase: '#E0A97E',
      skinShadow: '#BA7E51',
      skinHighlight: '#F5C6A0',
      hairColor: '#09090B',
      hairHighlight: '#27272A',
      hairStyle: 'soft-waves',
      eyeColor: '#1E293B',
      apparelType: 'navy-blazer',
      apparelColor: '#1E1B4B',
      accessory: 'subtle-earrings',
      studioBg: ['#EEF2FF', '#E0E7FF'],
    }),
  },
  {
    id: 'female-3d-8',
    name: 'Ava',
    category: 'Researcher',
    gender: 'female',
    style: 'Oatmeal Cashmere · Smart Sleek Bob',
    svg: createRealistic3dAvatar({
      id: 'f8',
      skinBase: '#F3C5A0',
      skinShadow: '#CB9871',
      skinHighlight: '#FEDCB8',
      hairColor: '#451A03',
      hairHighlight: '#78350F',
      hairStyle: 'bob',
      eyeColor: '#15803D',
      apparelType: 'cashmere-knit',
      apparelColor: '#475569',
      accessory: 'modern-frames',
      studioBg: ['#FFFBEB', '#FEF3C7'],
    }),
  },
  {
    id: 'female-3d-9',
    name: 'Emma',
    category: 'Designer',
    gender: 'female',
    style: 'Lavender Overshirt · Modern Pixie',
    svg: createRealistic3dAvatar({
      id: 'f9',
      skinBase: '#FCD3B6',
      skinShadow: '#D89E78',
      skinHighlight: '#FFE4CF',
      hairColor: '#D97706',
      hairHighlight: '#F59E0B',
      hairStyle: 'pixie',
      eyeColor: '#1E3A8A',
      apparelType: 'merino-crew',
      apparelColor: '#581C87',
      accessory: 'subtle-earrings',
      studioBg: ['#FAF5FF', '#F3E8FF'],
    }),
  },
  {
    id: 'female-3d-10',
    name: 'Layla',
    category: 'Visionary',
    gender: 'female',
    style: 'Forest Turtleneck · Textured Braids',
    svg: createRealistic3dAvatar({
      id: 'f10',
      skinBase: '#5C381E',
      skinShadow: '#3D2210',
      skinHighlight: '#7A4D2B',
      hairColor: '#09090B',
      hairHighlight: '#27272A',
      hairStyle: 'braids',
      eyeColor: '#18181B',
      apparelType: 'black-turtleneck',
      apparelColor: '#064E3B',
      accessory: 'subtle-earrings',
      studioBg: ['#F0FDF4', '#DCFCE7'],
    }),
  },
];

export const ALL_AVATARS: AvatarOption[] = [...MALE_AVATARS, ...FEMALE_AVATARS];

export const getAvatarById = (id?: string | null): AvatarOption | undefined => {
  if (!id) return undefined;
  const clean = id.trim().toLowerCase();
  
  // Exact match
  const exact = ALL_AVATARS.find((a) => a.id.toLowerCase() === clean);
  if (exact) return exact;

  // Partial / alias match (e.g. "male_1", "male_2", "female_1")
  if (clean.includes('female') || clean.includes('f')) {
    const num = parseInt(clean.replace(/\D/g, ''), 10) || 1;
    const idx = Math.min(Math.max(0, num - 1), FEMALE_AVATARS.length - 1);
    return FEMALE_AVATARS[idx];
  } else {
    const num = parseInt(clean.replace(/\D/g, ''), 10) || 1;
    const idx = Math.min(Math.max(0, num - 1), MALE_AVATARS.length - 1);
    return MALE_AVATARS[idx];
  }
};

export const getAvatarSvgSrc = (idOrUrl?: string | null): string => {
  if (!idOrUrl) return MALE_AVATARS[0].svg;
  if (idOrUrl.startsWith('data:image') || idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) {
    return idOrUrl;
  }
  const match = getAvatarById(idOrUrl);
  return match ? match.svg : MALE_AVATARS[0].svg;
};

