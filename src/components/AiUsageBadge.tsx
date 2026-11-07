import { useTranslation } from 'react-i18next';
import { Bot, BrainCircuit, PenLine, Sparkles, Wand2, type LucideIcon } from 'lucide-react';
import type { AIUsage } from '@/types/project';
import { aiUsageColors, aiUsageDescriptions, aiUsageLabels } from '@/types/project';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const aiUsageIcons: Record<AIUsage, LucideIcon> = {
  none: PenLine,
  minor: Sparkles,
  contributed: Wand2,
  major: Bot,
  full: BrainCircuit,
};

export function AiUsageGlyph({ usage, className = 'size-4' }: { usage: AIUsage; className?: string }) {
  const Icon = aiUsageIcons[usage];
  return <Icon className={className} aria-hidden="true" />;
}

export function AiUsageBadge({ usage }: { usage: AIUsage }) {
  const { t } = useTranslation();
  const label = t(`ai_usage.${usage}`, aiUsageLabels[usage]);
  const description = t(`ai_usage_descriptions.${usage}`, aiUsageDescriptions[usage]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={event => event.stopPropagation()}
          aria-label={`${label}: ${description}`}
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${aiUsageColors[usage]}`}
        >
          <AiUsageGlyph usage={usage} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 space-y-1 p-3">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
