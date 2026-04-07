import { Project } from '../data/mockData';

export function getProjectFollowerCount(project: Pick<Project, 'id' | 'budget'>) {
  const seed = project.id.split('').reduce((total, character) => total + character.charCodeAt(0), 0) + project.budget;
  return 120 + (seed % 38) * 17;
}

export function formatFollowerCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${count}`;
}
