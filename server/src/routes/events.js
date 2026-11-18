import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireUser, allowRoles, requireVerifiedAlumni } from "../middleware/currentUser.js";
import { idParam } from "../validators/common.js";
import { listEventsQuery, createEventSchema, updateEventSchema } from "../validators/eventSchemas.js";
import * as events from "../controllers/eventController.js";

// Mounted at /api, so these are /api/events... and /api/me/registrations
const router = Router();
const id = validate({ params: idParam });

router.get("/events", requireUser, validate({ query: listEventsQuery }), asyncHandler(events.listEvents));
router.post("/events", requireUser, requireVerifiedAlumni({ adminsToo: true }), validate({ body: createEventSchema }), asyncHandler(events.createEvent));
router.get("/events/:id", requireUser, id, asyncHandler(events.getEvent));
router.patch("/events/:id", requireUser, validate({ params: idParam, body: updateEventSchema }), asyncHandler(events.updateEvent));
router.delete("/events/:id", requireUser, id, asyncHandler(events.deleteEvent));
router.post("/events/:id/register", requireUser, allowRoles("student", "alumni"), id, asyncHandler(events.register));
router.delete("/events/:id/register", requireUser, id, asyncHandler(events.unregister));
router.get("/events/:id/registrations", requireUser, id, asyncHandler(events.listRegistrations));
router.get("/me/registrations", requireUser, asyncHandler(events.myRegistrations));

export default router;
