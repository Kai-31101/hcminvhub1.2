import { Project } from '../data/mockData';

export const MOCK_FOLLOWED_PROJECT_COUNT = 10;
export const MOCK_JOINED_PROJECT_COUNT = 3;
export const MOCK_FOLLOWED_PROJECT_IDS = ['s1', 's2', 's3', 's7', 's8', 's10', 's12', 's16', 'm7', 'm21'] as const;
export const MOCK_JOINED_PROJECT_IDS = ['s7', 's8', 'm21'] as const;

export function getOrderedInvestorExecutionProjects(projects: Project[], watchlist: string[]) {
  const watchlistOrder = new Map(watchlist.map((projectId, index) => [projectId, index]));
  const watchedProjects = projects
    .filter((project) => watchlistOrder.has(project.id))
    .sort((left, right) => {
      const leftIndex = watchlistOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = watchlistOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
  const unwatchedProjects = projects.filter((project) => !watchlistOrder.has(project.id));

  return [...watchedProjects, ...unwatchedProjects];
}

export function getMockFollowedProjects(projects: Project[]) {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const selected = MOCK_FOLLOWED_PROJECT_IDS
    .map((projectId) => byId.get(projectId))
    .filter((project): project is Project => Boolean(project));

  if (selected.length >= MOCK_FOLLOWED_PROJECT_COUNT) {
    return selected.slice(0, MOCK_FOLLOWED_PROJECT_COUNT);
  }

  const remaining = projects.filter((project) => !selected.some((item) => item.id === project.id));
  return [...selected, ...remaining].slice(0, Math.min(MOCK_FOLLOWED_PROJECT_COUNT, projects.length));
}

export function getMockJoinedProjects(followedProjects: Project[]) {
  const byId = new Map(followedProjects.map((project) => [project.id, project]));
  const selected = MOCK_JOINED_PROJECT_IDS
    .map((projectId) => byId.get(projectId))
    .filter((project): project is Project => Boolean(project));

  if (selected.length >= MOCK_JOINED_PROJECT_COUNT) {
    return selected.slice(0, MOCK_JOINED_PROJECT_COUNT);
  }

  const remaining = followedProjects.filter((project) => !selected.some((item) => item.id === project.id));
  return [...selected, ...remaining].slice(0, Math.min(MOCK_JOINED_PROJECT_COUNT, followedProjects.length));
}
