import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCommit } from 'lucide-react';

interface ActivityDay {
  date: string;
  level: number;
  count: number;
  hosts: Record<string, number>;
}

interface ActivityData {
  days: ActivityDay[];
  hosts: string[];
}

const weekCount = 53;
const dayMs = 24 * 60 * 60 * 1000;
const cellStep = 8;
const levelColors = [
  'bg-muted',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-600 dark:bg-emerald-500',
  'bg-emerald-800 dark:bg-emerald-300',
];

function hostLabel(host: string) {
  if (host === 'github.com') return 'GitHub';
  if (host === 'gitlab.com') return 'GitLab.com';
  if (host === 'gitlab.git.nrw') return 'NRW GitLab';
  if (host === 'local') return 'Local';
  return host;
}

export function GitActivity() {
  const { t, i18n } = useTranslation();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [activeDay, setActiveDay] = useState<{ date: string; count: number; hosts: Record<string, number>; x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/git-activity.json', { cache: 'no-store', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Activity unavailable: ${response.status}`);
        return response.json();
      })
      .then((data: ActivityData) => {
        if (Array.isArray(data.days) && data.days.length > 0) setActivity(data);
      })
      .catch(() => {}); // The header remains usable if activity data cannot be loaded.
    return () => controller.abort();
  }, []);

  const weeks = useMemo(() => {
    if (!activity) return [];
    const daysByDate = new Map(activity.days.map(day => [day.date, day]));
    const latest = new Date(`${activity.days[activity.days.length - 1].date}T00:00:00Z`);
    const start = latest.getTime() - (latest.getUTCDay() + (weekCount - 1) * 7) * dayMs;
    return Array.from({ length: weekCount }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const date = new Date(start + (week * 7 + day) * dayMs).toISOString().slice(0, 10);
        const activityDay = daysByDate.get(date);
        return { date, level: activityDay?.level, count: activityDay?.count, hosts: activityDay?.hosts || {} };
      })
    );
  }, [activity]);

  useEffect(() => {
    const grid = gridRef.current;
    if (grid) grid.scrollLeft = grid.scrollWidth - grid.clientWidth;
  }, [weeks]);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!gridRef.current?.contains(event.target as Node)) setActiveDay(null);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  const showDay = (clientX: number, clientY: number, grid: HTMLElement) => {
    const bounds = grid.getBoundingClientRect();
    const weekIndex = Math.floor((clientX - bounds.left) / cellStep);
    const weekday = Math.floor((clientY - bounds.top) / cellStep);
    const day = weeks[weekIndex]?.[weekday];
    if (day?.count === undefined) {
      setActiveDay(null);
      return;
    }
    setActiveDay({
      date: day.date,
      count: day.count,
      hosts: day.hosts,
      x: Math.max(140, Math.min(window.innerWidth - 140, bounds.left + weekIndex * cellStep + 3.5)),
      y: bounds.top + weekday * cellStep,
    });
  };

  const dayLabel = (date: string, count: number) => {
    const parsed = new Date(`${date}T00:00:00Z`);
    let formatted: string;
    if (i18n.language.startsWith('de')) {
      formatted = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parsed);
    } else {
      const day = parsed.getUTCDate();
      const ending = day >= 11 && day <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] || 'th';
      formatted = `${new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(parsed)} ${day}${ending}`;
    }
    return t('activity.contributions', { count, date: formatted });
  };

  if (!activity || weeks.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border/70 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium"><GitCommit className="size-3.5" />{t('activity.title', 'Contribution activity')}</span>
        <span>{activity.hosts.map(hostLabel).join(' · ')}</span>
      </div>
      <div ref={gridRef} className="mt-2 max-w-full overflow-x-auto pb-1" aria-label={t('activity.description', 'GitHub contributions and GitLab commits over the past year')} role="region" tabIndex={0} onScroll={() => setActiveDay(null)}>
        <div
          className="flex w-max gap-px"
          role="img"
          aria-label={t('activity.description', 'GitHub contributions and GitLab commits over the past year')}
          onPointerMove={event => { if (event.pointerType === 'mouse') showDay(event.clientX, event.clientY, event.currentTarget); }}
          onPointerLeave={event => { if (event.pointerType === 'mouse') setActiveDay(null); }}
          onClick={event => showDay(event.clientX, event.clientY, event.currentTarget)}
        >
        {weeks.map(week => (
          <div key={week[0].date} className="flex flex-col gap-px" aria-hidden="true">
            {week.map(({ date, level }) => (
              <span
                key={date}
                data-date={date}
                className={`size-[7px] rounded-[1px] ${level === undefined ? 'bg-transparent' : levelColors[Math.max(0, Math.min(4, level))]}`}
              />
            ))}
          </div>
        ))}
        </div>
      </div>
      {activeDay && (
        <div role="tooltip" className="pointer-events-none fixed z-[60] max-w-[280px] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg" style={{ left: activeDay.x, top: activeDay.y - 6 }}>
          <div>{dayLabel(activeDay.date, activeDay.count)}</div>
          {Object.keys(activeDay.hosts).length > 0 && (
            <div className="mt-0.5 text-[10px] font-normal opacity-80">
              {Object.entries(activeDay.hosts).map(([host, count]) => `${hostLabel(host)}: ${count}`).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
