import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import OpenAI from 'openai';
import environment from 'src/core/config/environments';
import { CreateClinicHistoryDto } from '../clinic-history/dto/create-clinic-history.dto';
import { CreateClinicHistoryWithoutAppointmentDto } from '../clinic-history/dto/create-clinic-history-without-appointment.dto';
import {
  ANAMNESIS_SCHEMA,
  ANAMNESIS_SCHEMA_ID,
  ANAMNESIS_SCHEMA_VERSION,
  isNoReferidoAllowedField,
} from './anamnesis.schema';
import { assertModelSupportsStructuredOutputs } from './model-capability.registry';
import type {
  StructureAnamnesisInput,
  StructureAnamnesisResult,
} from './structuring.types';

@Injectable()
export class StructuringService {
  private readonly openai: OpenAI;

  constructor(private readonly model = environment.OPENAI_MODEL) {
    this.openai = new OpenAI({ apiKey: environment.OPENAI_API_KEY });
  }

  async structureAnamnesis(
    input: StructureAnamnesisInput,
  ): Promise<StructureAnamnesisResult> {
    try {
      assertModelSupportsStructuredOutputs(this.model);
    } catch (error) {
      return this.fail('MODEL_CAPABILITY', 'MODEL_NOT_SUPPORTED', `${error}`);
    }

    let rawContent: string;
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Estructurá la anamnesis en JSON válido respetando exactamente el schema indicado.',
          },
          { role: 'user', content: input.text },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: ANAMNESIS_SCHEMA_ID,
            schema: ANAMNESIS_SCHEMA,
            strict: true,
          },
        },
      });
      rawContent = response.choices[0]?.message?.content ?? '';
    } catch (error) {
      return this.fail(
        'PROVIDER_RUNTIME',
        'OPENAI_RUNTIME_ERROR',
        `OpenAI runtime error (${ANAMNESIS_SCHEMA_VERSION}): ${String(error)}`,
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      return this.fail(
        'STRUCTURE_VALIDATION',
        'INVALID_JSON_PAYLOAD',
        'El proveedor devolvió un payload no parseable para el esquema de anamnesis.',
      );
    }

    const requiredFields = this.getMissingRequiredFields(parsed);
    if (requiredFields.length > 0) {
      return this.fail(
        'STRUCTURE_VALIDATION',
        'SCHEMA_REQUIRED_FIELDS_MISSING',
        'El payload JSON es válido pero no cumple campos requeridos del esquema de anamnesis.',
        requiredFields,
      );
    }

    const noReferidoViolations = this.getNoReferidoPolicyViolations(parsed);
    if (noReferidoViolations.length > 0) {
      return this.fail(
        'SEMANTIC_VALIDATION',
        'NO_REFERIDO_POLICY_VIOLATION',
        'Se detectó "no referido" en campos obligatorios no permitidos por la policy.',
        noReferidoViolations,
      );
    }

    if (input.mode === 'WITH_APPOINTMENT') {
      const dto = plainToInstance(CreateClinicHistoryDto, {
        ...parsed,
        appointmentId: input.appointmentId,
      });
      const errors = await validate(dto);
      if (errors.length > 0) {
        return this.semanticFailure(errors);
      }
      return { ok: true, data: dto };
    }

    const dto = plainToInstance(CreateClinicHistoryWithoutAppointmentDto, {
      ...parsed,
      patientId: input.patientRef?.patientId,
      specialtyId: input.specialtyRef?.specialtyId,
      patientNumber: input.patientRef?.patientNumber,
      specialtyCode: input.specialtyRef?.specialtyCode,
    });
    const errors = await validate(dto);
    if (errors.length > 0) {
      return this.semanticFailure(errors);
    }
    return { ok: true, data: dto };
  }

  private semanticFailure(errors: Array<{ property: string }>) {
    return this.fail(
      'SEMANTIC_VALIDATION',
      'DTO_VALIDATION_FAILED',
      'La anamnesis estructurada no cumple validación semántica de dominio.',
      Array.from(new Set(errors.map((item) => item.property))),
    );
  }

  private getMissingRequiredFields(payload: Record<string, unknown>): string[] {
    return ANAMNESIS_SCHEMA.required.filter(
      (field) => !Object.prototype.hasOwnProperty.call(payload, field),
    );
  }

  private getNoReferidoPolicyViolations(
    payload: Record<string, unknown>,
  ): string[] {
    const violations: string[] = [];

    const mandatoryTextFields = ['consultationReason', 'treatment'] as const;
    for (const field of mandatoryTextFields) {
      const value = payload[field];
      if (
        typeof value === 'string' &&
        this.isNoReferidoEquivalent(value) &&
        !isNoReferidoAllowedField(field)
      ) {
        violations.push(field);
      }
    }

    const symptoms = payload.symptoms;
    if (Array.isArray(symptoms)) {
      const hasNoReferidoSymptom = symptoms.some(
        (item) =>
          typeof item === 'string' &&
          this.isNoReferidoEquivalent(item) &&
          !isNoReferidoAllowedField('symptoms'),
      );
      if (hasNoReferidoSymptom) {
        violations.push('symptoms');
      }
    }

    return violations;
  }

  private isNoReferidoEquivalent(value: string): boolean {
    const normalized = value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();

    return (
      normalized === 'no referido' ||
      normalized === 'n/r' ||
      normalized === 'nr' ||
      normalized === 'no especificado'
    );
  }

  private fail(
    category:
      | 'MODEL_CAPABILITY'
      | 'STRUCTURE_VALIDATION'
      | 'SEMANTIC_VALIDATION'
      | 'PROVIDER_RUNTIME',
    code: string,
    message: string,
    fields?: string[],
  ): StructureAnamnesisResult {
    return {
      ok: false,
      error: { category, code, message, ...(fields ? { fields } : {}) },
    };
  }
}
