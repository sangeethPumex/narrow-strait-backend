export const COMPANY_PROFILE = {
  name: 'Narrow Strait',
  tagline: 'Data & intelligence analytics for complex enterprises',
  founded: 'January 2025',
  stage: 'Pre-Series A',
  raised: '$1M (Canadian Capital Fund)',
  
  whatWeDo: `Narrow Strait builds real-time data analytics and intelligence platforms 
for enterprises operating in high-stakes, data-dense environments. We're building what 
Palantir should have been — faster deployment cycles, modular architecture, and designed 
for both financial markets and critical infrastructure. Our platforms don't just visualize 
data; they turn operational chaos into executable intelligence.`,

  vision: `To surpass Palantir in both scope and market penetration. We're starting with 
financial intelligence and defence tech — two sectors where milliseconds and accuracy 
determine billions in outcomes. From there, we expand into energy, logistics, and any 
industry still making critical decisions on gut feel instead of ground truth.`,

  founder: {
    name: 'Sangeeth',
    age: 24,
    role: 'CEO & Founder',
    background: `Built Narrow Strait at 23 as a technical founder who codes, sells, and 
operates. Started as a full-stack engineer obsessed with asymmetric leverage through 
technology. Saw an opening where Palantir was too slow and enterprise tools were too 
fragmented — built Narrow Strait to fill that gap. Currently leading AWS pricing 
negotiations personally while closing enterprise customers and driving product roadmap.`
  },

  ownership: {
    summary: `Sangeeth holds majority control at 80%. Remaining 20% split between early 
investor and core team. Decision-making authority is centralized with founder — designed 
to move fast and avoid death-by-committee.`,
    breakdown: [
      { name: 'Sangeeth (CEO & Founder)', stake: '80%' },
      { name: 'Canadian Capital Fund (Seed Investor)', stake: '10%' },
      { name: 'Early Team / Advisors', stake: '10%' },
    ],
    notes: `Sangeeth will not dilute below 51% in any funding scenario. Series A structure 
is being designed to preserve founder control while bringing in strategic capital. Any 
equity grants to team or advisors come from the existing 10% allocation.`
  },

  headquarters: 'Vancouver, Canada',
  incorporation: 'Canada (C-Corp structure)',
  operatingModel: 'Core leadership in Vancouver office; engineering and ops distributed across North America, India and london',

  // === PRODUCTS ===
  products: [
    {
      name: 'High Tide',
      category: 'Financial Intelligence Platform',
      description: `Real-time financial modeling and data analytics tool purpose-built for 
hedge funds, trading desks, and investment banks. High Tide integrates directly with 
Bloomberg Terminal and pulls live market data, alternative datasets, and proprietary 
signals into a unified modeling environment. Designed for traders and analysts who need 
faster insights than Excel can deliver and more control than off-the-shelf BI tools allow.`,
      features: [
        'Direct Bloomberg Terminal integration',
        'Live market data ingestion (equities, fixed income, derivatives)',
        'Custom financial modeling with Python/SQL backends',
        'Risk scenario analysis and stress testing',
        'Collaboration layer for trading teams',
      ],
      customers: 'Hedge funds, prop trading firms, investment banks',
      status: 'Production — 4 paying customers, actively expanding'
    },
    {
      name: 'Wetland',
      category: 'Defence & Critical Infrastructure Intelligence',
      description: `Autonomous decision-support platform designed for defence, intelligence, 
and critical infrastructure operators. Wetland ingests trillions of data points from sensors, 
satellites, communications, and operational systems — then surfaces actionable intelligence 
in real time. Built for scenarios where human decision-making is too slow or data volume 
is too high. Think: threat detection, logistics optimization, and operational command.`,
      features: [
        'Trillions of data points ingested per day',
        'Autonomous pattern recognition and anomaly detection',
        'Real-time decision recommendations for operators',
        'Multi-source intelligence fusion (SIGINT, GEOINT, OSINT)',
        'Deployable in air-gapped or classified environments',
      ],
      customers: 'Defence contractors, government agencies, critical infrastructure providers',
      status: 'Pilot phase — 1 paying customer (defence tech), expanding pipeline'
    }
  ],

  // === CUSTOMER BASE ===
  customers: {
    total: 5,
    pilot: 5,
    converted: 4,
    paying: 5,
    breakdown: [
      { name: 'Greylock Capital (Hedge Fund)', product: 'High Tide', status: 'Paying', since: 'Feb 2025' },
      { name: 'Atalaya Capital Management (Hedge Fund)', product: 'High Tide', status: 'Paying', since: 'Mar 2025' },
      { name: 'Autonomy Defence Systems (Defence Tech)', product: 'Wetland', status: 'Paying', since: 'Jan 2025' },
      { name: 'Citrine Capital (Hedge Fund)', product: 'High Tide', status: 'Paying', since: 'Feb 2025' },
      { name: 'Redstone Analytics (Prop Trading)', product: 'High Tide', status: 'Pilot → Converted', since: 'Mar 2026' },
    ],
    pipeline: [
      { name: 'Goldman Sachs', product: 'High Tide', status: 'In Talks', stage: 'Technical evaluation + procurement review' },
      { name: 'JP Morgan', product: 'High Tide', status: 'In Talks', stage: 'Proof-of-concept phase' },
    ],
    target: `Close Goldman or JP Morgan + 3 more enterprise deals → triggers Series A raise`,
    targetMarket: `Financial services (hedge funds, banks, prop desks) and defence/intelligence. 
Expanding into energy and logistics in 2026.`
  },

  // === COMPETITIVE LANDSCAPE ===
  competitors: ['Palantir', 'Databricks', 'Snowflake', 'Tableau', 'Splunk'],
  differentiator: `We deploy 10x faster than Palantir with modular, industry-specific 
products instead of one-size-fits-all platforms. High Tide is built for finance — not 
retrofitted from a government intel tool. Wetland is purpose-built for defence operations, 
not a generic data lake with a UI slapped on top. Our customers go live in weeks, not quarters.`,

  // === TEAM ===
  teamSize: 120,
keyHires: [
  // C-LEVEL
  {
    name: 'Sangeeth',
    role: 'CEO & Founder',
    reportsTo: null,
    manages: 'Overall company, product direction, key accounts (Goldman, JP Morgan), AWS negotiations',
    directReports: [
      'Priya Patel (CFO)',
      'James Park (COO)',
      'Marcus Wei (CTO)',
      'Alex Rivera (General Counsel)',
      'Amir Khan (SVP, Product & Strategy)'
    ],
  },
  {
    name: 'Priya Patel',
    role: 'CFO',
    reportsTo: 'CEO',
    manages: 'Finance, FP&A, fundraising support, cash runway, AWS spend economics',
    directReports: [
      'Sara Lopez (SVP, Finance & Ops)'
    ],
  },
  {
    name: 'James Park',
    role: 'COO',
    reportsTo: 'CEO',
    manages: 'Go-to-market, sales, customer success, defence & government delivery',
    directReports: [
      'David Chen (SVP, Revenue)',
      'Rachel Kim (SVP, Defence & Government Programs)'
    ],
  },
  {
    name: 'Marcus Wei',
    role: 'CTO',
    reportsTo: 'CEO',
    manages: 'Engineering, data platform, security, High Tide & Wetland technical roadmap',
    directReports: [
      'Ananya Rao (SVP, Engineering & Platform)'
    ],
  },
  {
    name: 'Alex Rivera',
    role: 'General Counsel',
    reportsTo: 'CEO',
    manages: 'Legal, contracts, regulatory, export controls, defence/compliance risk',
    directReports: [
      'Emily Hart (SVP, Legal & Risk)'
    ],
  },

  // SENIOR VPs
  {
    name: 'Amir Khan',
    role: 'SVP, Product & Strategy',
    reportsTo: 'CEO',
    manages: 'Product management for High Tide and Wetland, pricing, positioning, roadmap',
    directReports: [
      'Lisa Wong (VP, High Tide Product)',
      'Omar Siddiq (VP, Wetland Product)'
    ],
  },
  {
    name: 'Sara Lopez',
    role: 'SVP, Finance & Ops',
    reportsTo: 'CFO',
    manages: 'FP&A, controllership, internal ops, procurement including cloud contracts',
    directReports: [
      'Nikhil Verma (VP, FP&A)',
      'Julia Meyer (Director, Accounting & Reporting)',
      'Tom Becker (Director, Business Operations)'
    ],
  },
  {
    name: 'David Chen',
    role: 'SVP, Revenue',
    reportsTo: 'COO',
    manages: 'Global sales, revenue operations, channel partners',
    directReports: [
      'Maya Patel (VP, Enterprise Sales – Finance)',
      'Chris Long (VP, Enterprise Sales – Defence & Public Sector)',
      'Ivy Morales (VP, Revenue Operations)'
    ],
  },
  {
    name: 'Rachel Kim',
    role: 'SVP, Defence & Government Programs',
    reportsTo: 'COO',
    manages: 'All Wetland deployments, defence and government programs, program managers',
    directReports: [
      'Liam O’Connor (VP, Defence Programs)',
      'Hiro Tanaka (Director, Government Delivery)',
      'Elena Rossi (Director, Strategic Program Management)'
    ],
  },
  {
    name: 'Ananya Rao',
    role: 'SVP, Engineering & Platform',
    reportsTo: 'CTO',
    manages: 'Core platform, data infrastructure, application engineering for High Tide and Wetland',
    directReports: [
      'Victor Huang (VP, Core Platform)',
      'Sofia Martinez (VP, Application Engineering)',
      'Ben Adler (VP, Data & ML)'
    ],
  },
  {
    name: 'Emily Hart',
    role: 'SVP, Legal & Risk',
    reportsTo: 'General Counsel',
    manages: 'Commercial legal, defence compliance, data/privacy, risk',
    directReports: [
      'Daniel Cho (VP, Commercial Legal)',
      'Hannah Stein (Director, Regulatory & Compliance)',
      'Oksana Petrov (Director, Risk & Policy)'
    ],
  },

  // VPs
  {
    name: 'Lisa Wong',
    role: 'VP, High Tide Product',
    reportsTo: 'SVP, Product & Strategy',
    manages: 'Product for High Tide across hedge funds, banks, and prop shops',
    directReports: [
      'Ethan Brooks (Director, High Tide – Buy Side)',
      'Noor Khalid (Director, High Tide – Sell Side)'
    ],
  },
  {
    name: 'Omar Siddiq',
    role: 'VP, Wetland Product',
    reportsTo: 'SVP, Product & Strategy',
    manages: 'Product for Wetland across defence and critical infrastructure',
    directReports: [
      'Grace Park (Director, Wetland – Defence)',
      'Jonas Keller (Director, Wetland – Critical Infrastructure)'
    ],
  },
  {
    name: 'Nikhil Verma',
    role: 'VP, FP&A',
    reportsTo: 'SVP, Finance & Ops',
    manages: 'Planning, forecasting, board metrics, unit economics',
    directReports: [
      'ICs: 6'
    ],
  },
  {
    name: 'Maya Patel',
    role: 'VP, Enterprise Sales – Finance',
    reportsTo: 'SVP, Revenue',
    manages: 'Sales into hedge funds, banks, trading firms',
    directReports: [
      'ICs: 10'
    ],
  },
  {
    name: 'Chris Long',
    role: 'VP, Enterprise Sales – Defence & Public Sector',
    reportsTo: 'SVP, Revenue',
    manages: 'Sales into defence primes, government, critical infrastructure',
    directReports: [
      'ICs: 8'
    ],
  },
  {
    name: 'Ivy Morales',
    role: 'VP, Revenue Operations',
    reportsTo: 'SVP, Revenue',
    manages: 'Pipeline, tooling, forecasting, comp plans',
    directReports: [
      'ICs: 5'
    ],
  },
  {
    name: 'Liam O’Connor',
    role: 'VP, Defence Programs',
    reportsTo: 'SVP, Defence & Government Programs',
    manages: 'Programme managers for defence and intelligence accounts',
    directReports: [
      'ICs: 6'
    ],
  },
  {
    name: 'Victor Huang',
    role: 'VP, Core Platform',
    reportsTo: 'SVP, Engineering & Platform',
    manages: 'Core services, auth, multi-tenant control plane, infra',
    directReports: [
      'ICs: 10'
    ],
  },
  {
    name: 'Sofia Martinez',
    role: 'VP, Application Engineering',
    reportsTo: 'SVP, Engineering & Platform',
    manages: 'Feature delivery for High Tide and Wetland frontends & workflows',
    directReports: [
      'ICs: 12'
    ],
  },
  {
    name: 'Ben Adler',
    role: 'VP, Data & ML',
    reportsTo: 'SVP, Engineering & Platform',
    manages: 'Data pipelines, ML models, anomaly detection, decision engines',
    directReports: [
      'ICs: 9'
    ],
  },
  {
    name: 'Daniel Cho',
    role: 'VP, Commercial Legal',
    reportsTo: 'SVP, Legal & Risk',
    manages: 'Enterprise MSAs, DPAs, complex procurement with banks and defence',
    directReports: [
      'ICs: 4'
    ],
  },

  // DIRECTORS (NAMES + TEAM SIZE ONLY)
  {
    name: 'Julia Meyer',
    role: 'Director, Accounting & Reporting',
    reportsTo: 'SVP, Finance & Ops',
    manages: 'Close, reporting, controls',
    teamSize: 3,
  },
  {
    name: 'Tom Becker',
    role: 'Director, Business Operations',
    reportsTo: 'SVP, Finance & Ops',
    manages: 'Internal ops, OKRs, special projects',
    teamSize: 4,
  },
  {
    name: 'Ethan Brooks',
    role: 'Director, High Tide – Buy Side',
    reportsTo: 'VP, High Tide Product',
    manages: 'Hedge fund and asset manager use cases',
    teamSize: 5,
  },
  {
    name: 'Noor Khalid',
    role: 'Director, High Tide – Sell Side',
    reportsTo: 'VP, High Tide Product',
    manages: 'Investment bank and broker-dealer workflows',
    teamSize: 5,
  },
  {
    name: 'Grace Park',
    role: 'Director, Wetland – Defence',
    reportsTo: 'VP, Wetland Product',
    manages: 'Battle management, ISR, mission planning modules',
    teamSize: 6,
  },
  {
    name: 'Jonas Keller',
    role: 'Director, Wetland – Critical Infrastructure',
    reportsTo: 'VP, Wetland Product',
    manages: 'Energy, ports, logistics infra use cases',
    teamSize: 4,
  },
  {
    name: 'Hiro Tanaka',
    role: 'Director, Government Delivery',
    reportsTo: 'SVP, Defence & Government Programs',
    manages: 'On-site deployments, gov integration teams',
    teamSize: 6,
  },
  {
    name: 'Elena Rossi',
    role: 'Director, Strategic Program Management',
    reportsTo: 'SVP, Defence & Government Programs',
    manages: 'Cross-program governance and timelines',
    teamSize: 3,
  },
  {
    name: 'Hannah Stein',
    role: 'Director, Regulatory & Compliance',
    reportsTo: 'SVP, Legal & Risk',
    manages: 'Regulatory, export control, privacy',
    teamSize: 3,
  },
  {
    name: 'Oksana Petrov',
    role: 'Director, Risk & Policy',
    reportsTo: 'SVP, Legal & Risk',
    manages: 'Risk frameworks, internal policy, ethics reviews',
    teamSize: 3,
  },
],

  // === STRATEGIC INITIATIVES ===
  currentInitiatives: [
    {
      initiative: 'AWS Cost Optimization',
      lead: 'Sangeeth (CEO)',
      status: 'Ongoing negotiations',
      context: `Narrow Strait runs heavy compute workloads for both High Tide and Wetland. 
Current AWS spend is ~$40K/month and projected to hit $100K+ as customer base scales. 
Sangeeth is negotiating directly with AWS for startup credits, reserved instance discounts, 
and custom pricing on EC2/RDS. AWS is not budging yet — exploring backup options with GCP 
and Azure if talks stall.`
    },
    {
      initiative: 'Defence Tech Expansion',
      lead: 'Sangeeth (CEO)',
      status: 'Internal debate',
      context: `Sangeeth sees defence as a massive TAM with long sales cycles but high margins 
and stickiness. Wetland is already live with one defence contractor, and there's pipeline 
interest from government agencies. However, CFO Priya is opposed — citing regulatory complexity, 
longer cash conversion cycles, and potential investor hesitation. This is an unresolved tension 
heading into Series A planning.`
    },
    {
      initiative: 'Goldman Sachs + JP Morgan Deals',
      lead: 'Sangeeth + Sales',
      status: 'Active negotiations',
      context: `Goldman is in technical evaluation for High Tide (trading desk use case). 
JP Morgan is running a proof-of-concept for risk analytics. Closing either deal would be 
a massive credibility unlock and likely trigger institutional interest in Series A. Both 
banks move slow — expect 4-6 month sales cycles.`
    }
  ],

  // === FUNDING & MILESTONES ===
  nextMilestone: {
    target: 'Close 5 more paying enterprise customers (including Goldman or JP Morgan)',
    trigger: 'Series A fundraise',
    timeline: 'Q3 2026',
    raise: '$8-12M at $40-50M pre-money valuation',
    use: 'Scale sales team, expand Wetland for government contracts, hire senior leadership (CTO, VP Sales)'
  },

  risks: [
    'AWS cost structure unsustainable without discounts — may force cloud migration',
    'Defence expansion creates operational complexity and CFO-CEO misalignment',
    'Enterprise sales cycles (Goldman, JP Morgan) could delay Series A timeline',
    'Palantir competitive response if we gain traction in their verticals',
  ],

  unfairAdvantages: [
    'Sangeeth as technical founder who can sell, build, and operate',
    'Modular product architecture — High Tide and Wetland share core infrastructure',
    '4 paying customers in 2 months — proof of product-market fit',
    'Direct Bloomberg integration and defence-grade data pipeline as moats',
  ],
};
