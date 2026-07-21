import type { GenieWidgetConfig } from './types';
import { validateConfig } from './validate';

export type { GenieWidgetConfig, GenieWidgetApi } from './types';

/** Bundle semver — bump when public init contract changes. */
export const version = '0.1.0';

/**
 * Initialize the embeddable widget on the host page.
 * UI (bubble/panel), CDN host, and pk_live auth are deferred to later Phase 7 tasks.
 */
export function init(config: GenieWidgetConfig): void {
  const validated = validateConfig(config);
  // Placeholder until bubble UI ships — proves init path without host-page side effects beyond console.
  console.info('[GenieWidget] initialized', {
    version,
    assistantId: validated.assistantId,
  });
}
