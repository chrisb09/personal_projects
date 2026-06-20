import { useState, useEffect } from 'react';
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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X
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
            <div key={lang} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="w-3 h-3 rounded-sm shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground/80 truncate">{lang}</span>
              </div>
              <span className="text-foreground/60 text-xs justify-self-end tabular-nums">
                {count.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs justify-self-end w-12 text-right tabular-nums">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Screenshot Gallery Component
function ScreenshotGallery({ screenshots, projectName }: { screenshots: string[]; projectName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Keep active index updated if project changes
  const [lastScreenshots, setLastScreenshots] = useState(screenshots);
  if (lastScreenshots !== screenshots) {
    setLastScreenshots(screenshots);
    setActiveIndex(0);
    setLightboxOpen(false);
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, screenshots, lightboxOpen]);

  // Touch Swipe Navigation for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="space-y-3">
      {/* Featured Image Viewport */}
      <div 
        className="relative aspect-[16/10] max-h-[220px] md:max-h-[260px] w-full rounded-lg border border-border/40 bg-muted/20 overflow-hidden shadow-sm flex items-center justify-center group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={screenshots[activeIndex]} 
          alt={`${projectName} preview`} 
          className="w-full h-full object-cover cursor-zoom-in transition-all duration-300"
          onClick={() => setLightboxOpen(true)}
        />
        
        {/* Gallery Navigation Arrows (overlay) */}
        {screenshots.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground/75 hover:text-foreground shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground/75 hover:text-foreground shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnails list */}
      {screenshots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted">
          {screenshots.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-video w-20 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                activeIndex === i 
                  ? 'border-primary ring-1 ring-primary/30 shadow-sm' 
                  : 'border-border/60 hover:border-muted-foreground/30 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt={`${projectName} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center select-none"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close fullscreen view"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Lightbox arrows */}
          {screenshots.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main Lightbox Image */}
          <div 
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={screenshots[activeIndex]} 
              alt={`${projectName} fullscreen`} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            />
          </div>

          {/* Image index indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium">
            {activeIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectDetailModal({ project, isOpen, onClose, onProjectSelect, allProjects = [] }: ProjectDetailModalProps) {
  const { t } = useTranslation();
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
        <DialogContent className="w-[90vw] max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-7xl h-[88vh] max-h-[88vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl flex flex-col">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 pb-3 shrink-0">
            <DialogHeader>
              <div className="flex items-start gap-3.5">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shadow-md shadow-primary/10 shrink-0">
                  {project.logo ? (
                    <img src={project.logo} alt={project.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <FolderGit2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <DialogTitle className="text-xl font-bold">{project.name}</DialogTitle>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-snug">{project.tagline}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`${categoryColors[project.category]} text-[10px] px-1.5 py-0.5 leading-none font-medium`}
                    >
                      {t(`categories.${project.category}`, categoryLabels[project.category])}
                    </Badge>
                    {project.academic && (
                      <Badge 
                        variant="outline" 
                        className="bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400 text-[10px] px-1.5 py-0.5 leading-none font-medium"
                      >
                        {t('labels.academic', 'Academic')}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 leading-none">
                      {t(`statuses.${project.status}`, statusLabels[project.status])}
                    </Badge>
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
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{t(`ai_usage_descriptions.${project.aiUsage}`, aiUsageDescriptions[project.aiUsage])}</p>
                      </TooltipContent>
                    </Tooltip>
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
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{t(`ai_utilization_descriptions.${project.aiUtilization}`, aiUtilizationDescriptions[project.aiUtilization])}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.year}
                    </span>
                    {(hasRepos || hasMirrors) && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Github className="w-3 h-3" />
                        {(project.repos?.length ?? 0) + (project.mirrors?.length ?? 0)} {((project.repos?.length ?? 0) + (project.mirrors?.length ?? 0)) === 1 ? 'repo' : 'repos'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {project.demoUrl && (
                <Button size="sm" className="h-8 text-xs gap-2" variant="default" asChild>
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Demo
                  </a>
                </Button>
              )}
              {project.liveUrl && (
                <Button size="sm" className="h-8 text-xs gap-2" variant="default" asChild>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {(() => {
                      try {
                        return new URL(project.liveUrl).hostname;
                      } catch (e) {
                        return 'Website';
                      }
                    })()}
                  </a>
                </Button>
              )}
              {project.oldUrl && (
                <Button size="sm" className="h-8 text-xs gap-2" variant="outline" asChild>
                  <a href={project.oldUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('modal.legacy_version', 'Legacy Version')}
                  </a>
                </Button>
              )}
              {hasRepos && project.repos?.map((repo, i) => (
                <Button key={i} size="sm" className="h-8 text-xs gap-2" variant="outline" asChild>
                  <a href={repo.url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-3.5 h-3.5" />
                    {repo.name || 'Repository'}
                  </a>
                </Button>
              ))}
              {hasMirrors && project.mirrors?.map((mirror, i) => (
                <Button key={i} size="sm" className="h-8 text-xs gap-2" variant="outline" asChild>
                  <a href={mirror.url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-3.5 h-3.5" />
                    {mirror.name} (Mirror)
                  </a>
                </Button>
              ))}
              {project.docsUrl && (
                <Button size="sm" className="h-8 text-xs gap-2" variant="outline" asChild>
                  <a href={project.docsUrl} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="w-3.5 h-3.5" />
                    Documentation
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <div className="px-4 border-b border-border/20 shrink-0">
              <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-5 flex-wrap">
                <TabsTrigger 
                  value="overview" 
                  className="px-1 pb-2 pt-1.5 rounded-none text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all whitespace-nowrap bg-transparent shadow-none border-t-0 border-x-0"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="technical" 
                  className="px-1 pb-2 pt-1.5 rounded-none text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all whitespace-nowrap bg-transparent shadow-none border-t-0 border-x-0"
                >
                  Technical
                </TabsTrigger>
                <TabsTrigger 
                  value="usage" 
                  className="px-1 pb-2 pt-1.5 rounded-none text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all whitespace-nowrap bg-transparent shadow-none border-t-0 border-x-0"
                >
                  Installation & Usage
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="px-1 pb-2 pt-1.5 rounded-none text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all whitespace-nowrap bg-transparent shadow-none border-t-0 border-x-0"
                >
                  Stats & Metrics
                </TabsTrigger>
                {(hasRepos || hasMirrors) && (
                  <TabsTrigger 
                    value="repositories" 
                    className="px-1 pb-2 pt-1.5 rounded-none text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all whitespace-nowrap bg-transparent shadow-none border-t-0 border-x-0"
                  >
                    {`Repositories (${(project.repos?.length ?? 0) + (project.mirrors?.length ?? 0)})`}
                  </TabsTrigger>
                )}
                {(hasScreenshots || hasRelatedProjects) && (
                  <TabsTrigger 
                    value="media" 
                    className="px-1 pb-2 pt-1.5 rounded-none text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all whitespace-nowrap bg-transparent shadow-none border-t-0 border-x-0"
                  >
                    Media & Links
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Scrollable content area — fills remaining modal height */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="p-4 min-w-0">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4 focus-visible:outline-none">
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Description
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">{project.description}</p>
                  </section>
 
                  <Separator />
 
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Purpose
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">{project.purpose}</p>
                  </section>
 
                  <Separator />
 
                  <div className="grid md:grid-cols-2 gap-4">
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {project.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </section>
 
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Limitations
                      </h4>
                      <ul className="space-y-1.5">
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
                <TabsContent value="technical" className="mt-0 space-y-4 focus-visible:outline-none">
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Technologies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tech, i) => (
                        <Badge key={i} variant="secondary" className="font-normal text-xs px-2 py-0.5">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </section>
 
                  <Separator />
 
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      Dependencies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {project.dependencies.map((dep, i) => (
                        <Badge key={i} variant="outline" className="font-normal text-xs px-2 py-0.5">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </section>
 
                  <Separator />
 
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      Expertise Highlighted
                    </h4>
                    <ul className="space-y-1.5">
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
                <TabsContent value="usage" className="mt-0 space-y-4 focus-visible:outline-none">
                  {project.installation && (
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Installation
                      </h4>
                      <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground/90 border border-border/50">
                        <code>{project.installation}</code>
                      </pre>
                    </section>
                  )}
 
                  {project.installation && project.usage && <Separator />}
 
                  {project.usage && (
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        Usage
                      </h4>
                      <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground/90 border border-border/50">
                        <code>{project.usage}</code>
                      </pre>
                    </section>
                  )}
 
                  {!project.installation && !project.usage && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Wrench className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Installation and usage details coming soon.</p>
                    </div>
                  )}
                </TabsContent>
                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Repository Stats */}
                    {hasStats && (
                      <section className="space-y-2.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Github className="w-3.5 h-3.5" />
                          Repository Stats
                        </h4>
                        <div className="space-y-2 max-w-md">
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-medium">Stars</span>
                            </div>
                            <span className="text-xs font-semibold">{project.stats?.stars}</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                            <div className="flex items-center gap-2">
                              <GitCommit className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-medium">Commits</span>
                            </div>
                            <span className="text-xs font-semibold">{project.stats?.commits}</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                            <div className="flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-medium">Branches</span>
                            </div>
                            <span className="text-xs font-semibold">{project.stats?.branches}</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-500" />
                              <span className="text-xs font-medium">Last Commit</span>
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[150px]" title={project.stats?.lastCommit}>
                              {project.stats?.lastCommit}
                            </span>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* LOC Chart */}
                    {hasLOC && (
                      <section className="space-y-2.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          Lines of Code
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3.5 border border-border/50 max-w-md">
                          <DonutChart 
                            data={project.loc!.byLanguage} 
                            total={project.loc!.total} 
                          />
                        </div>
                      </section>
                    )}

                    {!hasStats && !hasLOC && (
                      <div className="text-center py-10 text-muted-foreground col-span-2">
                        <FolderGit2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No repository statistics or lines of code data available.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
 
                {/* Repositories Tab */}
                {(hasRepos || hasMirrors) && (
                  <TabsContent value="repositories" className="mt-0 space-y-4 focus-visible:outline-none">
                    {hasRepos && (
                      <section>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Github className="w-3.5 h-3.5" />
                          Primary Repositories
                        </h4>
                        <div className="space-y-2">
                          {project.repos?.map((repo, i) => (
                            <a 
                              key={i}
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground/90 group-hover:text-foreground transition-colors">{repo.name}</p>
                                <p className="text-[10px] text-muted-foreground">{repo.type || 'git'}</p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}
 
                    {hasRepos && hasMirrors && <Separator />}
 
                    {hasMirrors && (
                      <section>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5" />
                          Mirror Repositories
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">Mirrors for visibility and accessibility. Stats are counted from primary repository.</p>
                        <div className="space-y-2">
                          {project.mirrors?.map((mirror, i) => (
                            <a 
                              key={i}
                              href={mirror.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/20 hover:bg-muted/40 hover:border-primary/30 transition-colors group"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground/90 group-hover:text-foreground transition-colors">{mirror.name}</p>
                                <p className="text-[10px] text-muted-foreground">{mirror.description || mirror.type || 'git'}</p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-2 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}
                  </TabsContent>
                )}
 
                {/* Media Tab */}
                {(hasScreenshots || hasRelatedProjects) && (
                  <TabsContent value="media" className="mt-0 space-y-4 focus-visible:outline-none">
                    {hasScreenshots && (
                      <section className="space-y-2.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          Screenshots
                        </h4>
                        <div className="max-w-xl">
                          <ScreenshotGallery screenshots={project.screenshots!} projectName={project.name} />
                        </div>
                      </section>
                    )}
 
                    {hasScreenshots && hasRelatedProjects && <Separator />}
 
                    {hasRelatedProjects && (
                      <section>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5" />
                          Related Projects
                        </h4>
                        <div className="space-y-2">
                          {project.relatedProjects?.map((related, i) => {
                            const isInternalProject = related.projectId && allProjects.some(p => p.id === related.projectId);
                            
                            return (
                              <div 
                                key={i}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-sm text-foreground/90">{related.name}</p>
                                  <p className="text-xs text-muted-foreground">{related.relation}</p>
                                </div>
                                {isInternalProject && onProjectSelect ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onProjectSelect(related.projectId!);
                                    }}
                                    className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                  >
                                    <ArrowUpRight className="w-4 h-4" />
                                  </button>
                                ) : related.url ? (
                                  <a 
                                    href={related.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ArrowUpRight className="w-4 h-4" />
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
