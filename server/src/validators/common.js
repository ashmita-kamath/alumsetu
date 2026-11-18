// Zod building blocks shared by every validator.
import { z } from "zod";

export const uuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Must be a valid id"
);

export const positiveInt = z.coerce.number().int().positive();

export const idParam = z.object({ id: positiveInt });
export const userIdParam = z.object({ userId: uuid });

// Optional text: trims it, and turns "" into null so the database stores "no value".
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const year = z.coerce.number().int().min(1950).max(new Date().getFullYear() + 10);

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};
