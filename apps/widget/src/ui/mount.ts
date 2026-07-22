import type { GenieWidgetTheme } from '../types';
import { WIDGET_STYLES } from './styles';

const HOST_ID = 'genie-widget-root';

const CHAT_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>`;

export type AuthUiState = 'loading' | 'ready' | 'error';

export interface MountOptions {
  theme: GenieWidgetTheme;
  title: string;
  assistantId: string;
  /** Initial auth UI state (default loading until bootstrap completes). */
  authState?: AuthUiState;
  authMessage?: string;
}

export interface WidgetMount {
  open: () => void;
  close: () => void;
  destroy: () => void;
  isOpen: () => boolean;
  getHost: () => HTMLElement;
  setAuthState: (state: AuthUiState, message?: string) => void;
  setTitle: (title: string) => void;
  showWelcome: (text: string) => void;
}

function resolveTheme(theme: GenieWidgetTheme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/** Static shell only — no user-controlled strings in this markup. */
const PANEL_SHELL = `
  <div class="gw-panel" id="gw-panel" role="dialog" aria-modal="false" aria-labelledby="gw-title" hidden>
    <div class="gw-header">
      <h2 id="gw-title"></h2>
      <button type="button" class="gw-close" aria-label="Close chat">×</button>
    </div>
    <div class="gw-status" id="gw-status" role="status" aria-live="polite" hidden></div>
    <div class="gw-messages" id="gw-messages" role="log" aria-live="polite" aria-relevant="additions">
      <p class="gw-empty" id="gw-empty">Ask a question to get started.</p>
    </div>
    <form class="gw-composer" id="gw-form">
      <label class="visually-hidden" for="gw-input" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">Message</label>
      <input class="gw-input" id="gw-input" name="message" type="text" autocomplete="off" maxlength="2000" placeholder="Type a message…" />
      <button class="gw-send" type="submit">Send</button>
    </form>
  </div>
  <button type="button" class="gw-bubble" id="gw-bubble" aria-label="Open chat" aria-controls="gw-panel" aria-expanded="false">
    ${CHAT_ICON}
  </button>
`;

/**
 * Mounts bubble + panel into a Shadow DOM host on document.body.
 */
export function mountWidget(options: MountOptions): WidgetMount {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('GenieWidget: document.body is required to mount the UI');
  }

  const existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('data-genie-widget', 'true');
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = WIDGET_STYLES;
  shadow.appendChild(style);

  const root = document.createElement('div');
  root.className = 'gw-root';
  root.dataset.theme = resolveTheme(options.theme);
  root.innerHTML = PANEL_SHELL;
  shadow.appendChild(root);

  const panel = shadow.getElementById('gw-panel') as HTMLElement;
  const bubble = shadow.getElementById('gw-bubble') as HTMLButtonElement;
  const closeBtn = shadow.querySelector('.gw-close') as HTMLButtonElement;
  const form = shadow.getElementById('gw-form') as HTMLFormElement;
  const input = shadow.getElementById('gw-input') as HTMLInputElement;
  const messages = shadow.getElementById('gw-messages') as HTMLElement;
  const empty = shadow.getElementById('gw-empty') as HTMLElement | null;
  const statusEl = shadow.getElementById('gw-status') as HTMLElement;
  const titleEl = shadow.getElementById('gw-title') as HTMLElement;
  titleEl.textContent = options.title;

  let openState = false;
  let authState: AuthUiState = options.authState ?? 'loading';
  let replyTimer: ReturnType<typeof setTimeout> | null = null;
  let mediaQuery: MediaQueryList | null = null;
  let onMediaChange: (() => void) | null = null;

  if (options.theme === 'auto' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    onMediaChange = () => {
      root.dataset.theme = resolveTheme('auto');
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onMediaChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onMediaChange);
    }
  }

  function applyAuthUi(state: AuthUiState, message?: string): void {
    authState = state;
    root.dataset.auth = state;
    const sendBtn = form.querySelector('.gw-send') as HTMLButtonElement;
    if (state === 'ready') {
      statusEl.hidden = true;
      statusEl.textContent = '';
      input.disabled = false;
      sendBtn.disabled = false;
      return;
    }
    statusEl.hidden = false;
    statusEl.dataset.kind = state;
    statusEl.textContent =
      message ??
      (state === 'loading' ? 'Connecting…' : 'Unable to connect. Check your public key.');
    input.disabled = true;
    sendBtn.disabled = true;
  }

  applyAuthUi(authState, options.authMessage);

  function setOpen(next: boolean): void {
    openState = next;
    if (next) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
    bubble.setAttribute('aria-expanded', next ? 'true' : 'false');
    bubble.setAttribute('aria-label', next ? 'Close chat' : 'Open chat');
    if (next) {
      if (authState === 'ready') {
        input.focus();
      }
    } else {
      bubble.focus();
    }
  }

  function appendMessage(role: 'user' | 'assistant', text: string): void {
    if (empty) empty.remove();
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'gw-msg';
    bubbleEl.dataset.role = role;
    bubbleEl.textContent = text;
    messages.appendChild(bubbleEl);
    messages.scrollTop = messages.scrollHeight;
  }

  function onBubbleClick(): void {
    setOpen(!openState);
  }

  function onCloseClick(): void {
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && openState) {
      event.stopPropagation();
      setOpen(false);
    }
  }

  function onSubmit(event: Event): void {
    event.preventDefault();
    if (authState !== 'ready') return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendMessage('user', text);
    // Placeholder reply — live SSE deferred to later P7 tasks.
    replyTimer = setTimeout(() => {
      replyTimer = null;
      appendMessage(
        'assistant',
        'Thanks — chat UI is ready. Live assistant replies connect in a later Phase 7 task.',
      );
    }, 250);
  }

  bubble.addEventListener('click', onBubbleClick);
  closeBtn.addEventListener('click', onCloseClick);
  form.addEventListener('submit', onSubmit);
  host.addEventListener('keydown', onKeyDown);

  // Quiet console breadcrumb for operators (assistantId only — never log apiKey).
  console.info('[GenieWidget] UI mounted', { assistantId: options.assistantId });

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    isOpen: () => openState,
    getHost: () => host,
    setAuthState: (state, message) => applyAuthUi(state, message),
    setTitle: (title) => {
      titleEl.textContent = title;
    },
    showWelcome: (text) => {
      if (!text.trim()) return;
      appendMessage('assistant', text);
    },
    destroy: () => {
      if (replyTimer !== null) {
        clearTimeout(replyTimer);
        replyTimer = null;
      }
      bubble.removeEventListener('click', onBubbleClick);
      closeBtn.removeEventListener('click', onCloseClick);
      form.removeEventListener('submit', onSubmit);
      host.removeEventListener('keydown', onKeyDown);
      if (mediaQuery && onMediaChange) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', onMediaChange);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(onMediaChange);
        }
      }
      host.remove();
    },
  };
}
