import { z } from "zod";
import { uuid, optionalText } from "./common.js";

export const createRequestSchema = z.object({
  alumni_id: uuid,
  message: optionalText(1000),
});

export const listRequestsQuery = z.object({
  status: z.enum(["pending", "accepted", "declined", "completed"]).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["accepted", "declined", "completed"]),
});
