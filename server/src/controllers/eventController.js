import * as eventService from "../services/eventService.js";

export async function listEvents(req, res) {
  res.json(await eventService.listEvents(req.query));
}

export async function getEvent(req, res) {
  res.json(await eventService.getEvent(req.params.id, req.user));
}

export async function createEvent(req, res) {
  res.status(201).json({ event: await eventService.createEvent(req.user, req.body) });
}

export async function updateEvent(req, res) {
  res.json({ event: await eventService.updateEvent(req.user, req.params.id, req.body) });
}

export async function deleteEvent(req, res) {
  await eventService.deleteEvent(req.user, req.params.id);
  res.status(204).end();
}

export async function register(req, res) {
  await eventService.register(req.user, req.params.id);
  res.status(201).json({ registered: true });
}

export async function unregister(req, res) {
  await eventService.unregister(req.user, req.params.id);
  res.status(204).end();
}

export async function listRegistrations(req, res) {
  res.json(await eventService.listRegistrations(req.user, req.params.id));
}

export async function myRegistrations(req, res) {
  res.json(await eventService.myRegistrations(req.user));
}
