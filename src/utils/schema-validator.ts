import Ajv, { Schema } from 'ajv';

const ajv = new Ajv({ allErrors: true });

export function validateSchema(data: unknown, schema: Schema): void {
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    throw new Error(`Schema validation failed:\n${ajv.errorsText(validate.errors)}`);
  }
}
