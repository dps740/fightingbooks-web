'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { ComponentPropsWithoutRef } from 'react';

interface TrackedLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  eventName: string;
  eventParams?: Record<string, string | number | boolean>;
}

/**
 * Thin wrapper around Next.js <Link> that fires a GA4 event on click.
 * Accepts all standard Link props.
 */
export default function TrackedLink({
  eventName,
  eventParams,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(eventName, eventParams);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
