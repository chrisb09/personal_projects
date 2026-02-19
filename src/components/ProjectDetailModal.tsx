import { useTranslation } from 'react-i18next';
import type { Project } from '@/types/project';
import { 
  categoryLabels, 
  statusLabels, 
  roleLabels,
  sourceTypeLabels,
  categoryColors, 
  roleColors,
  sourceTypeColors,
  aiUsageLabels, 
  aiUsageColors,
  aiUsageDescriptions,
  aiUtilizationLabels,
  aiUtilizationColors,
  aiUtilizationDescriptions,
  languageColors,
} from '@/types/project';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  ExternalLink, 
  Github, 
  BookOpen, 
  Calendar, 
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Package,
  Wrench,
  Cpu,
  Target,
  Link2,
  Image as ImageIcon,
  ArrowUpRight,
  Star,
  GitCommit,
  GitBranch,
  Clock,
  Code2,
  Sparkles
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect?: (projectId: string) => void;
  allProjects?: Project[];
}

// Simple donut chart component for LOC
function DonutChart({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  let currentAngle = 0;
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {entries.map(([lang, count]) => {
            const percentage = count / total;
            const angle = percentage * 360;
            const color = languageColors[lang] || '#888888';
            
            // Calculate arc path
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            return (
              <path
                key={lang}
                d={path}
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
          {/* Center hole */}
          <circle cx="50" cy="50" r="25" fill="hsl(var(--background))" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold">{(total / 1000).toFixed(1)}k</p>
            <p className="text-xs text-muted-foreground">LOC</p>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex-1 space-y-1.5">
        {entries.slice(0, 5).map(([lang, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          const color = languageColors[lang] || '#888888';
          return (
            <div key={lang} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground/80">{lang}</span>
              </div>
              <span className="text-muted-foreground text-xs">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// AI Usage Legend Component
function AIUsageLegend() {
  const levels: Array<'none' | 'minor' | 'major' | 'full'> = ['none', 'minor', 'major', 'full'];
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        AI Usage Levels
      </h5>
      <div className="space-y-2">
        {levels.map((level) => (
          <div key={level} className="flex items-start gap-2">
            <Badge 
              variant="outline" 
              className={`${aiUsageColors[level]} text-xs shrink-0`}
            >
              {aiUsageLabels[level]}
            </Badge>
            <span className="text-xs text-muted-foreground">{aiUsageDescriptions[level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailModal({ project, isOpen, onClose, onProjectSelect, allProjects = [] }: ProjectDetailModalProps) {
  if (!project) return null;

  const hasScreenshots = project.screenshots && project.screenshots.length > 0;
  const hasRelatedProjects = project.relatedProjects && project.relatedProjects.length > 0;
  const hasStats = project.stats && Object.keys(project.stats).length > 0;
  const hasLOC = project.loc && project.loc.total > 0;
  const hasRepos = project.repos && project.repos.length > 0;
  const hasMirrors = project.mirrors && project.mirrors.length > 0;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[92vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4">
            <DialogHeader>
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10 shrink-0">
                  {project.logo ? (
                    <img src={project.logo} alt={project.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <FolderGit2 className="w-8 h-8 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <DialogTitle className="text-2xl font-bold">{project.name}</DialogTitle>
                  </div>
                  <p className="text-muted-foreground">{project.tagline}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`${categoryColors[project.category]} text-xs font-medium`}
                    >
                      {categoryLabels[project.category]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {statusLabels[project.status]}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`${projectTypeColors[project.projectType]} text-xs cursor-help`}
                        >
                          {projectTypeLabels[project.projectType]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {project.projectType === 'full' 
                            ? 'A complete project built from scratch' 
                            : 'Contributions to an existing open source project'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`${aiUsageColors[project.aiUsage]} text-xs cursor-help`}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {aiUsageLabels[project.aiUsage]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{aiUsageDescriptions[project.aiUsage]}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.year}
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {project.demoUrl && (
                <Button size="sm" variant="default" className="gap-2" asChild>
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Live Demo
                  </a>
                </Button>
              )}
              {hasRepos && project.repos?.map((repo, i) => (
                <Button key={i} size="sm" variant="outline" className="gap-2" asChild>
                  <a href={repo.url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                    {repo.name || 'Repository'}
                  </a>
                </Button>
              ))}
              {hasMirrors && project.mirrors?.map((mirror, i) => (
                <Button key={i} size="sm" variant="outline" className="gap-2" asChild>
                  <a href={mirror.url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                    {mirror.name} (Mirror)
                  </a>
                </Button>
              ))}
              {project.docsUrl && (
                <Button size="sm" variant="outline" className="gap-2" asChild>
                  <a href={project.docsUrl} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="w-4 h-4" />
                    Documentation
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="flex-1">
            <div className="px-6 border-b border-border/50">
              <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-1 overflow-x-auto flex-nowrap">
                <TabsTrigger 
                  value="overview" 
                  className="px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground transition-colors whitespace-nowrap"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="technical" 
                  className="px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground transition-colors whitespace-nowrap"
                >
                  Technical
                </TabsTrigger>
                <TabsTrigger 
                  value="usage" 
                  className="px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground transition-colors whitespace-nowrap"
                >
                  Installation & Usage
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground transition-colors whitespace-nowrap"
                >
                  Stats & Metrics
                </TabsTrigger>
                {(hasRepos || hasMirrors) && (
                  <TabsTrigger 
                    value="repositories" 
                    className="px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground transition-colors whitespace-nowrap"
                  >
                    Repositories
                  </TabsTrigger>
                )}
                {(hasScreenshots || hasRelatedProjects) && (
                  <TabsTrigger 
                    value="media" 
                    className="px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground transition-colors whitespace-nowrap"
                  >
                    Media & Links
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Scrollable content area with horizontal scroll support */}
            <div className="overflow-auto max-h-[55vh]">
              <div className="p-6 min-w-0">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6 focus-visible:outline-none">
                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Description
                    </h4>
                    <p className="text-foreground/90 leading-relaxed">{project.description}</p>
                  </section>

                  <Separator />

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Purpose
                    </h4>
                    <p className="text-foreground/90 leading-relaxed">{project.purpose}</p>
                  </section>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {project.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Limitations
                      </h4>
                      <ul className="space-y-2">
                        {project.limitations.map((limitation, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 mt-2 flex-shrink-0" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </TabsContent>

                {/* Technical Tab */}
                <TabsContent value="technical" className="mt-0 space-y-6 focus-visible:outline-none">
                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Dependencies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.dependencies.map((dep, i) => (
                        <Badge key={i} variant="outline" className="font-normal">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Expertise Highlighted
                    </h4>
                    <ul className="space-y-2">
                      {project.expertise.map((exp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-2 flex-shrink-0" />
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </section>
                </TabsContent>

                {/* Usage Tab */}
                <TabsContent value="usage" className="mt-0 space-y-6 focus-visible:outline-none">
                  {project.installation && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Installation
                      </h4>
                      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground/90 border border-border/50">
                        <code>{project.installation}</code>
                      </pre>
                    </section>
                  )}

                  {project.installation && project.usage && <Separator />}

                  {project.usage && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Usage
                      </h4>
                      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground/90 border border-border/50">
                        <code>{project.usage}</code>
                      </pre>
                    </section>
                  )}

                  {!project.installation && !project.usage && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Installation and usage details coming soon.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-0 space-y-6 focus-visible:outline-none">
                  {/* Git Stats */}
                  {hasStats && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        Repository Stats
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 text-center">
                          <Star className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                          <p className="text-2xl font-bold">{project.stats?.stars}</p>
                          <p className="text-xs text-muted-foreground">Stars</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 text-center">
                          <GitCommit className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                          <p className="text-2xl font-bold">{project.stats?.commits}</p>
                          <p className="text-xs text-muted-foreground">Commits</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 text-center">
                          <GitBranch className="w-5 h-5 mx-auto mb-2 text-green-500" />
                          <p className="text-2xl font-bold">{project.stats?.branches}</p>
                          <p className="text-xs text-muted-foreground">Branches</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 text-center">
                          <Clock className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                          <p className="text-sm font-bold">{project.stats?.lastCommit}</p>
                          <p className="text-xs text-muted-foreground">Last Commit</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {hasStats && hasLOC && <Separator />}

                  {/* LOC Chart */}
                  {hasLOC && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Lines of Code
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                        <DonutChart 
                          data={project.loc!.byLanguage} 
                          total={project.loc!.total} 
                        />
                      </div>
                    </section>
                  )}

                  {/* AI Usage Legend */}
                  <section>
                    <AIUsageLegend />
                  </section>
                </TabsContent>

                {/* Repositories Tab */}
                {(hasRepos || hasMirrors) && (
                  <TabsContent value="repositories" className="mt-0 space-y-6 focus-visible:outline-none">
                    {hasRepos && (
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <Github className="w-4 h-4" />
                          Primary Repositories
                        </h4>
                        <div className="space-y-2">
                          {project.repos?.map((repo, i) => (
                            <a 
                              key={i}
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">{repo.name}</p>
                                <p className="text-xs text-muted-foreground">{repo.type || 'git'}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    {hasRepos && hasMirrors && <Separator />}

                    {hasMirrors && (
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          Mirror Repositories
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">Mirrors for visibility and accessibility. Stats are counted from primary repository.</p>
                        <div className="space-y-2">
                          {project.mirrors?.map((mirror, i) => (
                            <a 
                              key={i}
                              href={mirror.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20 hover:bg-muted/40 hover:border-primary/30 transition-colors group"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">{mirror.name}</p>
                                <p className="text-xs text-muted-foreground">{mirror.description || mirror.type || 'git'}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-2 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}
                  </TabsContent>
                )}

                {/* Media Tab */}
                {(hasScreenshots || hasRelatedProjects) && (
                  <TabsContent value="media" className="mt-0 space-y-6 focus-visible:outline-none">
                    {hasScreenshots && (
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Screenshots
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {project.screenshots?.map((screenshot, i) => (
                            <div 
                              key={i} 
                              className="aspect-video rounded-lg bg-muted border border-border/50 overflow-hidden hover:border-primary/30 transition-colors"
                            >
                              <img 
                                src={screenshot} 
                                alt={`${project.name} screenshot ${i + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {hasScreenshots && hasRelatedProjects && <Separator />}

                    {hasRelatedProjects && (
                      <section>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Related Projects
                        </h4>
                        <div className="space-y-2">
                          {project.relatedProjects?.map((related, i) => {
                            const isInternalProject = related.projectId && allProjects.some(p => p.id === related.projectId);
                            
                            return (
                              <div 
                                key={i}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-foreground/90">{related.name}</p>
                                  <p className="text-sm text-muted-foreground">{related.relation}</p>
                                </div>
                                {isInternalProject && onProjectSelect ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onProjectSelect(related.projectId!);
                                    }}
                                    className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                  >
                                    <ArrowUpRight className="w-5 h-5" />
                                  </button>
                                ) : related.url ? (
                                  <a 
                                    href={related.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ArrowUpRight className="w-5 h-5" />
                                  </a>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </TabsContent>
                )}
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
