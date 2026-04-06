# Rule: skill-consistency

When creating or modifying a PROJECT-LEVEL skill, update ALL related files atomically.

## Files to Update

When you create or modify `.opencode/skills/{skill}/SKILL.md`, you MUST also update:

| File | What to update |
|------|----------------|
| `.opencode/skills/{skill}/SKILL.md` | The skill file itself (created/modified) |
| `.atl/skill-registry.md` | Add/update entry with trigger and location |
| `AGENTS.md` | Add/update in Skills table |
| Internal references | Update any `.opencode/` paths within the skill |

## Does NOT Apply To

This rule does **NOT** apply to:
- Global skills (`~/.config/opencode/skills/`)
- User-level skills
- Only PROJECT-LEVEL skills in `.opencode/skills/`

## Checklist

After creating/modifying a project skill:

- [ ] Skill file created/modified in `.opencode/skills/{skill}/SKILL.md`
- [ ] `.atl/skill-registry.md` updated with entry
- [ ] `AGENTS.md` Skills table updated
- [ ] Internal references in skill file correct (`.opencode/rules/...`, `.opencode/skills/...`)

## Example

**Creating `backend-testing` skill:**

1. Create `.opencode/skills/backend-testing/SKILL.md`
2. Add to `.atl/skill-registry.md`:
   ```markdown
   | backend-testing | Writing backend tests (unit/integration/API) | `.opencode/skills/backend-testing/SKILL.md` |
   ```
3. Add to `AGENTS.md` Skills table:
   ```markdown
   | Writing backend tests | backend-testing |
   ```
4. Add rule to `AGENTS.md` Rules table (if corresponding rule exists):
   ```markdown
   | Writing backend tests | backend-testing | `.opencode/rules/backend-testing.md` |
   ```

## Why This Matters

- **Discoverability**: Orchestrator reads `.atl/skill-registry.md` to know what skills exist
- **Auto-loading**: AGENTS.md tells the agent when to load each skill
- **Consistency**: Internal references must point to `.opencode/`, not `.agent/`

## Verification

After updating, verify with:

```bash
# Check for orphaned .agent/ references
grep -rn "\.agent/" --include="*.md" .

# Verify skill-registry has all skills
cat .atl/skill-registry.md | grep -E "^\|"

# Verify AGENTS.md skills table
grep -A 10 "## Skills" AGENTS.md
```