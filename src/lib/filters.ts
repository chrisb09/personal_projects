import type {
  Project,
  ProjectCategory,
  ProjectType,
  ProjectStatus,
  ProjectRole,
  ProjectSourceType,
  AIUsage,
  AIUtilization,
} from '@/types/project';

export interface FilterState {
  categories: ProjectCategory[];
  projectTypes: ProjectType[];
  statuses: ProjectStatus[];
  roles: ProjectRole[];
  sourceTypes: ProjectSourceType[];
  aiUsage: AIUsage[];
  aiUtilization: AIUtilization[];
  languages: string[];
  technologies: string[];
  academicOnly: boolean;
  hasStars: boolean;
  hasMedia: boolean;
}

export const defaultFilterState: FilterState = {
  categories: [],
  projectTypes: [],
  statuses: [],
  roles: [],
  sourceTypes: [],
  aiUsage: [],
  aiUtilization: [],
  languages: [],
  technologies: [],
  academicOnly: false,
  hasStars: false,
  hasMedia: false,
};

// Normalized list of recognized programming languages (excludes non-code formats like Markdown, XML, JSON, etc.)
export const PROGRAMMING_LANGUAGES = [
  'Python',
  'Java',
  'TypeScript',
  'JavaScript',
  'C++',
  'C#',
  'PHP',
  'Shell',
  'Rust',
  'Go',
  'HTML',
  'CSS',
] as const;

export function projectHasMedia(project: Project): boolean {
  if (project.screenshots && project.screenshots.length > 0) return true;
  const anyProj = project as any;
  if (Array.isArray(anyProj.media) && anyProj.media.length > 0) return true;
  return false;
}

export function projectHasStars(project: Project): boolean {
  return (project.stats?.stars || 0) > 0;
}

export function projectHasLanguage(project: Project, lang: string): boolean {
  const normLang = lang.toLowerCase();
  
  // 1. Check LOC breakdown
  if (project.loc?.byLanguage) {
    for (const [l, count] of Object.entries(project.loc.byLanguage)) {
      if (count <= 0) continue;
      const lLower = l.toLowerCase();
      if (lLower === normLang) return true;
      if (normLang === 'shell' && (lLower === 'bash' || lLower === 'sh')) return true;
      if (normLang === 'c++' && (lLower === 'c/c++ header' || lLower === 'cpp')) return true;
    }
  }

  // 2. Check declared technologies list
  return project.technologies.some(t => {
    const tLower = t.toLowerCase();
    if (tLower === normLang) return true;
    if (normLang === 'shell' && (tLower === 'bash' || tLower === 'sh')) return true;
    if (normLang === 'c++' && tLower === 'cpp') return true;
    return false;
  });
}

export function matchesFilters(
  project: Project,
  filters: FilterState,
  searchQuery: string
): boolean {
  // 1. Text Search across localized fields
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      project.name.toLowerCase().includes(q) ||
      project.tagline.toLowerCase().includes(q) ||
      project.description.toLowerCase().includes(q) ||
      (project.purpose && project.purpose.toLowerCase().includes(q)) ||
      project.technologies.some(t => t.toLowerCase().includes(q)) ||
      (project.dependencies && project.dependencies.some(d => d.toLowerCase().includes(q))) ||
      (project.expertise && project.expertise.some(e => e.toLowerCase().includes(q)));

    if (!matchesSearch) return false;
  }

  // 2. Categories (OR within facet)
  if (filters.categories.length > 0 && !filters.categories.includes(project.category)) {
    return false;
  }

  // 3. Project Types (OR within facet)
  const pType = project.projectType || 'software-project';
  if (filters.projectTypes.length > 0 && !filters.projectTypes.includes(pType)) {
    return false;
  }

  // 4. Statuses (OR within facet)
  if (filters.statuses.length > 0 && !filters.statuses.includes(project.status)) {
    return false;
  }

  // 5. Roles (OR within facet)
  if (filters.roles.length > 0 && !filters.roles.includes(project.role)) {
    return false;
  }

  // 6. Source Types (OR within facet)
  if (filters.sourceTypes.length > 0 && !filters.sourceTypes.includes(project.sourceType)) {
    return false;
  }

  // 7. AI Usage (OR within facet)
  if (filters.aiUsage.length > 0 && !filters.aiUsage.includes(project.aiUsage)) {
    return false;
  }

  // 8. AI Utilization (OR within facet)
  if (filters.aiUtilization.length > 0 && !filters.aiUtilization.includes(project.aiUtilization)) {
    return false;
  }

  // 9. Programming Languages (OR within facet)
  if (filters.languages.length > 0) {
    const hasAnyLang = filters.languages.some(lang => projectHasLanguage(project, lang));
    if (!hasAnyLang) return false;
  }

  // 10. Technologies / Tools (OR within facet)
  if (filters.technologies.length > 0) {
    const hasAnyTech = filters.technologies.some(tech =>
      project.technologies.some(pt => pt.toLowerCase() === tech.toLowerCase())
    );
    if (!hasAnyTech) return false;
  }

  // 11. Signals & Flags
  if (filters.academicOnly && !project.academic) {
    return false;
  }

  if (filters.hasStars && !projectHasStars(project)) {
    return false;
  }

  if (filters.hasMedia && !projectHasMedia(project)) {
    return false;
  }

  return true;
}

export function getActiveFilterCount(filters: FilterState): number {
  return (
    filters.categories.length +
    filters.projectTypes.length +
    filters.statuses.length +
    filters.roles.length +
    filters.sourceTypes.length +
    filters.aiUsage.length +
    filters.aiUtilization.length +
    filters.languages.length +
    filters.technologies.length +
    (filters.academicOnly ? 1 : 0) +
    (filters.hasStars ? 1 : 0) +
    (filters.hasMedia ? 1 : 0)
  );
}

// =====================================================================
// URL Query Parameter Serialization & Deserialization
// =====================================================================
export function parseFiltersFromUrl(queryString: string): { filters: FilterState; search: string } {
  const params = new URLSearchParams(queryString);
  const filters: FilterState = { ...defaultFilterState };

  const splitParam = (key: string) =>
    params.get(key)?.split(',').map(s => s.trim()).filter(Boolean) || [];

  filters.categories = splitParam('category') as ProjectCategory[];
  filters.projectTypes = splitParam('type') as ProjectType[];
  filters.statuses = splitParam('status') as ProjectStatus[];
  filters.roles = splitParam('role') as ProjectRole[];
  filters.sourceTypes = splitParam('source') as ProjectSourceType[];
  filters.aiUsage = splitParam('aiUsage') as AIUsage[];
  filters.aiUtilization = splitParam('aiUtil') as AIUtilization[];
  filters.languages = splitParam('lang');
  filters.technologies = splitParam('tech');
  filters.academicOnly = params.get('academic') === '1' || params.get('academic') === 'true';
  filters.hasStars = params.get('stars') === '1' || params.get('stars') === 'true';
  filters.hasMedia = params.get('media') === '1' || params.get('media') === 'true';

  const search = params.get('q') || '';
  return { filters, search };
}

export function filtersToSearchParams(filters: FilterState, searchQuery: string): URLSearchParams {
  const params = new URLSearchParams();

  if (searchQuery.trim()) {
    params.set('q', searchQuery.trim());
  }

  const setArrayParam = (key: string, arr: string[]) => {
    if (arr.length > 0) {
      params.set(key, arr.join(','));
    }
  };

  setArrayParam('category', filters.categories);
  setArrayParam('type', filters.projectTypes);
  setArrayParam('status', filters.statuses);
  setArrayParam('role', filters.roles);
  setArrayParam('source', filters.sourceTypes);
  setArrayParam('aiUsage', filters.aiUsage);
  setArrayParam('aiUtil', filters.aiUtilization);
  setArrayParam('lang', filters.languages);
  setArrayParam('tech', filters.technologies);

  if (filters.academicOnly) params.set('academic', '1');
  if (filters.hasStars) params.set('stars', '1');
  if (filters.hasMedia) params.set('media', '1');

  return params;
}

// Extract available programming languages and unique technologies with frequencies
export function getFacetStats(projects: Project[]) {
  const langCounts: Record<string, number> = {};
  const techCounts: Record<string, number> = {};

  PROGRAMMING_LANGUAGES.forEach(lang => {
    const count = projects.filter(p => projectHasLanguage(p, lang)).length;
    if (count > 0) {
      langCounts[lang] = count;
    }
  });

  projects.forEach(p => {
    p.technologies.forEach(tech => {
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    });
  });

  const sortedLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const sortedTechnologies = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  return {
    languages: sortedLanguages,
    technologies: sortedTechnologies,
  };
}
