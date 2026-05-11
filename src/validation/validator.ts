import ajvModule, { type ValidateFunction } from "ajv";
import { type TSchema } from "typebox";

// AJV's CJS default export needs .default when imported as ESM
const Ajv = ajvModule.default ?? ajvModule;
const ajv = new Ajv({ allErrors: true });

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
        const prefix = context ? `${context}: ` : "";
        throw new Error(prefix + formatErrors(validate.errors));
      }
      return data as T;
    },
    errors: () => validate.errors,
  };
}
