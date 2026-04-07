import { ProjectStatus } from '../utils/projectStatus';

export interface Project {
  id: string;
  createdByUserId: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  sector: string;
  location: string;
  province: string;
  budget: number; // in million USD
  minInvestment: number;
  status: ProjectStatus;
  stage: string;
  description: string;
  image: string;
  highlights: string[];
  returnRate: string;
  timeline: string;
  landArea: string;
  jobs: number;
  followers: number;
  dataCompleteness: number;
  publishedAt?: string;
  sector_tag_color: string;
  documents: Document[];
  qa: QAItem[];
  milestones: Milestone[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export interface QAItem {
  id: string;
  question: string;
  askedBy: string;
  askedAt: string;
  answer?: string;
  answeredAt?: string;
}

export interface Opportunity {
  id: string;
  projectId: string;
  projectName: string;
  investorName: string;
  investorCompany: string;
  investorCountry: string;
  investorType: string;
  amount: number; // million USD
  stage: 'new' | 'review' | 'due_diligence' | 'negotiation' | 'approved' | 'rejected';
  submittedAt: string;
  updatedAt: string;
  notes: string;
  activities: Activity[];
  intakeData: IntakeData;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  by: string;
  at: string;
}

export interface IntakeData {
  investmentStructure: string;
  timeline: string;
  fundSource: string;
  experience: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Permit {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  applicant: string;
  submittedAt: string;
  deadline: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'info_required';
  assignedTo: string;
  comments: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Issue {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  reportedBy?: string;
  reportedAt: string;
  dueDate?: string;
  updatedAt: string;
  category: string;
}

export interface Milestone {
  id: string;
  projectId?: string;
  projectName?: string;
  phase: string;
  description: string;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  processingTime: string;
  fee: string;
  requiredDocs: string[];
  agency: string;
  icon: string;
  color: string;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  applicant: string;
  projectId: string;
  projectName: string;
  submittedAt: string;
  deadline: string;
  status: 'submitted' | 'processing' | 'info_required' | 'approved' | 'rejected';
  slaStatus: 'on_track' | 'at_risk' | 'breached';
  assignedAgency: string;
  documents: string[];
  notes: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

export interface AgencyOfficer {
  id: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
  title: string;
  titleVi?: string;
  titleEn?: string;
  email: string;
  phone: string;
}

export interface Agency {
  id: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
  shortName: string;
  type: string;
  jurisdiction: string;
  level?: number;
  contactPerson: string;
  email: string;
  phone: string;
  activeRequests: number;
  status: 'active' | 'inactive';
  peopleInCharge?: AgencyOfficer[];
}

// ========================= DATA =========================

export const projects: Project[] = [
  {
    id: 'p1',
    createdByUserId: 'u1',
    name: 'Ho Chi Minh City Smart Infrastructure Hub',
    sector: 'Infrastructure',
    location: 'Phường Thủ Đức',
    province: 'Ho Chi Minh City',
    budget: 500,
    minInvestment: 50,
    status: 'processing',
    stage: 'Processing',
    description: 'A landmark smart city development transforming Thu Duc into a world-class urban innovation center with integrated digital infrastructure, smart mobility solutions, and sustainable urban management systems.',
    image: 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtJTIwc21hcnQlMjBjaXR5JTIwaW5mcmFzdHJ1Y3R1cmUlMjB1cmJhbiUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
    highlights: ['PPP Structure Available', 'Tax Incentives 15 Years', '35-year Land Lease', 'Fast-track Licensing'],
    returnRate: '12-15% IRR',
    timeline: '2024-2032',
    landArea: '850 ha',
    jobs: 45000,
    followers: 234,
    dataCompleteness: 95,
    createdAt: '2024-01-08',
    updatedAt: '2024-03-01',
    publishedAt: '2024-01-15',
    sector_tag_color: 'bg-blue-100 text-blue-700',
    documents: [
      { id: 'd1', name: 'Investment Prospectus.pdf', type: 'PDF', size: '4.2 MB', uploadedAt: '2024-01-10' },
      { id: 'd2', name: 'Environmental Impact Assessment.pdf', type: 'PDF', size: '8.7 MB', uploadedAt: '2024-01-08' },
      { id: 'd3', name: 'Land Use Plan.pdf', type: 'PDF', size: '2.1 MB', uploadedAt: '2024-01-05' },
    ],
    qa: [
      { id: 'q1', question: 'What is the minimum equity contribution required for the PPP model?', askedBy: 'Korea Investment Partners', askedAt: '2024-02-01', answer: 'Minimum equity contribution is 30% of total project value for the PPP structure.', answeredAt: '2024-02-03' },
      { id: 'q2', question: 'Are there restrictions on profit repatriation?', askedBy: 'Singapore Capital Group', askedAt: '2024-02-05' },
    ],
    milestones: [
      { id: 'm1', phase: 'Phase 1', description: 'Site Preparation & Foundation', dueDate: '2024-06-30', status: 'completed', progress: 100, completedDate: '2024-06-28' },
      { id: 'm2', phase: 'Phase 2', description: 'Core Infrastructure Build', dueDate: '2025-12-31', status: 'in_progress', progress: 45 },
      { id: 'm3', phase: 'Phase 3', description: 'Smart Systems Integration', dueDate: '2027-06-30', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'p2',
    createdByUserId: 'u2',
    name: 'Ho Chi Minh City Renewable Energy Integration Park',
    sector: 'Energy',
    location: 'Xã Thanh An',
    province: 'Ho Chi Minh City',
    budget: 200,
    minInvestment: 20,
    status: 'processing',
    stage: 'Processing',
    description: 'Integrated renewable energy and storage park in Can Gio, designed to strengthen Ho Chi Minh City\'s clean-energy supply chain with resilient grid integration and urban decarbonization infrastructure.',
    image: 'https://images.unsplash.com/photo-1762381157166-f51ac99ab412?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMHdpbmQlMjByZW5ld2FibGUlMjBlbmVyZ3klMjBmYXJtfGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
    highlights: ['FIT Price Guaranteed', '20-year PPA Available', 'Grid Connection Ready', 'EPC Partners Available'],
    returnRate: '10-13% IRR',
    timeline: '2024-2030',
    landArea: '2,400 ha',
    jobs: 12000,
    followers: 189,
    dataCompleteness: 88,
    createdAt: '2024-01-20',
    updatedAt: '2024-03-10',
    publishedAt: '2024-02-01',
    sector_tag_color: 'bg-green-100 text-green-700',
    documents: [
      { id: 'd4', name: 'Energy Yield Assessment.pdf', type: 'PDF', size: '3.5 MB', uploadedAt: '2024-01-20' },
      { id: 'd5', name: 'Grid Connection Study.pdf', type: 'PDF', size: '1.8 MB', uploadedAt: '2024-01-18' },
    ],
    qa: [
      { id: 'q3', question: 'What is the current FIT tariff rate?', askedBy: 'Vestas Capital', askedAt: '2024-02-10', answer: 'Current solar FIT is 7.09 UScents/kWh and wind is 8.5 UScents/kWh.', answeredAt: '2024-02-12' },
    ],
    milestones: [
      { id: 'm4', phase: 'Phase 1', description: 'Land Clearance & Site Setup', dueDate: '2024-09-30', status: 'completed', progress: 100, completedDate: '2024-09-20' },
      { id: 'm5', phase: 'Phase 2', description: 'Equipment Procurement & Installation', dueDate: '2025-09-30', status: 'in_progress', progress: 60 },
      { id: 'm6', phase: 'Phase 3', description: 'Grid Connection & Commissioning', dueDate: '2026-06-30', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'p3',
    createdByUserId: 'u1',
    name: 'Ho Chi Minh City Advanced Manufacturing Zone',
    sector: 'Manufacturing',
    location: 'Xã Thái Mỹ',
    province: 'Ho Chi Minh City',
    budget: 350,
    minInvestment: 30,
    status: 'published',
    stage: 'Published',
    description: 'Strategic advanced manufacturing and logistics zone in Cu Chi, designed for high-tech industry, urban supply chains, and export-oriented production with fully integrated infrastructure support.',
    image: 'https://images.unsplash.com/photo-1758304480922-4e8e1899e3c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwem9uZSUyMGZhY3RvcnklMjBtYW51ZmFjdHVyaW5nJTIwYWVyaWFsfGVufDF8fHx8MTc3NDM0NDMyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    highlights: ['Airport Adjacency', 'Corporate Tax Holiday 4Y', 'One-Stop Service Center', 'Skilled Labor Pool'],
    returnRate: '14-18% IRR',
    timeline: '2024-2031',
    landArea: '1,200 ha',
    jobs: 85000,
    followers: 312,
    dataCompleteness: 92,
    createdAt: '2024-01-10',
    updatedAt: '2024-02-18',
    publishedAt: '2024-01-20',
    sector_tag_color: 'bg-orange-100 text-orange-700',
    documents: [
      { id: 'd6', name: 'Industrial Zone Master Plan.pdf', type: 'PDF', size: '6.3 MB', uploadedAt: '2024-01-15' },
      { id: 'd7', name: 'Infrastructure Specification.pdf', type: 'PDF', size: '4.1 MB', uploadedAt: '2024-01-12' },
    ],
    qa: [],
    milestones: [
      { id: 'm7', phase: 'Phase 1', description: 'Infrastructure Development Zone A', dueDate: '2025-03-31', status: 'in_progress', progress: 30 },
      { id: 'm8', phase: 'Phase 2', description: 'Zone B & C Development', dueDate: '2027-06-30', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'p4',
    createdByUserId: 'u2',
    name: 'Ho Chi Minh City Riverside Tourism & Convention Complex',
    sector: 'Tourism',
    location: 'Phường An Khánh',
    province: 'Ho Chi Minh City',
    budget: 150,
    minInvestment: 15,
    status: 'published',
    stage: 'Published',
    description: 'Premium integrated tourism, hospitality, and convention development along the Saigon River, combining 5-star accommodation, business events, and entertainment in a flagship Ho Chi Minh City destination.',
    image: 'https://images.unsplash.com/photo-1748741426070-f11ac876e7dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWFjaCUyMHJlc29ydCUyMHRvdXJpc20lMjBob3RlbHxlbnwxfHx8fDE3NzQzNDQzMjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    highlights: ['Prime Beachfront Land', 'Tourism Incentives 10Y', 'Proven Tourism Market', 'Heritage Site Access'],
    returnRate: '11-14% IRR',
    timeline: '2024-2029',
    landArea: '45 ha',
    jobs: 5000,
    followers: 156,
    dataCompleteness: 78,
    createdAt: '2024-01-28',
    updatedAt: '2024-02-14',
    publishedAt: '2024-02-10',
    sector_tag_color: 'bg-purple-100 text-purple-700',
    documents: [
      { id: 'd8', name: 'Tourism Feasibility Study.pdf', type: 'PDF', size: '5.2 MB', uploadedAt: '2024-02-05' },
    ],
    qa: [
      { id: 'q4', question: 'What is the maximum building height restriction near the heritage site?', askedBy: 'IHG Development', askedAt: '2024-02-15' },
    ],
    milestones: [
      { id: 'm9', phase: 'Phase 1', description: 'Hotel & Resort Core', dueDate: '2026-12-31', status: 'pending', progress: 0 },
      { id: 'm10', phase: 'Phase 2', description: 'Convention & Entertainment', dueDate: '2028-06-30', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'p5',
    createdByUserId: 'u1',
    name: 'Ho Chi Minh City Technology Innovation Hub',
    sector: 'Technology',
    location: 'Phường Tăng Nhơn Phú',
    province: 'Ho Chi Minh City',
    budget: 100,
    minInvestment: 10,
    status: 'draft',
    stage: 'Draft',
    description: 'Ho Chi Minh City\'s flagship technology innovation cluster at Saigon Hi-Tech Park, designed to attract R&D centers, semiconductor manufacturing, and deep-tech startups with world-class facilities.',
    image: 'https://images.unsplash.com/photo-1759754160007-3bb1f3604c46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMGh1YiUyMHN0YXJ0dXAlMjBvZmZpY2V8ZW58MXx8fHwxNzc0MzQ0MzIzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    highlights: ['Hi-Tech Zone Benefits', 'University Cluster Access', 'Talent Pipeline', 'R&D Tax Credits'],
    returnRate: '13-17% IRR',
    timeline: '2024-2030',
    landArea: '320 ha',
    jobs: 25000,
    followers: 98,
    dataCompleteness: 65,
    createdAt: '2024-02-26',
    updatedAt: '2024-03-04',
    publishedAt: undefined,
    sector_tag_color: 'bg-cyan-100 text-cyan-700',
    documents: [
      { id: 'd9', name: 'Innovation Hub Concept.pdf', type: 'PDF', size: '3.8 MB', uploadedAt: '2024-03-01' },
    ],
    qa: [],
    milestones: [
      { id: 'm11', phase: 'Phase 1', description: 'R&D Campus Construction', dueDate: '2025-12-31', status: 'pending', progress: 0 },
    ],
  },
  {
    id: 'p6',
    createdByUserId: 'u2',
    name: 'Ho Chi Minh City Agri-Logistics & Processing Complex',
    sector: 'Agriculture',
    location: 'Xã Nhuận Đức',
    province: 'Ho Chi Minh City',
    budget: 80,
    minInvestment: 8,
    status: 'draft',
    stage: 'Draft',
    description: 'Integrated agricultural processing and cold-chain logistics complex in Cu Chi, supporting Ho Chi Minh City\'s regional food distribution, export connectivity, and value-added agro-industry ecosystem.',
    image: 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtJTIwc21hcnQlMjBjaXR5JTIwaW5mcmFzdHJ1Y3R1cmUlMjB1cmJhbiUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
    highlights: ['Delta Location', 'Agri Export Hub', 'Cold Chain Infrastructure', 'EVFTA Benefits'],
    returnRate: '10-12% IRR',
    timeline: '2025-2030',
    landArea: '180 ha',
    jobs: 8000,
    followers: 45,
    dataCompleteness: 42,
    createdAt: '2024-03-02',
    updatedAt: '2024-03-06',
    sector_tag_color: 'bg-lime-100 text-lime-700',
    documents: [],
    qa: [],
    milestones: [],
  },
];

export const opportunities: Opportunity[] = [
  {
    id: 'o1',
    projectId: 'p1',
    projectName: 'Ho Chi Minh City Smart Infrastructure Hub',
    investorName: 'Kim Jae-won',
    investorCompany: 'Korea Infrastructure Partners',
    investorCountry: 'South Korea',
    investorType: 'Institutional',
    amount: 150,
    stage: 'negotiation',
    submittedAt: '2024-01-20',
    updatedAt: '2024-03-01',
    notes: 'Strong institutional investor with track record in APAC infrastructure.',
    intakeData: {
      investmentStructure: 'Equity + Debt (60/40)',
      timeline: 'Ready Q2 2024',
      fundSource: 'Institutional Fund II',
      experience: '12 years in APAC infrastructure',
      contactEmail: 'kjw@kip.co.kr',
      contactPhone: '+82 2 1234 5678',
    },
    activities: [
      { id: 'a1', type: 'intake', description: 'Intake form submitted', by: 'System', at: '2024-01-20 09:00' },
      { id: 'a2', type: 'review', description: 'Initial screening completed — qualified', by: 'Nguyen Van A', at: '2024-01-25 14:30' },
      { id: 'a3', type: 'due_diligence', description: 'Due diligence package sent to investor', by: 'Tran Thi B', at: '2024-02-10 10:00' },
      { id: 'a4', type: 'meeting', description: 'Site visit completed with investor team', by: 'Nguyen Van A', at: '2024-02-20 09:00' },
      { id: 'a5', type: 'negotiation', description: 'Term sheet draft shared', by: 'Tran Thi B', at: '2024-03-01 16:00' },
    ],
  },
  {
    id: 'o2',
    projectId: 'p5',
    projectName: 'Ho Chi Minh City Technology Innovation Hub',
    investorName: 'Chen Wei',
    investorCompany: 'VietTech Ventures',
    investorCountry: 'Singapore',
    investorType: 'VC/PE',
    amount: 45,
    stage: 'due_diligence',
    submittedAt: '2024-02-05',
    updatedAt: '2024-02-28',
    notes: 'Tech-focused VC with portfolio in SEA deep-tech.',
    intakeData: {
      investmentStructure: 'Equity',
      timeline: 'Q3 2024',
      fundSource: 'VietTech Fund III',
      experience: '8 years in SEA tech investments',
      contactEmail: 'cw@viettech.sg',
      contactPhone: '+65 9876 5432',
    },
    activities: [
      { id: 'a6', type: 'intake', description: 'Intake form submitted', by: 'System', at: '2024-02-05 11:00' },
      { id: 'a7', type: 'review', description: 'Qualified — forwarded to tech committee', by: 'Le Van C', at: '2024-02-15 09:30' },
      { id: 'a8', type: 'due_diligence', description: 'Technical assessment initiated', by: 'Le Van C', at: '2024-02-28 14:00' },
    ],
  },
  {
    id: 'o3',
    projectId: 'p2',
    projectName: 'Ho Chi Minh City Renewable Energy Integration Park',
    investorName: 'Bjorn Hansen',
    investorCompany: 'Nordic Green Energy Fund',
    investorCountry: 'Norway',
    investorType: 'Infrastructure Fund',
    amount: 80,
    stage: 'review',
    submittedAt: '2024-03-01',
    updatedAt: '2024-03-10',
    notes: 'Experienced renewable energy fund, first investment in Vietnam.',
    intakeData: {
      investmentStructure: 'Project Finance',
      timeline: 'Q4 2024',
      fundSource: 'Nordic Green Fund IV',
      experience: '15 years in renewables globally',
      contactEmail: 'b.hansen@ngef.no',
      contactPhone: '+47 123 45678',
    },
    activities: [
      { id: 'a9', type: 'intake', description: 'Intake form submitted', by: 'System', at: '2024-03-01 08:00' },
      { id: 'a10', type: 'review', description: 'Under initial screening', by: 'Pham Thi D', at: '2024-03-10 10:00' },
    ],
  },
  {
    id: 'o4',
    projectId: 'p3',
    projectName: 'Ho Chi Minh City Advanced Manufacturing Zone',
    investorName: 'Tanaka Hiroshi',
    investorCompany: 'Mitsubishi Industrial Ventures',
    investorCountry: 'Japan',
    investorType: 'Strategic',
    amount: 120,
    stage: 'approved',
    submittedAt: '2023-11-01',
    updatedAt: '2024-01-15',
    notes: 'Strategic investor with existing Vietnam manufacturing presence.',
    intakeData: {
      investmentStructure: 'Direct Investment (100% FDI)',
      timeline: 'Q1 2024',
      fundSource: 'Mitsubishi Corp Balance Sheet',
      experience: '20+ years in Vietnam manufacturing',
      contactEmail: 'h.tanaka@mitsubishi.co.jp',
      contactPhone: '+81 3 1234 5678',
    },
    activities: [
      { id: 'a11', type: 'intake', description: 'Intake form submitted', by: 'System', at: '2023-11-01 09:00' },
      { id: 'a12', type: 'review', description: 'Qualified', by: 'Nguyen Van A', at: '2023-11-10 10:00' },
      { id: 'a13', type: 'due_diligence', description: 'Due diligence completed', by: 'Tran Thi B', at: '2023-12-01 14:00' },
      { id: 'a14', type: 'negotiation', description: 'Term sheet agreed', by: 'Nguyen Van A', at: '2023-12-20 09:00' },
      { id: 'a15', type: 'approved', description: 'Opportunity approved by Director', by: 'Director Hoang', at: '2024-01-15 11:00' },
    ],
  },
  {
    id: 'o5',
    projectId: 'p4',
    projectName: 'Ho Chi Minh City Riverside Tourism & Convention Complex',
    investorName: 'Sarah Mitchell',
    investorCompany: 'Global Hospitality Capital',
    investorCountry: 'USA',
    investorType: 'REIT/Fund',
    amount: 60,
    stage: 'new',
    submittedAt: '2024-03-15',
    updatedAt: '2024-03-15',
    notes: 'New submission, awaiting initial review.',
    intakeData: {
      investmentStructure: 'JV with Government (51/49)',
      timeline: 'H2 2024',
      fundSource: 'GHC Tourism Fund II',
      experience: '10 years in SE Asian hospitality',
      contactEmail: 's.mitchell@ghcapital.com',
      contactPhone: '+1 212 555 0100',
    },
    activities: [
      { id: 'a16', type: 'intake', description: 'Intake form submitted', by: 'System', at: '2024-03-15 15:30' },
    ],
  },
];

export const permits: Permit[] = [
  { id: 'pm1', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', type: 'Construction Permit', applicant: 'Korea Infrastructure Partners', submittedAt: '2024-02-01', deadline: '2024-04-01', status: 'in_review', assignedTo: 'Nguyen Minh Tuan', comments: 'Reviewing structural plans.', priority: 'high' },
  { id: 'pm2', projectId: 'p2', projectName: 'HCMC Renewable Integration Park', type: 'Environmental Permit', applicant: 'Nordic Green Energy Fund', submittedAt: '2024-01-15', deadline: '2024-03-15', status: 'approved', assignedTo: 'Le Thi Hoa', comments: 'Approved with conditions.', priority: 'high' },
  { id: 'pm3', projectId: 'p3', projectName: 'HCMC Advanced Manufacturing Zone', type: 'Investment Registration', applicant: 'Mitsubishi Industrial Ventures', submittedAt: '2023-11-20', deadline: '2024-01-20', status: 'approved', assignedTo: 'Tran Van Duc', comments: 'IRC issued successfully.', priority: 'medium' },
  { id: 'pm4', projectId: 'p4', projectName: 'HCMC Riverside Tourism Complex', type: 'Land Use Rights Certificate', applicant: 'Global Hospitality Capital', submittedAt: '2024-03-01', deadline: '2024-05-01', status: 'pending', assignedTo: 'Pham Thi Lan', comments: '', priority: 'medium' },
  { id: 'pm5', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', type: 'Fire Safety Certificate', applicant: 'Korea Infrastructure Partners', submittedAt: '2024-03-10', deadline: '2024-04-10', status: 'info_required', assignedTo: 'Nguyen Minh Tuan', comments: 'Missing fire suppression system drawings.', priority: 'high' },
  { id: 'pm6', projectId: 'p2', projectName: 'Ho Chi Minh City Renewable Energy Integration Park', type: 'Grid Connection Permit', applicant: 'Nordic Green Energy Fund', submittedAt: '2024-02-20', deadline: '2024-04-20', status: 'in_review', assignedTo: 'Hoang Van Nam', comments: 'Technical review with EVN underway.', priority: 'high' },
];

export const issues: Issue[] = [
  { id: 'i1', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', title: 'Site Boundary Dispute with Adjacent Landowner', description: 'Landowner claims 2ha overlap with project boundary in Zone B. Legal review initiated.', priority: 'critical', status: 'in_progress', assignedTo: 'Legal Team', reportedBy: 'Department of Planning and Investment', reportedAt: '2024-02-15', dueDate: '2024-03-20', updatedAt: '2024-03-01', category: 'Land' },
  { id: 'i2', projectId: 'p2', projectName: 'Ho Chi Minh City Renewable Energy Integration Park', title: 'Grid Capacity Constraint — Delayed EVN Upgrade', description: 'EVN transmission upgrade delayed by 3 months, affecting Phase 2 commissioning schedule.', priority: 'high', status: 'in_progress', assignedTo: 'Infrastructure Team', reportedBy: 'Department of Construction', reportedAt: '2024-02-20', dueDate: '2024-03-22', updatedAt: '2024-03-05', category: 'Infrastructure' },
  { id: 'i3', projectId: 'p3', projectName: 'Ho Chi Minh City Advanced Manufacturing Zone', title: 'Environmental Compliance: Water Treatment Specification', description: 'Investor requested wastewater treatment capacity increase. Engineering review needed.', priority: 'medium', status: 'open', assignedTo: 'Environment Team', reportedBy: 'Department of Natural Resources and Environment', reportedAt: '2024-03-01', dueDate: '2024-03-28', updatedAt: '2024-03-01', category: 'Environment' },
  { id: 'i4', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', title: 'Traffic Impact Assessment — Revised Routing', description: 'City transport authority requested revised traffic study for Zone A access roads.', priority: 'medium', status: 'resolved', assignedTo: 'Transport Team', reportedBy: 'Urban Transport Department', reportedAt: '2024-01-10', dueDate: '2024-02-20', updatedAt: '2024-02-28', category: 'Transport' },
  { id: 'i5', projectId: 'p4', projectName: 'Ho Chi Minh City Riverside Tourism Complex', title: 'Riverfront Height Restriction Clarification', description: 'Conflicting regulations between the local riverfront plan and aviation safety envelope. Seeking city-level planning guidance.', priority: 'high', status: 'open', assignedTo: 'Urban Planning Team', reportedBy: 'Department of Planning and Investment', reportedAt: '2024-03-10', dueDate: '2024-04-05', updatedAt: '2024-03-10', category: 'Regulatory' },
  { id: 'i6', projectId: 'p1', projectName: 'Ho Chi Minh City Smart Infrastructure Hub', title: 'Yêu cầu hỗ trợ nhà đầu tư - xác nhận mốc bàn giao đường tiếp cận', description: 'Nhà đầu tư đề nghị xác nhận mốc bàn giao cuối cùng cho đường tiếp cận tạm phục vụ các lô xây dựng A1 và A2.', priority: 'medium', status: 'open', assignedTo: 'Department of Planning and Investment', reportedBy: 'Kim Jae-won', reportedAt: '2026-03-21', dueDate: '2026-03-30', updatedAt: '2026-03-23', category: 'Support' },
  { id: 'i7', projectId: 'p1', projectName: 'Ho Chi Minh City Smart Infrastructure Hub', title: 'Yêu cầu hỗ trợ nhà đầu tư - cập nhật phụ lục định giá đất', description: 'Nhà đầu tư cần phụ lục định giá mới nhất để đồng bộ hồ sơ thẩm định nội bộ trước khi chốt term-sheet.', priority: 'high', status: 'in_progress', assignedTo: 'Department of Natural Resources and Environment, Ho Chi Minh City', reportedBy: 'Kim Jae-won', reportedAt: '2026-03-19', dueDate: '2026-03-28', updatedAt: '2026-03-24', category: 'Support' },
  { id: 'i8', projectId: 'p1', projectName: 'Ho Chi Minh City Smart Infrastructure Hub', title: 'Yêu cầu hỗ trợ nhà đầu tư - cung cấp biên bản di dời hạ tầng kỹ thuật', description: 'Đề nghị chia sẻ biên bản đã ký về di dời điện và viễn thông ảnh hưởng tới công tác huy động giai đoạn 1.', priority: 'medium', status: 'resolved', assignedTo: 'Department of Construction, Ho Chi Minh City', reportedBy: 'Kim Jae-won', reportedAt: '2026-03-13', dueDate: '2026-03-20', updatedAt: '2026-03-22', category: 'Support' },
  { id: 'i9', projectId: 'p1', projectName: 'Ho Chi Minh City Smart Infrastructure Hub', title: 'Yêu cầu hỗ trợ nhà đầu tư - rà soát ngôn ngữ pháp lý song ngữ', description: 'Yêu cầu hỗ trợ pháp lý về tính nhất quán ngôn ngữ song ngữ cho điều khoản giải quyết tranh chấp và luật áp dụng.', priority: 'low', status: 'closed', assignedTo: 'Government Legal Desk', reportedBy: 'Kim Jae-won', reportedAt: '2026-03-05', dueDate: '2026-03-12', updatedAt: '2026-03-14', category: 'Support' },
];

export const milestones: Milestone[] = [
  { id: 'ms1', projectId: 'p1', projectName: 'HCMC Smart Hub', phase: 'Phase 1', description: 'Site Preparation & Foundation', dueDate: '2024-06-30', completedDate: '2024-06-28', status: 'completed', progress: 100 },
  { id: 'ms2', projectId: 'p1', projectName: 'HCMC Smart Hub', phase: 'Phase 2', description: 'Core Infrastructure Build', dueDate: '2025-12-31', status: 'in_progress', progress: 45 },
  { id: 'ms3', projectId: 'p2', projectName: 'HCMC RE Integration Park', phase: 'Phase 1', description: 'Land Clearance & Site Setup', dueDate: '2024-09-30', completedDate: '2024-09-20', status: 'completed', progress: 100 },
  { id: 'ms4', projectId: 'p2', projectName: 'HCMC RE Integration Park', phase: 'Phase 2', description: 'Equipment Procurement & Installation', dueDate: '2025-09-30', status: 'in_progress', progress: 60 },
  { id: 'ms5', projectId: 'p3', projectName: 'HCMC Manufacturing Zone', phase: 'Phase 1', description: 'Infrastructure Development Zone A', dueDate: '2025-03-31', status: 'in_progress', progress: 30 },
  { id: 'ms6', projectId: 'p4', projectName: 'HCMC Riverside Tourism', phase: 'Phase 1', description: 'Hotel & Resort Core', dueDate: '2026-12-31', status: 'pending', progress: 0 },
  { id: 'ms7', projectId: 'p2', projectName: 'HCMC RE Integration Park', phase: 'Phase 3', description: 'Grid Connection & Commissioning', dueDate: '2026-06-30', status: 'pending', progress: 0 },
];

export const services: Service[] = [
  { id: 's1', name: 'Investment Registration Certificate', category: 'Registration', description: 'Official IRC issued by the Department of Planning and Investment for foreign-invested enterprises.', processingTime: '15 working days', fee: 'No fee', requiredDocs: ['Application form', 'Investment project proposal', 'Investor charter docs', 'Financial capacity proof'], agency: 'Department of Planning and Investment', icon: 'FileCheck', color: 'bg-blue-50 border-blue-200' },
  { id: 's2', name: 'Enterprise Registration Certificate', category: 'Registration', description: 'ERC for establishing a legal entity in Vietnam.', processingTime: '3 working days', fee: 'VND 50,000', requiredDocs: ['Application form', 'Charter', 'Owner ID/Passport', 'Legal address proof'], agency: 'Department of Planning and Investment', icon: 'Building', color: 'bg-indigo-50 border-indigo-200' },
  { id: 's3', name: 'Environmental Impact Assessment Approval', category: 'Environment', description: 'EIA approval from the Ministry of Natural Resources and Environment for industrial/energy projects.', processingTime: '30 working days', fee: 'Based on project scale', requiredDocs: ['EIA Report', 'Project technical documentation', 'Site map & boundary', 'Stakeholder consultation records'], agency: 'Department of Natural Resources and Environment', icon: 'Leaf', color: 'bg-green-50 border-green-200' },
  { id: 's4', name: 'Construction Permit', category: 'Construction', description: 'Building permit for construction of industrial, commercial or residential structures.', processingTime: '20 working days', fee: '0.1% of construction value', requiredDocs: ['Construction design drawings', 'Land use rights docs', 'Fire safety pre-assessment', 'Structural calculation'], agency: 'Department of Construction', icon: 'HardHat', color: 'bg-orange-50 border-orange-200' },
  { id: 's5', name: 'Land Use Rights Certificate (LURC)', category: 'Land', description: '"Red Book" certification confirming land use rights allocation for the project site.', processingTime: '30 working days', fee: 'Land-use fee based on area', requiredDocs: ['LURC application', 'Approved site plan', 'Land survey report', 'Tax clearance certificate'], agency: 'Department of Natural Resources and Environment', icon: 'MapPin', color: 'bg-yellow-50 border-yellow-200' },
  { id: 's6', name: 'Import/Export License for Equipment', category: 'Trade', description: 'License for importing capital equipment exempt from import duties.', processingTime: '5 working days', fee: 'No fee', requiredDocs: ['IRC copy', 'Equipment list & specs', 'Customs declaration form', 'Supplier invoice'], agency: 'Department of Industry and Trade', icon: 'Package', color: 'bg-cyan-50 border-cyan-200' },
  { id: 's7', name: 'Fire Prevention & Fighting Certificate', category: 'Safety', description: 'Fire safety design approval and operational certificate for buildings.', processingTime: '10 working days', fee: 'VND 300,000', requiredDocs: ['Fire safety design docs', 'Construction permit copy', 'Equipment list', 'Fire drill plan'], agency: 'City Police Department', icon: 'Shield', color: 'bg-red-50 border-red-200' },
  { id: 's8', name: 'Work Permit for Foreign Employees', category: 'Labor', description: 'Work permits for foreign nationals employed in Vietnam-based projects.', processingTime: '7 working days', fee: 'USD 135/person', requiredDocs: ['Application form', 'Criminal record', 'Health certificate', 'Diplomas & CVs', 'Passport copy'], agency: 'Department of Labor, War Invalids and Social Affairs', icon: 'Users', color: 'bg-violet-50 border-violet-200' },
];

export const serviceRequests: ServiceRequest[] = [
  { id: 'sr1', serviceId: 's1', serviceName: 'Investment Registration Certificate', applicant: 'Korea Infrastructure Partners', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', submittedAt: '2024-01-20', deadline: '2024-02-10', status: 'approved', slaStatus: 'on_track', assignedAgency: 'Department of Planning and Investment', documents: ['Application form.pdf', 'Project proposal.pdf', 'Financial docs.pdf'], notes: 'IRC issued. Certificate number: 3512024001.' },
  { id: 'sr2', serviceId: 's3', serviceName: 'Environmental Impact Assessment Approval', applicant: 'Korea Infrastructure Partners', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', submittedAt: '2024-02-01', deadline: '2024-03-15', status: 'processing', slaStatus: 'at_risk', assignedAgency: 'Department of Natural Resources and Environment', documents: ['EIA Report.pdf', 'Technical docs.pdf', 'Site boundary.pdf'], notes: 'Under technical review. Additional clarification requested on waste management.' },
  { id: 'sr3', serviceId: 's4', serviceName: 'Construction Permit', applicant: 'Nordic Green Energy Fund', projectId: 'p2', projectName: 'Ho Chi Minh City Renewable Energy Integration Park', submittedAt: '2024-02-15', deadline: '2024-03-12', status: 'approved', slaStatus: 'on_track', assignedAgency: 'Department of Construction', documents: ['Design drawings.pdf', 'Structural calcs.pdf', 'LURC copy.pdf'], notes: 'Permit issued. Number: CP-HCMC-2024-042.' },
  { id: 'sr4', serviceId: 's5', serviceName: 'Land Use Rights Certificate', applicant: 'Global Hospitality Capital', projectId: 'p4', projectName: 'Ho Chi Minh City Riverside Tourism & Convention Complex', submittedAt: '2024-03-01', deadline: '2024-04-14', status: 'info_required', slaStatus: 'on_track', assignedAgency: 'Department of Natural Resources and Environment', documents: ['LURC Application.pdf', 'Site plan.pdf'], notes: 'Land survey report missing. Please upload within 5 working days.' },
  { id: 'sr5', serviceId: 's6', serviceName: 'Import/Export License for Equipment', applicant: 'Mitsubishi Industrial Ventures', projectId: 'p3', projectName: 'Ho Chi Minh City Advanced Manufacturing Zone', submittedAt: '2024-03-10', deadline: '2024-03-17', status: 'processing', slaStatus: 'at_risk', assignedAgency: 'Department of Industry and Trade', documents: ['IRC copy.pdf', 'Equipment list.pdf', 'Customs form.pdf'], notes: 'Equipment list under HS code verification.' },
  { id: 'sr6', serviceId: 's8', serviceName: 'Work Permit for Foreign Employees', applicant: 'Korea Infrastructure Partners', projectId: 'p1', projectName: 'HCMC Smart Infrastructure Hub', submittedAt: '2024-03-12', deadline: '2024-03-21', status: 'submitted', slaStatus: 'on_track', assignedAgency: 'Department of Labor, War Invalids and Social Affairs', documents: ['Passports.pdf', 'Health certs.pdf', 'CVs.pdf'], notes: '' },
];

export const users: User[] = [
  { id: 'u1', name: 'Nguyen Van Anh', email: 'nvanh@mpi.gov.vn', role: 'Government Operator', organization: 'Ministry of Planning & Investment', status: 'active', lastLogin: '2024-03-15 09:30', permissions: ['project.create', 'project.edit', 'opportunity.manage', 'execution.view'] },
  { id: 'u2', name: 'Tran Thi Bich', email: 'ttbich@mpi.gov.vn', role: 'Government Operator', organization: 'Ministry of Planning & Investment', status: 'active', lastLogin: '2024-03-15 08:15', permissions: ['project.view', 'opportunity.manage', 'execution.view'] },
  { id: 'u3', name: 'Pham Gia Huy', email: 'pghuy.skhdt@hcmc.gov.vn', role: 'Agency User', organization: 'Department of Planning and Investment', status: 'active', lastLogin: '2024-03-14 16:45', permissions: ['permit.process', 'service.process'] },
  { id: 'u4', name: 'Vo Thu Lan', email: 'vtlan.stnmt@hcmc.gov.vn', role: 'Agency User', organization: 'Department of Natural Resources and Environment', status: 'active', lastLogin: '2024-03-13 11:00', permissions: ['permit.process', 'service.process', 'issue.update'] },
  { id: 'u5', name: 'Hoang Minh Duc', email: 'hmduc@mpi.gov.vn', role: 'Executive', organization: 'Ministry of Planning & Investment', status: 'active', lastLogin: '2024-03-15 07:30', permissions: ['dashboard.view', 'analytics.view'] },
  { id: 'u6', name: 'Kim Jae-won', email: 'kjw@kip.co.kr', role: 'Investor', organization: 'Korea Infrastructure Partners', status: 'active', lastLogin: '2024-03-15 10:00', permissions: ['explorer.view', 'intake.submit', 'execution.view', 'service.apply'] },
  { id: 'u7', name: 'Admin System', email: 'admin@mpi.gov.vn', role: 'Admin', organization: 'Ministry of Planning & Investment', status: 'active', lastLogin: '2024-03-15 06:00', permissions: ['admin.*'] },
];

const AGENCY_SHORTNAME_STOP_WORDS = new Set(['of', 'and', 'the', 'for']);

const AGENCY_OFFICER_NAME_POOL: Array<{ nameEn: string; nameVi: string }> = [
  { nameEn: 'Nguyen Minh Anh', nameVi: 'Nguyen Minh Anh' },
  { nameEn: 'Tran Quoc Bao', nameVi: 'Tran Quoc Bao' },
  { nameEn: 'Le Thanh Ha', nameVi: 'Le Thanh Ha' },
  { nameEn: 'Pham Gia Huy', nameVi: 'Pham Gia Huy' },
  { nameEn: 'Vo Thu Lan', nameVi: 'Vo Thu Lan' },
  { nameEn: 'Bui Tuan Kiet', nameVi: 'Bui Tuan Kiet' },
  { nameEn: 'Dang My Linh', nameVi: 'Dang My Linh' },
  { nameEn: 'Do Hoang Nam', nameVi: 'Do Hoang Nam' },
  { nameEn: 'Hoang Anh Thu', nameVi: 'Hoang Anh Thu' },
  { nameEn: 'Phan Duc Long', nameVi: 'Phan Duc Long' },
  { nameEn: 'Truong Khanh Vy', nameVi: 'Truong Khanh Vy' },
  { nameEn: 'Vu Ngoc Son', nameVi: 'Vu Ngoc Son' },
];

const AGENCY_OFFICER_ROLE_TEMPLATES = [
  {
    titleEn: 'Deputy Director in Charge',
    titleVi: 'Ph\u00f3 Gi\u00e1m \u0111\u1ed1c ph\u1ee5 tr\u00e1ch',
  },
  {
    titleEn: 'Senior Coordination Officer',
    titleVi: 'Chuy\u00ean vi\u00ean \u0111i\u1ec1u ph\u1ed1i cao c\u1ea5p',
  },
  {
    titleEn: 'Investor Support Officer',
    titleVi: 'Chuy\u00ean vi\u00ean h\u1ed7 tr\u1ee3 \u0111\u1ea7u t\u01b0',
  },
] as const;

function inferAgencyShortName(nameEn: string) {
  if (nameEn.trim().toUpperCase() === 'ITPC') return 'ITPC';
  return nameEn
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !AGENCY_SHORTNAME_STOP_WORDS.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join('');
}

function buildAgencyOfficerPhone(agencyIndex: number, officerIndex: number) {
  const exchange = String(40 + ((agencyIndex + 3) % 50)).padStart(2, '0');
  const suffix = String(1100 + agencyIndex * 9 + officerIndex * 3).padStart(4, '0');
  return `028 38${exchange} ${suffix}`;
}

function buildAgencyOfficers(agencyId: string, shortName: string, agencyIndex: number): AgencyOfficer[] {
  return AGENCY_OFFICER_ROLE_TEMPLATES.map((role, officerIndex) => {
    const person = AGENCY_OFFICER_NAME_POOL[(agencyIndex * 3 + officerIndex) % AGENCY_OFFICER_NAME_POOL.length];
    return {
      id: `${agencyId}-pic-${officerIndex + 1}`,
      name: person.nameEn,
      nameEn: person.nameEn,
      nameVi: person.nameVi,
      title: role.titleEn,
      titleEn: role.titleEn,
      titleVi: role.titleVi,
      email: `${shortName.toLowerCase()}-pic${officerIndex + 1}@hcmc.gov.vn`,
      phone: buildAgencyOfficerPhone(agencyIndex, officerIndex),
    };
  });
}

const agencySeed: Array<{ id: string; nameVi: string; nameEn: string }> = [
  { id: 'ag1', nameVi: 'ITPC', nameEn: 'ITPC' },
  { id: 'ag2', nameVi: 'Sở Công thương', nameEn: 'Department of Industry and Trade' },
  { id: 'ag3', nameVi: 'Sở Du lịch', nameEn: 'Department of Tourism' },
  { id: 'ag4', nameVi: 'Sở Giáo dục và Đào tạo', nameEn: 'Department of Education and Training' },
  { id: 'ag5', nameVi: 'Sở Giao thông Vận tải', nameEn: 'Department of Transport' },
  { id: 'ag6', nameVi: 'Sở Kế hoạch và Đầu tư', nameEn: 'Department of Planning and Investment' },
  { id: 'ag7', nameVi: 'Sở Khoa học và Công nghệ', nameEn: 'Department of Science and Technology' },
  { id: 'ag8', nameVi: 'Sở Lao động – Thương binh và Xã hội', nameEn: 'Department of Labor, War Invalids and Social Affairs' },
  { id: 'ag9', nameVi: 'Sở Nội Vụ', nameEn: 'Department of Home Affairs' },
  { id: 'ag10', nameVi: 'Sở Nông nghiệp và Phát triển Nông thôn', nameEn: 'Department of Agriculture and Rural Development' },
  { id: 'ag11', nameVi: 'Sở Quy hoạch - Kiến trúc', nameEn: 'Department of Planning and Architecture' },
  { id: 'ag12', nameVi: 'Sở Tài chính', nameEn: 'Department of Finance' },
  { id: 'ag13', nameVi: 'Sở Tài nguyên và Môi trường', nameEn: 'Department of Natural Resources and Environment' },
  { id: 'ag14', nameVi: 'Sở Thông tin và Truyền thông', nameEn: 'Department of Information and Communications' },
  { id: 'ag15', nameVi: 'Sở Tư pháp', nameEn: 'Department of Justice' },
  { id: 'ag16', nameVi: 'Sở Văn hóa và Thể thao', nameEn: 'Department of Culture and Sports' },
  { id: 'ag17', nameVi: 'Sở Xây dựng', nameEn: 'Department of Construction' },
  { id: 'ag18', nameVi: 'Sở Y tế', nameEn: 'Department of Health' },
  { id: 'ag19', nameVi: 'Thanh tra Thành phố', nameEn: 'City Inspectorate' },
  { id: 'ag20', nameVi: 'Ban Quản lý Khu công nghệ cao', nameEn: 'High-Tech Park Management Board' },
  { id: 'ag21', nameVi: 'Ban Quản lý các Khu chế xuất và Khu công nghiệp', nameEn: 'Export Processing and Industrial Zones Authority' },
  { id: 'ag22', nameVi: 'Ban Dân tộc', nameEn: 'Committee for Ethnic Minority Affairs' },
  { id: 'ag23', nameVi: 'Ban Quản lý An toàn Thực phẩm', nameEn: 'Food Safety Management Board' },
  { id: 'ag24', nameVi: 'Cục Thuế Thành phố', nameEn: 'City Tax Department' },
  { id: 'ag25', nameVi: 'Kho bạc Nhà nước Thành phố', nameEn: 'City State Treasury' },
  { id: 'ag26', nameVi: 'Ngân hàng Nhà nước – Chi nhánh Thành phố', nameEn: 'State Bank of Vietnam City Branch' },
  { id: 'ag27', nameVi: 'Bảo hiểm xã hội Thành phố', nameEn: 'City Social Security Agency' },
  { id: 'ag28', nameVi: 'Sở Ngoại vụ', nameEn: 'Department of External Relations' },
  { id: 'ag29', nameVi: 'Công an Thành phố', nameEn: 'City Police Department' },
  { id: 'ag30', nameVi: 'UBND Quận 1', nameEn: "District 1 People's Committee" },
  { id: 'ag31', nameVi: 'UBND Quận 3', nameEn: "District 3 People's Committee" },
  { id: 'ag32', nameVi: 'UBND Quận 4', nameEn: "District 4 People's Committee" },
  { id: 'ag33', nameVi: 'UBND Quận 5', nameEn: "District 5 People's Committee" },
  { id: 'ag34', nameVi: 'UBND Quận 6', nameEn: "District 6 People's Committee" },
  { id: 'ag35', nameVi: 'UBND Quận 7', nameEn: "District 7 People's Committee" },
  { id: 'ag36', nameVi: 'UBND Quận 8', nameEn: "District 8 People's Committee" },
  { id: 'ag37', nameVi: 'UBND Quận 10', nameEn: "District 10 People's Committee" },
  { id: 'ag38', nameVi: 'UBND Quận 11', nameEn: "District 11 People's Committee" },
  { id: 'ag39', nameVi: 'UBND Quận 12', nameEn: "District 12 People's Committee" },
  { id: 'ag40', nameVi: 'UBND quận Bình Tân', nameEn: "Binh Tan District People's Committee" },
  { id: 'ag41', nameVi: 'UBND quận Bình Thạnh', nameEn: "Binh Thanh District People's Committee" },
  { id: 'ag42', nameVi: 'UBND quận Phú Nhuận', nameEn: "Phu Nhuan District People's Committee" },
  { id: 'ag43', nameVi: 'UBND quận Tân Bình', nameEn: "Tan Binh District People's Committee" },
  { id: 'ag44', nameVi: 'UBND quận Tân Phú', nameEn: "Tan Phu District People's Committee" },
  { id: 'ag45', nameVi: 'UBND quận Gò Vấp', nameEn: "Go Vap District People's Committee" },
  { id: 'ag46', nameVi: 'UBND huyện Bình Chánh', nameEn: "Binh Chanh District People's Committee" },
  { id: 'ag47', nameVi: 'UBND huyện Nhà Bè', nameEn: "Nha Be District People's Committee" },
  { id: 'ag48', nameVi: 'UBND huyện Củ Chi', nameEn: "Cu Chi District People's Committee" },
  { id: 'ag49', nameVi: 'UBND huyện Hóc Môn', nameEn: "Hoc Mon District People's Committee" },
  { id: 'ag50', nameVi: 'UBND huyện Cần Giờ', nameEn: "Can Gio District People's Committee" },
  { id: 'ag51', nameVi: 'UBND thành phố Thủ Đức', nameEn: "Thu Duc City People's Committee" },
  { id: 'ag52', nameVi: 'Ban Quản lý Khu Nông nghiệp Công nghệ cao', nameEn: 'Agricultural Hi-Tech Park Management Board' },
  { id: 'ag53', nameVi: 'Ban Thi đua – Khen thưởng', nameEn: 'Emulation and Commendation Board' },
  { id: 'ag54', nameVi: 'Ban Tôn giáo', nameEn: 'Committee for Religious Affairs' },
  { id: 'ag55', nameVi: 'Cục Thống kê', nameEn: 'Statistics Office' },
  { id: 'ag56', nameVi: 'Chi cục Chăn nuôi và Thú y', nameEn: 'Sub-Department of Livestock Production and Animal Health' },
  { id: 'ag57', nameVi: 'Chi cục Tiêu chuẩn Đo lường Chất lượng', nameEn: 'Sub-Department of Standards, Metrology and Quality' },
  { id: 'ag58', nameVi: 'Chi cục Kiểm lâm', nameEn: 'Forest Protection Sub-Department' },
  { id: 'ag59', nameVi: 'Chi cục Thủy sản', nameEn: 'Fisheries Sub-Department' },
  { id: 'ag60', nameVi: 'Chi cục Trồng trọt và Bảo vệ Thực vật', nameEn: 'Sub-Department of Crop Production and Plant Protection' },
  { id: 'ag61', nameVi: 'Chi cục Thủy lợi', nameEn: 'Irrigation Sub-Department' },
  { id: 'ag62', nameVi: 'Chi cục Phát triển Nông thôn', nameEn: 'Rural Development Sub-Department' },
  { id: 'ag63', nameVi: 'Chi cục Bảo vệ Môi trường', nameEn: 'Environmental Protection Sub-Department' },
  { id: 'ag64', nameVi: 'Chi cục Văn thư Lưu trữ', nameEn: 'Records and Archives Sub-Department' },
];

export const agencies: Agency[] = agencySeed.map(({ id, nameVi, nameEn }, agencyIndex) => {
  const shortName = inferAgencyShortName(nameEn);
  const peopleInCharge = buildAgencyOfficers(id, shortName, agencyIndex);

  return {
    id,
    name: nameEn,
    nameVi,
    nameEn,
    shortName,
    type: 'Government',
    jurisdiction: 'Level 2',
    level: 2,
    contactPerson: peopleInCharge[0].nameEn ?? peopleInCharge[0].name,
    email: peopleInCharge[0].email,
    phone: peopleInCharge[0].phone,
    activeRequests: 0,
    status: 'active',
    peopleInCharge,
  };
});

// Executive KPI data
export const executiveKPIs = {
  totalProjects: 6,
  publishedProjects: 2,
  totalInvestmentPipeline: 455, // M USD
  approvedOpportunities: 1,
  activeExecution: 2,
  pendingPermits: 3,
  slaBreached: 0,
  slaAtRisk: 2,
};

export const funnelData = [
  { stage: 'Explorer Views', count: 1240, color: '#3B82F6' },
  { stage: 'Project Follows', count: 834, color: '#6366F1' },
  { stage: 'Intake Submitted', count: 156, color: '#8B5CF6' },
  { stage: 'Opportunity Created', count: 89, color: '#A855F7' },
  { stage: 'Due Diligence', count: 34, color: '#EC4899' },
  { stage: 'Approved', count: 12, color: '#F59E0B' },
  { stage: 'Processing', count: 5, color: '#10B981' },
];

export const sectorInvestmentData = [
  { sector: 'Infrastructure', value: 500 },
  { sector: 'Manufacturing', value: 350 },
  { sector: 'Energy', value: 200 },
  { sector: 'Tourism', value: 150 },
  { sector: 'Technology', value: 100 },
  { sector: 'Agriculture', value: 80 },
];

export const monthlyIntakeData = [
  { month: 'Oct', intakes: 8, approved: 1 },
  { month: 'Nov', intakes: 14, approved: 2 },
  { month: 'Dec', intakes: 11, approved: 1 },
  { month: 'Jan', intakes: 22, approved: 3 },
  { month: 'Feb', intakes: 18, approved: 2 },
  { month: 'Mar', intakes: 25, approved: 3 },
];
