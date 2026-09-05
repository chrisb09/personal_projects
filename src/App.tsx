import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { projects } from '@/config/projects';
import { useLocalizedProjects } from '@/lib/localizeProject';
import { ProjectFilters } from '@/components/ProjectFilters';
import {
  type FilterState,
  defaultFilterState,
  matchesFilters,
  parseFiltersFromUrl,
  filtersToSearchParams,
  getActiveFilterCount,
} from '@/lib/filters';
import headerConfig from '../config/portfolio-header.json';
import type { Project, ProjectCategory } from '@/types/project';
import { fetchStats, mergeStatsWithProjects } from '@/lib/stats';
import { initializeTheme } from '@/lib/theme';
import { 
  categoryLabels, 
  statusLabels,
  roleLabels,
  sourceTypeLabels,
  aiUsageLabels, 
  aiUsageColors, 
  aiUsageDescriptions, 
  aiUtilizationLabels, 
  aiUtilizationColors, 
  aiUtilizationDescriptions, 
  projectTypeLabels,
  languageColors,
} from '@/types/project';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Github, 
  Gitlab, 
  Linkedin, 
  Mail, 
  Search, 
  Code2, 
  X, 
  FolderGit2, 
  Star, 
  GitCommit, 
  Code, 
  Sparkles, 
  Cpu, 
  ExternalLink, 
  BookOpen,
  RotateCcw,
  SlidersHorizontal,
  Image as ImageIcon,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  Github,
  Gitlab,
  Linkedin,
  Mail,
  Search,
  Code2,
  X,
  FolderGit2,
  Star,
  GitCommit,
  Code,
  Sparkles,
  Cpu,
  ExternalLink,
  BookOpen
};

// AI Legend Component - shows both AI Usage (how it was built) and AI Utilization (does it use AI)
function AILegend() {
  const { t } = useTranslation();
  const usageLevels: Array<'none' | 'minor' | 'contributed' | 'major' | 'full'> = ['none', 'minor', 'contributed', 'major', 'full'];
  const utilizationLevels: Array<'ai-powered' | 'ai-enhanced' | 'no-ai'> = ['no-ai', 'ai-enhanced', 'ai-powered'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 rounded-lg p-6 border border-border/50">
      {/* Column 1: AI Usage Levels */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          {t('labels.built_with', 'Built with')} - {t('labels.ai_usage_levels', 'AI Usage Levels')}
        </h4>
        <div className="space-y-3">
          {usageLevels.map((level) => (
            <div key={level} className="flex items-center gap-3">
              <span 
                className={`${aiUsageColors[level]} px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0 min-w-[100px] text-center`}
              >
                {t(`ai_usage.${level}`, aiUsageLabels[level])}
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t(`ai_usage_descriptions.${level}`, aiUsageDescriptions[level])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: AI Utilization */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Cpu className="w-4 h-4 text-primary" />
          {t('labels.features', 'Features')} - {t('labels.ai_utilization_levels', 'AI Utilization')}
        </h4>
        <div className="space-y-3">
          {utilizationLevels.map((level) => (
            <div key={level} className="flex items-center gap-3">
              <span 
                className={`${aiUtilizationColors[level]} px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0 min-w-[110px] text-center`}
              >
                {t(`ai_utilization.${level}`, aiUtilizationLabels[level])}
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t(`ai_utilization_descriptions.${level}`, aiUtilizationDescriptions[level])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('overview');
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      return parseFiltersFromUrl(window.location.search).filters;
    }
    return defaultFilterState;
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return parseFiltersFromUrl(window.location.search).search;
    }
    return '';
  });
  const [projectsWithStats, setProjectsWithStats] = useState<Project[]>(projects);
  const localizedProjects = useLocalizedProjects(projectsWithStats);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloseTimeRef = useRef(0);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Fetch and merge stats on component mount
  useEffect(() => {
    const loadStats = async () => {
      const stats = await fetchStats();
      const mergedProjects = mergeStatsWithProjects(projects, stats);
      setProjectsWithStats(mergedProjects);
      console.log('[v0] Stats loaded and merged with projects');
    };

    loadStats();
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseFiltersFromUrl(window.location.search);
      setFilters(parsed.filters);
      setSearchQuery(parsed.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateFiltersAndUrl = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params = filtersToSearchParams(newFilters, searchQuery);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState(null, '', newUrl);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const params = filtersToSearchParams(filters, query);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilterState);
    setSearchQuery('');
    if (window.location.search) {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  // Filter projects based on faceted filters and text search
  const filteredProjects = useMemo(() => {
    return localizedProjects.filter(project =>
      matchesFilters(project, filters, searchQuery)
    );
  }, [localizedProjects, filters, searchQuery]);

  const hasActiveFilters = getActiveFilterCount(filters) > 0 || Boolean(searchQuery.trim());

  // Categories present across localized projects
  const availableCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    localizedProjects.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return (Object.keys(categoryLabels) as ProjectCategory[])
      .filter(cat => (counts[cat] || 0) > 0)
      .map(cat => ({ id: cat, count: counts[cat] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [localizedProjects]);

  const handleCategoryToggle = (catId: ProjectCategory) => {
    const newCategories = filters.categories.includes(catId)
      ? filters.categories.filter(c => c !== catId)
      : [...filters.categories, catId];
    updateFiltersAndUrl({ ...filters, categories: newCategories });
  };

  // Group filtered projects by projectType
  const groupedProjects = useMemo(() => {
    const groups: Record<string, Project[]> = {
      'software-project': [],
      'script-small': [],
      'it-project': [],
      '3d-printing': [],
    };
    
    filteredProjects.forEach(project => {
      const type = project.projectType || 'software-project';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(project);
    });
    
    return groups;
  }, [filteredProjects]);

  // Get aggregate stats from projects with stats
  const aggregateStats = useMemo(() => {
    const totalStars = projectsWithStats
      .filter(p => p.role === 'main-author' || p.role === 'fork-maintainer')
      .reduce((sum, p) => sum + (p.stats?.stars || 0), 0);
    const totalCommits = projectsWithStats.reduce((sum, p) => sum + (p.stats?.commits || 0), 0);
    return { totalStars, totalCommits };
  }, [projectsWithStats]);

  const locByLanguage = useMemo(() => {
    const languages: Record<string, number> = {};
    projectsWithStats.forEach(p => {
      if (p.loc?.byLanguage) {
        Object.entries(p.loc.byLanguage).forEach(([lang, count]) => {
          languages[lang] = (languages[lang] || 0) + count;
        });
      }
    });
    return languages;
  }, [projectsWithStats]);
  const totalLOC = Object.values(locByLanguage).reduce((sum, count) => sum + count, 0);

  const handleProjectClick = (project: Project) => {
    // Ignore click-through immediately after closing a modal
    if (Date.now() - lastCloseTimeRef.current < 400) {
      return;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setSelectedProject(project);
    setModalInitialTab('overview');
    setIsModalOpen(true);
  };

  const handleProjectMediaClick = (project: Project) => {
    // Ignore click-through immediately after closing a modal
    if (Date.now() - lastCloseTimeRef.current < 400) {
      return;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setSelectedProject(project);
    setModalInitialTab('media');
    setIsModalOpen(true);
  };

  const handleProjectSelect = (projectId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const project = projectsWithStats.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const handleCloseModal = () => {
    lastCloseTimeRef.current = Date.now();
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsModalOpen(false);
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedProject(null);
      closeTimeoutRef.current = null;
    }, 250);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <header className="relative overflow-hidden border-b border-border/50">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Top bar with theme and language controls */}
          <div className="relative flex items-center justify-end gap-1 px-4 sm:px-6 lg:px-8 pt-2 max-w-6xl mx-auto">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-5 pt-1.5 md:pb-6 md:pt-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {(() => {
                    const BadgeIcon = iconMap[headerConfig.badgeIcon] || Code2;
                    return <BadgeIcon className="w-4 h-4" />;
                  })()}
                  <span className="text-xs font-medium">{headerConfig.badgeText}</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  {t('header.title_prefix', headerConfig.titlePrefix)}{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t('header.title_highlight', headerConfig.titleHighlight)}
                  </span>
                </h1>
                
                <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                  {t('header.description', headerConfig.description)}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {headerConfig.buttons.map((btn, i) => {
                    const BtnIcon = iconMap[btn.icon] || ExternalLink;
                    const btnLabel = t(`header.buttons.${btn.text.toLowerCase()}`, btn.text);
                    return (
                      <Button 
                        key={i}
                        variant={btn.invertColor ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 gap-2 text-xs"
                        asChild
                      >
                        <a href={btn.url} target="_blank" rel="noopener noreferrer">
                          <BtnIcon className="w-3.5 h-3.5" />
                          {btnLabel}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Aggregate Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-primary">
                    <Star className="w-4 h-4" />
                    <p className="text-2xl font-bold">{aggregateStats.totalStars}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('stats.total_stars', 'Total Stars')}</p>
                </div>
                <div className="text-center md:text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help inline-block">
                          <div className="flex items-center md:justify-end gap-1.5 text-primary">
                            <GitCommit className="w-4 h-4" />
                            <p className="text-2xl font-bold">{aggregateStats.totalCommits}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{t('stats.total_commits', 'Total Commits')}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end">
                        <p className="text-xs max-w-xs">{t('stats.commits_tooltip', 'Commits authored by me on the default branch of all tracked projects.')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-center md:text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help inline-block">
                          <div className="flex items-center md:justify-end gap-1.5 text-primary">
                            <Code className="w-4 h-4" />
                            <p className="text-2xl font-bold">{(totalLOC / 1000).toFixed(1)}k</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{t('stats.total_loc', 'Total LOC')}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end">
                        <p className="text-xs max-w-xs">{t('stats.loc_tooltip', 'Lines of code authored by me that are currently in the default branch.')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          {/* Search and Filters bar */}
          <div className="flex items-center gap-2 mb-2.5">
            {/* Search: flex-1 on mobile, neat max-width on desktop */}
            <div className="relative flex-1 md:flex-initial md:w-64 lg:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('header.search_placeholder', 'Search projects, technologies, descriptions...')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm bg-card/60 border-border/70 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Inline Category Quick Filters (visible on md screens and above) */}
            <div className="hidden md:flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 py-0.5">
              {/* All Projects button */}
              <button
                type="button"
                onClick={() => updateFiltersAndUrl({ ...filters, categories: [] })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 border ${
                  filters.categories.length === 0
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                }`}
              >
                {t('filters.all', 'All')}
              </button>

              {/* Category buttons */}
              {availableCategories.map(({ id, count }) => {
                const isSelected = filters.categories.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleCategoryToggle(id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                    }`}
                  >
                    <span>{t(`categories.${id}`, categoryLabels[id])}</span>
                    <span className={`text-[10px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Faceted Filter Component (Popover on desktop, Sheet on mobile) */}
            <ProjectFilters
              filters={filters}
              onFilterChange={updateFiltersAndUrl}
              onReset={handleResetFilters}
              projects={localizedProjects}
              filteredCount={filteredProjects.length}
            />
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
              <span className="text-muted-foreground font-medium mr-1 flex items-center gap-1 text-[11px]">
                <SlidersHorizontal className="w-3 h-3 text-primary" />
                {t('filters.active_filters', 'Active filters')}:
              </span>

              {/* Text Search query chip */}
              {searchQuery.trim() && (
                <Badge
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span className="text-muted-foreground text-[10px]">Text:</span>
                  <span className="font-medium max-w-[120px] truncate">{searchQuery}</span>
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {/* Categories */}
              {filters.categories.map(cat => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span>{t(`categories.${cat}`, categoryLabels[cat])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      categories: filters.categories.filter(c => c !== cat)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Project Types */}
              {filters.projectTypes.map(type => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span>{t(`project_types.${type}`, projectTypeLabels[type])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      projectTypes: filters.projectTypes.filter(t => t !== type)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Programming Languages */}
              {filters.languages.map(lang => (
                <Badge
                  key={lang}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: languageColors[lang] || '#888' }} />
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      languages: filters.languages.filter(l => l !== lang)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Technologies */}
              {filters.technologies.map(tech => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      technologies: filters.technologies.filter(t => t !== tech)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* AI Utilization */}
              {filters.aiUtilization.map(util => (
                <Badge
                  key={util}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <Cpu className="w-3 h-3 text-primary" />
                  <span>{t(`ai_utilization.${util}`, aiUtilizationLabels[util])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      aiUtilization: filters.aiUtilization.filter(u => u !== util)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* AI Usage */}
              {filters.aiUsage.map(usage => (
                <Badge
                  key={usage}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>{t(`ai_usage.${usage}`, aiUsageLabels[usage])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      aiUsage: filters.aiUsage.filter(u => u !== usage)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Roles */}
              {filters.roles.map(role => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span>{t(`roles.${role}`, roleLabels[role])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      roles: filters.roles.filter(r => r !== role)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Source Types */}
              {filters.sourceTypes.map(st => (
                <Badge
                  key={st}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span>{t(`source_types.${st}`, sourceTypeLabels[st])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      sourceTypes: filters.sourceTypes.filter(s => s !== st)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Statuses */}
              {filters.statuses.map(st => (
                <Badge
                  key={st}
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-border/50 bg-background/80"
                >
                  <span>{t(`statuses.${st}`, statusLabels[st])}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({
                      ...filters,
                      statuses: filters.statuses.filter(s => s !== st)
                    })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* Academic */}
              {filters.academicOnly && (
                <Badge
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{t('filters.academic_only', 'Academic Projects')}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({ ...filters, academicOnly: false })}
                    className="ml-0.5 text-teal-600 hover:text-teal-800 dark:text-teal-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {/* Has Stars */}
              {filters.hasStars && (
                <Badge
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                >
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{t('filters.has_stars', 'Has Stars')}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({ ...filters, hasStars: false })}
                    className="ml-0.5 text-amber-600 hover:text-amber-800 dark:text-amber-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {/* Has Media */}
              {filters.hasMedia && (
                <Badge
                  variant="secondary"
                  className="h-6 gap-1 px-2 text-[11px] font-normal border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10"
                >
                  <ImageIcon className="w-3 h-3 text-purple-500" />
                  <span>{t('filters.has_media', 'Has Media')}</span>
                  <button
                    type="button"
                    onClick={() => updateFiltersAndUrl({ ...filters, hasMedia: false })}
                    className="ml-0.5 text-purple-600 hover:text-purple-800 dark:text-purple-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {/* Clear All */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                {t('filters.clear_all', 'Clear all')}
              </Button>
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              {t('header.showing', 'Showing')} <span className="font-medium text-foreground">{filteredProjects.length}</span> {t('header.of', 'of')}{' '}
              <span className="font-medium text-foreground">{localizedProjects.length}</span> {t('header.projects', 'projects')}
            </p>
          </div>

          {/* Projects Grid Grouped */}
          {filteredProjects.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                let isFirstSection = true;
                const order: Array<'software-project' | 'script-small' | 'it-project' | '3d-printing'> = [
                  'software-project',
                  'script-small',
                  'it-project',
                  '3d-printing',
                ];
                
                return order.map((type) => {
                  const groupProjects = groupedProjects[type] || [];
                  if (groupProjects.length === 0) return null;
                  
                  const showSeparator = !isFirstSection;
                  isFirstSection = false;
                  
                  return (
                    <div key={type} className="space-y-3">
                      {showSeparator && (
                        <div className="pt-2">
                          <Separator className="opacity-40" />
                        </div>
                      )}
                      <h2 className="text-base font-semibold tracking-tight text-foreground/90 mt-2">
                        {t(`project_types.${type}`, projectTypeLabels[type])}
                      </h2>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupProjects.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project)}
                            onMediaClick={() => handleProjectMediaClick(project)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-center py-20">
              <FolderGit2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {t('filters.no_projects_found', 'No projects found')}
              </h3>
              <p className="text-sm text-muted-foreground/70">
                {t('filters.try_adjusting', 'Try adjusting your search or filter criteria')}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleResetFilters}
              >
                {t('filters.clear_filters', 'Clear filters')}
              </Button>
            </div>
          )}

          {/* AI Usage Legend - at bottom of main content */}
          <div className="mt-12">
            <AILegend />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {t('site.footer', 'Built with React, TypeScript & Tailwind CSS')}
              </p>
              <div className="flex items-center gap-4">
                {headerConfig.buttons.map((btn, i) => {
                  const BtnIcon = iconMap[btn.icon] || ExternalLink;
                  const btnLabel = t(`header.buttons.${btn.text.toLowerCase()}`, btn.text);
                  return (
                    <a 
                      key={i}
                      href={btn.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={btnLabel}
                    >
                      <BtnIcon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </footer>

        {/* Project Detail Modal */}
        <ProjectDetailModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onProjectSelect={handleProjectSelect}
          allProjects={localizedProjects}
          initialTab={modalInitialTab}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
