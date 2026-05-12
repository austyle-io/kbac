import ajvModule, { type ValidateFunction } from "ajv";
import { type TSchema } from "typebox";

// AJV's CJS default export needs .default when imported as ESM
const Ajv = ajvModule.default ?? ajvModule;
const ajv = new Ajv();

/**
 * Thrown by `assertValid` when input fails AJV validation. Callers that
 * need to distinguish schema-mismatch failures from other runtime errors
 * should `instanceof`-check this class rather than substring-matching
 * the message.
 */
export class ValidationError extends Error {
  readonly context?: string;
  readonly errors: ValidateFunction["errors"];

  constructor(
    errors: ValidateFunction["errors"],
    context?: string,
  ) {
    const prefix = context ? `${context}: ` : "";
    super(prefix + formatErrors(errors));
    this.name = "ValidationError";
    this.context = context;
    this.errors = errors;
  }
}

export interface Validator<T> {
  validate: (data: unknown) => data is T;
  assertValid: (data: unknown, context?: string) => T;
  errors: () => ValidateFunction["errors"];
}

function formatErrors(errors: ValidateFunction["errors"]): string {
  if (!errors?.length) return "Validation failed";
  return errors.map((e) => `${e.instancePath} ${e.message}`).join("; ");
}

export function createValidator<T>(schema: TSchema): Validator<T> {
  const validate = ajv.compile<T>(schema);
  return {
    validate: (data: unknown): data is T => validate(data) as boolean,
    assertValid: (data: unknown, context?: string): T => {
      if (!validate(data)) {
        throw new ValidationError(validate.errors, context);
      }
      return data as T;
    },
    errors: () => validate.errors,
  };
}
