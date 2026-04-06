# Rule: backend-testing

Comprehensive testing strategy for NestJS backend with Prisma. Unit + Integration + API testing.

## Testing Pyramid for Backend

```
        /\
       /E2E\      ← Playwright (frontend E2E calls backend)
      /------\
     / Integ \    ← Repository tests with real DB
    /----------\
   /   Unit     \ ← Service tests with mocks
  /--------------\
```

## Test Types

| Type | Location | Purpose | Speed |
|------|----------|---------|-------|
| Unit | `src/**/*.spec.ts` | Test isolated logic | ms |
| Integration | `test/**/*.e2e-spec.ts` | Test DB interactions | seconds |
| API | `test/**/*.e2e-spec.ts` | Test HTTP endpoints | seconds |

## Unit Test Patterns (Jest)

### Service Tests (with mocked dependencies)

```typescript
// src/modules/doctors/doctors.service.spec.ts
describe('DoctorsService', () => {
  let service: DoctorsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLog: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: PrismaService, useValue: mockPrisma() },
        { provide: AuditLogService, useValue: mockAuditLog() },
      ],
    }).compile();

    service = module.get(DoctorsService);
    prisma = module.get(PrismaService);
    auditLog = module.get(AuditLogService);
  });

  describe('create()', () => {
    it('should create doctor with valid data', async () => {
      prisma.doctor.create.mockResolvedValue(mockDoctor);
      const result = await service.create(createDoctorDto);
      expect(result).toEqual(mockDoctor);
    });

    it('should throw ConflictException if email exists', async () => {
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      await expect(service.create(createDoctorDto))
        .rejects.toThrow(ConflictException);
    });
  });
});
```

### Controller Tests (with mocked service)

```typescript
// src/modules/doctors/doctors.controller.spec.ts
describe('DoctorsController', () => {
  let controller: DoctorsController;
  let service: jest.Mocked<DoctorsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [
        { provide: DoctorsService, useValue: mockDoctorsService() },
      ],
    }).compile();

    controller = module.get(DoctorsController);
    service = module.get(DoctorsService);
  });

  describe('POST /doctors', () => {
    it('should return 201 with created doctor', async () => {
      service.create.mockResolvedValue(mockDoctor);
      const result = await controller.create(createDoctorDto);
      expect(result).toEqual(mockDoctor);
    });
  });
});
```

### Guard Tests

```typescript
// src/common/guards/roles.guard.spec.ts
describe('RolesGuard', () => {
  it('should allow access for matching role', () => {
    const context = mockExecutionContext({ user: { role: 'admin' } });
    const guard = new RolesGuard('admin');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access for non-matching role', () => {
    const context = mockExecutionContext({ user: { role: 'doctor' } });
    const guard = new RolesGuard('admin');
    expect(guard.canActivate(context)).toBe(false);
  });
});
```

## Integration Tests (with real DB)

### Repository Tests

```typescript
// test/modules/doctors/doctors.repository.spec.ts
describe('DoctorsRepository (Integration)', () => {
  let repository: DoctorsRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [DoctorsRepository, PrismaService],
    }).compile();

    repository = module.get(DoctorsRepository);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.doctor.deleteMany(); // Clean slate
  });

  it('should create and find doctor', async () => {
    const created = await repository.create(createDoctorDto);
    const found = await repository.findById(created.id);
    expect(found).toEqual(created);
  });
});
```

## API Tests (e2e-spec)

### Endpoint Testing with supertest

```typescript
// test/modules/doctors/doctors.e2e-spec.ts
describe('Doctors API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    prisma = module.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.doctor.deleteMany();
  });

  describe('POST /v1/doctors', () => {
    it('should create doctor', () => {
      return request(app.getHttpServer())
        .post('/v1/doctors')
        .send(createDoctorDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe(createDoctorDto.email);
        });
    });
  });

  describe('GET /v1/doctors', () => {
    it('should return paginated list', async () => {
      await prisma.doctor.createMany({ data: mockDoctors(15) });

      return request(app.getHttpServer())
        .get('/v1/doctors?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(10);
          expect(res.body.total).toBe(15);
        });
    });
  });
});
```

## Test Coverage Requirements

| Metric | Minimum | Critical Paths |
|--------|---------|----------------|
| Lines | 80% | 95% |
| Branches | 75% | 90% |
| Functions | 80% | 95% |
| Statements | 80% | 95% |

### Critical Paths (require 95%)
- Authentication/Authorization
- Data validation/sanitization
- Database operations
- External API calls
- Error handling

## Commands

```bash
# Run all unit tests
cd backend && pnpm test

# Run specific file
pnpm test -- doctors.service.spec.ts

# Run with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e

# Run e2e tests (specific file)
pnpm test:e2e -- doctors.e2e-spec.ts

# Watch mode (development)
pnpm test:watch
```

## Test Structure Conventions

```
backend/
├── src/
│   └── modules/
│       └── doctors/
│           ├── doctors.service.ts
│           ├── doctors.service.spec.ts    ← Unit test (same folder)
│           ├── doctors.controller.ts
│           └── doctors.controller.spec.ts
├── test/
│   └── modules/
│       └── doctors/
│           ├── doctors.repository.spec.ts ← Integration test
│           └── doctors.e2e-spec.ts         ← API test
```

## Mocking Patterns

### Prisma Mock Factory

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
});
```

### Service Mock Factory

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

## TDD Approach

1. **Write failing test first**
2. **Write minimum code to pass**
3. **Refactor**
4. **Repeat**

```bash
# TDD cycle
pnpm test:watch -- --testPathPattern=doctors.service
```

## Verification Checklist

Before marking task complete:
- [ ] All unit tests pass (`pnpm test`)
- [ ] All e2e tests pass (`pnpm test:e2e`)
- [ ] Coverage meets minimum requirements
- [ ] Critical paths have 95%+ coverage
- [ ] No skipped tests (`xit`, `it.skip`)
- [ ] No `only` tests (`it.only`, `fit`)

## Resources

- Jest docs: https://jestjs.io/docs/getting-started
- NestJS testing: https://docs.nestjs.com/fundamentals/testing
- Supertest: https://github.com/visionmedia/supertest