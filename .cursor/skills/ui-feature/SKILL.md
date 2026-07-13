---
name: ui-feature
description: Playbook for building UI features in Next.js dashboard, marketing, or widget apps. Use when adding pages, components, forms, or client-side flows.
---

# UI Feature Playbook

## Steps

### 1. Confirm API contract

- Endpoint exists and is documented
- Types available in `packages/types` or `packages/api-client`

### 2. Plan UI structure

```text
Page or layout
  ├── Data fetching (server component or client hook)
  ├── Presentation components
  ├── Form + validation (client-side for UX only)
  └── Loading / error / empty states
```

### 3. Implement

- Reuse `packages/ui` components where possible
- Match existing Tailwind patterns and theme
- No business logic — delegate to API

### 4. States

Every data-driven UI must handle:

- **Loading** — skeleton or spinner
- **Error** — user-friendly message + retry
- **Empty** — guidance for next action

### 5. Accessibility

- Semantic HTML
- Form labels and `aria-*` where needed
- Keyboard navigation

### 6. Tests

- Component tests for critical interactions
- E2E for full user workflow (auth, CRUD)

## App-specific notes

| App | Path | Rendering |
|-----|------|-----------|
| Marketing + Dashboard | `apps/web/` | SSR marketing + client dashboard shell |
| Widget | `apps/widget/` | Minimal bundle size |
| Legacy | `dashboard/` | Current landing (migrate to `apps/marketing`) |

## Checklist

- [ ] No business logic in components
- [ ] Loading/error/empty states
- [ ] Typed API calls
- [ ] Responsive layout
- [ ] Accessible forms
- [ ] Tests for critical paths
