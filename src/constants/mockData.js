export const MOCK_PROJECTS = [
  {
    id: "PRJ-1001",
    name: "City Network Upgrade",
    budget: 420000,
    deadline: "2026-05-02",
    requirements:
      "Upgrade municipal network backbone, improve district redundancy, and deploy secure access controls across 40 government offices.",
    status: "Active",
  },
  {
    id: "PRJ-1002",
    name: "Public Health Equipment",
    budget: 185000,
    deadline: "2026-04-26",
    requirements:
      "Supply and commission medical-grade devices for clinics, including maintenance agreements and operator training.",
    status: "Active",
  },
  {
    id: "PRJ-1003",
    name: "Municipal ERP Migration",
    budget: 610000,
    deadline: "2026-04-18",
    requirements:
      "Migrate legacy finance and procurement systems to an integrated ERP platform with data validation and rollback support.",
    status: "Closed",
  },
  {
    id: "PRJ-1004",
    name: "Road Monitoring Sensors",
    budget: 295000,
    deadline: "2026-04-14",
    requirements:
      "Deploy IoT traffic sensors and monitoring software for real-time congestion and maintenance alerts.",
    status: "Awarded",
  },
  {
    id: "PRJ-1005",
    name: "Water Analytics Platform",
    budget: 510000,
    deadline: "2026-04-11",
    requirements:
      "Build analytics dashboards for water quality metrics and anomaly detection with monthly compliance reports.",
    status: "Awarded",
  },
];

export const MOCK_SUPPLIERS = [
  {
    id: "SUP-001",
    name: "Nadia Rahman",
    company: "Apex InfraTech",
    email: "nadia@apexinfra.com",
    registeredDate: "2026-03-21",
    status: "Pending",
  },
  {
    id: "SUP-002",
    name: "Rizwan Malik",
    company: "Vertex Systems",
    email: "rizwan@vertexsys.io",
    registeredDate: "2026-03-19",
    status: "Approved",
  },
  {
    id: "SUP-003",
    name: "Sara Khan",
    company: "Nova Procurement Labs",
    email: "sara@novalabs.co",
    registeredDate: "2026-03-18",
    status: "Pending",
  },
  {
    id: "SUP-004",
    name: "Irfan Ahmed",
    company: "Blue Grid Works",
    email: "irfan@bluegridworks.com",
    registeredDate: "2026-03-15",
    status: "Rejected",
  },
  {
    id: "SUP-005",
    name: "Amina Yusuf",
    company: "Crestline Dynamics",
    email: "amina@crestline.io",
    registeredDate: "2026-03-10",
    status: "Approved",
  },
];

export const MOCK_BIDS = [
  {
    id: "BID-9001",
    supplierName: "Apex InfraTech",
    projectName: "City Network Upgrade",
    bidAmount: 398000,
    proposal:
      "We propose phased deployment in 3 milestones with zero-downtime migration windows, centralized network monitoring, and post-implementation optimization for 12 months.",
    submittedAt: "2026-04-10 09:22",
    status: "Under Review",
  },
  {
    id: "BID-9002",
    supplierName: "Vertex Systems",
    projectName: "City Network Upgrade",
    bidAmount: 405000,
    proposal:
      "Our team will deliver resilient architecture, SD-WAN integration, and compliance-ready logs with dedicated support engineers for all rollout stages.",
    submittedAt: "2026-04-10 12:47",
    status: "Submitted",
  },
  {
    id: "BID-9003",
    supplierName: "Nova Procurement Labs",
    projectName: "Public Health Equipment",
    bidAmount: 176500,
    proposal:
      "Complete equipment package includes installation, staff training, and preventive maintenance schedules aligned with medical safety standards.",
    submittedAt: "2026-04-09 16:15",
    status: "Under Review",
  },
  {
    id: "BID-9004",
    supplierName: "Blue Grid Works",
    projectName: "Public Health Equipment",
    bidAmount: 182000,
    proposal:
      "Proposal includes long-term service contracts, replacement guarantees, and performance benchmarks verified monthly by quality engineers.",
    submittedAt: "2026-04-09 17:58",
    status: "Submitted",
  },
  {
    id: "BID-9005",
    supplierName: "Crestline Dynamics",
    projectName: "Water Analytics Platform",
    bidAmount: 498000,
    proposal:
      "We will provide a full-stack analytics platform with event-driven ingestion, anomaly detection, and automated compliance reporting dashboards.",
    submittedAt: "2026-04-07 10:31",
    status: "Under Review",
  },
];

export const MOCK_BLOCKCHAIN_RECORDS = [
  {
    id: "ABR-001",
    projectId: "PRJ-1004",
    winner: "Blue Grid Works",
    bidAmount: "$289,000",
    timestamp: "2026-04-14 14:10 UTC",
    hash: "0x8f21c7ad4e51b2a6f3c1d9e2a8b8b5d4c2e1f7a9d6b3c4e5f6a1b2c3d4e5f6a7",
  },
  {
    id: "ABR-002",
    projectId: "PRJ-1005",
    winner: "Crestline Dynamics",
    bidAmount: "$498,000",
    timestamp: "2026-04-11 10:42 UTC",
    hash: "0x3b22a8df9d10c7e4b0aa6c21f42be71d65ab4eaed6ffad0fa61353fd81ef2a43",
  },
  {
    id: "ABR-003",
    projectId: "PRJ-0998",
    winner: "Vertex Systems",
    bidAmount: "$211,000",
    timestamp: "2026-03-29 08:16 UTC",
    hash: "0x9c0e5ab3d857149df57c8f284fdaa2637f0e43dab8f65f6c69b1e31b8dbfb71a",
  },
  {
    id: "ABR-004",
    projectId: "PRJ-0984",
    winner: "Apex InfraTech",
    bidAmount: "$332,000",
    timestamp: "2026-03-21 12:03 UTC",
    hash: "0x5b7a92beccb2bb66cb55fd21367a8de2a7ea93b0ed912f7f4f0f5f4ab3aa9ccd",
  },
];

export const MOCK_SUPPLIER_PROJECTS = [
  {
    id: "SP-001",
    name: "Municipal Fiber Expansion",
    budget: 215000,
    deadline: "2026-04-24",
    requirements:
      "Install high-capacity fiber links across district offices, with secure routing and failover support.",
    status: "Active",
    deadlineSoon: false,
    bidSubmitted: false,
  },
  {
    id: "SP-002",
    name: "Hospital Supply Chain System",
    budget: 230000,
    deadline: "2026-04-17",
    requirements:
      "Deploy an automated supply chain portal for hospital inventory tracking and procurement coordination.",
    status: "Active",
    deadlineSoon: true,
    bidSubmitted: true,
  },
  {
    id: "SP-003",
    name: "Smart Traffic Analytics",
    budget: 185000,
    deadline: "2026-04-15",
    requirements:
      "Provide analytics dashboards and edge devices to monitor traffic flow and congestion patterns.",
    status: "Active",
    deadlineSoon: true,
    bidSubmitted: false,
  },
  {
    id: "SP-004",
    name: "Water Meter Replacement",
    budget: 170000,
    deadline: "2026-04-29",
    requirements:
      "Replace legacy meters with digital units and set up centralized monitoring for consumption trends.",
    status: "Active",
    deadlineSoon: false,
    bidSubmitted: true,
  },
  {
    id: "SP-005",
    name: "School Network Modernization",
    budget: 95000,
    deadline: "2026-04-30",
    requirements:
      "Modernize network infrastructure in public schools with secure Wi-Fi and admin controls.",
    status: "Active",
    deadlineSoon: false,
    bidSubmitted: false,
  },
];

export const MOCK_SUPPLIER_BIDS = [
  {
    id: "SB-001",
    projectName: "Hospital Supply Chain System",
    bidAmount: 228000,
    proposal:
      "We will deliver a secure procurement workflow with phased rollout, training, and post-launch support for hospital staff.",
    submittedAt: "2026-04-10 09:22",
    status: "Under Review",
    companyName: "Apex InfraTech",
  },
  {
    id: "SB-002",
    projectName: "Water Meter Replacement",
    bidAmount: 173500,
    proposal:
      "Our team will replace meters in batches, validate readings, and provide a dashboard for anomaly detection.",
    submittedAt: "2026-04-09 11:40",
    status: "Submitted",
    companyName: "Apex InfraTech",
  },
  {
    id: "SB-003",
    projectName: "Smart Traffic Analytics",
    bidAmount: 179000,
    proposal:
      "We propose a modular analytics stack with live reporting, device management, and operational handover.",
    submittedAt: "2026-04-08 15:12",
    status: "Selected",
    companyName: "Apex InfraTech",
  },
  {
    id: "SB-004",
    projectName: "City Network Upgrade",
    bidAmount: 408000,
    proposal:
      "An engineered network upgrade plan with staged deployment, security hardening, and support coverage.",
    submittedAt: "2026-04-07 13:05",
    status: "Rejected",
    companyName: "Apex InfraTech",
  },
];

export const MOCK_RESULTS = [
  {
    id: "SR-001",
    projectName: "Smart Traffic Analytics",
    winner: "Apex InfraTech",
    bidAmount: "₱179,000",
    awardDate: "2026-04-12",
    hash: "0x7a41b9b8e1d31f3fa8d1a7bcab1f9d1e6bf1d3c8a2f1a0b5c7d98e1123ffab01",
    won: true,
  },
  {
    id: "SR-002",
    projectName: "Hospital Supply Chain System",
    winner: "Blue Grid Works",
    bidAmount: "₱230,000",
    awardDate: "2026-04-11",
    hash: "0x4f3c2b1a9d8e7f6c5b4a3928171e0d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a2",
    won: false,
  },
];

export const MOCK_USERS = [
  { id: "1", fullName: "Administrator", email: "admin@eprocurement.gov", role: "admin", status: "Active", createdAt: "2026-01-01" },
  { id: "2", fullName: "Supplier User", email: "supplier@eprocurement.gov", role: "supplier", status: "Active", createdAt: "2026-02-10" },
  { id: "3", fullName: "Nadia Rahman", email: "nadia@apexinfra.com", role: "supplier", status: "Active", createdAt: "2026-03-01" },
  { id: "4", fullName: "Irfan Ahmed", email: "irfan@bluegridworks.com", role: "supplier", status: "Inactive", createdAt: "2026-03-05" },
  { id: "5", fullName: "Public Viewer", email: "viewer@eprocurement.gov", role: "viewer", status: "Active", createdAt: "2026-03-10" },
  { id: "6", fullName: "Sara Khan", email: "sara@novalabs.co", role: "supplier", status: "Active", createdAt: "2026-03-18" },
];

export const MOCK_NOTIFICATIONS = {
  admin: [
    { id: 1, icon: "Users", color: "yellow", title: "New supplier registered", subtitle: "Nadia Rahman from Apex InfraTech", time: "5 min ago", read: false },
    { id: 2, icon: "FileText", color: "emerald", title: "New bid submitted", subtitle: "City Network Upgrade — ₱420,000", time: "1 hr ago", read: false },
    { id: 3, icon: "Clock", color: "red", title: "Project deadline soon", subtitle: "Municipal ERP Migration — 2 days left", time: "3 hr ago", read: true },
  ],
  supplier: [
    { id: 1, icon: "Award", color: "emerald", title: "Bid status updated", subtitle: "Your bid is now Under Review", time: "2 hr ago", read: false },
    { id: 2, icon: "FolderOpen", color: "blue", title: "New project posted", subtitle: "Water Analytics Platform is now open", time: "1 day ago", read: true },
  ],
};
