# Rule: test-mandate

Every piece of new or modified code MUST have corresponding tests. No exceptions.

## Core Rule

```
NO test = NO pass = NO commit
```

## What Requires Tests

| Code type | Test type required |
|-----------|-------------------|
| New service method | Unit test with mocked dependencies |
| New controller endpoint | Unit test with mocked service |
| New DTO/validation | Unit test for valid + invalid inputs |
| New guard | Unit test for allow + deny cases |
| New utility function | Unit test for all branches |
| New React component | Unit test for render + interactions |
| New custom hook | Unit test with renderHook |
| New API client function | Unit test with mocked fetch/axios |
| Bug fix | Regression test that reproduces the bug |
| Modified existing code | Update existing tests to match |

## Test Structure (TDD)

```typescript
// Backend: Jest
describe('ServiceName', () => {
  describe('methodName()', () => {
    it('should handle happy path', () => { ... });
    it('should throw on invalid input', () => { ... });
    it('should handle edge case', () => { ... });
  });
});

// Frontend: Vitest
describe('ComponentName', () => {
  it('should render correctly', () => { ... });
  it('should handle user interaction', () => { ... });
  it('should show error state', () => { ... });
});
```

## Minimum Coverage

| Metric | Minimum |
|--------|---------|
| New code coverage | 80% |
| Critical paths (auth, payments) | 95% |
| Edge cases | At least 1 test per branch |

## Verification

Before marking a task complete in sdd-apply:
```bash
# Run ONLY your new tests to verify they pass
pnpm test -- --testPathPattern={your-module}

# Then run ALL tests to verify no regressions
pnpm test
```
