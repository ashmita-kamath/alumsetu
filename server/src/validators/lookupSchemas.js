import { z } from "zod";
import { optionalText } from "./common.js";

export const institutionSchema = z.object({
  name: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  district: optionalText(100),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
