---
description: Notion progress tracking for Genie/ChatbotMaker. Use when starting, updating, or completing tasks; syncing roadmap progress; or reporting project status from Notion.
---

# Notion Progress Tracking

Sync Genie development progress with Notion. Config: `.cursor/notion.json`.

## Notion workspace

| Resource | URL |
|----------|-----|
| **Engineering Hub** | [Genie Platform — Engineering Hub](https://app.notion.com/p/391d48599a9981739d54d95dca415f29) |
| **Genie Phases** | [Phases database](https://app.notion.com/p/c3aae86d04524ab6aa16a22fdf8e4628) |
| **Genie Tasks** | [Tasks database](https://app.notion.com/p/c782d47d0df049649dca8bf522af3844) |

## When to use

- **Starting work** on a feature → find or create task, set Status to `In progress`
- **Completing work** → set Status to `Done` only when definition of done is met
- **Planning** → create tasks from roadmap with Phase, Priority, Area, Repo Path
- **Status reports** → query Genie Tasks and Genie Phases via Notion MCP
- **Blockers** → add notes to task page content

## MCP tools (server: `plugin-notion-workspace-notion`)

| Action | Tool |
|--------|------|
| Search tasks/phases | `notion-search` |
| Read page/database | `notion-fetch` |
| Create task | `notion-create-pages` (parent: tasks `data_source_id`) |
| Update task status | `notion-update-page` |
| Query tasks | `notion-query-database-view` or `notion-query-data-sources` |

Always read `.cursor/notion.json` for current database IDs.

## Task creation template

```json
{
  "parent": { "data_source_id": "5badeabf-070c-45bc-90c9-ce58758bab1d", "type": "data_source_id" },
  "pages": [{
    "properties": {
      "Task name": "Task title",
      "Status": "Not started",
      "Priority": "P0",
      "Area": "Backend",
      "Repo Path": "apps/api/",
      "Phase": "[\"https://app.notion.com/p/391d48599a9981069208c6d704285815\"]"
    },
    "content": "## Acceptance criteria\n- [ ] ...\n\n## Notes\n"
  }]
}
```

Phase URLs are in `.cursor/notion.json` → `phase_urls`.

## Workflow integration

### On feature start

1. Search Genie Tasks for existing task (avoid duplicates)
2. If missing, create task linked to correct Phase
3. Set Status → `In progress`
4. Reference task URL in implementation plan

### During work

- Add progress notes to task page when significant milestones complete
- Update Phase status if entire phase changes (e.g. Foundation → `In progress`)

### On feature complete

1. Verify definition of done (`.cursor/rules/definition-of-done.mdc`)
2. Set task Status → `Done`
3. If all phase tasks done, set Phase Status → `Done`

### Status report format

```markdown
## Genie Progress — [date]

### Active
- [Task name](url) — In progress — Phase N

### Recently completed
- [Task name](url) — Done

### Up next (P0)
- Task name — Phase N

### Phase summary
| Phase | Status | Progress |
```

## Property reference (Genie Tasks)

| Property | Values |
|----------|--------|
| Status | Not started, In progress, Done, Archived |
| Priority | P0, P1, P2 |
| Area | Backend, Frontend, AI/RAG, Database, DevOps, Docs, Infra |
| Phase | Relation to Genie Phases |
| Repo Path | Code path in monorepo |

## Rules

- Never mark Done without meeting definition of done
- Always link tasks to a Phase
- Prefer updating existing tasks over creating duplicates
- Keep `Docs/05-mvp-roadmap.md` and Notion in sync when scope changes
