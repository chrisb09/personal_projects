import type { Project } from '@/types/project';

export type ProjectTab = 'overview' | 'technical' | 'usage' | 'stats' | 'repositories' | 'media';

const PROJECT_TABS: ProjectTab[] = [
  'overview',
  'technical',
  'usage',
  'stats',
  'repositories',
  'media',
];

const PROJECT_TAB_SET = new Set<string>(PROJECT_TABS);

export interface ProjectRoute {
  projectId: string | null;
  tab: ProjectTab | null;
}

export function isProjectTab(value: string | null | undefined): value is ProjectTab {
  return Boolean(value && PROJECT_TAB_SET.has(value));
}

export function parseProjectRoute(queryString: string): ProjectRoute {
  const params = new URLSearchParams(queryString);
  const projectId = (params.get('project') || '').trim();
  const tab = (params.get('tab') || '').trim();

  return {
    projectId: projectId || null,
    tab: isProjectTab(tab) ? tab : null,
  };
}

export function getProjectTabs(project: Project): ProjectTab[] {
  const tabs: ProjectTab[] = ['overview', 'technical'];

  if (project.installation || project.usage) {
    tabs.push('usage');
  }

  // Stats may arrive asynchronously from stats.json, so keep this tab addressable.
  tabs.push('stats');

  if (
    (project.repos?.length ?? 0) > 0 ||
    (project.mirrors?.length ?? 0) > 0 ||
    (project.modelReleases?.length ?? 0) > 0
  ) {
    tabs.push('repositories');
  }

  if ((project.screenshots?.length ?? 0) > 0 || (project.relatedProjects?.length ?? 0) > 0) {
    tabs.push('media');
  }

  return tabs;
}

export function normalizeProjectTab(project: Project, tab: ProjectTab | null | undefined): ProjectTab {
  if (!tab) return 'overview';
  return getProjectTabs(project).includes(tab) ? tab : 'overview';
}

export function findProjectByRouteId(projects: Project[], projectId: string | null): Project | null {
  if (!projectId) return null;
  return (
    projects.find(project => project.id === projectId) ||
    projects.find(project => project.id.toLowerCase() === projectId.toLowerCase()) ||
    null
  );
}

function currentUrl(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function buildProjectUrl(
  projectId: string,
  tab: ProjectTab | null | undefined,
  search = window.location.search
): string {
  const params = new URLSearchParams(search);
  params.set('project', projectId);

  if (tab && tab !== 'overview') {
    params.set('tab', tab);
  } else {
    params.delete('tab');
  }

  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
}

export function buildUrlWithoutProject(search = window.location.search): string {
  const params = new URLSearchParams(search);
  params.delete('project');
  params.delete('tab');

  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
}

export function replaceUrlIfChanged(nextUrl: string, mode: 'push' | 'replace' = 'replace') {
  if (nextUrl === currentUrl()) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', nextUrl);
}
