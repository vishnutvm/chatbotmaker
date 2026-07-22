import type { GenieWidgetConfig } from './types';
import { validateConfig } from './validate';
import { mountWidget, type WidgetMount } from './ui/mount';

export type { GenieWidgetConfig, GenieWidgetApi, GenieWidgetTheme } from './types';

/** Bundle semver — bump when public init/UI contract changes. */
export const version = '0.2.0';

let activeMount: WidgetMount | null = null;

/**
 * Initialize the embeddable widget on the host page (bubble + panel UI).
 * CDN host and pk_live auth remain deferred to later Phase 7 tasks.
 */
export function init(config: GenieWidgetConfig): void {
  const validated = validateConfig(config);
  if (activeMount) {
    activeMount.destroy();
    activeMount = null;
  }
  activeMount = mountWidget({
    theme: validated.theme ?? 'auto',
    title: validated.title ?? 'Chat',
    assistantId: validated.assistantId,
  });
}

/** Remove the widget from the page. */
export function destroy(): void {
  if (!activeMount) return;
  activeMount.destroy();
  activeMount = null;
}

/** Open the chat panel (no-op if not initialized). */
export function open(): void {
  activeMount?.open();
}

/** Close the chat panel (no-op if not initialized). */
export function close(): void {
  activeMount?.close();
}
