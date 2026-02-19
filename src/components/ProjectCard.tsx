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
import { ExternalLink, Github, BookOpen, FolderGit2, Star, GitCommit, Code2, Sparkles, Cpu } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
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
              <div key={lang} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{lang}</span>
                </div>
                <span className="text-muted-foreground">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { t } = useTranslation();
  // Get top 2 technologies to display as badges
  const topTechnologies = project.technologies.slice(0, 2);
  const hasRepos = project.repos && project.repos.length > 0;
  
  return (
    <TooltipProvider>
      <Card 
        className="group cursor-pointer overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
        onClick={onClick}
      >
        <CardContent className="p-5">
          {/* Category and Role badges at top */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge 
              variant="outline" 
              className={`${categoryColors[project.category]} text-xs font-medium`}
            >
              {t(`categories.${project.category}`, categoryLabels[project.category])}
            </Badge>
            <Badge 
              variant="outline" 
              className={`${roleColors[project.role]} text-xs font-medium`}
            >
              {t(`roles.${project.role}`, roleLabels[project.role])}
            </Badge>
          </div>

          {/* Header with Logo and Title */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo placeholder */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:from-primary/30 group-hover:to-primary/10 transition-all shrink-0">
                {project.logo ? (
                  <img src={project.logo} alt={project.name} className="w-6 h-6 object-contain" />
                ) : (
                  <FolderGit2 className="w-5 h-5 text-primary/70" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-muted-foreground">{project.year}</p>
              </div>
            </div>
            
            {/* Mini language chart */}
            {project.loc && project.loc.total > 0 && (
              <MiniLanguageChart data={project.loc.byLanguage} total={project.loc.total} />
            )}
          </div>

          {/* Tagline */}
          <p className="text-sm font-medium text-foreground/90 mb-2 line-clamp-1">
            {project.tagline}
          </p>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>

          {/* Technology badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {topTechnologies.map((tech, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs font-normal bg-secondary/50"
              >
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 2 && (
              <Badge variant="secondary" className="text-xs font-normal bg-secondary/50">
                +{project.technologies.length - 2}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            {project.stats && (
              <>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>{project.stats.stars}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitCommit className="w-3 h-3" />
                  <span>{project.stats.commits}</span>
                </div>
              </>
            )}
            {project.loc && (
              <div className="flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                <span>{(project.loc.total / 1000).toFixed(1)}k LOC</span>
              </div>
            )}
          </div>

          {/* Footer with Status, Source Type, AI Usage, AI Utilization, and Links */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {t(`statuses.${project.status}`, statusLabels[project.status])}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`${sourceTypeColors[project.sourceType]} text-xs`}
              >
                {t(`source_types.${project.sourceType}`, sourceTypeLabels[project.sourceType])}
              </Badge>

              {/* AI Usage Badge (how it was built) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${aiUsageColors[project.aiUsage]} text-xs cursor-help`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
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
                    className={`${aiUtilizationColors[project.aiUtilization]} text-xs cursor-help`}
                  >
                    <Cpu className="w-3 h-3 mr-1" />
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
                <span className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </span>
              )}
              {hasRepos && (
                <span className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="w-4 h-4" />
                </span>
              )}
              {project.docsUrl && (
                <span className="text-muted-foreground hover:text-primary transition-colors">
                  <BookOpen className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
