import {
  MoodBoard,
  MoodBoardProjectOption,
  MoodBoardClientOption,
  MoodBoardImage,
  MoodBoardTemplate,
  MoodBoardLeadOption,
  MoodBoardCategory,
} from "./types";

export const MOCK_PROJECTS: MoodBoardProjectOption[] = [
  {
    id: "proj-1",
    name: "Nikhil Oberoi",
    defaultClientId: "client-1",
    defaultClientName: "Mehta Residence",
    defaultClientSubtitle: "Commercial",
    boqReference: "BOQ-0029",
  },
  {
    id: "proj-2",
    name: "Skyline Penthouse",
    defaultClientId: "client-2",
    defaultClientName: "Sharma Developers",
    defaultClientSubtitle: "Residential",
    boqReference: "BOQ-0030",
  },
  {
    id: "proj-3",
    name: "Greenfield Corporate HQ",
    defaultClientId: "client-3",
    defaultClientName: "Aditi Rao",
    defaultClientSubtitle: "Corporate",
    boqReference: "BOQ-0031",
  },
  {
    id: "proj-4",
    name: "Prestige Tech Park Hub",
    defaultClientId: "client-4",
    defaultClientName: "Apex Corp",
    defaultClientSubtitle: "Tech Workspace",
  },
  {
    id: "proj-5",
    name: "Azure Bay Villa",
    defaultClientId: "client-5",
    defaultClientName: "Siddharth Kapoor",
    defaultClientSubtitle: "Luxury Villa",
  },
  {
    id: "proj-6",
    name: "Oberoi Towers 14B",
    defaultClientId: "client-6",
    defaultClientName: "Rohan Singhania",
    defaultClientSubtitle: "Residential Penthouse",
  },
  {
    id: "proj-7",
    name: "Albatross Villa",
    defaultClientId: "client-7",
    defaultClientName: "Natasha Verma",
    defaultClientSubtitle: "Coastal Residential",
  },
  {
    id: "proj-8",
    name: "Zenith Business Suites",
    defaultClientId: "client-8",
    defaultClientName: "Kapoor & Sons",
    defaultClientSubtitle: "Commercial Office",
  },
  {
    id: "proj-9",
    name: "The Glasshouse Bistro",
    defaultClientId: "client-9",
    defaultClientName: "Gourmet Ventures",
    defaultClientSubtitle: "Hospitality & Dining",
  },
  {
    id: "proj-10",
    name: "Serenity Wellness Spa",
    defaultClientId: "client-10",
    defaultClientName: "Maya Lin",
    defaultClientSubtitle: "Health & Wellness",
  },
  {
    id: "proj-11",
    name: "Grand Imperial Hotel",
    defaultClientId: "client-11",
    defaultClientName: "Regal Hospitality",
    defaultClientSubtitle: "Hotel & Resort",
  },
  {
    id: "proj-12",
    name: "Horizon Retail Mall",
    defaultClientId: "client-12",
    defaultClientName: "Cityscape Retail",
    defaultClientSubtitle: "Retail Mall",
  },
];

export const MOCK_CLIENTS: MoodBoardClientOption[] = [
  { id: "client-1", name: "Mehta Residence", subtitle: "Commercial" },
  { id: "client-2", name: "Sharma Developers", subtitle: "Residential" },
  { id: "client-3", name: "Aditi Rao", subtitle: "Corporate" },
  { id: "client-4", name: "Apex Corp", subtitle: "Tech Workspace" },
  { id: "client-5", name: "Siddharth Kapoor", subtitle: "Luxury Villa" },
  { id: "client-6", name: "Rohan Singhania", subtitle: "Residential Penthouse" },
  { id: "client-7", name: "Natasha Verma", subtitle: "Coastal Residential" },
  { id: "client-8", name: "Kapoor & Sons", subtitle: "Commercial Office" },
  { id: "client-9", name: "Gourmet Ventures", subtitle: "Hospitality & Dining" },
  { id: "client-10", name: "Maya Lin", subtitle: "Health & Wellness" },
  { id: "client-11", name: "Regal Hospitality", subtitle: "Hotel & Resort" },
  { id: "client-12", name: "Cityscape Retail", subtitle: "Retail Mall" },
];

export const MOCK_CREATORS = [
  "Jenny Wilson",
  "Alex Morgan",
  "David Chen",
  "Sarah Jenkins",
];

export const MOCK_LEADS: MoodBoardLeadOption[] = [
  { id: "lead-1", name: "Jenny Wilson", role: "Lead Architect" },
  { id: "lead-2", name: "Alex Morgan", role: "Spatial Designer" },
  { id: "lead-3", name: "David Chen", role: "Project Lead" },
  { id: "lead-4", name: "Sarah Jenkins", role: "Design Director" },
  { id: "lead-5", name: "Siddharth Verma", role: "Site Supervisor" },
];

export function createInitialCategories(): MoodBoardCategory[] {
  return [
    {
      id: "cat-entrance",
      name: "Entrance",
      expanded: false,
      imageCount: 8,
      images: [],
      itemGroups: [
        {
          id: "grp-entrance-foyer",
          name: "Foyer Console & Mirror",
          itemCount: 4,
          items: [
            {
              id: "item-ent-1",
              description: "Custom Fluted Marble Console Table",
              quantity: 1,
              rate: 45000,
              amount: 45000,
            },
            {
              id: "item-ent-2",
              description: "Arched Brushed Brass Backlit Mirror",
              quantity: 1,
              rate: 18500,
              amount: 18500,
            },
          ],
        },
      ],
    },
    {
      id: "cat-living",
      name: "Living Room",
      expanded: false,
      imageCount: 16,
      images: [],
      itemGroups: [
        {
          id: "grp-living-seating",
          name: "Main Seating Area",
          itemCount: 8,
          items: [
            {
              id: "item-liv-1",
              description: "Modular 4-Seater Sofa in Oat Bouclé",
              quantity: 1,
              rate: 120000,
              amount: 120000,
            },
            {
              id: "item-liv-2",
              description: "Organic Travertine Coffee Table Set",
              quantity: 1,
              rate: 55000,
              amount: 55000,
            },
          ],
        },
      ],
    },
    {
      id: "cat-dining",
      name: "Dining",
      expanded: false,
      imageCount: 10,
      images: [],
      itemGroups: [
        {
          id: "grp-dining-furniture",
          name: "Dining Table & Chairs",
          itemCount: 6,
          items: [
            {
              id: "item-din-1",
              description: "Solid White Oak 8-Seater Dining Table",
              quantity: 1,
              rate: 95000,
              amount: 95000,
            },
            {
              id: "item-din-2",
              description: "Upholstered Dining Armchairs with Cane Back",
              quantity: 8,
              rate: 14000,
              amount: 112000,
            },
          ],
        },
      ],
    },
    {
      id: "cat-kitchen",
      name: "Kitchen",
      expanded: false,
      imageCount: 24,
      images: [],
      itemGroups: [
        {
          id: "grp-kitchen-joinery",
          name: "Cabinets & Island",
          itemCount: 12,
          items: [
            {
              id: "item-kit-1",
              description: "Quartz Waterfall Island Countertop (Sq. Ft.)",
              quantity: 45,
              rate: 1800,
              amount: 81000,
            },
            {
              id: "item-kit-2",
              description: "Reeded Glass Upper Display Cabinets",
              quantity: 3,
              rate: 28000,
              amount: 84000,
            },
          ],
        },
      ],
    },
    {
      id: "cat-master-bedroom",
      name: "Master Bedroom",
      expanded: true,
      imageCount: 18,
      images: [],
      itemGroups: [
        {
          id: "grp-furniture",
          name: "Furniture",
          itemCount: 8,
          items: [
            {
              id: "item-mb-1",
              description: "King Size Bed with Fluted Walnut Headboard",
              quantity: 1,
              rate: 85000,
              amount: 85000,
            },
            {
              id: "item-mb-2",
              description: "Nightstands with Brushed Brass Pulls (Pair)",
              quantity: 2,
              rate: 18500,
              amount: 37000,
            },
            {
              id: "item-mb-3",
              description: "Lounge Accent Chair in Textured Bouclé",
              quantity: 1,
              rate: 42000,
              amount: 42000,
            },
          ],
        },
        {
          id: "grp-painting",
          name: "Painting",
          itemCount: 6,
          items: [
            {
              id: "item-mb-4",
              description: "Textured Minimalist Canvas Artwork (120x80cm)",
              quantity: 2,
              rate: 12500,
              amount: 25000,
            },
            {
              id: "item-mb-5",
              description: "Limewash Wall Finish on Accent Bedhead Wall",
              quantity: 180,
              rate: 180,
              amount: 32400,
            },
          ],
        },
        {
          id: "grp-electrical",
          name: "Electrical",
          itemCount: 4,
          items: [
            {
              id: "item-mb-6",
              description: "Architectural Cove Dim-to-Warm LED Strip (Mtr)",
              quantity: 24,
              rate: 850,
              amount: 20400,
            },
            {
              id: "item-mb-7",
              description: "Designer Pendant Bedside Lights (Brushed Brass)",
              quantity: 2,
              rate: 9500,
              amount: 19000,
            },
          ],
        },
      ],
    },
  ];
}

// Generates self-contained SVG data URIs for mock interior design mood boards
export function createSampleImageSvg(
  label: string,
  palette: [string, string, string],
  subtitle?: string
): string {
  const [c1, c2, c3] = palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="60%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="600" height="400" fill="url(#g)"/>
    <rect width="600" height="400" fill="url(#grid)"/>
    <circle cx="500" cy="80" r="120" fill="rgba(255,255,255,0.06)"/>
    <rect x="40" y="270" width="520" height="90" rx="8" fill="rgba(15,23,42,0.6)" backdrop-filter="blur(10px)"/>
    <text x="60" y="315" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="20" fill="#ffffff">${label}</text>
    <text x="60" y="342" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="14" fill="#cbd5e1">${subtitle || "Interior Design Concept"}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Pre-generated realistic mood board preview images
const PALETTES: [string, string, string][] = [
  ["#1e293b", "#334155", "#475569"], // slate / minimalist
  ["#064e3b", "#047857", "#10b981"], // emerald luxury
  ["#78350f", "#b45309", "#f59e0b"], // warm oak & amber
  ["#1e3a8a", "#2563eb", "#60a5fa"], // classic blue
  ["#4c1d95", "#6d28d9", "#8b5cf6"], // royal violet
  ["#701a75", "#a21caf", "#d946ef"], // contemporary berry
  ["#134e4a", "#0d9488", "#2dd4bf"], // modern teal
  ["#7c2d12", "#c2410c", "#fb923c"], // terracotta
];

function generateMockImages(boardName: string, count: number): MoodBoardImage[] {
  const images: MoodBoardImage[] = [];
  const tags = [
    "Material Palette",
    "Living Room Perspective",
    "Lighting Fixture Concept",
    "Flooring & Marble Finish",
    "Fabric & Upholstery Swatch",
    "Custom Cabinetry Detail",
    "Acoustic Ceiling Treatment",
    "Wall Cladding Texture",
    "Window Framing & Drape",
    "Foyer Accent Wall",
    "Hardware & Brass Fittings",
    "Outdoor Terrace Transition",
    "Master Bed Headboard",
    "Kitchen Island Detail",
    "Executive Desk Elevation",
    "Spa Bath & Terrazzo",
    "Ambient LED Scheme",
    "Artwork & Styling Accessories",
  ];

  for (let i = 0; i < count; i++) {
    const palette = PALETTES[i % PALETTES.length];
    const tag = tags[i % tags.length];
    const previewUrl = createSampleImageSvg(`${boardName} - ${tag}`, palette, `Spec Sheet #${i + 1}`);
    images.push({
      id: `img-${boardName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${i + 1}`,
      name: `${tag}.jpg`,
      previewUrl,
      fileType: "image/jpeg",
      size: 1024 * 1024 * 1.5 + i * 200000,
      isCover: i === 0,
      uploadedAt: new Date(Date.now() - i * 86400000 * 0.5).toISOString(),
    });
  }
  return images;
}

export const INITIAL_MOOD_BOARDS: MoodBoard[] = [
  {
    id: "mb-1",
    name: "Modern Minimalist Living",
    description: "Clean lines, muted neutrals, and natural oak accents for open-plan living areas.",
    projectId: "proj-1",
    projectName: "Nikhil Oberoi",
    clientId: "client-1",
    clientName: "Mehta Residence",
    clientSubtitle: "Commercial",
    images: generateMockImages("Modern Minimalist Living", 12),
    status: "COMPLETED",
    createdBy: "Jenny Wilson",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Modern Minimalist Living", PALETTES[0], "Mehta Residence - Commercial"),
  },
  {
    id: "mb-2",
    name: "Contemporary Luxury Residence",
    description: "High-contrast marble, brushed champagne gold fixtures, and bespoke Italian upholstery.",
    projectId: "proj-2",
    projectName: "Skyline Penthouse",
    clientId: "client-2",
    clientName: "Sharma Developers",
    clientSubtitle: "Residential",
    images: generateMockImages("Contemporary Luxury Residence", 8),
    status: "IN_PROGRESS",
    createdBy: "Alex Morgan",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Contemporary Luxury Residence", PALETTES[1], "Skyline Penthouse"),
  },
  {
    id: "mb-3",
    name: "Scandinavian Kitchen Concept",
    description: "Light birch woods, matte white quartz countertops, and minimalist integrated appliances.",
    projectId: "proj-3",
    projectName: "Greenfield Corporate HQ",
    clientId: "client-3",
    clientName: "Aditi Rao",
    clientSubtitle: "Corporate",
    images: generateMockImages("Scandinavian Kitchen Concept", 15),
    status: "COMPLETED",
    createdBy: "Jenny Wilson",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Scandinavian Kitchen Concept", PALETTES[2], "Greenfield Corporate HQ"),
  },
  {
    id: "mb-4",
    name: "Premium Office Interiors",
    description: "Ergonomic executive suites, acoustic felt baffling, and vibrant collaborative hubs.",
    projectId: "proj-4",
    projectName: "Prestige Tech Park Hub",
    clientId: "client-4",
    clientName: "Apex Corp",
    clientSubtitle: "Tech Workspace",
    images: generateMockImages("Premium Office Interiors", 6),
    status: "DRAFT",
    createdBy: "David Chen",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    coverImage: createSampleImageSvg("Premium Office Interiors", PALETTES[3], "Prestige Tech Park Hub"),
  },
  {
    id: "mb-5",
    name: "Warm Neutral Bedroom",
    description: "Soft bouclé textures, limewashed beige walls, and diffused warm ambient sconces.",
    projectId: "proj-5",
    projectName: "Azure Bay Villa",
    clientId: "client-5",
    clientName: "Siddharth Kapoor",
    clientSubtitle: "Luxury Villa",
    images: generateMockImages("Warm Neutral Bedroom", 10),
    status: "COMPLETED",
    createdBy: "Sarah Jenkins",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Warm Neutral Bedroom", PALETTES[4], "Azure Bay Villa"),
  },
  {
    id: "mb-6",
    name: "Modern Commercial Reception",
    description: "Double-height backlit onyx reception counter with biophilic living walls.",
    projectId: "proj-6",
    projectName: "Oberoi Towers 14B",
    clientId: "client-6",
    clientName: "Rohan Singhania",
    clientSubtitle: "Residential Penthouse",
    images: generateMockImages("Modern Commercial Reception", 18),
    status: "IN_PROGRESS",
    createdBy: "David Chen",
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Modern Commercial Reception", PALETTES[5], "Oberoi Towers 14B"),
  },
  {
    id: "mb-7",
    name: "Mediterranean Villa Concept",
    description: "Terracotta tile pavers, hand-plastered white arches, and weathered olive wood millwork.",
    projectId: "proj-7",
    projectName: "Albatross Villa",
    clientId: "client-7",
    clientName: "Natasha Verma",
    clientSubtitle: "Coastal Residential",
    images: generateMockImages("Mediterranean Villa Concept", 14),
    status: "ARCHIVED",
    createdBy: "Jenny Wilson",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Mediterranean Villa Concept", PALETTES[6], "Albatross Villa"),
  },
  {
    id: "mb-8",
    name: "Zenith Executive Boardroom",
    description: "Smoked oak conference table, hidden presentation screens, and leather swivel seating.",
    projectId: "proj-8",
    projectName: "Zenith Business Suites",
    clientId: "client-8",
    clientName: "Kapoor & Sons",
    clientSubtitle: "Commercial Office",
    images: generateMockImages("Zenith Executive Boardroom", 9),
    status: "COMPLETED",
    createdBy: "Alex Morgan",
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Zenith Executive Boardroom", PALETTES[7], "Zenith Business Suites"),
  },
  {
    id: "mb-9",
    name: "Artisan Coffee Bar & Lounge",
    description: "Exposed brick, brass espresso fixtures, and fluted glass partitions.",
    projectId: "proj-9",
    projectName: "The Glasshouse Bistro",
    clientId: "client-9",
    clientName: "Gourmet Ventures",
    clientSubtitle: "Hospitality & Dining",
    images: generateMockImages("Artisan Coffee Bar & Lounge", 11),
    status: "DRAFT",
    createdBy: "Sarah Jenkins",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Artisan Coffee Bar & Lounge", PALETTES[0], "The Glasshouse Bistro"),
  },
  {
    id: "mb-10",
    name: "Holistic Treatment Rooms",
    description: "Muted sage greens, diffused recessed ceiling coves, and acoustic water walls.",
    projectId: "proj-10",
    projectName: "Serenity Wellness Spa",
    clientId: "client-10",
    clientName: "Maya Lin",
    clientSubtitle: "Health & Wellness",
    images: generateMockImages("Holistic Treatment Rooms", 7),
    status: "IN_PROGRESS",
    createdBy: "Jenny Wilson",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Holistic Treatment Rooms", PALETTES[1], "Serenity Wellness Spa"),
  },
  {
    id: "mb-11",
    name: "Grand Presidential Suite",
    description: "Silk wallpaper panels, hand-knotted wool rugs, and panoramic glass curtain walls.",
    projectId: "proj-11",
    projectName: "Grand Imperial Hotel",
    clientId: "client-11",
    clientName: "Regal Hospitality",
    clientSubtitle: "Hotel & Resort",
    images: generateMockImages("Grand Presidential Suite", 16),
    status: "COMPLETED",
    createdBy: "Alex Morgan",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Grand Presidential Suite", PALETTES[2], "Grand Imperial Hotel"),
  },
  {
    id: "mb-12",
    name: "Atrium Promenade & Lighting",
    description: "Suspended sculptural lighting, terrazzo walkways, and indoor botanical groupings.",
    projectId: "proj-12",
    projectName: "Horizon Retail Mall",
    clientId: "client-12",
    clientName: "Cityscape Retail",
    clientSubtitle: "Retail Mall",
    images: generateMockImages("Atrium Promenade & Lighting", 13),
    status: "ARCHIVED",
    createdBy: "David Chen",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    coverImage: createSampleImageSvg("Atrium Promenade & Lighting", PALETTES[3], "Horizon Retail Mall"),
  },
];

export const MOCK_MOOD_BOARD_TEMPLATES: MoodBoardTemplate[] = [
  {
    id: "template-modern-minimalist",
    name: "Modern Minimalist Living",
    category: "Residential",
    description: "Clean architectural lines, muted greige tones, natural white oak joinery, and clutter-free open plan flow.",
    tags: ["Minimalist", "Neutral Tones", "White Oak", "Open Plan"],
    coverImage: createSampleImageSvg("Modern Minimalist Template", PALETTES[0], "Residential Template"),
    images: generateMockImages("Modern Minimalist Concept", 6),
  },
  {
    id: "template-scandinavian-warmth",
    name: "Scandinavian Cozy Suite",
    category: "Residential",
    description: "Tactile bouclé fabrics, blonde woods, soft layered warm lighting, and organic ceramic decorative accents.",
    tags: ["Nordic", "Bouclé", "Warm Woods", "Layered Light"],
    coverImage: createSampleImageSvg("Scandinavian Cozy Template", PALETTES[2], "Residential Template"),
    images: generateMockImages("Scandinavian Cozy Concept", 5),
  },
  {
    id: "template-contemporary-luxury",
    name: "Contemporary Luxury Villa",
    category: "Luxury",
    description: "Bookmatched Calacatta marble, brushed brass details, rich fluted walnut feature walls, and custom ambient cove LEDs.",
    tags: ["Luxury", "Calacatta Marble", "Brushed Brass", "Feature Wall"],
    coverImage: createSampleImageSvg("Contemporary Luxury Template", PALETTES[1], "Luxury Living Template"),
    images: generateMockImages("Contemporary Luxury Concept", 6),
  },
  {
    id: "template-executive-office",
    name: "Premium Corporate Workspace",
    category: "Commercial",
    description: "Acoustic fabric wall panels, ergonomic bespoke executive desks, matte black framing, and biophilic indoor plant integration.",
    tags: ["Commercial", "Acoustic Panels", "Ergonomic", "Biophilic"],
    coverImage: createSampleImageSvg("Corporate Workspace Template", PALETTES[3], "Commercial Office Template"),
    images: generateMockImages("Corporate Workspace Concept", 6),
  },
  {
    id: "template-warm-neutral-bedroom",
    name: "Warm Neutral Master Bedroom",
    category: "Residential",
    description: "Soft washed linen bedding, cashmere throws, warm dim-to-warm bedside fixtures, and integrated reeded glass wardrobe doors.",
    tags: ["Bedroom", "Linen Swatches", "Reeded Glass", "Dim to Warm"],
    coverImage: createSampleImageSvg("Warm Neutral Bedroom Template", PALETTES[7], "Master Bedroom Template"),
    images: generateMockImages("Warm Neutral Bedroom Concept", 5),
  },
  {
    id: "template-artisan-hospitality",
    name: "Artisan Bistro & Lounge",
    category: "Hospitality",
    description: "Custom cast terrazzo bar tops, cognac leather banquettes, moody antique brass pendants, and acoustic timber slatted ceilings.",
    tags: ["Hospitality", "Terrazzo", "Cognac Leather", "Atmospheric"],
    coverImage: createSampleImageSvg("Artisan Bistro Template", PALETTES[4], "Hospitality & Dining Template"),
    images: generateMockImages("Artisan Bistro Concept", 6),
  },
];
