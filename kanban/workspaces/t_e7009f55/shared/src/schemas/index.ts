/**
 * Barrel export of JSON Schemas + a runtime Ajv validator helper.
 *
 * Server imports { schemas, validateRequest } to validate body / query / params
 * before they reach controllers.
 */

import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

import RegisterRequest from './RegisterRequest.json';
import LoginRequest from './LoginRequest.json';
import RefreshRequest from './RefreshRequest.json';
import CreateSceneRequest from './CreateSceneRequest.json';
import UpdateSceneRequest from './UpdateSceneRequest.json';
import CreateDataSourceRequest from './CreateDataSourceRequest.json';

export const schemas = {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  CreateSceneRequest,
  UpdateSceneRequest,
  CreateDataSourceRequest,
} as const;

export type SchemaName = keyof typeof schemas;

// strict: true would flag the `then` block in CreateDataSourceRequest for not
// re-declaring keys already in the top-level `required`. The schema is
// intentionally idempotent there, so we silence strictRequired specifically.
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false,
  strict: true,
  strictSchema: true,
  strictRequired: false,
});
addFormats(ajv);

const cache = new Map<SchemaName, ValidateFunction>();
for (const [name, schema] of Object.entries(schemas) as [SchemaName, unknown][]) {
  cache.set(name, ajv.compile(schema as object));
}

export interface ValidationFailure {
  ok: false;
  errors: Array<Pick<ErrorObject, 'instancePath' | 'message' | 'keyword' | 'params'>>;
}

export interface ValidationSuccess {
  ok: true;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function validateRequest(name: SchemaName, payload: unknown): ValidationResult {
  const validate = cache.get(name);
  if (!validate) {
    return { ok: false, errors: [{ instancePath: '', message: `unknown schema: ${name}`, keyword: 'schema', params: {} }] };
  }
  const valid = validate(payload);
  if (valid) return { ok: true };
  return {
    ok: false,
    errors: (validate.errors ?? []).map((e) => ({
      instancePath: e.instancePath,
      message: e.message ?? 'invalid',
      keyword: e.keyword,
      params: e.params as Record<string, unknown>,
    })),
  };
}

export {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  CreateSceneRequest,
  UpdateSceneRequest,
  CreateDataSourceRequest,
};