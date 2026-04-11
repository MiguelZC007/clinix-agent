# Rule: ticket-router

Automatically determines which package(s) to work on inside the monorepo based on ticket prefix.

## Routing Table

| Prefix | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| `PAC-` | ✅ | ❌ | Patient CRUD |
| `CIT-` | ✅ | ❌ | Appointments |
| `HC-` | ✅ | ❌ | Clinical histories |
| `OAI-` | ✅ | ❌ | OpenAI integration |
| `TWA-` | ✅ | ❌ | Twilio/WhatsApp |
| `CTX-` | ✅ | ❌ | Conversation context |
| `AUTH-` | ✅ | ❌ | Authentication |
| `DB-` | ✅ | ❌ | Schema/models |
| `ADMIN-1` | ✅ | ❌ | CRUD backend |
| `ADMIN-2` | ✅ | ❌ | Audit backend |
| `ADMIN-3` | ❌ | ✅ | Admin UI |
| `LLM-` | ✅ | ❌ | LLM structuring |
| `PDF-1` | ✅ | ❌ | PDF backend |
| `PDF-2` | ❌ | ✅ | PDF UI |
| `RBAC-1` | ✅ | ❌ | Roles DB |
| `RBAC-2` | ✅ | ❌ | Roles guards |
| `RBAC-3` | ❌ | ✅ | Roles UI |
| `AUDIT-1` | ✅ | ❌ | Audit DB |
| `AUDIT-2` | ✅ | ❌ | Audit middleware |
| `AUDIT-3` | ❌ | ✅ | Audit UI |
| `FALLBACK-` | ✅ | ❌ | LLM recovery |
| `SYNC-1` | ✅ | ❌ | Shared state |
| `SYNC-2` | ✅ | ❌ | Channel detection |
| `SYNC-3` | ❌ | ✅ | Progress UI |
| `FE-` | ❌ | ✅ | Frontend features |
| `DSH-` | ❌ | ✅ | Dashboard |
| `T-` | ✅ | varies | Technical (check desc) |

## Usage

Before creating the ticket branch/worktree, run:
```
Read this file → Match ticket prefix → Know which package(s) need changes
```

If a ticket affects both packages (rare), use ONE branch and ONE worktree at the monorepo root, then work in both `backend/` and `frontend/` as needed.
