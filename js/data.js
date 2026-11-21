/* ==========================================================
   UniPulse - Default Mock Data & Initial State (Optimized Assets)
   ========================================================== */

const INITIAL_EVENTS = [
  {
    id: "evt-101",
    title: "HackAI 2025: The Autonomous Future",
    category: "hackathon",
    categoryName: "Hackathon",
    categoryBadge: "HACKATHON",
    statusBadge: "• Live Filling",
    statusType: "coral",
    subBadge: "36h Sprint",
    dateDisplay: "Nov 14 - 16, 2025",
    actionLabel: "Register Free",
    organizer: "Google Developer Student Club & ACM",
    organizerIcon: "💻",
    description: "Join over 600 innovators to architect generative agents, edge intelligence, and cooperative robotics with ₹5,00,000+ in prize pool, cloud credits, and mentor access.",
    date: "2026-10-18",
    time: "09:00 AM - Oct 19, 09:00 PM",
    venue: "Turing Innovation Complex, Hall B",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Team (2-4)",
    maxCapacity: 600,
    registeredCount: 485,
    isFeatured: true,
    banner: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=75",
    tags: ["Coding", "AI", "Agents", "Robotics", "Prizes"],
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
    title: "Campus SoundWave Annual Fest",
    category: "cultural",
    categoryName: "Cultural Fest",
    categoryBadge: "CULTURAL",
    statusBadge: "Official Fest",
    statusType: "sky",
    subBadge: "Open Stage",
    dateDisplay: "Nov 20, 2025 • 6:00 PM",
    actionLabel: "Get Pass",
    organizer: "Campus Cultural Council & Music Society",
    organizerIcon: "🎸",
    description: "Featuring indie ensembles, faculty jazz orchestra, acoustic duels, and late-night food trucks across the Great Lawn amphitheatre.",
    date: "2026-10-24",
    time: "06:00 PM - 11:00 PM",
    venue: "Great Lawn Amphitheatre",
    isOnline: false,
    price: 0,
    priceText: "Free Pass",
    teamType: "Solo / Group",
    maxCapacity: 1200,
    registeredCount: 940,
    isFeatured: true,
    banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=75",
    tags: ["Music", "Dance", "Food Stalls", "Live Band"],
    perks: ["Concert Entry Wristband", "Food Stalls Discount Vouchers", "Live DJ After-Party"],
    agenda: [
      { time: "06:00 PM", title: "Gates Open & Red Carpet Walk" },
      { time: "06:45 PM", title: "Inter-College Dance Faceoff Finals" },
      { time: "08:15 PM", title: "Battle of the Bands Championship" },
      { time: "09:30 PM", title: "Headlining Band Live" },
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
    title: "RoboWars: Arena Clash 2025",
    category: "tech",
    categoryName: "Tech & Robotics",
    categoryBadge: "TECH & ROBOTICS",
    statusBadge: "High Stakes",
    statusType: "orange",
    subBadge: "15kg & 30kg",
    dateDisplay: "Nov 25, 2025 • 10:00 AM",
    actionLabel: "Register Free",
    organizer: "Robotics Club & Engineering Society",
    organizerIcon: "🤖",
    description: "Mechanical and mechatronics societies present destructive cage matches with autonomous battlebots and drone navigation.",
    date: "2026-10-15",
    time: "10:00 AM - 05:30 PM",
    venue: "Engineering Foundry Arena 04",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Team (2-4)",
    maxCapacity: 150,
    registeredCount: 142,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=75",
    tags: ["Robotics", "Hardware", "Autonomous", "Battles"],
    perks: ["Arena Safety Gear", "₹1,00,000 Cash Pool", "Component Sponsorship"],
    agenda: [
      { time: "10:00 AM", title: "Technical Inspection & Weigh-in" },
      { time: "12:00 PM", title: "15kg Class Knockouts" },
      { time: "03:30 PM", title: "30kg Destructive Heavyweight Finals" }
    ],
    rules: [
      "All bots must pass safety remote failsafe checks.",
      "Flame or chemical weapons strictly prohibited."
    ]
  },
  {
    id: "evt-104",
    title: "Inter-Department Varsity Cup",
    category: "sports",
    categoryName: "Sports & Fitness",
    categoryBadge: "SPORTS",
    statusBadge: "Inter-Dept",
    statusType: "mint",
    subBadge: "Varsity Cup",
    dateDisplay: "Dec 01, 2025 • 8:30 AM",
    actionLabel: "Register Free",
    organizer: "Sports Federation & Student Gymkhana",
    organizerIcon: "🏆",
    description: "Cheer for your department! 16 departments compete for the prestigious Chancellor's Cup in track & field, cricket, and futsal.",
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
    banner: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=75",
    tags: ["Sports", "Athletics", "Football", "Trophy"],
    perks: ["Championship Medals & Trophy", "Department Pride Points", "Sports Energy Kit"],
    agenda: [
      { time: "08:30 AM", title: "Torch Relay & Opening March Past" },
      { time: "09:30 AM", title: "Track & Field Finals" },
      { time: "02:00 PM", title: "Futsal Championship Match" },
      { time: "05:00 PM", title: "Awards & Chancellor's Cup Ceremony" }
    ],
    rules: [
      "Players must represent their enrolled departmental batch.",
      "Standard university sports dress code mandatory."
    ]
  },
  {
    id: "evt-105",
    title: "Zero-Gas Lab: Clean Mobility Sprint",
    category: "workshop",
    categoryName: "Workshops",
    categoryBadge: "WORKSHOP",
    statusBadge: "Certification",
    statusType: "sky",
    subBadge: "Zero-Gas Lab",
    dateDisplay: "Dec 05, 2025 • 2:00 PM",
    actionLabel: "Register Free",
    organizer: "Automotive & Sustainability Guild",
    organizerIcon: "⚡",
    description: "Hands-on EV battery modeling, regenerative braking design, and micro-grid integration workshop with real vehicle telemetry.",
    date: "2026-11-02",
    time: "02:00 PM - 06:00 PM",
    venue: "Zero-Gas Lab, Green Energy Block",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Solo",
    maxCapacity: 80,
    registeredCount: 76,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=75",
    tags: ["EV", "Sustainability", "Hardware", "CleanTech"],
    perks: ["Industry Micro-Certification", "Lab Testing Hardware Access", "Free Project Kit"],
    agenda: [
      { time: "02:00 PM", title: "EV Powertrain Architecture" },
      { time: "03:30 PM", title: "Battery Thermal Simulation Lab" },
      { time: "05:15 PM", title: "Prototype Track Testing" }
    ],
    rules: [
      "Closed-toe safety shoes mandatory in lab.",
      "Bring laptop for simulation software setup."
    ]
  },
  {
    id: "evt-106",
    title: "Brand & UI Design Systems Masterclass",
    category: "workshop",
    categoryName: "Workshops",
    categoryBadge: "WORKSHOP",
    statusBadge: "Hands-on",
    statusType: "orange",
    subBadge: "Portfolio Review",
    dateDisplay: "Dec 09, 2025 • 4:00 PM",
    actionLabel: "Register Free",
    organizer: "Design Guild & Creative Media",
    organizerIcon: "🎨",
    description: "Hands-on editorial design workshop: building cohesive token systems, typography contrast, Figma auto-layouts, and portfolio critiques.",
    date: "2026-11-06",
    time: "04:00 PM - 07:00 PM",
    venue: "Design Studio 02 & Digital Media Hub",
    isOnline: false,
    price: 0,
    priceText: "Free",
    teamType: "Solo",
    maxCapacity: 100,
    registeredCount: 92,
    isFeatured: false,
    banner: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=75",
    tags: ["Design", "UI/UX", "Figma", "DesignSystems"],
    perks: ["Portfolio Review by Senior Designers", "Figma Design Token Kit", "Verified Certificate"],
    agenda: [
      { time: "04:00 PM", title: "Foundations of Modern Tactile Minimalism" },
      { time: "05:00 PM", title: "Live Exercise: Constructing a 5-Color System" },
      { time: "06:15 PM", title: "1-on-1 Student Portfolio Reviews" }
    ],
    rules: [
      "Bring laptop with Figma installed.",
      "Bring 1-2 design projects for live review."
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
  "🤖 Free AI Workshop cloud credits (₹2,000) sponsored by Tech Innovation Lab."
];

const INITIAL_REGISTRATIONS = [
  {
    ticketId: "UP-2026-8540",
    eventId: "evt-101",
    attendeeName: "Ankit Ghosh",
    fullName: "Ankit Ghosh",
    rollNo: "22BCS10043",
    email: "ankit.ghosh@campus.edu",
    dept: "Computer Science & Engineering",
    year: "3rd Year",
    timestamp: "2026-10-03T10:14:00Z",
    isCheckedIn: true,
    checkedIn: true
  },
  {
    ticketId: "UP-2026-7249",
    eventId: "evt-102",
    attendeeName: "Ankit Ghosh",
    fullName: "Ankit Ghosh",
    rollNo: "22BCS10043",
    email: "ankit.ghosh@campus.edu",
    dept: "Computer Science & Engineering",
    year: "3rd Year",
    timestamp: "2026-10-04T14:22:00Z",
    isCheckedIn: true,
    checkedIn: true
  },
  {
    ticketId: "UP-2026-5524",
    eventId: "evt-103",
    attendeeName: "Ankit Ghosh",
    fullName: "Ankit Ghosh",
    rollNo: "22BCS10043",
    email: "ankit.ghosh@campus.edu",
    dept: "Computer Science & Engineering",
    year: "3rd Year",
    timestamp: "2026-10-06T11:05:00Z",
    isCheckedIn: true,
    checkedIn: true
  },
  {
    ticketId: "UP-2026-1547",
    eventId: "evt-104",
    attendeeName: "Ankit Ghosh",
    fullName: "Ankit Ghosh",
    rollNo: "22BCS10043",
    email: "ankit.ghosh@campus.edu",
    dept: "Computer Science & Engineering",
    year: "3rd Year",
    timestamp: "2026-10-07T16:40:00Z",
    isCheckedIn: true,
    checkedIn: true
  },
  {
    ticketId: "UP-2026-7972",
    eventId: "evt-105",
    attendeeName: "Ankit Ghosh",
    fullName: "Ankit Ghosh",
    rollNo: "22BCS10043",
    email: "ankit.ghosh@campus.edu",
    dept: "Computer Science & Engineering",
    year: "3rd Year",
    timestamp: "2026-10-08T09:30:00Z",
    isCheckedIn: true,
    checkedIn: true
  },
  {
    ticketId: "UP-2026-3062",
    eventId: "evt-106",
    attendeeName: "Ankit Ghosh",
    fullName: "Ankit Ghosh",
    rollNo: "22BCS10043",
    email: "ankit.ghosh@campus.edu",
    dept: "Computer Science & Engineering",
    year: "3rd Year",
    timestamp: "2026-10-09T15:10:00Z",
    isCheckedIn: true,
    checkedIn: true
  }
];

