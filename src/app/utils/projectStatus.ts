export type ProjectStatus = 'draft' | 'published' | 'processing' | 'completed' | 'cancelled';

export type ProjectStageLabel = 'Draft' | 'Published' | 'Processing' | 'Completed' | 'Cancelled';

export const PROJECT_STAGE_OPTIONS: ProjectStageLabel[] = ['Draft', 'Published', 'Processing', 'Completed', 'Cancelled'];

const PROJECT_STAGE_LABEL_BY_STATUS: Record<ProjectStatus, ProjectStageLabel> = {
  draft: 'Draft',
  published: 'Published',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PROJECT_STATUS_ALIAS_MAP: Record<string, ProjectStatus> = {
  draft: 'draft',
  review: 'draft',
  'under review': 'draft',
  published: 'published',
  'open for investment': 'published',
  processing: 'processing',
  execution: 'processing',
  'in execution': 'processing',
  completed: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

export function normalizeProjectStatus(status?: string | null, stage?: string | null): ProjectStatus {
  const normalizedStatus = PROJECT_STATUS_ALIAS_MAP[String(status ?? '').trim().toLowerCase()];
  if (normalizedStatus) return normalizedStatus;

  const normalizedStage = PROJECT_STATUS_ALIAS_MAP[String(stage ?? '').trim().toLowerCase()];
  if (normalizedStage) return normalizedStage;

  return 'draft';
}

export function getProjectStageLabel(status?: string | null, stage?: string | null): ProjectStageLabel {
  return PROJECT_STAGE_LABEL_BY_STATUS[normalizeProjectStatus(status, stage)];
}

export function getProjectStatusTone(
  status?: string | null,
  stage?: string | null,
): 'success' | 'warning' | 'default' | 'info' | 'danger' {
  switch (normalizeProjectStatus(status, stage)) {
    case 'draft':
      return 'default';
    case 'published':
      return 'warning';
    case 'processing':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}
