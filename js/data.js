/* ==========================================================
   UniPulse - Default Mock Data & Initial State (Optimized Assets)
   ========================================================== */

const INITIAL_EVENTS = [
  {
    id: "evt-101",
    title: "HackPulse 2026: 36-Hour National Campus Hackathon",
    category: "hackathon",
    categoryName: "Hackathon",
    organizer: "Google Developer Student Club & ACM",
    organizerIcon: "💻",
    description: "Gear up for the biggest university-wide hackathon! Solve real-world challenges across Web3, AI/ML, Climate Tech, and Open Innovation with $5,000+ in prize pool, free food, mentor workshops, and exclusive swags.",
    date: "2026-10-18",
    time: "09:00 AM - Oct 19, 09:00 PM",
    venue: "Main Campus Auditorium & Tech Innovation Lab",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Team (2-4)",
    maxCapacity: 300,
    registeredCount: 248,
    isFeatured: true,
    banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=75",
    tags: ["Coding", "AI", "Team", "Prizes", "Swags"],
    perks: ["Verified Certificate", "Free Meals & Energy Drinks", "Exclusive Swag Kit", "Official Attendance Credit (2 Days)"],
    agenda: [
      { time: "Day 1 - 09:00 AM", title: "Opening Ceremony & Problem Statements Release" },
      { time: "Day 1 - 01:00 PM", title: "Lunch & Mentor Office Hours" },
      { time: "Day 1 - 08:00 PM", title: "Midnight Coding & Snacks" },
      { time: "Day 2 - 04:00 PM", title: "Final Project Submissions" },
      { time: "Day 2 - 06:30 PM", title: "Demos, Judging & Grand Prize Distribution" }
    ],
    rules: [
      "Open to all undergraduate & postgraduate students.",
      "Teams can comprise 2 to 4 members.",
      "All code must be written during the hackathon period.",
      "Plagiarism or pre-built complete solutions will lead to disqualification."
    ]
  },
  {
    id: "evt-102",
    title: "Euphoria '26: Annual Cultural Night & Battle of the Bands",
    category: "cultural",
    categoryName: "Cultural & Arts",
    organizer: "Campus Cultural Council & Music Society",
    organizerIcon: "🎸",
    description: "The most electrifying night of the semester! Live performance by top indie band 'The Neon Echoes', inter-college dance faceoff, acoustic jamming, and carnival food stalls.",
    date: "2026-10-24",
    time: "06:00 PM - 11:00 PM",
    venue: "Central Open Air Amphitheatre",
    isOnline: false,
    price: 0,
    priceText: "Free Pass",
    teamType: "Solo / Group",
    maxCapacity: 1200,
    registeredCount: 980,
    isFeatured: true,
    banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=75",
    tags: ["Music", "Dance", "Food Stalls", "Live Band"],
    perks: ["Concert Entry Wristband", "Food Stalls Discount Vouchers", "Live DJ After-Party"],
    agenda: [
      { time: "06:00 PM", title: "Gates Open & Red Carpet Walk" },
      { time: "06:45 PM", title: "Inter-College Dance Faceoff Finals" },
      { time: "08:15 PM", title: "Battle of the Bands Championship" },
      { time: "09:30 PM", title: "Headlining Band 'The Neon Echoes' Live" },
      { time: "10:30 PM", title: "Campus EDM & Laser Show" }
    ],
    rules: [
      "Valid University Digital Student ID & E-Ticket required at gate entry.",
      "Outside alcohol or contraband strictly prohibited.",
      "Wristband must be worn at all times."
    ]
  },
  {
    id: "evt-103",
    title: "Hands-on Generative AI & Autonomous Agents Workshop",
    category: "workshop",
    categoryName: "Workshop",
    organizer: "AI & Robotics Club",
    organizerIcon: "🤖",
    description: "Build, deploy, and evaluate full-stack AI agents using modern LLM APIs, LangChain, and vector embeddings. Bring your laptop and leave with a working deployed project!",
    date: "2026-10-15",
    time: "02:00 PM - 05:30 PM",
    venue: "Computer Science Lab 304 & Live Stream",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Solo",
    maxCapacity: 90,
    registeredCount: 88,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=75",
    tags: ["AI/ML", "Hands-on", "Python", "Certificate"],
    perks: ["Hands-on Project Repo", "Free Cloud API Credits ($25)", "Official Skill Certificate", "Attendance Credit"],
    agenda: [
      { time: "02:00 PM", title: "Introduction to Agentic Architecture & LLM Foundations" },
      { time: "03:00 PM", title: "Live Coding: Building your First Autonomous Agent" },
      { time: "04:15 PM", title: "Integrating Tool Calling & Vector Search" },
      { time: "05:00 PM", title: "Project Deployment & Q&A" }
    ],
    rules: [
      "Basic knowledge of Python is recommended.",
      "Bring a charged laptop with VS Code and Python 3.10+ installed."
    ]
  },
  {
    id: "evt-104",
    title: "Inter-Department Premier Cricket & Football League",
    category: "sports",
    categoryName: "Sports & Fitness",
    organizer: "Sports Federation & Student Gymkhana",
    organizerIcon: "🏆",
    description: "Cheer for your department! 16 departments compete for the prestigious Chancellor's Cup in Cricket, Futsal, and Basketball tournaments over three action-packed days.",
    date: "2026-10-28",
    time: "08:30 AM - 06:00 PM",
    venue: "University Sports Arena & Main Stadium",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Department Teams",
    maxCapacity: 500,
    registeredCount: 340,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=75",
    tags: ["Sports", "Cricket", "Football", "Trophy"],
    perks: ["Championship Medals & Trophy", "Department Pride Points", "Sports Energy Kit"],
    agenda: [
      { time: "08:30 AM", title: "Torch Relay & Opening March Past" },
      { time: "09:30 AM", title: "Cricket Quarter & Semi Finals" },
      { time: "02:00 PM", title: "Football Championship Match" },
      { time: "05:00 PM", title: "Awards & Chancellor's Cup Ceremony" }
    ],
    rules: [
      "Players must represent their enrolled departmental batch.",
      "Standard university sports dress code mandatory."
    ]
  },
  {
    id: "evt-105",
    title: "Valorant & BGMI Campus Esports Championship '26",
    category: "gaming",
    categoryName: "Gaming & Esports",
    organizer: "Campus Gaming League (CGL)",
    organizerIcon: "🎮",
    description: "High-octane esports tournament with live casting on Twitch & YouTube! Compete in 5v5 Valorant Spike Rush & 4-man BGMI custom lobbies for cash prizes & pro gaming peripherals.",
    date: "2026-11-02",
    time: "01:00 PM - 08:00 PM",
    venue: "Student Activity Center Esports Lounge",
    isOnline: false,
    price: 150,
    priceText: "₹150 / Team",
    teamType: "Squad (4-5)",
    maxCapacity: 64,
    registeredCount: 52,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=75",
    tags: ["Esports", "Valorant", "BGMI", "Gaming Gear"],
    perks: ["₹25,000 Cash Prize Pool", "Gaming Headsets for MVP", "Live Stream Spotlight"],
    agenda: [
      { time: "01:00 PM", title: "Knockout Round 1 (Custom Rooms)" },
      { time: "03:30 PM", title: "Semifinals & Casters Commentary" },
      { time: "06:00 PM", title: "Grand Finals on Big Screen" },
      { time: "07:45 PM", title: "Prize Distribution" }
    ],
    rules: [
      "Emulators strictly prohibited for BGMI.",
      "Zero tolerance policy for toxicity or third-party hacks."
    ]
  },
  {
    id: "evt-106",
    title: "Silicon Valley Tech Leaders: Keynote & Career Fireside Chat",
    category: "tech",
    categoryName: "Tech & Innovation",
    organizer: "Training & Placement Cell (T&P)",
    organizerIcon: "🚀",
    description: "Exclusive fireside talk with senior engineering managers and startup founders on navigating the future of tech careers, cracking FAANG interviews, and building venture-backed startups in college.",
    date: "2026-11-06",
    time: "04:30 PM - 06:30 PM",
    venue: "Seminar Hall 1 & Zoom Hybrid",
    isOnline: true,
    price: 0,
    priceText: "Free",
    teamType: "Solo",
    maxCapacity: 400,
    registeredCount: 310,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=75",
    tags: ["Career", "FAANG", "Startups", "Networking"],
    perks: ["Resume Review Slots", "Direct Internship Referrals", "Q&A Session with Founders", "Digital Certificate"],
    agenda: [
      { time: "04:30 PM", title: "Keynote: Where Tech is Headed in 2027" },
      { time: "05:15 PM", title: "Fireside Panel: Cracking Global Tech Roles" },
      { time: "06:00 PM", title: "Live Open Q&A & Networking" }
    ],
    rules: [
      "Open to all years and branches.",
      "Virtual attendees will receive Zoom link on ticket confirmation."
    ]
  }
];

const INITIAL_CLUBS = [
  {
    id: "club-1",
    name: "GDSC & ACM Student Chapter",
    category: "Technical",
    icon: "💻",
    bgGradient: "linear-gradient(135deg, #6366f1, #3b82f6)",
    description: "Empowering student developers to build modern tech solutions for community problems through hackathons, study jams, and open source.",
    members: 840,
    eventsCount: 14,
    lead: "Aarav Sharma (President)"
  },
  {
    id: "club-2",
    name: "Campus Music & Drama Society",
    category: "Cultural",
    icon: "🎭",
    bgGradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    description: "The home of musicians, actors, and artists bringing stage plays, live concerts, and musical productions to life.",
    members: 620,
    eventsCount: 18,
    lead: "Rhea Kapoor (Secretary)"
  },
  {
    id: "club-3",
    name: "AI & Robotics Club (ARC)",
    category: "Innovation",
    icon: "🤖",
    bgGradient: "linear-gradient(135deg, #06b6d4, #10b981)",
    description: "Hands-on projects in Machine Learning, ROS robotics, drone engineering, and competitive bot battles.",
    members: 490,
    eventsCount: 9,
    lead: "Devansh Varma (Lead Researcher)"
  },
  {
    id: "club-4",
    name: "E-Cell (Entrepreneurship Cell)",
    category: "Business",
    icon: "💡",
    bgGradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    description: "Fostering startup culture on campus with angel pitch events, founder talks, incubator grants, and business plan competitions.",
    members: 530,
    eventsCount: 11,
    lead: "Ananya Mehta (Convenor)"
  },
  {
    id: "club-5",
    name: "Campus Esports & Gaming Union",
    category: "Sports & Gaming",
    icon: "🎮",
    bgGradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    description: "Organizing competitive gaming tournaments, LAN parties, game development jams, and live community streams.",
    members: 910,
    eventsCount: 16,
    lead: "Karthik Nair (Captain)"
  },
  {
    id: "club-6",
    name: "Literary & Debating Society (LitSoc)",
    category: "Literary",
    icon: "📚",
    bgGradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    description: "Model United Nations (MUN), Parliamentary Debates, Creative Writing Slams, and Campus Journalism.",
    members: 380,
    eventsCount: 8,
    lead: "Sneha Sen (Chairperson)"
  }
];

const INITIAL_ANNOUNCEMENTS = [
  "⚡ Registration for HackPulse '26 is 85% full! Secure your team slot today.",
  "🎉 Euphoria Cultural Fest wristband pickup starts this Thursday at Student Center.",
  "🤖 Free AI Workshop cloud credits ($25) sponsored by Tech Innovation Lab."
];
