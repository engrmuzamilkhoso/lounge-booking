import { z } from 'zod';

const commaSeparatedList = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  CORS_ORIGINS: commaSeparatedList,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  /** Public URL of the website, used for links in emails (e.g. password reset). */
  WEB_URL: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /** When SMTP_HOST is empty, emails are written to the log instead of being sent. */
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  MAIL_FROM: z.string().min(1),
  /** Staff addresses that receive new-booking, inquiry and registration notifications. */
  STAFF_NOTIFICATION_EMAILS: commaSeparatedList,
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
