import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireUser } from "../middleware/currentUser.js";
import { idParam } from "../validators/common.js";
import { listPostsQuery, createPostSchema, updatePostSchema, commentSchema } from "../validators/forumSchemas.js";
import * as forum from "../controllers/forumController.js";

// Mounted at /api, so these are /api/posts... and /api/comments/:id
const router = Router();

router.get("/posts", requireUser, validate({ query: listPostsQuery }), asyncHandler(forum.listPosts));
router.post("/posts", requireUser, validate({ body: createPostSchema }), asyncHandler(forum.createPost));
router.get("/posts/:id", requireUser, validate({ params: idParam }), asyncHandler(forum.getPost));
router.patch("/posts/:id", requireUser, validate({ params: idParam, body: updatePostSchema }), asyncHandler(forum.updatePost));
router.delete("/posts/:id", requireUser, validate({ params: idParam }), asyncHandler(forum.deletePost));
router.post("/posts/:id/comments", requireUser, validate({ params: idParam, body: commentSchema }), asyncHandler(forum.addComment));
router.delete("/comments/:id", requireUser, validate({ params: idParam }), asyncHandler(forum.deleteComment));

export default router;
