import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { projects } from '@/config/projects';
import headerConfig from '../config/portfolio-header.json';
import type { Project, ProjectCategory } from '@/types/project';
import { fetchStats, mergeStatsWithProjects } from '@/lib/stats';
import { initializeTheme } from '@/lib/theme';
import { 
  categoryLabels, 
  aiUsageLabels, 
  aiUsageColors, 
  aiUsageDescriptions,
  aiUtilizationLabels,
  aiUtilizationColors,
  aiUtilizationDescriptions,
  projectTypeLabels,
} from '@/types/project';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  BookOpen
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
          {t('labels.built_with', 'Built with')} - AI Usage Levels
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
          {t('labels.features', 'Features')} - AI Utilization
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const [showAcademicOnly, setShowAcademicOnly] = useState(false);
  const [projectsWithStats, setProjectsWithStats] = useState<Project[]>(projects);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
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

  // Get unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set(projectsWithStats.map(p => p.category));
    return ['all', ...Array.from(cats)] as (ProjectCategory | 'all')[];
  }, [projectsWithStats]);

  // Filter projects based on search and category
  const filteredProjects = useMemo(() => {
    return projectsWithStats.filter(project => {
      const matchesSearch = 
        searchQuery === '' ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        project.category === selectedCategory;
      
      const matchesAcademic = 
        !showAcademicOnly || 
        project.academic === true;
      
      return matchesSearch && matchesCategory && matchesAcademic;
    });
  }, [projectsWithStats, searchQuery, selectedCategory, showAcademicOnly]);

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
    const totalStars = projectsWithStats.reduce((sum, p) => sum + (p.stats?.stars || 0), 0);
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
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projectsWithStats.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProject(null), 300);
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
                  {headerConfig.titlePrefix}{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {headerConfig.titleHighlight}
                  </span>
                </h1>
                
                <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                  {headerConfig.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {headerConfig.buttons.map((btn, i) => {
                    const BtnIcon = iconMap[btn.icon] || ExternalLink;
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
                          {btn.text}
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
                  <div className="flex items-center md:justify-end gap-1.5 text-primary">
                    <GitCommit className="w-4 h-4" />
                    <p className="text-2xl font-bold">{aggregateStats.totalCommits}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('stats.total_commits', 'Total Commits')}</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-primary">
                    <Code className="w-4 h-4" />
                    <p className="text-2xl font-bold">{(totalLOC / 1000).toFixed(1)}k</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('stats.total_loc', 'Total LOC')}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('header.search_placeholder', 'Search projects...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-1.5 flex-1 items-center justify-start md:justify-end">
              <button
                onClick={() => setShowAcademicOnly(!showAcademicOnly)}
                className={`
                  px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border flex items-center gap-1.5
                  ${showAcademicOnly 
                    ? 'bg-teal-500/10 text-teal-600 border-teal-500/30 dark:text-teal-400 shadow-sm' 
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent'
                  }
                `}
              >
                <BookOpen className="w-3.5 h-3.5" />
                {t('filters.academic_only', 'Academic Projects')}
              </button>

              <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border
                    ${selectedCategory === category 
                      ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent'
                    }
                  `}
                >
                  {category === 'all' ? t('filters.all', 'All') : t(`categories.${category}`, categoryLabels[category])}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              {t('header.showing', 'Showing')} <span className="font-medium text-foreground">{filteredProjects.length}</span> {t('header.of', 'of')}{' '}
              <span className="font-medium text-foreground">{projectsWithStats.length}</span> {t('header.projects', 'projects')}
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
                No projects found
              </h3>
              <p className="text-sm text-muted-foreground/70">
                Try adjusting your search or filter criteria
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowAcademicOnly(false);
                }}
              >
                Clear filters
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
                Built with React, TypeScript & Tailwind CSS
              </p>
              <div className="flex items-center gap-4">
                {headerConfig.buttons.map((btn, i) => {
                  const BtnIcon = iconMap[btn.icon] || ExternalLink;
                  return (
                    <a 
                      key={i}
                      href={btn.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={btn.text}
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
          allProjects={projectsWithStats}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
