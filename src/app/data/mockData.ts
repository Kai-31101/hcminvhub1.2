import { administrativeLocationMasterData } from './administrativeLocations';
import { getProjectStageLabel, normalizeProjectStatus, ProjectStatus } from '../utils/projectStatus';

export interface Project {
  id: string;
  createdByUserId: string;
  ownerAgencyId?: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
  projectType: 'public' | 'private';
  sector: string;
  location: string;
  province: string;
  budget: number; // in million USD
  minInvestment: number;
  status: ProjectStatus;
  stage: string;
  description: string;
  descriptionVi?: string;
  descriptionEn?: string;
  image: string;
  mapImage?: string;
  highlights: string[];
  highlightsVi?: string[];
  highlightsEn?: string[];
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
  nameVi?: string;
  nameEn?: string;
  fileUrl?: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export interface QAItem {
  id: string;
  question: string;
  questionVi?: string;
  questionEn?: string;
  askedBy: string;
  askedByVi?: string;
  askedByEn?: string;
  askedAt: string;
  answer?: string;
  answerVi?: string;
  answerEn?: string;
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
  phaseVi?: string;
  phaseEn?: string;
  description: string;
  descriptionVi?: string;
  descriptionEn?: string;
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

const generatedProjectImagePool = [
  'https://images.unsplash.com/photo-1513828583688-c52646db42da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaW5mcmFzdHJ1Y3R1cmV8ZW58MXx8fHwxNzc0MzQ0MzIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxob3NwaXRhbCUyMGNhbXB1c3xlbnwxfHx8fDE3NzQzNDQzMjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhwb3J0JTIwbG9naXN0aWNzfGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzQzNDQzMjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXBvdCUyMHRyYW5zaXR8ZW58MXx8fHwxNzc0MzQ0MzIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWN0b3J5JTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzc0MzQ0MzIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wdXMlMjBjb2xvd2lvcmtpbmd8ZW58MXx8fHwxNzc0MzQ0MzIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwbG9naXN0aWNzfGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjBsb2dpc3RpY3N8ZW58MXx8fHwxNzc0MzQ0MzIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWFwb3J0JTIwbG9naXN0aWNzfGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
] as const;

const sectorTagColorBySector: Record<string, string> = {
  Infrastructure: 'bg-blue-100 text-blue-700',
  Energy: 'bg-green-100 text-green-700',
  Manufacturing: 'bg-purple-100 text-purple-700',
  Tourism: 'bg-amber-100 text-amber-700',
  Technology: 'bg-cyan-100 text-cyan-700',
  Agriculture: 'bg-lime-100 text-lime-700',
  Healthcare: 'bg-rose-100 text-rose-700',
  Logistics: 'bg-orange-100 text-orange-700',
  Education: 'bg-indigo-100 text-indigo-700',
};

type ImportedProjectSeed = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  sector: string;
  district: string;
  status: string;
  ownerType: 'GOVERNMENT' | 'PRIVATE';
  investmentMinUsd: number;
  investmentMaxUsd: number;
  isPriority: boolean;
};

function mapImportedProjectStatus(status: string): ProjectStatus {
  switch (status) {
    case 'PUBLISHED':
    case 'ATTRACTING_INTEREST':
      return 'published';
    case 'IN_PROCESS':
    case 'APPROVED':
    case 'EXECUTING':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    case 'PENDING_APPROVAL':
    default:
      return 'draft';
  }
}

function mapImportedProjectLocation(district: string) {
  switch (district) {
    case 'Thu Duc':
      return administrativeLocationMasterData.thuDucWard;
    case 'Can Gio':
      return administrativeLocationMasterData.canGioCommune;
    case 'Nha Be':
      return administrativeLocationMasterData.hiepPhuocCommune;
    case 'District 7':
      return administrativeLocationMasterData.phuThuanWard;
    case 'Binh Chanh':
      return administrativeLocationMasterData.binhChanhCommune;
    case 'District 1':
      return administrativeLocationMasterData.saiGonWard;
    case 'District 12':
      return administrativeLocationMasterData.tangNhonPhuWard;
    case 'Binh Thanh':
      return administrativeLocationMasterData.tanDinhWard;
    case 'District 5':
      return administrativeLocationMasterData.binhPhuWard;
    case 'Hoc Mon':
      return administrativeLocationMasterData.dongThanhCommune;
    case 'Cu Chi':
      return administrativeLocationMasterData.thaiMyCommune;
    case 'District 2':
      return administrativeLocationMasterData.anKhanhWard;
    case 'Binh Duong':
      return administrativeLocationMasterData.tangNhonPhuWard;
    case 'Ba Ria-Vung Tau':
      return administrativeLocationMasterData.canGioCommune;
    case 'Tan Binh':
      return administrativeLocationMasterData.tayThanhWard;
    default:
      return administrativeLocationMasterData.thuDucWard;
  }
}

function mapImportedProjectProvince(district: string) {
  switch (district) {
    case 'Binh Duong':
      return 'Binh Duong';
    case 'Ba Ria-Vung Tau':
      return 'Ba Ria - Vung Tau';
    default:
      return 'Ho Chi Minh City';
  }
}

function mapImportedProjectOwnerAgencyId(sector: string) {
  if (sector.includes('Infrastructure')) return 'ag7';
  if (sector.includes('Logistics')) return 'ag5';
  if (sector.includes('Healthcare') || sector.includes('Biotech')) return 'ag16';
  if (sector.includes('High-Tech') || sector.includes('Digital') || sector.includes('Financial')) return 'ag14';
  if (sector.includes('Real Estate') || sector.includes('Housing')) return 'ag8';
  if (sector.includes('Renewable') || sector.includes('Clean Energy') || sector.includes('Circular')) return 'ag9';
  if (sector.includes('Education')) return 'ag15';
  if (sector.includes('Tourism')) return 'ag13';
  if (sector.includes('AgriTech')) return 'ag6';
  if (sector.includes('Manufacturing')) return 'ag5';
  return 'ag3';
}

function mapImportedSectorColor(sector: string) {
  if (sector.includes('Infrastructure')) return sectorTagColorBySector.Infrastructure;
  if (sector.includes('Logistics')) return sectorTagColorBySector.Logistics;
  if (sector.includes('Healthcare') || sector.includes('Biotech')) return sectorTagColorBySector.Healthcare;
  if (sector.includes('High-Tech') || sector.includes('Digital') || sector.includes('Financial')) return sectorTagColorBySector.Technology;
  if (sector.includes('Real Estate') || sector.includes('Housing')) return 'bg-slate-100 text-slate-700';
  if (sector.includes('Renewable') || sector.includes('Clean Energy') || sector.includes('Circular')) return sectorTagColorBySector.Energy;
  if (sector.includes('Education')) return sectorTagColorBySector.Education;
  if (sector.includes('Tourism')) return sectorTagColorBySector.Tourism;
  if (sector.includes('AgriTech')) return sectorTagColorBySector.Agriculture;
  if (sector.includes('Manufacturing')) return sectorTagColorBySector.Manufacturing;
  return 'bg-slate-100 text-slate-700';
}

function buildImportedProjectReturnRate(sector: string) {
  if (sector.includes('Infrastructure') || sector.includes('Logistics')) return '10-13% IRR';
  if (sector.includes('High-Tech') || sector.includes('Digital') || sector.includes('Financial')) return '13-17% IRR';
  if (sector.includes('Healthcare') || sector.includes('Biotech')) return '11-14% IRR';
  if (sector.includes('Tourism') || sector.includes('Real Estate') || sector.includes('Housing')) return '12-15% IRR';
  if (sector.includes('Renewable') || sector.includes('Clean Energy') || sector.includes('Circular')) return '10-12% IRR';
  if (sector.includes('AgriTech') || sector.includes('Education')) return '9-12% IRR';
  return '10-14% IRR';
}

type GeneratedProjectSeed = Omit<Project, 'stage' | 'image' | 'sector_tag_color' | 'documents' | 'qa' | 'milestones'> & {
  documentName: string;
  qaQuestion: string;
  qaAskedBy: string;
  qaAnswer?: string;
  qaAskedAt: string;
  qaAnsweredAt?: string;
  milestone: Omit<Milestone, 'id' | 'projectId' | 'projectName'>;
};

const generatedProjectSeeds: GeneratedProjectSeed[] = [
  {
    id: 'p7',
    createdByUserId: 'u1',
    ownerAgencyId: 'ag7',
    createdAt: '2024-03-08',
    updatedAt: '2024-03-18',
    publishedAt: '2024-03-12',
    name: 'Saigon River Transit-Oriented Innovation District',
    sector: 'Infrastructure',
    location: administrativeLocationMasterData.saiGonWard,
    province: 'Ho Chi Minh City',
    budget: 420,
    minInvestment: 40,
    status: 'published',
    description: 'Mixed-use transit-oriented district integrating riverfront mobility, grade-A office space, and digital public infrastructure near the central core of Ho Chi Minh City.',
    highlights: ['Transit-linked masterplan', 'Mixed-use zoning approved', 'Prime CBD waterfront access', 'Investor roadshow ready'],
    returnRate: '11-14% IRR',
    timeline: '2025-2033',
    landArea: '145 ha',
    jobs: 28000,
    followers: 198,
    dataCompleteness: 84,
    documentName: 'River District Investment Brief.pdf',
    qaQuestion: 'What is the phasing logic for the riverside access boulevard?',
    qaAskedBy: 'Mekong Capital Advisors',
    qaAnswer: 'The boulevard is phased in parallel with package A mobility works, with temporary circulation lanes opened before tower delivery.',
    qaAskedAt: '2024-03-16',
    qaAnsweredAt: '2024-03-18',
    milestone: { phase: 'Phase 1', description: 'Primary interchange and public realm package', dueDate: '2025-09-30', status: 'pending', progress: 0 },
  },
  {
    id: 'p8',
    createdByUserId: 'u2',
    ownerAgencyId: 'ag3',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-22',
    publishedAt: '2024-03-20',
    name: 'Tan Dinh Health Innovation Campus',
    sector: 'Healthcare',
    location: administrativeLocationMasterData.tanDinhWard,
    province: 'Ho Chi Minh City',
    budget: 160,
    minInvestment: 16,
    status: 'processing',
    description: 'Integrated healthcare and medical innovation campus combining specialist treatment facilities, med-tech labs, and training infrastructure for regional care delivery.',
    highlights: ['Hospital-innovation hybrid model', 'Clinical training partnerships', 'Foreign operator welcome', 'Specialist care demand zone'],
    returnRate: '10-12% IRR',
    timeline: '2025-2031',
    landArea: '36 ha',
    jobs: 7200,
    followers: 143,
    dataCompleteness: 76,
    documentName: 'Medical Campus Concept Note.pdf',
    qaQuestion: 'Can the project reserve a phase for specialist outpatient services?',
    qaAskedBy: 'Asia Healthcare Capital',
    qaAnswer: 'Yes. The current land-use concept reserves a dedicated outpatient and diagnostics wing in phase 2.',
    qaAskedAt: '2024-03-21',
    qaAnsweredAt: '2024-03-22',
    milestone: { phase: 'Phase 1', description: 'Clinical master planning and hospital operator shortlist', dueDate: '2025-06-30', status: 'in_progress', progress: 32 },
  },
  {
    id: 'p9',
    createdByUserId: 'u1',
    ownerAgencyId: 'ag7',
    createdAt: '2024-03-06',
    updatedAt: '2024-03-21',
    publishedAt: '2024-03-14',
    name: 'Tan Thuan Advanced Logistics Port Hub',
    sector: 'Logistics',
    location: administrativeLocationMasterData.tanThuanWard,
    province: 'Ho Chi Minh City',
    budget: 275,
    minInvestment: 25,
    status: 'published',
    description: 'Last-mile and port-adjacent logistics hub designed to consolidate bonded warehousing, urban distribution, and digital customs enablement for import-export flows.',
    highlights: ['Port-adjacent logistics footprint', 'Bonded warehouse option', 'Customs enablement program', 'Cold-chain expansion ready'],
    returnRate: '11-13% IRR',
    timeline: '2024-2030',
    landArea: '62 ha',
    jobs: 9400,
    followers: 174,
    dataCompleteness: 87,
    documentName: 'Port Hub Investor Deck.pdf',
    qaQuestion: 'Is the bonded storage area included in the base land package?',
    qaAskedBy: 'HarborLink Logistics',
    qaAnswer: 'Yes. The base package includes bonded-storage allocation with customs inspection frontage.',
    qaAskedAt: '2024-03-18',
    qaAnsweredAt: '2024-03-20',
    milestone: { phase: 'Phase 1', description: 'Bonded logistics design and customs circulation package', dueDate: '2025-03-31', status: 'in_progress', progress: 41 },
  },
  {
    id: 'p10',
    createdByUserId: 'u2',
    ownerAgencyId: 'ag9',
    createdAt: '2024-03-11',
    updatedAt: '2024-03-24',
    publishedAt: '2024-03-22',
    name: 'Phu Thuan Circular Economy Waterfront Park',
    sector: 'Energy',
    location: administrativeLocationMasterData.phuThuanWard,
    province: 'Ho Chi Minh City',
    budget: 190,
    minInvestment: 18,
    status: 'processing',
    description: 'Circular-economy energy park combining waste-to-energy processing, material recovery, and waterfront resilience infrastructure serving southern city districts.',
    highlights: ['Waste-to-energy platform', 'Circular material recovery', 'Waterfront resilience package', 'Public-private implementation model'],
    returnRate: '10-13% IRR',
    timeline: '2025-2032',
    landArea: '88 ha',
    jobs: 6800,
    followers: 152,
    dataCompleteness: 79,
    documentName: 'Circular Economy Park Summary.pdf',
    qaQuestion: 'What is the expected feedstock catchment for the first phase?',
    qaAskedBy: 'Nordic Green Energy Fund',
    qaAnswer: 'The first phase is sized for a city-managed feedstock cluster from District 7 and neighboring transfer stations.',
    qaAskedAt: '2024-03-23',
    qaAnsweredAt: '2024-03-24',
    milestone: { phase: 'Phase 1', description: 'Feedstock routing validation and shoreline engineering scope', dueDate: '2025-08-31', status: 'in_progress', progress: 27 },
  },
  {
    id: 'p11',
    createdByUserId: 'u1',
    ownerAgencyId: 'ag7',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-25',
    name: 'Binh Phu Urban Mobility Depot',
    sector: 'Infrastructure',
    location: administrativeLocationMasterData.binhPhuWard,
    province: 'Ho Chi Minh City',
    budget: 95,
    minInvestment: 10,
    status: 'draft',
    description: 'Integrated urban mobility depot supporting electric bus operations, charging infrastructure, fleet management, and multimodal transfer services for the western city corridor.',
    highlights: ['Electric bus infrastructure', 'Mobility depot operations', 'Western corridor access', 'Land assembly in progress'],
    returnRate: '9-11% IRR',
    timeline: '2025-2029',
    landArea: '24 ha',
    jobs: 2900,
    followers: 118,
    dataCompleteness: 58,
    documentName: 'Mobility Depot Draft Scope.pdf',
    qaQuestion: 'Can the depot phase charging infrastructure separately from fleet storage?',
    qaAskedBy: 'Urban Fleet Partners',
    qaAskedAt: '2024-03-24',
    milestone: { phase: 'Phase 1', description: 'Depot land assembly and preliminary charging layout', dueDate: '2025-02-28', status: 'pending', progress: 0 },
  },
  {
    id: 'p12',
    createdByUserId: 'u2',
    ownerAgencyId: 'ag5',
    createdAt: '2024-03-09',
    updatedAt: '2024-03-26',
    publishedAt: '2024-03-19',
    name: 'Tay Thanh Green Electronics Cluster',
    sector: 'Manufacturing',
    location: administrativeLocationMasterData.tayThanhWard,
    province: 'Ho Chi Minh City',
    budget: 230,
    minInvestment: 22,
    status: 'published',
    description: 'Green electronics manufacturing cluster focused on component assembly, testing, and supplier co-location with sustainability-linked utility systems.',
    highlights: ['Export-ready manufacturing zone', 'Supplier co-location model', 'Green utility backbone', 'Skilled labor catchment'],
    returnRate: '12-16% IRR',
    timeline: '2024-2030',
    landArea: '54 ha',
    jobs: 16000,
    followers: 201,
    dataCompleteness: 90,
    documentName: 'Electronics Cluster Prospectus.pdf',
    qaQuestion: 'What clean-power share is reserved for anchor tenants?',
    qaAskedBy: 'Mitsubishi Industrial Ventures',
    qaAnswer: 'Anchor tenants are allocated a dedicated renewable-energy procurement package under the phased utility plan.',
    qaAskedAt: '2024-03-20',
    qaAnsweredAt: '2024-03-22',
    milestone: { phase: 'Phase 1', description: 'Anchor-tenant parcel release and clean utility package', dueDate: '2025-05-31', status: 'in_progress', progress: 46 },
  },
  {
    id: 'p13',
    createdByUserId: 'u2',
    ownerAgencyId: 'ag14',
    createdAt: '2024-03-18',
    updatedAt: '2024-03-27',
    name: 'Phu Tho Hoa Creative Manufacturing Campus',
    sector: 'Technology',
    location: administrativeLocationMasterData.phuThoHoaWard,
    province: 'Ho Chi Minh City',
    budget: 110,
    minInvestment: 12,
    status: 'draft',
    description: 'Flexible campus for design-led manufacturing, prototyping labs, and SME maker infrastructure bridging innovation programs with export-oriented production.',
    highlights: ['Prototype-to-production pathway', 'SME maker infrastructure', 'Urban talent access', 'Flexible block planning'],
    returnRate: '10-14% IRR',
    timeline: '2025-2030',
    landArea: '29 ha',
    jobs: 6100,
    followers: 127,
    dataCompleteness: 54,
    documentName: 'Creative Manufacturing Campus Outline.pdf',
    qaQuestion: 'Can pilot production suites be leased separately from the core campus?',
    qaAskedBy: 'VietTech Ventures',
    qaAskedAt: '2024-03-26',
    milestone: { phase: 'Phase 1', description: 'Concept zoning and prototype-lab operating model', dueDate: '2025-07-31', status: 'pending', progress: 0 },
  },
  {
    id: 'p14',
    createdByUserId: 'u1',
    ownerAgencyId: 'ag6',
    createdAt: '2024-03-13',
    updatedAt: '2024-03-28',
    publishedAt: '2024-03-21',
    name: 'Binh Chanh Food Innovation & Distribution Center',
    sector: 'Agriculture',
    location: administrativeLocationMasterData.binhChanhCommune,
    province: 'Ho Chi Minh City',
    budget: 135,
    minInvestment: 14,
    status: 'processing',
    description: 'Integrated food innovation, cold-chain distribution, and regional aggregation center designed to strengthen traceability and value-added processing for southern supply chains.',
    highlights: ['Cold-chain distribution core', 'Traceability-ready operations', 'Export preparation services', 'Regional aggregation access'],
    returnRate: '10-12% IRR',
    timeline: '2025-2031',
    landArea: '70 ha',
    jobs: 8700,
    followers: 149,
    dataCompleteness: 73,
    documentName: 'Food Innovation Center Brief.pdf',
    qaQuestion: 'Will the center include testing labs for export certification support?',
    qaAskedBy: 'Mekong Agri Ventures',
    qaAnswer: 'Yes. The concept includes a shared testing-and-certification wing next to the processing zone.',
    qaAskedAt: '2024-03-25',
    qaAnsweredAt: '2024-03-27',
    milestone: { phase: 'Phase 1', description: 'Cold-chain master plan and certification-lab concept', dueDate: '2025-06-30', status: 'in_progress', progress: 35 },
  },
  {
    id: 'p15',
    createdByUserId: 'u1',
    ownerAgencyId: 'ag5',
    createdAt: '2024-03-07',
    updatedAt: '2024-03-30',
    publishedAt: '2024-03-11',
    name: 'Dong Thanh Smart Warehousing Network',
    sector: 'Logistics',
    location: administrativeLocationMasterData.dongThanhCommune,
    province: 'Ho Chi Minh City',
    budget: 145,
    minInvestment: 15,
    status: 'completed',
    description: 'Smart warehousing network with digital inventory visibility, high-throughput cross-docking, and automated last-mile staging for metropolitan distribution.',
    highlights: ['Automated warehousing core', 'Cross-docking operations', 'Digital inventory visibility', 'Demonstrated operating model'],
    returnRate: '11-13% IRR',
    timeline: '2023-2026',
    landArea: '31 ha',
    jobs: 5300,
    followers: 222,
    dataCompleteness: 98,
    documentName: 'Warehousing Network Operations Pack.pdf',
    qaQuestion: 'Can the existing automation spine be scaled for e-commerce tenants?',
    qaAnswer: 'Yes. The network already reserves additional sorting capacity and mezzanine space for e-commerce tenants.',
    qaAskedBy: 'TransitEdge Logistics',
    qaAskedAt: '2024-03-28',
    qaAnsweredAt: '2024-03-30',
    milestone: { phase: 'Phase 2', description: 'Automation commissioning and operator handover', dueDate: '2026-01-31', status: 'completed', progress: 100, completedDate: '2026-01-18' },
  },
  {
    id: 'p16',
    createdByUserId: 'u2',
    ownerAgencyId: 'ag7',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-29',
    publishedAt: '2024-03-23',
    name: 'Hiep Phuoc Offshore Services & Logistics Base',
    sector: 'Logistics',
    location: administrativeLocationMasterData.hiepPhuocCommune,
    province: 'Ho Chi Minh City',
    budget: 310,
    minInvestment: 30,
    status: 'processing',
    description: 'Integrated offshore-support and heavy-logistics base serving marine services, project cargo, and fabrication-adjacent supply operations for southern Vietnam.',
    highlights: ['Marine support operations', 'Heavy project cargo handling', 'Fabrication-adjacent logistics', 'Phaseable waterfront parcels'],
    returnRate: '12-14% IRR',
    timeline: '2025-2032',
    landArea: '118 ha',
    jobs: 11200,
    followers: 186,
    dataCompleteness: 82,
    documentName: 'Offshore Logistics Base Overview.pdf',
    qaQuestion: 'What draft depth is assumed for the first marine service package?',
    qaAskedBy: 'Bluewater Industrial Capital',
    qaAnswer: 'The first package assumes medium-draft service vessels with staged dredging allowance for later expansion.',
    qaAskedAt: '2024-03-27',
    qaAnsweredAt: '2024-03-29',
    milestone: { phase: 'Phase 1', description: 'Marine frontage engineering and heavy-cargo staging plan', dueDate: '2025-10-31', status: 'in_progress', progress: 29 },
  },
];

const additionalMockProjects: Project[] = generatedProjectSeeds.map((seed, index) => ({
  id: seed.id,
  createdByUserId: seed.createdByUserId,
  ownerAgencyId: seed.ownerAgencyId,
  createdAt: seed.createdAt,
  updatedAt: seed.updatedAt,
  publishedAt: seed.publishedAt,
  name: seed.name,
  projectType: 'public',
  sector: seed.sector,
  location: seed.location,
  province: seed.province,
  budget: seed.budget,
  minInvestment: seed.minInvestment,
  status: seed.status,
  stage: getProjectStageLabel(seed.status),
  description: seed.description,
  image: generatedProjectImagePool[index % generatedProjectImagePool.length],
  highlights: [...seed.highlights],
  returnRate: seed.returnRate,
  timeline: seed.timeline,
  landArea: seed.landArea,
  jobs: seed.jobs,
  followers: seed.followers,
  dataCompleteness: seed.dataCompleteness,
  sector_tag_color: sectorTagColorBySector[seed.sector] ?? 'bg-slate-100 text-slate-700',
  documents: [
    {
      id: `d-${seed.id}-1`,
      name: seed.documentName,
      type: 'PDF',
      size: `${(2.6 + index * 0.3).toFixed(1)} MB`,
      uploadedAt: seed.updatedAt ?? seed.createdAt ?? '2024-03-01',
    },
  ],
  qa: [
    {
      id: `q-${seed.id}-1`,
      question: seed.qaQuestion,
      askedBy: seed.qaAskedBy,
      askedAt: seed.qaAskedAt,
      answer: seed.qaAnswer,
      answeredAt: seed.qaAnsweredAt,
    },
  ],
  milestones: [
    {
      id: `m-${seed.id}-1`,
      projectId: seed.id,
      projectName: seed.name,
      ...seed.milestone,
    },
  ],
}));

const importedExternalProjectSeeds: ImportedProjectSeed[] = [
  { id: 's1', slug: 'metro-line-2-integration-hub', name: 'Metro Line 2 Integration Hub', nameVi: 'Trung tâm kết nối Metro tuyến 2', sector: 'Infrastructure & Urban', district: 'Thu Duc', status: 'PUBLISHED', ownerType: 'GOVERNMENT', investmentMinUsd: 350000000, investmentMaxUsd: 520000000, isPriority: true },
  { id: 's2', slug: 'thu-thiem-smart-city-center', name: 'Thu Thiem Smart City Center', nameVi: 'Trung tâm thành phố thông minh Thủ Thiêm', sector: 'Real Estate & Smart Cities', district: 'Thu Duc', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 1200000000, investmentMaxUsd: 2500000000, isPriority: true },
  { id: 's3', slug: 'can-gio-deep-water-port', name: 'Can Gio Deep Water Port', nameVi: 'Cảng nước sâu Cần Giờ', sector: 'Logistics & Supply Chain', district: 'Can Gio', status: 'PUBLISHED', ownerType: 'GOVERNMENT', investmentMinUsd: 5500000000, investmentMaxUsd: 6000000000, isPriority: true },
  { id: 's7', slug: 'can-gio-floating-solar-farm', name: 'Can Gio Floating Solar Farm', nameVi: 'Nhà máy điện mặt trời nổi Cần Giờ', sector: 'Renewable Energy', district: 'Can Gio', status: 'APPROVED', ownerType: 'GOVERNMENT', investmentMinUsd: 180000000, investmentMaxUsd: 250000000, isPriority: false },
  { id: 's8', slug: 'hiep-phuoc-logistics-hub', name: 'Hiep Phuoc Logistics Hub', nameVi: 'Trung tâm logistics Hiệp Phước', sector: 'Logistics & Supply Chain', district: 'Nha Be', status: 'EXECUTING', ownerType: 'GOVERNMENT', investmentMinUsd: 200000000, investmentMaxUsd: 320000000, isPriority: false },
  { id: 's10', slug: 'binh-chanh-green-industrial-park', name: 'Binh Chanh Green Industrial Park', nameVi: 'Khu công nghiệp xanh Bình Chánh', sector: 'Clean Energy & Environment', district: 'Binh Chanh', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 450000000, investmentMaxUsd: 680000000, isPriority: false },
  { id: 's12', slug: 'shtp-semiconductor-foundry', name: 'SHTP Semiconductor Foundry', nameVi: 'Nhà máy bán dẫn SHTP', sector: 'High-Tech & Digital', district: 'Thu Duc', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 2000000000, investmentMaxUsd: 3500000000, isPriority: false },
  { id: 's16', slug: 'd12-biopharma-park', name: 'District 12 Biopharma Manufacturing Park', nameVi: 'Khu sản xuất dược sinh học Quận 12', sector: 'Biotech & Life Sciences', district: 'District 12', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 400000000, investmentMaxUsd: 650000000, isPriority: false },
  { id: 's19', slug: 'thu-duc-water-treatment-3', name: 'Thu Duc Water Treatment Plant 3', nameVi: 'Nhà máy nước sạch Thủ Đức 3', sector: 'Infrastructure & Urban', district: 'Thu Duc', status: 'EXECUTING', ownerType: 'GOVERNMENT', investmentMinUsd: 380000000, investmentMaxUsd: 520000000, isPriority: false },
  { id: 's21', slug: 'cu-chi-high-tech-agriculture', name: 'Cu Chi High-Tech Agriculture Center', nameVi: 'Trung tâm nông nghiệp công nghệ cao Củ Chi', sector: 'AgriTech', district: 'Cu Chi', status: 'PUBLISHED', ownerType: 'GOVERNMENT', investmentMinUsd: 120000000, investmentMaxUsd: 180000000, isPriority: false },
  { id: 'm7', slug: 'thu-thiem-mixed', name: 'Thu Thiem New Urban Area — Mixed-Use', nameVi: 'Khu Do thi moi Thu Thiem — Da nang', sector: 'Infrastructure & Urban', district: 'Thu Duc', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 100000000, investmentMaxUsd: 500000000, isPriority: true },
  { id: 'm8', slug: 'd7-hospital', name: 'District 7 International Hospital Complex', nameVi: 'Tổ hợp bệnh viện quốc tế Quận 7', sector: 'Healthcare & Pharma', district: 'District 7', status: 'PUBLISHED', ownerType: 'GOVERNMENT', investmentMinUsd: 50000000, investmentMaxUsd: 100000000, isPriority: false },
  { id: 'm21', slug: 'can-gio-port', name: 'Can Gio International Transshipment Port', nameVi: 'Cảng trung chuyển quốc tế Cần Giờ', sector: 'Logistics & Supply Chain', district: 'Can Gio', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 500000000, investmentMaxUsd: 1000000000, isPriority: true },
  { id: 'm27', slug: 'brvt-lng', name: 'Ba Ria LNG Power Plant', nameVi: 'Nha may Dien LNG Ba Ria', sector: 'Renewable Energy', district: 'Ba Ria-Vung Tau', status: 'ATTRACTING_INTEREST', ownerType: 'GOVERNMENT', investmentMinUsd: 500000000, investmentMaxUsd: 1000000000, isPriority: true },
  { id: 'm29', slug: 'brvt-petrochem', name: 'Long Son Petrochemical Complex Phase 2', nameVi: 'To hop Hoa dau Long Son Giai doan 2', sector: 'Renewable Energy', district: 'Ba Ria-Vung Tau', status: 'EXECUTING', ownerType: 'GOVERNMENT', investmentMinUsd: 1000000000, investmentMaxUsd: 2000000000, isPriority: true },
  { id: 'm30', slug: 'nha-be-waterfront', name: 'Nha Be Waterfront Residential & Retail', nameVi: 'Khu dan cu & Thuong mai ven song Nha Be', sector: 'Real Estate & Smart Cities', district: 'Nha Be', status: 'PUBLISHED', ownerType: 'PRIVATE', investmentMinUsd: 40000000, investmentMaxUsd: 90000000, isPriority: false },
];

const importedExternalMockProjects: Project[] = importedExternalProjectSeeds.map((seed, index) => {
  const normalizedStatus = mapImportedProjectStatus(seed.status);
  const createdAt = `2024-04-${String((index % 20) + 1).padStart(2, '0')}`;
  const updatedAt = `2024-05-${String((index % 20) + 1).padStart(2, '0')}`;
  const publishedAt = normalizedStatus === 'draft' ? '' : updatedAt;
  const minInvestment = Math.max(5, Math.round(seed.investmentMinUsd / 1_000_000));
  const budget = Math.max(minInvestment, Math.round(seed.investmentMaxUsd / 1_000_000));

  return {
    id: seed.id,
    createdByUserId: index % 2 === 0 ? 'u1' : 'u2',
    ownerAgencyId: mapImportedProjectOwnerAgencyId(seed.sector),
    createdAt,
    updatedAt,
    publishedAt,
    name: seed.name,
    nameVi: seed.nameVi,
    nameEn: seed.name,
    projectType: seed.ownerType === 'PRIVATE' ? 'private' : 'public',
    sector: seed.sector,
    location: mapImportedProjectLocation(seed.district),
    province: mapImportedProjectProvince(seed.district),
    budget,
    minInvestment,
    status: normalizedStatus,
    stage: getProjectStageLabel(normalizedStatus),
    description: `${seed.name} is an imported mock project normalized into the current HCMInvHub data model. The source pipeline labels this opportunity under ${seed.sector} in ${seed.district}, and the mock record keeps the original project ID while aligning ownership and location to the app's existing master-data rules.`,
    descriptionVi: `${seed.nameVi} là dự án mock được nhập từ nguồn dữ liệu bên ngoài và chuẩn hóa theo mô hình dữ liệu hiện tại của HCMInvHub. Hồ sơ này giữ nguyên mã dự án gốc, đồng thời đồng bộ cơ quan phụ trách và địa bàn theo master data hiện có của hệ thống.`,
    descriptionEn: `${seed.name} is an imported mock project normalized into the current HCMInvHub data model. The source pipeline labels this opportunity under ${seed.sector} in ${seed.district}, and the mock record keeps the original project ID while aligning ownership and location to the app's existing master-data rules.`,
    image: generatedProjectImagePool[(index + 3) % generatedProjectImagePool.length],
    highlights: [
      seed.nameVi,
      seed.ownerType === 'PRIVATE' ? 'Private-led source pipeline' : 'Government-led source pipeline',
      seed.isPriority ? 'Priority shortlist project' : 'Expanded mock portfolio project',
      `${minInvestment}-${budget}M USD investment band`,
    ],
    highlightsVi: [
      seed.nameVi,
      seed.ownerType === 'PRIVATE' ? 'Nguồn dữ liệu do khối tư nhân dẫn dắt' : 'Nguồn dữ liệu do khối nhà nước dẫn dắt',
      seed.isPriority ? 'Dự án thuộc danh sách ưu tiên' : 'Dự án thuộc danh mục mock mở rộng',
      `Biên độ vốn đầu tư ${minInvestment}-${budget} triệu USD`,
    ],
    highlightsEn: [
      seed.nameVi,
      seed.ownerType === 'PRIVATE' ? 'Private-led source pipeline' : 'Government-led source pipeline',
      seed.isPriority ? 'Priority shortlist project' : 'Expanded mock portfolio project',
      `${minInvestment}-${budget}M USD investment band`,
    ],
    returnRate: buildImportedProjectReturnRate(seed.sector),
    timeline: seed.isPriority ? '2025-2033' : '2025-2030',
    landArea: `${Math.max(18, Math.round(budget / 8))} ha`,
    jobs: Math.max(1200, Math.round(budget * 22)),
    followers: 90 + index * 13,
    dataCompleteness: seed.isPriority ? 88 : 74,
    sector_tag_color: mapImportedSectorColor(seed.sector),
    documents: [
      {
        id: `d-${seed.id}-1`,
        name: `${seed.slug}-investment-brief.pdf`,
        nameVi: `Hồ sơ đầu tư ${seed.nameVi}.pdf`,
        nameEn: `${seed.slug}-investment-brief.pdf`,
        type: 'PDF',
        size: `${(2.4 + (index % 5) * 0.6).toFixed(1)} MB`,
        uploadedAt: updatedAt,
      },
    ],
    qa: [
      {
        id: `q-${seed.id}-1`,
        question: `What is the current coordination status for ${seed.name}?`,
        questionVi: `Tình trạng điều phối hiện tại của dự án ${seed.nameVi} là gì?`,
        questionEn: `What is the current coordination status for ${seed.name}?`,
        askedBy: seed.ownerType === 'PRIVATE' ? 'Private Capital Desk' : 'Investor Relations Desk',
        askedByVi: seed.ownerType === 'PRIVATE' ? 'Bộ phận hỗ trợ vốn tư nhân' : 'Bộ phận quan hệ nhà đầu tư',
        askedByEn: seed.ownerType === 'PRIVATE' ? 'Private Capital Desk' : 'Investor Relations Desk',
        askedAt: updatedAt,
        answer: `This mock record indicates that ${seed.name} is aligned for ${seed.status.toLowerCase().replace(/_/g, ' ')} review and has been normalized to the current execution workspace structure.`,
        answerVi: `Hồ sơ mock này cho thấy dự án ${seed.nameVi} đang được căn chỉnh cho trạng thái ${seed.status.toLowerCase().replace(/_/g, ' ')} và đã được chuẩn hóa theo cấu trúc không gian triển khai hiện tại.`,
        answerEn: `This mock record indicates that ${seed.name} is aligned for ${seed.status.toLowerCase().replace(/_/g, ' ')} review and has been normalized to the current execution workspace structure.`,
        answeredAt: updatedAt,
      },
    ],
    milestones: [
      {
        id: `m-${seed.id}-1`,
        projectId: seed.id,
        projectName: seed.name,
        phase: 'Phase 1',
        phaseVi: 'Giai đoạn 1',
        phaseEn: 'Phase 1',
        description: 'Imported mock pipeline normalization and launch planning',
        descriptionVi: 'Chuẩn hóa dữ liệu mock nhập khẩu và lập kế hoạch khởi động',
        descriptionEn: 'Imported mock pipeline normalization and launch planning',
        dueDate: seed.isPriority ? '2025-09-30' : '2025-12-31',
        status: normalizedStatus === 'completed' ? 'completed' : normalizedStatus === 'processing' ? 'in_progress' : 'pending',
        progress: normalizedStatus === 'completed' ? 100 : normalizedStatus === 'processing' ? 42 : 0,
      },
    ],
  };
});

const baseProjectRecords = [
  {
    id: 'p1',
    createdByUserId: 'u1',
    ownerAgencyId: 'ag7',
    name: 'Ho Chi Minh City Smart Infrastructure Hub',
    sector: 'Infrastructure',
    location: administrativeLocationMasterData.thuDucWard,
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
    ownerAgencyId: 'ag9',
    name: 'Ho Chi Minh City Renewable Energy Integration Park',
    sector: 'Energy',
    location: administrativeLocationMasterData.thanhAnCommune,
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
    ownerAgencyId: 'ag5',
    name: 'Ho Chi Minh City Advanced Manufacturing Zone',
    sector: 'Manufacturing',
    location: administrativeLocationMasterData.thaiMyCommune,
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
    ownerAgencyId: 'ag13',
    name: 'Ho Chi Minh City Riverside Tourism & Convention Complex',
    sector: 'Tourism',
    location: administrativeLocationMasterData.anKhanhWard,
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
    ownerAgencyId: 'ag14',
    name: 'Ho Chi Minh City Technology Innovation Hub',
    sector: 'Technology',
    location: administrativeLocationMasterData.tangNhonPhuWard,
    province: 'Ho Chi Minh City',
    budget: 100,
    minInvestment: 10,
    status: 'draft',
    stage: 'Draft',
    description: 'Ho Chi Minh City\'s flagship technology innovation cluster at Saigon Hi-Tech Park, designed to attract R&D centers, semiconductor manufacturing, and deep-tech startups with world-class facilities.',
    image: 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtJTIwc21hcnQlMjBjaXR5JTIwaW5mcmFzdHJ1Y3R1cmUlMjB1cmJhbiUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc3NDM0NDMyMnww&ixlib=rb-4.1.0&q=80&w=1080',
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
    ownerAgencyId: 'ag6',
    name: 'Ho Chi Minh City Agri-Logistics & Processing Complex',
    sector: 'Agriculture',
    location: administrativeLocationMasterData.nhuanDucCommune,
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
  ...additionalMockProjects,
  ...importedExternalMockProjects,
];

const privateProjectIds = new Set(['s2', 's8', 'm8', 'm21', 'm29', 'm30']);

export const projects: Project[] = baseProjectRecords.map((project) => ({
  ...project,
  projectType: privateProjectIds.has(project.id) ? 'private' : project.projectType ?? 'public',
}));

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
  { id: 'ag1', nameVi: 'Sở Nội vụ', nameEn: 'Department of Home Affairs' },
  { id: 'ag2', nameVi: 'Sở Tư pháp', nameEn: 'Department of Justice' },
  { id: 'ag3', nameVi: 'Sở Kế hoạch và Đầu tư', nameEn: 'Department of Planning and Investment' },
  { id: 'ag4', nameVi: 'Sở Tài chính', nameEn: 'Department of Finance' },
  { id: 'ag5', nameVi: 'Sở Công Thương', nameEn: 'Department of Industry and Trade' },
  { id: 'ag6', nameVi: 'Sở Nông nghiệp và Phát triển nông thôn', nameEn: 'Department of Agriculture and Rural Development' },
  { id: 'ag7', nameVi: 'Sở Giao thông Vận tải', nameEn: 'Department of Transport' },
  { id: 'ag8', nameVi: 'Sở Xây dựng', nameEn: 'Department of Construction' },
  { id: 'ag9', nameVi: 'Sở Tài nguyên và Môi trường', nameEn: 'Department of Natural Resources and Environment' },
  { id: 'ag10', nameVi: 'Sở Thông tin và Truyền thông', nameEn: 'Department of Information and Communications' },
  { id: 'ag11', nameVi: 'Sở Lao động - Thương binh và Xã hội', nameEn: 'Department of Labor, War Invalids and Social Affairs' },
  { id: 'ag12', nameVi: 'Sở Văn hóa và Thể thao', nameEn: 'Department of Culture and Sports' },
  { id: 'ag13', nameVi: 'Sở Du lịch', nameEn: 'Department of Tourism' },
  { id: 'ag14', nameVi: 'Sở Khoa học và Công nghệ', nameEn: 'Department of Science and Technology' },
  { id: 'ag15', nameVi: 'Sở Giáo dục và Đào tạo', nameEn: 'Department of Education and Training' },
  { id: 'ag16', nameVi: 'Sở Y tế', nameEn: 'Department of Medication' },
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
  totalProjects: projects.length,
  publishedProjects: projects.filter((project) => normalizeProjectStatus(project.status, project.stage) === 'published').length,
  totalInvestmentPipeline: projects.reduce((sum, project) => sum + project.budget, 0), // M USD
  approvedOpportunities: opportunities.filter((opportunity) => opportunity.stage === 'approved').length,
  activeExecution: projects.filter((project) => normalizeProjectStatus(project.status, project.stage) === 'processing').length,
  pendingPermits: permits.filter((permit) => permit.status === 'pending' || permit.status === 'in_review' || permit.status === 'info_required').length,
  slaBreached: serviceRequests.filter((request) => request.slaStatus === 'breached').length,
  slaAtRisk: serviceRequests.filter((request) => request.slaStatus === 'at_risk').length,
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

export const sectorInvestmentData = Object.entries(
  projects.reduce<Record<string, number>>((accumulator, project) => {
    accumulator[project.sector] = (accumulator[project.sector] ?? 0) + project.budget;
    return accumulator;
  }, {}),
)
  .map(([sector, value]) => ({ sector, value }))
  .sort((left, right) => right.value - left.value);

export const monthlyIntakeData = [
  { month: 'Oct', intakes: 8, approved: 1 },
  { month: 'Nov', intakes: 14, approved: 2 },
  { month: 'Dec', intakes: 11, approved: 1 },
  { month: 'Jan', intakes: 22, approved: 3 },
  { month: 'Feb', intakes: 18, approved: 2 },
  { month: 'Mar', intakes: 25, approved: 3 },
];


