'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WizardFooter({
  backTo,
  nextTo,
  nextLabel = 'Continue',
  nextDisabled,
  onNext,
}: {
  backTo?: string;
  nextTo?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  onNext?: () => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 mt-10 flex items-center justify-between border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm sm:px-8">
      <div>
        {backTo ? (
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href={backTo}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
        ) : (
          <span />
        )}
      </div>
      <div className="flex items-center gap-3">
        {nextTo && !nextDisabled ? (
          <Button asChild size="lg" className="h-10 rounded-xl font-semibold shadow-md shadow-primary/10">
            <Link href={nextTo} onClick={onNext}>
              {nextLabel}
            </Link>
          </Button>
        ) : (
          <Button
            disabled={nextDisabled}
            onClick={onNext}
            size="lg"
            className="h-10 rounded-xl font-semibold shadow-md shadow-primary/10"
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
