// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\constants\mockData.js
export const MOCK_PROJECTS = [
  { id: "1", title: "City Network Upgrade", name: "City Network Upgrade", budget: 420000, deadline: "2026-05-02", requirements: "Upgrade municipal network backbone, improve district routing and fiber cabling across 12 zones.", status: "Active", createdAt: "2026-03-01" },
  { id: "2", title: "Public Health Equipment", name: "Public Health Equipment", budget: 185000, deadline: "2026-04-26", requirements: "Supply and commission medical-grade devices for clinics including ECG, BP monitors, and sterilizers.", status: "Active", createdAt: "2026-03-05" },
  { id: "3", title: "Municipal ERP Migration", name: "Municipal ERP Migration", budget: 610000, deadline: "2026-04-18", requirements: "Migrate legacy finance and procurement systems to an integrated cloud ERP solution.", status: "Closed", createdAt: "2026-02-20" },
  { id: "4", title: "Road Monitoring Sensors", name: "Road Monitoring Sensors", budget: 295000, deadline: "2026-04-14", requirements: "Deploy IoT traffic sensors and monitoring software for 8 major intersections.", status: "Awarded", createdAt: "2026-02-10" },
  { id: "5", title: "Water Analytics Platform", name: "Water Analytics Platform", budget: 510000, deadline: "2026-04-11", requirements: "Build analytics dashboards for water quality metrics across 5 treatment facilities.", status: "Awarded", createdAt: "2026-02-01" },
];

export const MOCK_BIDS = [
  { id: "b1", projectId: "4", projectTitle: "Road Monitoring Sensors", projectName: "Road Monitoring Sensors", supplierName: "Apex InfraTech", company: "Apex InfraTech", bidAmount: 285000, proposal: "We propose deploying 48 smart IoT sensors with real-time cloud dashboard, 24/7 monitoring, and 2-year maintenance warranty.", status: "Selected", submittedAt: "2026-03-10", recorded: true },
  { id: "b2", projectId: "4", projectTitle: "Road Monitoring Sensors", projectName: "Road Monitoring Sensors", supplierName: "Vertex Systems", company: "Vertex Systems", bidAmount: 292000, proposal: "Full sensor deployment with AI-based traffic analysis and mobile app integration.", status: "Rejected", submittedAt: "2026-03-11", recorded: false },
  { id: "b3", projectId: "5", projectTitle: "Water Analytics Platform", projectName: "Water Analytics Platform", supplierName: "Nova Procurement Labs", company: "Nova Procurement Labs", bidAmount: 498000, proposal: "Custom water analytics platform with React dashboard, real-time alerts, and predictive maintenance AI.", status: "Selected", submittedAt: "2026-03-08", recorded: true },
  { id: "b4", projectId: "1", projectTitle: "City Network Upgrade", projectName: "City Network Upgrade", supplierName: "Blue Grid Works", company: "Blue Grid Works", bidAmount: 415000, proposal: "Full fiber optic backbone upgrade with redundant routing and 99.9% uptime SLA across all 12 zones.", status: "Under Review", submittedAt: "2026-03-20", recorded: false },
  { id: "b5", projectId: "2", projectTitle: "Public Health Equipment", projectName: "Public Health Equipment", supplierName: "Crestline Dynamics", company: "Crestline Dynamics", bidAmount: 178000, proposal: "Supply of certified medical devices with installation, calibration, and 18-month warranty.", status: "Submitted", submittedAt: "2026-03-22", recorded: false },
];

export const MOCK_BLOCKCHAIN_RECORDS = [
  { id: "bc1", projectId: "PRJ-004", projectTitle: "Road Monitoring Sensors", winner: "Apex InfraTech", bidAmount: 285000, hash: "0x8f21c7ad4e51b2a6f3c1d9e2a8b8b5d4c2e1f7a9d6b3c4e5f6a1b2c3d4e5f6a7", recordedAt: "2026-04-13 09:45 UTC" },
  { id: "bc2", projectId: "PRJ-005", projectTitle: "Water Analytics Platform", winner: "Nova Procurement Labs", bidAmount: 498000, hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", recordedAt: "2026-04-11 14:22 UTC" },
];

export const MOCK_USERS = [
  { id: "u1", fullName: "Administrator", email: "admin@gmail.com", role: "admin", status: "Active", createdAt: "2026-01-01" },
  { id: "u2", fullName: "Supplier User", email: "supplier@eprocurement.gov", role: "supplier", status: "Active", createdAt: "2026-02-10" },
  { id: "u3", fullName: "Nadia Rahman", email: "nadia@apexinfra.com", role: "supplier", status: "Active", createdAt: "2026-03-01" },
  { id: "u4", fullName: "Irfan Ahmed", email: "irfan@bluegridworks.com", role: "supplier", status: "Inactive", createdAt: "2026-03-05" },
  { id: "u5", fullName: "Sara Khan", email: "sara@novalabs.co", role: "supplier", status: "Active", createdAt: "2026-03-18" },
];

export const MOCK_RESULTS = [
  { id: "r1", projectTitle: "Road Monitoring Sensors", projectName: "Road Monitoring Sensors", winner: "Apex InfraTech", bidAmount: 285000, awardDate: "2026-04-13", hash: "0x8f21c7ad4e51b2a6f3c1d9e2a8b8b5d4c2e1f7a9d6b3c4e5f6a1b2c3d4e5f6a7", isWinner: true },
  { id: "r2", projectTitle: "Water Analytics Platform", projectName: "Water Analytics Platform", winner: "Nova Procurement Labs", bidAmount: 498000, awardDate: "2026-04-11", hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", isWinner: false },
];

export const MOCK_NOTIFICATIONS = {
  admin: [
    { id: 1, icon: "Users", title: "New supplier registered", subtitle: "Nadia Rahman from Apex InfraTech", time: "5m ago", read: false },
    { id: 2, icon: "FileText", title: "New bid submitted", subtitle: "City Network Upgrade - P415,000", time: "1h ago", read: false },
    { id: 3, icon: "Clock", title: "Project deadline soon", subtitle: "Public Health Equipment - 4 days left", time: "3h ago", read: true },
  ],
  supplier: [
    { id: 1, icon: "Award", title: "Bid under review", subtitle: "City Network Upgrade bid is being evaluated", time: "2h ago", read: false },
    { id: 2, icon: "FolderOpen", title: "New project posted", subtitle: "Water Analytics Platform is now open", time: "1d ago", read: true },
  ],
};
