import { z } from "zod";

// Emails are stored in lowercase so "Asha@X.com" and "asha@x.com" are the same account.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")).pipe(z.string().max(255));

export const registerSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes of a password, so longer ones are refused.
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
  full_name: z.string().trim().min(2, "Full name is required").max(150),
  // Admin accounts cannot sign up; they are created with `npm run create-admin`.
  role: z.enum(["student", "alumni"], { message: "Role must be student or alumni" }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(200),
});
