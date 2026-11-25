import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((value) => value.split(',').map((origin) => origin.trim())),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Environment = z.infer<typeof environmentSchema>;

/**
 * Used by ConfigModule. Fails application start-up with a readable message
 * when a variable is missing or malformed, instead of failing later at first use.
 */
export function validateEnvironment(rawEnvironment: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(rawEnvironment);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  return result.data;
}
