import { cn } from '@/lib/utils';

type GenieLogoProps = {
  className?: string;
  title?: string;
};

/** Genie brand mark — chat bubble with modular S. */
export function GenieLogo({ className, title = 'Genie' }: GenieLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M128 96 H352 V320 H224 L144 392 V320 H128 Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M304 144 H192 V208 H304 V272 H192 V336 H320"
      />
    </svg>
  );
}
