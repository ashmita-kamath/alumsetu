import { z } from "zod";
import { pagination } from "./common.js";

export const CATEGORIES = ["general", "careers", "academics", "placements"];

export const listPostsQuery = z.object({
  category: z.enum(CATEGORIES).optional(),
  search: z.string().trim().max(100).optional(),
  ...pagination,
});

export const createPostSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(10000),
  category: z.enum(CATEGORIES).default("general"),
});

export const updatePostSchema = createPostSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Send at least one field to change" });

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
