# MCP Servers — Genie Platform

Portable MCP configuration for **Cursor**, **Claude Code**, **Windsurf**, and other MCP-compatible IDEs.

**Never commit real API keys.** Use environment variables.

---

## Active servers

| Server | Purpose | Auth |
|--------|---------|------|
| **supabase** | Database, migrations, storage, docs, debugging | OAuth (authenticate in IDE) |
| **stitch** | Google Stitch — UI/design generation | `STITCH_API_KEY` env var |

---

## 1. Environment variables

Add to your **user/system environment** (not git):

### Windows (PowerShell — permanent)

```powershell
[System.Environment]::SetEnvironmentVariable("STITCH_API_KEY", "your-stitch-api-key-here", "User")
```

Restart Cursor after setting.

### macOS / Linux

```bash
# Add to ~/.zshrc or ~/.bashrc
export STITCH_API_KEY="your-stitch-api-key-here"
```

### Verify

```powershell
echo $env:STITCH_API_KEY   # Windows PowerShell
```

---

## 2. Cursor (this repo)

**Config file:** `.cursor/mcp.json` (committed — uses `${env:STITCH_API_KEY}`)

**Setup:**
1. Set `STITCH_API_KEY` in your OS environment (see above)
2. Restart Cursor
3. **Settings → Tools & MCP** → verify `supabase` and `stitch` show as connected
4. For **Supabase**: click **Authenticate** and complete browser OAuth

**Template (no secrets):** `docs/development/mcp.servers.example.json`

---

## 3. Claude Code (CLI)

```bash
# Supabase
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=rocxcjxaqceqndkymujl&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cbranching%2Cfunctions%2Cstorage"

# Stitch (use env var — do not paste key in command history)
export STITCH_API_KEY="your-key"
claude mcp add --scope project --transport http stitch \
  "https://stitch.googleapis.com/mcp" \
  --header "X-Goog-Api-Key: $STITCH_API_KEY"

# Authenticate Supabase
claude /mcp
```

---

## 4. Generic MCP config (any IDE)

Copy `docs/development/mcp.servers.example.json` and replace:

| Placeholder | Your value |
|-------------|------------|
| `YOUR_PROJECT_REF` | `rocxcjxaqceqndkymujl` |
| `STITCH_API_KEY` | Set in OS environment (not in JSON) |

### Full JSON reference

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=rocxcjxaqceqndkymujl&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cbranching%2Cfunctions%2Cstorage"
    },
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "${env:STITCH_API_KEY}"
      }
    }
  }
}
```

---

## 5. Supabase project

| Field | Value |
|-------|--------|
| Project name | chatbotmaker |
| Project ref | `rocxcjxaqceqndkymujl` |
| Region | ap-south-1 |
| Dashboard | https://supabase.com/dashboard/project/rocxcjxaqceqndkymujl |

---

## 6. Stitch (Google)

| Field | Value |
|-------|--------|
| MCP URL | `https://stitch.googleapis.com/mcp` |
| Header | `X-Goog-Api-Key: <your key>` |
| Env var | `STITCH_API_KEY` |

Get or rotate keys in [Google AI Studio](https://aistudio.google.com/) / Google Cloud console (depending on your Stitch setup).

---

## 7. Optional: Supabase agent skills

Installed in this repo via:

```bash
npx skills add supabase/agent-skills
```

Location: `.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/`

---

## 8. Security rules

- **Do not** commit API keys to git
- **Do not** paste keys in chat, PRs, or screenshots
- If a key is exposed, **rotate it immediately**
- `STITCH_API_KEY` is user-level only — each developer sets their own
- Supabase `service_role` key stays on Railway/API only — never in MCP or frontend

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| Stitch MCP not connected | Set `STITCH_API_KEY`, restart IDE |
| Supabase MCP needs auth | Settings → MCP → Authenticate |
| `${env:STITCH_API_KEY}` not resolved | IDE may not expand env vars — set key in IDE MCP UI headers instead |
| MCP tools not showing | Restart IDE after editing `mcp.json` |

---

## 10. When switching IDE

1. Copy JSON from section 4 or `mcp.servers.example.json`
2. Set `STITCH_API_KEY` in OS environment (same key works everywhere)
3. Re-authenticate Supabase OAuth in the new IDE
4. Install Supabase skills if the new IDE supports them: `npx skills add supabase/agent-skills`
