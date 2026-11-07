import { useState, type ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HoverClickPopupProps {
  ariaLabel: string;
  triggerClassName: string;
  contentClassName?: string;
  content: ReactNode;
  children: ReactNode;
}

/**
 * Hover shows a tooltip; click (or tap) opens the same content as a popover
 * that stays open until dismissed. Works uniformly for mouse and touch:
 * tooltips flash and dismiss instantly on tap, but a popover persists.
 */
export function HoverClickPopup({ ariaLabel, triggerClassName, contentClassName, content, children }: HoverClickPopupProps) {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <Popover open={popupOpen} onOpenChange={setPopupOpen}>
      <Tooltip open={popupOpen ? false : undefined}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" onClick={event => event.stopPropagation()} aria-label={ariaLabel} className={triggerClassName}>
              {children}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className={contentClassName}>
          {content}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        side="top"
        align="end"
        className={contentClassName}
        onClick={event => event.stopPropagation()}
        onCloseAutoFocus={event => event.preventDefault()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
