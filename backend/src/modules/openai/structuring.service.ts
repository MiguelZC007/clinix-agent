import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type ValidationError, validate } from 'class-validator';
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
import { AnamnesisSemanticValidator } from './semantic-validation';
import type {
  StructureAnamnesisInput,
  StructureAnamnesisResult,
} from './structuring.types';

type SchemaNode = {
  type?: 'object' | 'array' | 'string' | 'number' | 'integer';
  required?: readonly string[];
  additionalProperties?: boolean;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
};

@Injectable()
export class StructuringService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly semanticValidator = new AnamnesisSemanticValidator();

  constructor(model = environment.OPENAI_MODEL) {
    this.model = model;
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

    const schemaValidationErrors = this.validateAgainstSchema(
      parsed,
      ANAMNESIS_SCHEMA as SchemaNode,
    );
    if (schemaValidationErrors.length > 0) {
      return this.fail(
        'STRUCTURE_VALIDATION',
        'SCHEMA_VALIDATION_FAILED',
        'El payload JSON es válido pero no cumple el esquema estructural completo de anamnesis.',
        schemaValidationErrors,
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

      const semanticFailure = this.resolveSemanticViolations(parsed);
      if (semanticFailure) {
        return semanticFailure;
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

    const semanticFailure = this.resolveSemanticViolations(parsed);
    if (semanticFailure) {
      return semanticFailure;
    }

    return { ok: true, data: dto };
  }

  private resolveSemanticViolations(
    payload: Record<string, unknown>,
  ): StructureAnamnesisResult | null {
    const semanticViolations = this.semanticValidator.validate(payload);
    if (semanticViolations.length === 0) {
      return null;
    }

    return this.fail(
      'SEMANTIC_VALIDATION',
      'SEMANTIC_RULES_FAILED',
      'La anamnesis estructurada no cumple reglas semánticas de dominio.',
      Array.from(new Set(semanticViolations.map((item) => item.path))),
      semanticViolations.map(({ path, message }) => ({ path, message })),
    );
  }

  private semanticFailure(errors: ValidationError[]) {
    const details = this.flattenValidationErrors(errors);

    return this.fail(
      'SEMANTIC_VALIDATION',
      'DTO_VALIDATION_FAILED',
      'La anamnesis estructurada no cumple validación semántica de dominio.',
      Array.from(new Set(details.map((item) => item.path))),
      details,
    );
  }

  private flattenValidationErrors(
    errors: ValidationError[],
    parentPath = '',
  ): Array<{ path: string; message: string }> {
    const details: Array<{ path: string; message: string }> = [];

    errors.forEach((error) => {
      const segment = error.property;
      const currentPath = parentPath
        ? /^\d+$/.test(segment)
          ? `${parentPath}[${segment}]`
          : `${parentPath}.${segment}`
        : segment;

      Object.values(error.constraints ?? {}).forEach((message) => {
        details.push({ path: currentPath, message });
      });

      if (error.children?.length) {
        details.push(
          ...this.flattenValidationErrors(error.children, currentPath),
        );
      }
    });

    return details;
  }

  private getNoReferidoPolicyViolations(
    payload: Record<string, unknown>,
  ): string[] {
    const violations = new Set<string>();
    const visit = (
      value: unknown,
      currentPath: string,
      policyPath: string,
    ): void => {
      if (typeof value === 'string') {
        if (
          this.isNoReferidoEquivalent(value) &&
          !isNoReferidoAllowedField(policyPath)
        ) {
          violations.add(currentPath);
        }
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          visit(item, `${currentPath}[${index}]`, policyPath);
        });
        return;
      }

      if (value && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(
          ([key, nested]) => {
            const nextCurrentPath = currentPath ? `${currentPath}.${key}` : key;
            const nextPolicyPath = policyPath ? `${policyPath}.${key}` : key;
            visit(nested, nextCurrentPath, nextPolicyPath);
          },
        );
      }
    };

    Object.entries(payload).forEach(([key, value]) => visit(value, key, key));
    return Array.from(violations);
  }

  private isNoReferidoEquivalent(value: string): boolean {
    const normalized = value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    return (
      normalized === 'noreferido' ||
      normalized === 'nr' ||
      normalized === 'noespecificado'
    );
  }

  private validateAgainstSchema(
    payload: unknown,
    schema: SchemaNode,
    path = '',
  ): string[] {
    const errors: string[] = [];

    if (schema.type === 'object') {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        errors.push(path || '$');
        return errors;
      }

      const value = payload as Record<string, unknown>;
      const properties = schema.properties ?? {};
      const required = schema.required ?? [];

      required.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(value, field)) {
          errors.push(path ? `${path}.${field}` : field);
        }
      });

      if (schema.additionalProperties === false) {
        Object.keys(value).forEach((field) => {
          if (!Object.prototype.hasOwnProperty.call(properties, field)) {
            errors.push(path ? `${path}.${field}` : field);
          }
        });
      }

      Object.entries(properties).forEach(([field, childSchema]) => {
        if (!Object.prototype.hasOwnProperty.call(value, field)) {
          return;
        }
        const childPath = path ? `${path}.${field}` : field;
        errors.push(
          ...this.validateAgainstSchema(value[field], childSchema, childPath),
        );
      });

      return errors;
    }

    if (schema.type === 'array') {
      if (!Array.isArray(payload)) {
        errors.push(path || '$');
        return errors;
      }

      if (
        typeof schema.minItems === 'number' &&
        payload.length < schema.minItems
      ) {
        errors.push(path || '$');
      }

      if (
        typeof schema.maxItems === 'number' &&
        payload.length > schema.maxItems
      ) {
        errors.push(path || '$');
      }

      if (schema.items) {
        payload.forEach((item, index) => {
          errors.push(
            ...this.validateAgainstSchema(
              item,
              schema.items as SchemaNode,
              `${path}[${index}]`,
            ),
          );
        });
      }

      return errors;
    }

    if (schema.type === 'string') {
      if (typeof payload !== 'string') {
        errors.push(path || '$');
        return errors;
      }

      if (
        typeof schema.minLength === 'number' &&
        payload.length < schema.minLength
      ) {
        errors.push(path || '$');
      }

      if (
        typeof schema.maxLength === 'number' &&
        payload.length > schema.maxLength
      ) {
        errors.push(path || '$');
      }
    }

    if (schema.type === 'number' && typeof payload !== 'number') {
      errors.push(path || '$');
    }

    if (schema.type === 'integer' && !Number.isInteger(payload)) {
      errors.push(path || '$');
    }

    return errors;
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
    details?: Array<{ path: string; message: string }>,
  ): StructureAnamnesisResult {
    return {
      ok: false,
      error: {
        category,
        code,
        message,
        ...(fields ? { fields } : {}),
        ...(details ? { details } : {}),
      },
    };
  }
}
