import { useTranslation } from 'react-i18next';
import type { Project } from '@/types/project';
import { 
  categoryLabels, 
  statusLabels, 
  roleLabels,
  sourceTypeLabels,
  aiUsageLabels, 
  aiUtilizationLabels,
  categoryColors, 
  roleColors,
  sourceTypeColors,
  aiUsageColors,
  aiUtilizationColors,
  aiUsageDescriptions,
  aiUtilizationDescriptions,
  languageColors,
} from '@/types/project';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { ExternalLink, Github, BookOpen, FolderGit2, Star, GitCommit, Code2, Sparkles, Cpu, Image as ImageIcon } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onMediaClick?: () => void;
}

// Mini language chart for project card
function MiniLanguageChart({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 3);
  let currentAngle = 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-8 h-8 shrink-0 cursor-pointer">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {entries.map(([lang, count]) => {
              const percentage = count / total;
              const angle = percentage * 360;
              const color = languageColors[lang] || '#888888';
              
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle += angle;
              
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const x1 = 50 + 45 * Math.cos(startRad);
              const y1 = 50 + 45 * Math.sin(startRad);
              const x2 = 50 + 45 * Math.cos(endRad);
              const y2 = 50 + 45 * Math.sin(endRad);
              
              const largeArc = angle > 180 ? 1 : 0;
              const path = `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`;
              
              return (
                <path
                  key={lang}
                  d={path}
                  fill={color}
                  stroke="hsl(var(--card))"
                  strokeWidth="2"
                />
              );
            })}
            <circle cx="50" cy="50" r="20" fill="hsl(var(--card))" />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="text-xs font-medium mb-2">Language Breakdown</p>
          {entries.map(([lang, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            const color = languageColors[lang] || '#888888';
            return (
              <div key={lang} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate">{lang}</span>
                </div>
                <span className="text-foreground/75 justify-self-end tabular-nums">
                  {count.toLocaleString()}
                </span>
                <span className="text-muted-foreground justify-self-end w-10 text-right tabular-nums">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function ProjectCard({ project, onClick, onMediaClick }: ProjectCardProps) {
  const { t } = useTranslation();
  // Get top 3 technologies to display as badges
  const topTechnologies = project.technologies.slice(0, 3);
  const repoCount = project.repos?.length ?? 0;
  const hasScreenshots = project.screenshots && project.screenshots.length > 0;
  
  return (
    <TooltipProvider>
      <Card 
        className="group cursor-pointer overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
        onClick={onClick}
      >
        <CardContent className="p-3 pb-2.5">
          {/* Category and Role badges at top — role right-aligned */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Badge 
              variant="outline" 
              className={`${categoryColors[project.category]} text-[10px] px-1.5 py-0.5 leading-none font-medium`}
            >
              {t(`categories.${project.category}`, categoryLabels[project.category])}
            </Badge>
            <Badge 
              variant="outline" 
              className={`${roleColors[project.role]} text-[10px] px-1.5 py-0.5 leading-none font-medium`}
            >
              {t(`roles.${project.role}`, roleLabels[project.role])}
            </Badge>
          </div>

          {/* Header with Logo, Title, and language chart */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-lg border border-primary/10 shrink-0 overflow-hidden flex items-center justify-center transition-all ${
                project.logo 
                  ? 'bg-transparent' 
                  : 'bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10'
              }`}>
                {project.logo ? (
                  <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <FolderGit2 className="w-3.5 h-3.5 text-primary/70" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate">
                  {project.name}
                </h3>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{project.year}</p>
              </div>
            </div>
            
            {project.loc && project.loc.total > 0 && (
              <MiniLanguageChart data={project.loc.byLanguage} total={project.loc.total} />
            )}
          </div>

          {/* Tagline */}
          <p className="text-xs font-semibold text-foreground/90 mb-1 line-clamp-1">
            {project.tagline}
          </p>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
            {project.description}
          </p>

          {/* Technology badges */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {topTechnologies.map((tech, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0.5 leading-none font-normal bg-secondary/50"
              >
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 leading-none font-normal bg-secondary/50">
                +{project.technologies.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-2 text-[11px] text-muted-foreground">
            {project.stats && (
              <>
                {project.stats.stars !== undefined && project.stats.stars > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500/80" />
                    <span>{project.stats.stars}</span>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <GitCommit className="w-3 h-3 text-blue-500/80" />
                      <span>{project.stats.commits}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-[10px]">
                      {t('stats.commits_tooltip', 'Commits authored by me on the default branch of all tracked projects.')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {project.loc && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Code2 className="w-3 h-3 text-green-500/80" />
                    <span>{(project.loc.total / 1000).toFixed(1)}k LOC</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px]">
                    {t('stats.loc_tooltip', 'Lines of code authored by me that are currently in the default branch.')}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {repoCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Github className="w-3 h-3" />
                    <span>{repoCount} {repoCount === 1 ? 'repo' : 'repos'}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px]">
                    {project.repos?.map(r => r.name).join(', ')}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {project.modelReleases && project.modelReleases.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Cpu className="w-3 h-3 text-orange-500/80" />
                    <span>{project.modelReleases.length} {project.modelReleases.length === 1 ? 'model' : 'models'}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px]">
                    {project.modelReleases.map(m => m.name).join(', ')}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Footer with Status, Source Type, AI Usage, AI Utilization, and Links */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 leading-none">
                {t(`statuses.${project.status}`, statusLabels[project.status])}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`${sourceTypeColors[project.sourceType]} text-[10px] px-1.5 py-0.5 leading-none`}
              >
                {t(`source_types.${project.sourceType}`, sourceTypeLabels[project.sourceType])}
              </Badge>

              {project.academic && (
                <Badge 
                  variant="outline" 
                  className="bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400 text-[10px] px-1.5 py-0.5 leading-none font-medium"
                >
                  {t('labels.academic', 'Academic')}
                </Badge>
              )}

              {/* AI Usage Badge (how it was built) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${aiUsageColors[project.aiUsage]} text-[10px] px-1.5 py-0.5 leading-none cursor-help`}
                  >
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    {t(`ai_usage.${project.aiUsage}`, aiUsageLabels[project.aiUsage])}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">{t(`ai_usage_descriptions.${project.aiUsage}`, aiUsageDescriptions[project.aiUsage])}</p>
                </TooltipContent>
              </Tooltip>

              {/* AI Utilization Badge (does the project use AI) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${aiUtilizationColors[project.aiUtilization]} text-[10px] px-1.5 py-0.5 leading-none cursor-help`}
                  >
                    <Cpu className="w-3 h-3 mr-0.5" />
                    {t(`ai_utilization.${project.aiUtilization}`, aiUtilizationLabels[project.aiUtilization])}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">{t(`ai_utilization_descriptions.${project.aiUtilization}`, aiUtilizationDescriptions[project.aiUtilization])}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center gap-2">
              {project.demoUrl && (
                <a 
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                  title="Live Demo"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {hasScreenshots && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaClick?.();
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                  title="Screenshots & Media"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {project.liveUrl && (
                <a 
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                  title={(() => {
                    try {
                      return new URL(project.liveUrl).hostname;
                    } catch (e) {
                      return 'Website';
                    }
                  })()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {repoCount > 0 && (
                <a 
                  href={project.repos?.[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                  title="Repository"
                >
                  <Github className="w-3.5 h-3.5" />
                </a>
              )}
              {project.modelReleases && project.modelReleases.length > 0 && (
                <a 
                  href={project.modelReleases[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                  title={`Model Release: ${project.modelReleases[0]?.name}`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                </a>
              )}
              {project.docsUrl && (
                <a 
                  href={project.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
                  title="Documentation"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
