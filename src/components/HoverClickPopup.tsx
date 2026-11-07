import { useRef, useState, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const HOVER_OPEN_DELAY = 400;
const LEAVE_CLOSE_GRACE = 120;

interface HoverClickPopupProps {
  ariaLabel: string;
  triggerClassName: string;
  contentClassName?: string;
  content: ReactNode;
  children: ReactNode;
}

/**
 * A single popup that behaves like a tooltip on hover and gets pinned by
 * click/tap. Using one Popover for both hover and click (instead of a Tooltip
 * plus a Popover) makes it impossible to ever render two stacked popups, and
 * the popup persists on touch where tooltips flash and dismiss instantly.
 *
 * - hover (mouse): opens after a short delay, closes when the pointer leaves
 *   the trigger or the content (with a small grace period for the gap)
 * - click / tap: opens and pins the popup open until dismissed
 *   (click again, click outside, or Escape)
 */
export function HoverClickPopup({ ariaLabel, triggerClassName, contentClassName, content, children }: HoverClickPopupProps) {
  const [open, setOpen] = useState(false);
  const pinnedRef = useRef(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
  };
  const clearLeaveTimer = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
  };

  const handleEnter = () => {
    clearLeaveTimer();
    if (!open && !hoverTimer.current) {
      hoverTimer.current = setTimeout(() => { hoverTimer.current = null; setOpen(true); }, HOVER_OPEN_DELAY);
    }
  };

  const handleLeave = () => {
    clearHoverTimer();
    if (!open) return;
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      if (!pinnedRef.current) setOpen(false);
    }, LEAVE_CLOSE_GRACE);
  };

  const handleTriggerClick = () => {
    clearHoverTimer();
    clearLeaveTimer();
    if (open && pinnedRef.current) {
      pinnedRef.current = false;
      setOpen(false);
      return;
    }
    pinnedRef.current = true;
    setOpen(true);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        clearHoverTimer();
        clearLeaveTimer();
        if (!next) pinnedRef.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); handleTriggerClick(); }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          aria-label={ariaLabel}
          className={triggerClassName}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className={contentClassName}
        onMouseEnter={clearLeaveTimer}
        onMouseLeave={handleLeave}
        onClick={event => event.stopPropagation()}
        onOpenAutoFocus={event => event.preventDefault()}
        onCloseAutoFocus={event => event.preventDefault()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
