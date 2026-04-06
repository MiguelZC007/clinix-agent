# Rule: ticket-router

Automatically determines which repo(s) to work on based on ticket prefix.

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

Before creating branches, run:
```
Read this file → Match ticket prefix → Know which repos need changes
```

If a ticket affects both repos (rare), create the same branch name in both.
