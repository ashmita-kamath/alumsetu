import { z } from "zod";
import { optionalText, pagination } from "./common.js";

export const JOB_TYPES = ["job", "internship", "referral"];

const today = () => new Date().toISOString().slice(0, 10);

export const listJobsQuery = z.object({
  type: z.enum(JOB_TYPES).optional(),
  search: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  include_closed: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  ...pagination,
});

export const createJobSchema = z.object({
  title: z.string().trim().min(2).max(150),
  company: z.string().trim().min(2).max(150),
  type: z.enum(JOB_TYPES),
  location: optionalText(100),
  description: optionalText(5000),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .refine((d) => d >= today(), { message: "Deadline cannot be in the past" })
    .nullish()
    .transform((v) => v ?? null),
});

export const applySchema = z.object({
  resume_url: optionalText(500).refine((v) => v === null || /^https?:\/\//i.test(v), {
    message: "Must start with http:// or https://",
  }),
});

export const applicationStatusSchema = z.object({
  status: z.enum(["shortlisted", "rejected", "selected"]),
});
