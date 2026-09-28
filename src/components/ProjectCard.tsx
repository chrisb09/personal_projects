import { useTranslation } from 'react-i18next';
import { useLocalizedProject } from '@/lib/localizeProject';
import type { Project } from '@/types/project';
import { categoryLabels, roleLabels, statusLabels, languageColors } from '@/types/project';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpRight, FolderGit2, Image as ImageIcon, Star } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onMediaClick?: () => void;
}

function LanguageChart({ data, total }: { data: Record<string, number>; total: number }) {
  const { t } = useTranslation();
  const entries = Object.entries(data).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const displayed = entries.slice(0, 3);
  const segments = displayed.map(([name, count]) => ({ name, count, color: languageColors[name] || '#8893a3' }));
  const remainder = Math.max(0, total - displayed.reduce((sum, [, count]) => sum + count, 0));
  if (remainder > 0) segments.push({ name: t('card.other', 'Other'), count: remainder, color: '#8893a3' });

  let offset = 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={event => event.stopPropagation()} className="shrink-0 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('modal.loc_breakdown', 'Language breakdown')}>
          <svg viewBox="0 0 40 40" className="size-10 -rotate-90" aria-hidden="true">
            <circle cx="20" cy="20" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
            {segments.map(({ name, count, color }) => {
              const length = count / total * 94.25;
              const position = offset;
              offset += length;
              return <circle key={name} cx="20" cy="20" r="15" fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${length} ${94.25 - length}`} strokeDashoffset={-position} />;
            })}
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="min-w-40 space-y-1.5 p-3">
        <p className="text-xs font-semibold">{t('modal.loc_breakdown', 'Language breakdown')}</p>
        {segments.map(({ name, count, color }) => (
          <div key={name} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{name}</span>
            <span className="tabular-nums text-muted-foreground">{Math.round(count / total * 100)}%</span>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

export function ProjectCard({ project: rawProject, onClick, onMediaClick }: ProjectCardProps) {
  const project = useLocalizedProject(rawProject) || rawProject;
  const { t } = useTranslation();
  const hasMedia = Boolean(project.screenshots?.length);

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer gap-0 overflow-hidden border-border bg-card py-0 shadow-sm transition-colors hover:border-primary/60 hover:shadow-md focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40"
    >
      <CardContent className="flex min-h-[250px] flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
              {project.logo ? <img src={project.logo} alt="" className="size-full object-contain" /> : <FolderGit2 className="size-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-snug tracking-tight text-card-foreground group-hover:text-primary">{project.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t(`roles.${project.role}`, roleLabels[project.role])} · {project.year}</p>
            </div>
          </div>
          {Boolean(project.loc?.total && project.loc.byLanguage) && <LanguageChart data={project.loc!.byLanguage!} total={project.loc!.total!} />}
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-card-foreground/85">{project.description}</p>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t(`categories.${project.category}`, categoryLabels[project.category])}</span>
            <span aria-hidden="true">·</span>
            {project.technologies.slice(0, 3).map(tech => <span key={tech} className="rounded-md bg-muted px-1.5 py-0.5">{tech}</span>)}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
              <span>{t(`statuses.${project.status}`, statusLabels[project.status])}</span>
              {project.academic && <span>· {t('labels.academic', 'Academic')}</span>}
              {(project.stats?.stars ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 tabular-nums" title={t('stats.repo_stars', 'Stars on the linked repository')} aria-label={`${project.stats!.stars} ${t('stats.stars', 'stars')}`}>
                  <Star className="size-3.5 text-amber-500" />{project.stats!.stars}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-primary">
              {hasMedia && <button type="button" onClick={event => { event.stopPropagation(); onMediaClick?.(); }} className="rounded-md p-1.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('modal.screenshots', 'Screenshots')}: ${project.name}`}><ImageIcon className="size-4" /></button>}
              <button type="button" onClick={event => { event.stopPropagation(); onClick(); }} className="flex items-center gap-1 rounded-md p-1.5 font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('card.view_project', 'View project')}: ${project.name}`}>
                {t('card.details', 'Details')} <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
