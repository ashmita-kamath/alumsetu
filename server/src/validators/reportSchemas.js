import { z } from "zod";
import { positiveInt, pagination } from "./common.js";

export const createReportSchema = z
  .object({
    post_id: positiveInt.optional(),
    comment_id: positiveInt.optional(),
    reason: z.string().trim().min(3, "Tell us what is wrong").max(200),
  })
  // Exactly one of post_id / comment_id (the database CHECK only needs one).
  .refine((d) => Boolean(d.post_id) !== Boolean(d.comment_id), {
    path: ["post_id"],
    message: "Send either post_id or comment_id",
  });

export const listReportsQuery = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  ...pagination,
});

export const reviewReportSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
