import { z } from "zod";
import { optionalText, positiveInt, year } from "./common.js";

const common = {
  full_name: z.string().trim().min(2).max(150).optional(),
  institution_id: positiveInt,
  branch: z.string().trim().min(1).max(100),
  skill_ids: z.array(positiveInt).max(30).optional(),
};

export const studentProfileSchema = z
  .object({
    ...common,
    enrollment_year: year,
    expected_grad_year: year,
    career_goal: optionalText(200),
    bio: optionalText(2000),
  })
  .refine((d) => d.expected_grad_year >= d.enrollment_year, {
    path: ["expected_grad_year"],
    message: "Must be the same as or after the enrollment year",
  });

export const alumniProfileSchema = z.object({
  ...common,
  graduation_year: year,
  current_company: optionalText(150),
  job_title: optionalText(150),
  industry: optionalText(100),
  location: optionalText(100),
  linkedin_url: optionalText(300).refine((v) => v === null || /^https?:\/\//i.test(v), {
    message: "Must start with http:// or https://",
  }),
  available_for_mentoring: z.boolean().default(true),
});
