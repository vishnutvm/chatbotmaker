/** Shadow-DOM styles — slate/teal palette; no host leakage. */
export const WIDGET_STYLES = `
:host {
  all: initial;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

:host, .gw-root {
  --gw-bg: #f8fafc;
  --gw-surface: #ffffff;
  --gw-text: #0f172a;
  --gw-muted: #64748b;
  --gw-border: #e2e8f0;
  --gw-accent: #0f766e;
  --gw-accent-hover: #0d9488;
  --gw-accent-text: #ffffff;
  --gw-user-bg: #ccfbf1;
  --gw-bot-bg: #f1f5f9;
  --gw-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  --gw-radius: 16px;
}

.gw-root[data-theme="dark"] {
  --gw-bg: #0f172a;
  --gw-surface: #1e293b;
  --gw-text: #f8fafc;
  --gw-muted: #94a3b8;
  --gw-border: #334155;
  --gw-accent: #14b8a6;
  --gw-accent-hover: #2dd4bf;
  --gw-accent-text: #042f2e;
  --gw-user-bg: #134e4a;
  --gw-bot-bg: #334155;
  --gw-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.gw-root {
  position: fixed;
  z-index: 2147483000;
  right: 20px;
  bottom: 20px;
  color: var(--gw-text);
  line-height: 1.45;
}

.gw-bubble {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 999px;
  background: var(--gw-accent);
  color: var(--gw-accent-text);
  cursor: pointer;
  box-shadow: var(--gw-shadow);
  display: grid;
  place-items: center;
  transition: background 0.15s ease, transform 0.15s ease;
}

.gw-bubble:hover { background: var(--gw-accent-hover); }
.gw-bubble:focus-visible {
  outline: 3px solid var(--gw-accent);
  outline-offset: 3px;
}
.gw-bubble[aria-expanded="true"] { transform: scale(0.96); }

.gw-bubble svg { width: 26px; height: 26px; fill: currentColor; }

.gw-panel {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: min(380px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  background: var(--gw-surface);
  border: 1px solid var(--gw-border);
  border-radius: var(--gw-radius);
  box-shadow: var(--gw-shadow);
  overflow: hidden;
}

.gw-panel[hidden] { display: none !important; }

.gw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--gw-bg);
  border-bottom: 1px solid var(--gw-border);
}

.gw-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.gw-close {
  border: none;
  background: transparent;
  color: var(--gw-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.gw-close:hover { color: var(--gw-text); background: var(--gw-bot-bg); }
.gw-close:focus-visible {
  outline: 2px solid var(--gw-accent);
  outline-offset: 1px;
}

.gw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--gw-bg);
}

.gw-empty {
  margin: auto;
  text-align: center;
  color: var(--gw-muted);
  font-size: 13px;
  padding: 24px;
}

.gw-msg {
  max-width: 85%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.gw-msg[data-role="user"] {
  align-self: flex-end;
  background: var(--gw-user-bg);
}

.gw-msg[data-role="assistant"] {
  align-self: flex-start;
  background: var(--gw-bot-bg);
}

.gw-composer {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--gw-border);
  background: var(--gw-surface);
}

.gw-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--gw-border);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
  color: var(--gw-text);
  background: var(--gw-bg);
}

.gw-input:focus-visible {
  outline: 2px solid var(--gw-accent);
  outline-offset: 1px;
  border-color: transparent;
}

.gw-send {
  border: none;
  border-radius: 10px;
  padding: 0 14px;
  background: var(--gw-accent);
  color: var(--gw-accent-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.gw-send:hover { background: var(--gw-accent-hover); }
.gw-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.gw-send:focus-visible {
  outline: 2px solid var(--gw-accent);
  outline-offset: 2px;
}

@media (max-width: 420px) {
  .gw-root { right: 12px; bottom: 12px; }
  .gw-panel {
    width: calc(100vw - 24px);
    height: min(70vh, calc(100vh - 100px));
  }
}
`.trim();
