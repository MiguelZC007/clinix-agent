---
name: backend-testing
description: >
  Comprehensive testing strategy for NestJS backend with Prisma.
  Covers unit tests, integration tests, and API tests using Jest.
  Trigger: When writing tests for backend, needing test coverage, or verifying backend code quality.
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## When to Use

- Writing unit tests for services, controllers, guards
- Writing integration tests for repositories
- Writing API tests for endpoints
- Checking test coverage
- Debugging test failures
- Setting up testing infrastructure

## Testing Pyramid

```
        /\
       /E2E\      ← Playwright (frontend tests call backend)
      /------\
     / Integ \    ← Repository tests (test/**/*.repository.spec.ts)
    /----------\
   /   Unit     \ ← Service/Controller tests (src/**/*.spec.ts)
  /--------------\
```

## Critical Patterns

### 1. Unit Tests (FAST, ms)

Test isolated logic with mocked dependencies.

```typescript
// src/modules/doctors/doctors.service.spec.ts
describe('DoctorsService', () => {
  let service: DoctorsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = mockPrisma();
    service = new DoctorsService(prisma);
  });

  describe('create()', () => {
    it('should create doctor', async () => {
      prisma.doctor.create.mockResolvedValue(mockDoctor);
      const result = await service.create(dto);
      expect(result).toEqual(mockDoctor);
    });

    it('should throw ConflictException if email exists', async () => {
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      await expect(service.create(dto))
        .rejects.toThrow(ConflictException);
    });
  });
});
```

### 2. Integration Tests (SLOW, seconds)

Test DB interactions with real database.

```typescript
// test/modules/doctors/doctors.repository.spec.ts
describe('DoctorsRepository (Integration)', () => {
  let repo: DoctorsRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [DoctorsRepository, PrismaService],
    }).compile();

    repo = module.get(DoctorsRepository);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.doctor.deleteMany(); // Clean slate
  });

  it('should create and find doctor', async () => {
    const created = await repo.create(dto);
    const found = await repo.findById(created.id);
    expect(found).toEqual(created);
  });
});
```

### 3. API Tests (SLOW, seconds)

Test HTTP endpoints with supertest.

```typescript
// test/modules/doctors/doctors.e2e-spec.ts
describe('Doctors API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/doctors', () => {
    it('should return paginated list', () => {
      return request(app.getHttpServer())
        .get('/v1/doctors?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });
});
```

## Test Structure

```
backend/
├── src/
│   └── modules/
│       └── doctors/
│           ├── doctors.service.ts
│           ├── doctors.service.spec.ts    ← Unit test
│           ├── doctors.controller.ts
│           └── doctors.controller.spec.ts
├── test/
│   └── modules/
│       └── doctors/
│           ├── doctors.repository.spec.ts ← Integration
│           └── doctors.e2e-spec.ts         ← API test
```

## Mock Factories

### Prisma Mock

```typescript
// test/utils/mock-prisma.ts
export const mockPrisma = () => ({
  doctor: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma())),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
});
```

### Service Mock

```typescript
// test/utils/mock-service.ts
export const mockDoctorsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});
```

## Commands

```bash
# Run all unit tests
pnpm test

# Run specific file
pnpm test -- doctors.service.spec.ts

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e

# Run single e2e test
pnpm test:e2e -- doctors.e2e-spec.ts

# Debug specific test
node --inspect-brk ./node_modules/.bin/jest --runInBand doctors.service.spec.ts
```

## Coverage Requirements

| Type | Minimum | Critical Paths |
|------|---------|----------------|
| Lines | 80% | 95% |
| Branches | 75% | 90% |
| Functions | 80% | 95% |

### Critical Paths (95% required)
- Authentication/Authorization
- Data validation
- Database operations
- Error handling

## TDD Workflow

1. **Red** → Write failing test
2. **Green** → Write minimum code to pass
3. **Refactor** → Clean up

```bash
# Start TDD cycle
pnpm test:watch -- --testPathPattern=doctors.service
```

## Test Naming Convention

```typescript
describe('ClassName', () => {
  describe('methodName()', () => {
    it('should handle happy path', () => {});
    it('should throw on invalid input', () => {});
    it('should handle edge case X', () => {});
    it('should return Y when Z', () => {});
  });
});
```

## Verification Checklist

Before marking complete:
- [ ] `pnpm test` passes
- [ ] `pnpm test:e2e` passes
- [ ] Coverage meets minimum
- [ ] Critical paths have 95%+
- [ ] No `xit` or `it.only`
- [ ] All edge cases covered

## Resources

- **Rule**: `.opencode/rules/backend-testing.md` ← Full testing patterns
- Jest docs: https://jestjs.io/docs/getting-started
- NestJS testing: https://docs.nestjs.com/fundamentals/testing