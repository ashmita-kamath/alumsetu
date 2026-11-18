import { z } from "zod";
import { optionalText, pagination } from "./common.js";

export const EVENT_TYPES = ["meetup", "webinar", "panel", "career_session"];
export const EVENT_MODES = ["online", "offline"];

const futureDate = z.coerce.date().refine((d) => d > new Date(), { message: "Must be in the future" });

export const listEventsQuery = z.object({
  when: z.enum(["upcoming", "past"]).default("upcoming"),
  type: z.enum(EVENT_TYPES).optional(),
  ...pagination,
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: optionalText(5000),
  type: z.enum(EVENT_TYPES),
  mode: z.enum(EVENT_MODES),
  venue_or_link: z.string().trim().min(3).max(500),
  start_time: futureDate,
  capacity: z.coerce.number().int().positive().max(100000).nullish().transform((v) => v ?? null),
});

export const updateEventSchema = createEventSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Send at least one field to change" });
