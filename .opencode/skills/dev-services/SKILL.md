---
name: dev-services
description: >
  Start, stop, and manage backend + frontend dev servers for clinix-agent.
  Trigger: When needing to start/stop dev services, run integration tests, or test E2E flows.
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## When to Use

- Starting backend + frontend for integration/E2E testing
- Running TestSprite or Playwright tests
- Verifying changes work end-to-end
- Stopping services after tests complete

## Architecture

| Service | Port | Tech | Command |
|---------|------|------|---------|
| Backend | 4300 | NestJS + Prisma | `pnpm dev` in `backend/` |
| Frontend | 4301 | Next.js 15 | `pnpm dev` in `frontend/` |

## Critical Patterns

### Start Services (parallel)

```bash
# Backend (port 4300)
cd backend && pnpm dev &

# Frontend (port 4301) 
cd frontend && pnpm dev &
```

### Verify Services Running

```bash
# Check backend
curl -s http://localhost:4300/v1/health | head -5

# Check frontend
curl -s http://localhost:4301 | head -5
```

### Stop Services

```bash
# Kill by port
kill $(lsof -t -i:4300) 2>/dev/null
kill $(lsof -t -i:4301) 2>/dev/null

# Or kill all node processes (nuclear option)
pkill -f "next dev" 2>/dev/null
pkill -f "nest start --watch" 2>/dev/null
```

## Environment Variables

| Variable | Backend | Frontend |
|----------|---------|----------|
| PORT | 4300 | 4301 |
| DATABASE_URL | postgresql://postgres:root@localhost:4001/dbclinix | - |
| NEXT_PUBLIC_API_URL | - | http://localhost:4300/v1 |
| NEXTAUTH_URL | - | http://localhost:4301 |

## Health Check Endpoints

| Service | Endpoint | Expected |
|---------|----------|----------|
| Backend | GET /v1/health | 200 OK |
| Frontend | GET / | 200 OK |

## Commands Quick Reference

```bash
# Start both
cd backend && pnpm dev &
cd frontend && pnpm dev &

# Wait for startup (10-15 seconds)
sleep 15

# Verify both
curl -s http://localhost:4300/v1/health
curl -s http://localhost:4301

# Stop both
pkill -f "next dev" 2>/dev/null
pkill -f "nest start --watch" 2>/dev/null
```

## TestSprite Integration

When running TestSprite tests:
1. Start services using this skill
2. Run TestSprite bootstrap with `localPort: 4301`
3. Execute tests
4. Stop services using this skill

## Resources

- Backend env: `backend/.env`
- Frontend env: `frontend/.env.local`
