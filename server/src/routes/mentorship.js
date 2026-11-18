import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireUser, allowRoles } from "../middleware/currentUser.js";
import { idParam } from "../validators/common.js";
import { createRequestSchema, listRequestsQuery, updateStatusSchema } from "../validators/mentorshipSchemas.js";
import { createRequest, listRequests, updateStatus } from "../controllers/mentorshipController.js";

const router = Router();

router.use(requireUser, allowRoles("student", "alumni"));
router.post("/", allowRoles("student"), validate({ body: createRequestSchema }), asyncHandler(createRequest));
router.get("/", validate({ query: listRequestsQuery }), asyncHandler(listRequests));
router.patch("/:id", validate({ params: idParam, body: updateStatusSchema }), asyncHandler(updateStatus));

export default router;
