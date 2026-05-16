import { Test, TestingModule } from '@nestjs/testing';
import { FallbackService } from '../fallback.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RetryService } from '../retry.service';

describe('FallbackService', () => {
  let service: FallbackService;
  let prisma: { conversation: { update: jest.Mock; findUnique: jest.Mock } };
  let retryService: { executeWithRetry: jest.Mock };

  beforeEach(async () => {
    prisma = {
      conversation: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    retryService = {
      executeWithRetry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackService,
        { provide: PrismaService, useValue: prisma },
        { provide: RetryService, useValue: retryService },
      ],
    }).compile();

    service = module.get<FallbackService>(FallbackService);
  });

  describe('activateManualMode', () => {
    it('cambia modo de conversación a MANUAL', async () => {
      prisma.conversation.update.mockResolvedValue({});

      const result = await service.activateManualMode('conv-uuid');

      expect(result.reply).toContain('no está disponible');
      expect(result.nextQuestion).toBeDefined();
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-uuid' },
        data: { mode: 'MANUAL' },
      });
    });

    it('retorna primer paso del cuestionario guiado', async () => {
      prisma.conversation.update.mockResolvedValue({});

      const result = await service.activateManualMode('conv-uuid');

      expect(result.nextQuestion).toContain('motivo de consulta');
    });
  });

  describe('handleManualResponse', () => {
    it('retorna respuesta válida y siguiente pregunta', () => {
      const result = service.handleManualResponse(
        'conv-uuid',
        'Dolor de cabeza',
      );

      expect(result.valid).toBe(true);
      expect(result.reply).toContain('Dolor de cabeza');
      expect(result.nextQuestion).toBeDefined();
    });

    it('rechaza respuesta vacía', () => {
      const result = service.handleManualResponse('conv-uuid', '');

      expect(result.valid).toBe(false);
      expect(result.reply).toContain('vacía');
    });
  });

  describe('checkRecovery', () => {
    it('retorna true cuando LLM responde OK', async () => {
      retryService.executeWithRetry.mockResolvedValue({ ok: true });

      const result = await service.checkRecovery();

      expect(result).toBe(true);
    });

    it('retorna false cuando LLM sigue fallando', async () => {
      retryService.executeWithRetry.mockResolvedValue({ ok: false });

      const result = await service.checkRecovery();

      expect(result).toBe(false);
    });
  });

  describe('getManualSteps', () => {
    it('retorna pasos del cuestionario en orden', () => {
      const steps = service.getManualSteps();

      expect(steps).toHaveLength(4);
      expect(steps[0].key).toBe('reason');
      expect(steps[1].key).toBe('symptoms');
      expect(steps[2].key).toBe('exam');
      expect(steps[3].key).toBe('diagnosis');
    });
  });

  describe('getRecoveryMessage', () => {
    it('retorna mensaje de recuperación', () => {
      const msg = service.getRecoveryMessage();
      expect(msg).toContain('disponible');
    });
  });
});
