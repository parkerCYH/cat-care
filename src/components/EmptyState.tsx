import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Emoji or icon-font glyph — no custom illustrations (issue #11 resolution). */
  icon: ReactNode;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Shared empty-state used across home (no cats), weight history, and bowel history
 * table pages (issue #11). The bowel history *calendar* page intentionally does not
 * use this — an empty calendar cell is enough there.
 */
export function EmptyState({ icon, text, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="text-5xl" aria-hidden="true">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{text}</p>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="mt-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
