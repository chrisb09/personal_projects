import { useState, useMemo, useEffect } from 'react';
import { projects, getAggregateStats, getLOCAggregateByLanguage } from '@/config/projects';
import type { Project, ProjectCategory } from '@/types/project';
import { fetchStats, mergeStatsWithProjects } from '@/lib/stats';
import { categoryLabels, aiUsageLabels, aiUsageColors, aiUsageDescriptions } from '@/types/project';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ExternalLink
} from 'lucide-react';

// AI Usage Legend Component
function AIUsageLegend() {
  const levels: Array<'none' | 'minor' | 'major' | 'full'> = ['none', 'minor', 'major', 'full'];
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        AI Usage Levels
      </h4>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <Tooltip key={level}>
            <TooltipTrigger asChild>
              <span 
                className={`${aiUsageColors[level]} px-2 py-1 rounded-full text-xs font-medium border cursor-help`}
              >
                {aiUsageLabels[level]}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs max-w-xs">{aiUsageDescriptions[level]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const [projectsWithStats, setProjectsWithStats] = useState<Project[]>(projects);

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
      
      return matchesSearch && matchesCategory;
    });
  }, [projectsWithStats, searchQuery, selectedCategory]);

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
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Code2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Developer Portfolio</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Personal{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Projects
                  </span>
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                  A collection of my work spanning backend systems, web applications, 
                  DevOps infrastructure, and open source contributions.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="default" size="sm" className="gap-2" asChild>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href="https://gitlab.com" target="_blank" rel="noopener noreferrer">
                      <Gitlab className="w-4 h-4" />
                      GitLab
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href="https://gitlab.instance2.com" target="_blank" rel="noopener noreferrer">
                      <Gitlab className="w-3.5 h-3.5" />
                      <span className="text-xs">GL 2</span>
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href="mailto:contact@example.com">
                      <Mail className="w-4 h-4" />
                      Contact
                    </a>
                  </Button>
                </div>
              </div>

              {/* Aggregate Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-primary">
                    <Star className="w-5 h-5" />
                    <p className="text-3xl font-bold">{aggregateStats.totalStars}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Stars</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-primary">
                    <GitCommit className="w-5 h-5" />
                    <p className="text-3xl font-bold">{aggregateStats.totalCommits}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Commits</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-primary">
                    <Code className="w-5 h-5" />
                    <p className="text-3xl font-bold">{(totalLOC / 1000).toFixed(1)}k</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Lines of Code</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Filters */}
          <div className="space-y-4 mb-8">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by name, description, or technology..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
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
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedCategory === category 
                      ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent'
                    }
                  `}
                >
                  {category === 'all' ? 'All Projects' : categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredProjects.length}</span> of{' '}
              <span className="font-medium text-foreground">{projectsWithStats.length}</span> projects
            </p>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
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
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* AI Usage Legend - at bottom of main content */}
          <div className="mt-12">
            <AIUsageLegend />
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
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="https://gitlab.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Gitlab className="w-5 h-5" />
                </a>
                <a 
                  href="https://gitlab.instance2.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="GitLab Instance 2"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="mailto:contact@example.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Project Detail Modal */}
        <ProjectDetailModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
