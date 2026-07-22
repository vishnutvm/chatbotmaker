import { BootstrapError, fetchWidgetBootstrap } from './bootstrap';
import type { GenieWidgetConfig } from './types';
import { validateConfig } from './validate';
import { mountWidget, type WidgetMount } from './ui/mount';

export type { GenieWidgetConfig, GenieWidgetApi, GenieWidgetTheme } from './types';

/** Bundle semver — bump when public init/UI contract changes. */
export const version = '0.3.0';

let activeMount: WidgetMount | null = null;
let bootstrapToken = 0;

/**
 * Initialize the embeddable widget on the host page (bubble + panel UI).
 * Validates pk_live key locally, then bootstraps display config from the API.
 */
export function init(config: GenieWidgetConfig): void {
  const validated = validateConfig(config);
  if (activeMount) {
    activeMount.destroy();
    activeMount = null;
  }

  const mount = mountWidget({
    theme: validated.theme ?? 'auto',
    title: validated.title ?? 'Chat',
    assistantId: validated.assistantId,
    authState: 'loading',
    authMessage: 'Connecting…',
  });
  activeMount = mount;

  const token = ++bootstrapToken;
  void fetchWidgetBootstrap({
    apiBaseUrl: validated.apiBaseUrl,
    apiKey: validated.apiKey,
    assistantId: validated.assistantId,
  })
    .then((boot) => {
      if (token !== bootstrapToken || activeMount !== mount) return;
      if (!validated.title) {
        mount.setTitle(boot.name || 'Chat');
      }
      mount.setAuthState('ready');
      if (boot.welcomeMessage?.trim()) {
        mount.showWelcome(boot.welcomeMessage.trim());
      }
    })
    .catch((err: unknown) => {
      if (token !== bootstrapToken || activeMount !== mount) return;
      const message =
        err instanceof BootstrapError
          ? err.message
          : 'Unable to connect. Check your public key.';
      mount.setAuthState('error', message);
    });
}

/** Remove the widget from the page. */
export function destroy(): void {
  bootstrapToken += 1;
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
