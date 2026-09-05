import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Search,
  Star,
  Image as ImageIcon,
  GraduationCap,
  Sparkles,
  Cpu,
  Layers,
  Code2,
  Lock,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Project, ProjectCategory, ProjectType, ProjectStatus, ProjectRole, ProjectSourceType, AIUsage, AIUtilization } from '@/types/project';
import {
  categoryLabels,
  projectTypeLabels,
  statusLabels,
  roleLabels,
  sourceTypeLabels,
  aiUsageLabels,
  aiUtilizationLabels,
  languageColors,
} from '@/types/project';
import {
  type FilterState,
  getActiveFilterCount,
  getFacetStats,
  projectHasMedia,
  projectHasStars,
  projectHasDemo,
} from '@/lib/filters';

interface ProjectFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  projects: Project[];
  filteredCount: number;
}

export function ProjectFilters({
  filters,
  onFilterChange,
  onReset,
  projects,
  filteredCount,
}: ProjectFiltersProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [techSearch, setTechSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const lastCloseTimeRef = useRef<number>(0);

  // Close popover on page scroll to eliminate lag/jumping
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleScroll = () => {
      setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, isMobile]);

  // Track expanded / collapsed state for each facet group
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    signals: true,
    categories: false,
    languages: false,
    technologies: false,
    ai: false,
    details: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const areAllExpanded = useMemo(() => {
    return Object.values(openSections).every(Boolean);
  }, [openSections]);

  const toggleAllSections = () => {
    const nextVal = !areAllExpanded;
    setOpenSections({
      signals: nextVal,
      categories: nextVal,
      languages: nextVal,
      technologies: nextVal,
      ai: nextVal,
      details: nextVal,
    });
  };

  const activeCount = getActiveFilterCount(filters);

  // Facet data with project counts
  const facetStats = useMemo(() => getFacetStats(projects), [projects]);

  const categories: Array<{ id: ProjectCategory; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return (Object.keys(categoryLabels) as ProjectCategory[])
      .filter(cat => (counts[cat] || 0) > 0)
      .map(cat => ({ id: cat, count: counts[cat] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const projectTypes: Array<{ id: ProjectType; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      const type = p.projectType || 'software-project';
      counts[type] = (counts[type] || 0) + 1;
    });
    return (Object.keys(projectTypeLabels) as ProjectType[])
      .filter(type => (counts[type] || 0) > 0)
      .map(type => ({ id: type, count: counts[type] || 0 }));
  }, [projects]);

  const statuses: Array<{ id: ProjectStatus; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return (Object.keys(statusLabels) as ProjectStatus[])
      .filter(st => (counts[st] || 0) > 0)
      .map(st => ({ id: st, count: counts[st] || 0 }));
  }, [projects]);

  const roles: Array<{ id: ProjectRole; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.role] = (counts[p.role] || 0) + 1;
    });
    return (Object.keys(roleLabels) as ProjectRole[])
      .filter(r => (counts[r] || 0) > 0)
      .map(r => ({ id: r, count: counts[r] || 0 }));
  }, [projects]);

  const sourceTypes: Array<{ id: ProjectSourceType; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.sourceType] = (counts[p.sourceType] || 0) + 1;
    });
    return (Object.keys(sourceTypeLabels) as ProjectSourceType[])
      .filter(st => (counts[st] || 0) > 0)
      .map(st => ({ id: st, count: counts[st] || 0 }));
  }, [projects]);

  const aiUsages: Array<{ id: AIUsage; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.aiUsage] = (counts[p.aiUsage] || 0) + 1;
    });
    return (['none', 'minor', 'contributed', 'major', 'full'] as AIUsage[])
      .filter(u => (counts[u] || 0) > 0)
      .map(u => ({ id: u, count: counts[u] || 0 }));
  }, [projects]);

  const aiUtilizations: Array<{ id: AIUtilization; count: number }> = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.aiUtilization] = (counts[p.aiUtilization] || 0) + 1;
    });
    return (['ai-powered', 'ai-enhanced', 'no-ai'] as AIUtilization[])
      .filter(u => (counts[u] || 0) > 0)
      .map(u => ({ id: u, count: counts[u] || 0 }));
  }, [projects]);

  // Counts for signal toggles
  const starsCount = useMemo(() => projects.filter(projectHasStars).length, [projects]);
  const mediaCount = useMemo(() => projects.filter(projectHasMedia).length, [projects]);
  const demoCount = useMemo(() => projects.filter(projectHasDemo).length, [projects]);
  const academicCount = useMemo(() => projects.filter(p => p.academic).length, [projects]);

  // Filtered technologies by search input
  const filteredTechs = useMemo(() => {
    if (!techSearch.trim()) return facetStats.technologies.slice(0, 16);
    const q = techSearch.toLowerCase().trim();
    return facetStats.technologies.filter(t => t.name.toLowerCase().includes(q));
  }, [facetStats.technologies, techSearch]);

  // Helper toggle functions
  const toggleItem = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const update = (partial: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      lastCloseTimeRef.current = Date.now();
    }
    setIsOpen(open);
  };

  // Active filter count per section
  const signalsActiveCount =
    (filters.hasStars ? 1 : 0) +
    (filters.hasMedia ? 1 : 0) +
    (filters.hasDemo ? 1 : 0) +
    (filters.academicOnly ? 1 : 0);
  const categoriesActiveCount = filters.categories.length;
  const languagesActiveCount = filters.languages.length;
  const technologiesActiveCount = filters.technologies.length;
  const aiActiveCount = filters.aiUtilization.length + filters.aiUsage.length;
  const detailsActiveCount = filters.sourceTypes.length + filters.roles.length + filters.statuses.length + filters.projectTypes.length;

  const renderSectionHeader = (
    id: string,
    title: string,
    icon: React.ReactNode,
    count: number
  ) => {
    const isSectionOpen = !!openSections[id];
    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left select-none group"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </span>
          {count > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] font-semibold tabular-nums">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isSectionOpen ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>
    );
  };

  // Reusable facet panel content
  const filterPanelContent = (
    <div className={`flex flex-col h-full ${
      isMobile ? '' : 'max-h-[min(440px,calc(var(--radix-popover-content-available-height,440px)-16px))]'
    }`}>
      {/* Header with Title, Expand/Collapse, Reset, and optional mobile Close */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {t('filters.filter_projects', 'Filter Projects')}
          </h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
              {activeCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAllSections}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {areAllExpanded ? t('filters.collapse_all', 'Collapse all') : t('filters.expand_all', 'Expand all')}
          </button>
          {activeCount > 0 && (
            <>
              <span className="text-border/60 text-xs">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                {t('filters.clear_all', 'Clear all')}
              </Button>
            </>
          )}
          {isMobile && (
            <>
              <span className="text-border/60 text-xs">|</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable Facet Body */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-2 overflow-y-auto">
        <div className="space-y-1.5 pb-2">
          {/* 1. Quick Filter (Media & Signals) */}
          <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {renderSectionHeader(
              'signals',
              t('filters.group_signals', 'Quick Filter'),
              <Sparkles className="w-3.5 h-3.5" />,
              signalsActiveCount
            )}
            {openSections.signals && (
              <div className="px-2.5 pb-2.5 pt-1 grid grid-cols-2 gap-1.5">
                {/* Has Git Stars */}
                <button
                  type="button"
                  onClick={() => update({ hasStars: !filters.hasStars })}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                    filters.hasStars
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium'
                      : 'bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('filters.has_stars', 'Has Git Stars')}</span>
                  </div>
                  <span className="text-[10px] opacity-75 tabular-nums">{starsCount}</span>
                </button>

                {/* Has Media */}
                <button
                  type="button"
                  onClick={() => update({ hasMedia: !filters.hasMedia })}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                    filters.hasMedia
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 font-medium'
                      : 'bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                    <span>{t('filters.has_media', 'Has Media')}</span>
                  </div>
                  <span className="text-[10px] opacity-75 tabular-nums">{mediaCount}</span>
                </button>

                {/* Has Demo */}
                <button
                  type="button"
                  onClick={() => update({ hasDemo: !filters.hasDemo })}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                    filters.hasDemo
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('filters.has_demo', 'Has Demo')}</span>
                  </div>
                  <span className="text-[10px] opacity-75 tabular-nums">{demoCount}</span>
                </button>

                {/* Academic Projects */}
                <button
                  type="button"
                  onClick={() => update({ academicOnly: !filters.academicOnly })}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                    filters.academicOnly
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400 font-medium'
                      : 'bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-500" />
                    <span>{t('filters.academic_only', 'Academic Projects')}</span>
                  </div>
                  <span className="text-[10px] opacity-75 tabular-nums">{academicCount}</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Categories */}
          <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {renderSectionHeader(
              'categories',
              t('filters.category', 'Category'),
              <Layers className="w-3.5 h-3.5" />,
              categoriesActiveCount
            )}
            {openSections.categories && (
              <div className="px-2.5 pb-2.5 pt-1 flex flex-wrap gap-1.5">
                {categories.map(({ id, count }) => {
                  const isSelected = filters.categories.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => update({ categories: toggleItem(filters.categories, id) })}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                          : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted'
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
            )}
          </div>

          {/* 3. Programming Languages */}
          <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {renderSectionHeader(
              'languages',
              t('filters.languages', 'Programming Languages'),
              <Code2 className="w-3.5 h-3.5" />,
              languagesActiveCount
            )}
            {openSections.languages && (
              <div className="px-2.5 pb-2.5 pt-1 flex flex-wrap gap-1.5">
                {facetStats.languages.map(({ name, count }) => {
                  const isSelected = filters.languages.includes(name);
                  const color = languageColors[name] || '#888888';
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => update({ languages: toggleItem(filters.languages, name) })}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                          : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span>{name}</span>
                      <span className={`text-[10px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Technologies & Tools with inline search */}
          <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {renderSectionHeader(
              'technologies',
              t('filters.technologies', 'Technologies & Tools'),
              <Search className="w-3.5 h-3.5" />,
              technologiesActiveCount
            )}
            {openSections.technologies && (
              <div className="px-2.5 pb-2.5 pt-1 space-y-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('filters.search_tech', 'Search technologies...')}
                    value={techSearch}
                    onChange={e => setTechSearch(e.target.value)}
                    className="h-7 text-xs pl-7 pr-7 bg-muted/20"
                  />
                  {techSearch && (
                    <button
                      type="button"
                      onClick={() => setTechSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-0.5 pr-0.5">
                  {filteredTechs.map(({ name, count }) => {
                    const isSelected = filters.technologies.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => update({ technologies: toggleItem(filters.technologies, name) })}
                        className={`px-2 py-0.5 rounded text-[11px] transition-all border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary font-medium'
                            : 'bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{name}</span>
                        <span className={`text-[9px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. AI Features & Usage */}
          <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {renderSectionHeader(
              'ai',
              t('filters.group_ai', 'AI Features & Usage'),
              <Cpu className="w-3.5 h-3.5" />,
              aiActiveCount
            )}
            {openSections.ai && (
              <div className="px-2.5 pb-2.5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* AI Utilization */}
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t('labels.features', 'Features')} (AI)
                  </p>
                  <div className="space-y-1">
                    {aiUtilizations.map(({ id, count }) => {
                      const isSelected = filters.aiUtilization.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex items-center justify-between p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-accent/70 border-primary/40 font-medium' : 'hover:bg-muted/30 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => update({ aiUtilization: toggleItem(filters.aiUtilization, id) })}
                            />
                            <span>{t(`ai_utilization.${id}`, aiUtilizationLabels[id])}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* AI Usage */}
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t('labels.built_with', 'Built with')} (AI)
                  </p>
                  <div className="space-y-1">
                    {aiUsages.map(({ id, count }) => {
                      const isSelected = filters.aiUsage.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex items-center justify-between p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-accent/70 border-primary/40 font-medium' : 'hover:bg-muted/30 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => update({ aiUsage: toggleItem(filters.aiUsage, id) })}
                            />
                            <span>{t(`ai_usage.${id}`, aiUsageLabels[id])}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Project Details */}
          <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {renderSectionHeader(
              'details',
              t('filters.group_details', 'Project Details'),
              <Lock className="w-3.5 h-3.5" />,
              detailsActiveCount
            )}
            {openSections.details && (
              <div className="px-2.5 pb-2.5 pt-1 space-y-2.5">
                {/* Source Availability */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('filters.source_type', 'Source Availability')}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sourceTypes.map(({ id, count }) => {
                      const isSelected = filters.sourceTypes.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => update({ sourceTypes: toggleItem(filters.sourceTypes, id) })}
                          className={`px-2 py-0.5 rounded-md text-xs transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-medium'
                              : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{t(`source_types.${id}`, sourceTypeLabels[id])}</span>
                          <span className={`text-[10px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('filters.role', 'Role')}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roles.map(({ id, count }) => {
                      const isSelected = filters.roles.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => update({ roles: toggleItem(filters.roles, id) })}
                          className={`px-2 py-0.5 rounded-md text-xs transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-medium'
                              : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{t(`roles.${id}`, roleLabels[id])}</span>
                          <span className={`text-[10px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('filters.status', 'Status')}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map(({ id, count }) => {
                      const isSelected = filters.statuses.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => update({ statuses: toggleItem(filters.statuses, id) })}
                          className={`px-2 py-0.5 rounded-md text-xs transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-medium'
                              : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{t(`statuses.${id}`, statusLabels[id])}</span>
                          <span className={`text-[10px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('filters.project_type', 'Project Type')}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {projectTypes.map(({ id, count }) => {
                      const isSelected = filters.projectTypes.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => update({ projectTypes: toggleItem(filters.projectTypes, id) })}
                          className={`px-2 py-0.5 rounded-md text-xs transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-medium'
                              : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{t(`project_types.${id}`, projectTypeLabels[id])}</span>
                          <span className={`text-[10px] tabular-nums ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer count indicator */}
      <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <span>
          {t('header.showing', 'Showing')}{' '}
          <strong className="text-foreground font-semibold">{filteredCount}</strong>{' '}
          {t('header.of', 'of')} {projects.length}
        </span>
        <Button size="sm" className="h-7 text-xs px-3" onClick={() => setIsOpen(false)}>
          {t('common.done', 'Apply')}
        </Button>
      </div>
    </div>
  );

  const filterTriggerButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        if (isOpen) return;
        if (Date.now() - lastCloseTimeRef.current < 250) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={`h-9 gap-2 text-xs font-medium border-border/70 hover:border-primary/40 shrink-0 ${
        activeCount > 0 ? 'border-primary/40 bg-primary/5 text-primary' : ''
      }`}
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
      <span>{t('filters.filters_button', 'Filters')}</span>
      {activeCount > 0 && (
        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
          {activeCount}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{filterTriggerButton}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="p-0 h-[80vh] max-h-[580px] rounded-t-xl overflow-hidden flex flex-col"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t('filters.filter_projects', 'Filter Projects')}</SheetTitle>
          </SheetHeader>
          {filterPanelContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{filterTriggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        collisionPadding={20}
        avoidCollisions={true}
        onPointerDownOutside={() => {
          lastCloseTimeRef.current = Date.now();
        }}
        className="w-[420px] max-w-[95vw] p-0 shadow-xl border-border/60 max-h-[calc(var(--radix-popover-content-available-height,500px)-16px)]"
      >
        {filterPanelContent}
      </PopoverContent>
    </Popover>
  );
}
