import { z } from "zod";
import { optionalText, pagination, positiveInt, year } from "./common.js";
import { EMPLOYMENT_STATUSES } from "./profileSchemas.js";

export const listVerificationsQuery = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  ...pagination,
});

export const reviewVerificationSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    remarks: optionalText(500),
  })
  // A rejected alumnus needs to know what to fix, so a reason is required.
  .refine((d) => d.status === "approved" || d.remarks, {
    path: ["remarks"],
    message: "Give a reason when rejecting, so the alumnus knows what to fix",
  });

export const listUsersQuery = z.object({
  role: z.enum(["student", "alumni", "admin"]).optional(),
  status: z.enum(["pending", "active", "suspended"]).optional(),
  search: z.string().trim().max(100).optional(),
  ...pagination,
});

export const userStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

// Filters for the alumni database (list and CSV export)
const alumniFilters = {
  search: z.string().trim().max(100).optional(),
  institution_id: positiveInt.optional(),
  branch: z.string().trim().max(100).optional(),
  graduation_year: year.optional(),
  employment_status: z.enum([...EMPLOYMENT_STATUSES, "unknown"]).optional(),
  verified: z.enum(["yes", "no"]).optional(),
};

export const listAlumniQuery = z.object({ ...alumniFilters, ...pagination });
export const exportAlumniQuery = z.object(alumniFilters);
