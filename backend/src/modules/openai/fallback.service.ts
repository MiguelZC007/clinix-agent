import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RetryService } from './retry.service';

export interface ManualStep {
  key: 'reason' | 'symptoms' | 'exam' | 'diagnosis';
  prompt: string;
}

export interface ManualModeResult {
  reply: string;
  nextQuestion?: string;
}

export interface ManualResponseResult {
  valid: boolean;
  reply: string;
  nextQuestion?: string;
}

@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name);

  private readonly manualSteps: ManualStep[] = [
    { key: 'reason', prompt: '¿Cuál es el motivo de consulta del paciente?' },
    { key: 'symptoms', prompt: '¿Cuáles son los síntomas principales?' },
    { key: 'exam', prompt: '¿Cómo está el examen físico?' },
    {
      key: 'diagnosis',
      prompt: '¿Cuál es el diagnóstico o sospecha diagnóstica?',
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
  ) {}

  async activateManualMode(conversationId: string): Promise<ManualModeResult> {
    this.logger.log(
      `Activating MANUAL mode for conversation ${conversationId}`,
    );

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { mode: 'MANUAL' },
    });

    return {
      reply:
        'El asistente IA no está disponible. Podés continuar manualmente. Te voy a ir guiando con preguntas.',
      nextQuestion: this.manualSteps[0].prompt,
    };
  }

  handleManualResponse(
    _conversationId: string,
    response: string,
  ): ManualResponseResult {
    if (!response || response.trim() === '') {
      return {
        valid: false,
        reply: 'Por favor ingresá una respuesta, no puede estar vacía.',
      };
    }

    return {
      valid: true,
      reply: response,
      nextQuestion: this.manualSteps[1].prompt,
    };
  }

  async checkRecovery(): Promise<boolean> {
    try {
      const result = await this.retryService.executeWithRetry(
        async () => Promise.resolve({ status: 'ok' }),
        { maxRetries: 1, timeoutMs: 5000 },
      );
      return result.ok;
    } catch {
      return false;
    }
  }

  getManualSteps(): ManualStep[] {
    return [...this.manualSteps];
  }

  getRecoveryMessage(): string {
    return 'El asistente IA volvió a estar disponible. ¿Querés volver al modo automático?';
  }
}
