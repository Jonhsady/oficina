import { z } from 'zod';

const intFromEnv = (fallback: number) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? fallback : value),
    z.coerce.number().int().positive(),
  );

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TTL_SECONDS: intFromEnv(900),
  REFRESH_TTL_SECONDS: intFromEnv(60 * 60 * 24 * 7),
  CORS_ORIGIN: z.preprocess(
    (value) => (value === undefined || value === '' ? 'http://localhost:3001' : value),
    z.string().min(1),
  ),
  PORT: intFromEnv(3000),
  S3_ENDPOINT: z.string().optional().default(''),
  S3_ACCESS_KEY: z.string().optional().default('minio'),
  S3_SECRET_KEY: z.string().optional().default('minio12345'),
  S3_BUCKET: z.string().optional().default('oficina-fotos'),
  S3_REGION: z.string().optional().default('us-east-1'),
  UPLOAD_DIR: z.preprocess(
    (value) => (value === undefined || value === '' ? 'uploads' : value),
    z.string().min(1),
  ),
});

export type Role = 'admin' | 'tecnico';

export type AppConfig = {
  databaseUrl: string;
  accessSecret: string;
  refreshSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  corsOrigin: string;
  port: number;
  uploadDir: string;
  s3: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  } | null;
};

export const CONFIG = Symbol('CONFIG');

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Ambiente inválido: ${fields}`);
  }

  const env = parsed.data;
  const endpoint = env.S3_ENDPOINT.trim();

  return {
    databaseUrl: env.DATABASE_URL,
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSeconds: env.ACCESS_TTL_SECONDS,
    refreshTtlSeconds: env.REFRESH_TTL_SECONDS,
    corsOrigin: env.CORS_ORIGIN,
    port: env.PORT,
    uploadDir: env.UPLOAD_DIR,
    s3: endpoint
      ? {
          endpoint,
          accessKey: env.S3_ACCESS_KEY,
          secretKey: env.S3_SECRET_KEY,
          bucket: env.S3_BUCKET,
          region: env.S3_REGION,
        }
      : null,
  };
}
