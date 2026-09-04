import { z } from 'zod';

// Validate and export environment variables
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
});

const parsed = envSchema.safeParse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
}

export const env = {
  API_BASE_URL: parsed.success ? parsed.data.VITE_API_BASE_URL : 'http://localhost:3000/api/v1',
};
