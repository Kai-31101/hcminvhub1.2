import type { Project } from '../data/mockData';
import { getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../data/administrativeLocations';
import { normalizeProjectStatus } from './projectStatus';

export type InvestmentMapLanguage = 'en' | 'vi';

export interface InvestmentMapProject {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  sector: string;
  location: string;
  district: string;
  status: 'PUBLISHED' | 'ATTRACTING_INTEREST' | 'IN_PROCESS' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'PENDING_APPROVAL' | 'DRAFT';
  ownerType: 'GOVERNMENT' | 'PRIVATE';
  investmentMinUsd: number;
  investmentMaxUsd: number;
  lat: number;
  lng: number;
  isPriority: boolean;
  detailPath: string;
}

export interface InvestmentMapPayload {
  type: 'HCMINVESTMENT_MAP_SYNC';
  language: InvestmentMapLanguage;
  projects: InvestmentMapProject[];
}

const PROJECT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  p1: { lat: 10.8452, lng: 106.7788 },
  p2: { lat: 10.4118, lng: 106.9538 },
  p3: { lat: 11.0424, lng: 106.4694 },
  p4: { lat: 10.7865, lng: 106.7312 },
  p5: { lat: 10.8506, lng: 106.7948 },
  p6: { lat: 11.0306, lng: 106.5021 },
  s1: { lat: 10.8456, lng: 106.772 },
  s2: { lat: 10.7865, lng: 106.7312 },
  s3: { lat: 10.4112, lng: 106.953 },
  s7: { lat: 10.435, lng: 106.882 },
  s8: { lat: 10.631, lng: 106.769 },
  s10: { lat: 10.654, lng: 106.607 },
  s12: { lat: 10.858, lng: 106.805 },
  s16: { lat: 10.866, lng: 106.648 },
  s19: { lat: 10.875, lng: 106.785 },
  s21: { lat: 10.973, lng: 106.493 },
  m7: { lat: 10.79, lng: 106.74 },
  m8: { lat: 10.73, lng: 106.72 },
  m21: { lat: 10.415, lng: 106.955 },
  m27: { lat: 10.35, lng: 107.09 },
  m29: { lat: 10.355, lng: 107.095 },
  m30: { lat: 10.685, lng: 106.7 },
};

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Ho Chi Minh City': { lat: 10.7766, lng: 106.7009 },
  'District 1': { lat: 10.7766, lng: 106.7009 },
  'District 2': { lat: 10.7904, lng: 106.7498 },
  'District 7': { lat: 10.7327, lng: 106.7218 },
  'District 12': { lat: 10.865, lng: 106.649 },
  'Thu Duc': { lat: 10.8456, lng: 106.7824 },
  'Binh Chanh': { lat: 10.7084, lng: 106.5858 },
  'Can Gio': { lat: 10.4119, lng: 106.9548 },
  'Cu Chi': { lat: 11.0218, lng: 106.4936 },
  'Hoc Mon': { lat: 10.8832, lng: 106.5926 },
  'Nha Be': { lat: 10.6794, lng: 106.7325 },
  'Binh Duong': { lat: 11.0053, lng: 106.6527 },
  'Ba Ria-Vung Tau': { lat: 10.3473, lng: 107.0847 },
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferDistrict(project: Project) {
  const locationParts = [getProjectAdministrativeLocation(project), project.location, project.province]
    .filter(Boolean)
    .join(' ');
  const normalized = normalizeText(locationParts);

  if (normalized.includes('thu duc') || normalized.includes('tang nhon phu') || normalized.includes('an khanh')) return 'Thu Duc';
  if (normalized.includes('can gio') || normalized.includes('thanh an')) return 'Can Gio';
  if (normalized.includes('cu chi') || normalized.includes('thai my') || normalized.includes('nhuan duc')) return 'Cu Chi';
  if (normalized.includes('nha be') || normalized.includes('hiep phuoc')) return 'Nha Be';
  if (normalized.includes('binh chanh')) return 'Binh Chanh';
  if (normalized.includes('district 7') || normalized.includes('tan thuan') || normalized.includes('phu thuan')) return 'District 7';
  if (normalized.includes('district 1') || normalized.includes('sai gon') || normalized.includes('tan dinh')) return 'District 1';
  if (normalized.includes('district 2') || normalized.includes('cat lai') || normalized.includes('thao dien')) return 'District 2';
  if (normalized.includes('district 12')) return 'District 12';
  if (normalized.includes('hoc mon') || normalized.includes('dong thanh')) return 'Hoc Mon';
  if (normalized.includes('binh duong')) return 'Binh Duong';
  if (normalized.includes('ba ria') || normalized.includes('vung tau')) return 'Ba Ria-Vung Tau';

  return project.province || 'Ho Chi Minh City';
}

function inferCoordinates(project: Project, district: string) {
  return PROJECT_COORDINATES[project.id] ?? DISTRICT_COORDINATES[district] ?? DISTRICT_COORDINATES['Ho Chi Minh City'];
}

function mapOwnerType(project: Project): 'GOVERNMENT' | 'PRIVATE' {
  if (project.projectType === 'private') {
    return 'PRIVATE';
  }

  return 'GOVERNMENT';
}

function mapStatus(project: Project): InvestmentMapProject['status'] {
  switch (normalizeProjectStatus(project.status, project.stage)) {
    case 'draft':
      return 'DRAFT';
    case 'published':
      return 'PUBLISHED';
    case 'processing':
      return 'EXECUTING';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'PENDING_APPROVAL';
    default:
      return 'DRAFT';
  }
}

function isPriorityProject(project: Project) {
  return project.budget >= 500 || project.followers >= 250 || project.dataCompleteness >= 90;
}

export function buildInvestmentMapProjects(projects: Project[], detailBasePath = '/investor/project'): InvestmentMapProject[] {
  return projects.map((project) => {
    const district = inferDistrict(project);
    const coordinates = inferCoordinates(project, district);
    const masterLocation = getProjectAdministrativeLocation(project) || project.location || project.province;

    return {
      id: project.id,
      slug: slugify(project.nameEn || project.name),
      name: project.nameEn || project.name,
      nameVi: project.nameVi || project.name,
      sector: project.sector,
      location: getAdministrativeLocationLabel(masterLocation, 'en'),
      district,
      status: mapStatus(project),
      ownerType: mapOwnerType(project),
      investmentMinUsd: Math.max(1, project.minInvestment) * 1_000_000,
      investmentMaxUsd: Math.max(project.minInvestment, project.budget) * 1_000_000,
      lat: coordinates.lat,
      lng: coordinates.lng,
      isPriority: isPriorityProject(project),
      detailPath: `${detailBasePath}/${project.id}`,
    };
  });
}

export function buildInvestmentMapPayload(
  projects: Project[],
  language: InvestmentMapLanguage,
  detailBasePath = '/investor/project',
): InvestmentMapPayload {
  return {
    type: 'HCMINVESTMENT_MAP_SYNC',
    language,
    projects: buildInvestmentMapProjects(projects, detailBasePath),
  };
}
