import { query, withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const EVENT_COLUMNS = `
  e.id, e.title, e.description, e.type, e.mode, e.venue_or_link, e.start_time, e.capacity, e.created_at,
  json_build_object('id', o.id, 'full_name', o.full_name, 'role', o.role) AS organizer,
  (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = e.id) AS registered_count`;

const FROM_EVENTS = "FROM events e JOIN users o ON o.id = e.organizer_id";

export async function listEvents({ when, type, page, limit }) {
  const params = [];
  const conditions = [when === "past" ? "e.start_time < now()" : "e.start_time >= now()"];
  if (type) {
    params.push(type);
    conditions.push(`e.type = $${params.length}`);
  }
  const where = conditions.join(" AND ");
  // Upcoming events: soonest first. Past events: most recent first.
  const order = when === "past" ? "e.start_time DESC" : "e.start_time ASC";

  const total = (await query(`SELECT count(*)::int AS n FROM events e WHERE ${where}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT ${EVENT_COLUMNS} ${FROM_EVENTS} WHERE ${where} ORDER BY ${order}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );
  return { items: rows, page, limit, total };
}

async function findEvent(id) {
  const { rows } = await query(`SELECT ${EVENT_COLUMNS}, e.organizer_id ${FROM_EVENTS} WHERE e.id = $1`, [id]);
  if (!rows[0]) throw new AppError(404, "NOT_FOUND", "Event not found");
  return rows[0];
}

const publicEvent = ({ organizer_id, registered_count, ...event }) => event;

function assertCanManage(user, event) {
  if (event.organizer_id !== user.id && user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the organizer or an admin can change this event");
  }
}

export async function getEvent(id, viewer) {
  const event = await findEvent(id);
  const reg = await query("SELECT 1 FROM event_registrations WHERE event_id = $1 AND user_id = $2", [id, viewer.id]);
  return { event: publicEvent(event), registered_count: event.registered_count, is_registered: reg.rows.length > 0 };
}

export async function createEvent(organizer, data) {
  const { rows } = await query(
    `INSERT INTO events (organizer_id, title, description, type, mode, venue_or_link, start_time, capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [organizer.id, data.title, data.description, data.type, data.mode, data.venue_or_link, data.start_time, data.capacity]
  );
  return publicEvent(await findEvent(rows[0].id));
}

export async function updateEvent(user, id, changes) {
  const event = await findEvent(id);
  assertCanManage(user, event);
  if (changes.capacity != null && changes.capacity < event.registered_count) {
    throw new AppError(409, "CONFLICT", `Capacity cannot be below the ${event.registered_count} people already registered`);
  }
  const fields = Object.keys(changes);
  const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(", "); // field names come from the Zod schema, never from the user
  await query(`UPDATE events SET ${sets} WHERE id = $${fields.length + 1}`, [...fields.map((f) => changes[f]), id]);
  return publicEvent(await findEvent(id));
}

export async function deleteEvent(user, id) {
  assertCanManage(user, await findEvent(id));
  await query("DELETE FROM events WHERE id = $1", [id]); // registrations are deleted by ON DELETE CASCADE
}

// Registration runs in a transaction and locks the event row, so two people cannot
// both take the last seat at the same moment.
export async function register(user, eventId) {
  await withTransaction(async (client) => {
    const { rows } = await client.query("SELECT start_time, capacity FROM events WHERE id = $1 FOR UPDATE", [eventId]);
    const event = rows[0];
    if (!event) throw new AppError(404, "NOT_FOUND", "Event not found");
    if (new Date(event.start_time) < new Date()) throw new AppError(400, "VALIDATION_ERROR", "This event has already started");

    const already = await client.query("SELECT 1 FROM event_registrations WHERE event_id = $1 AND user_id = $2", [eventId, user.id]);
    if (already.rows.length) throw new AppError(409, "CONFLICT", "You are already registered for this event");

    if (event.capacity != null) {
      const count = (await client.query("SELECT count(*)::int AS n FROM event_registrations WHERE event_id = $1", [eventId])).rows[0].n;
      if (count >= event.capacity) throw new AppError(409, "CONFLICT", "This event is full");
    }
    await client.query("INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)", [eventId, user.id]);
  });
}

export async function unregister(user, eventId) {
  const { rowCount } = await query("DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2", [eventId, user.id]);
  if (rowCount === 0) throw new AppError(404, "NOT_FOUND", "You are not registered for this event");
}

export async function listRegistrations(user, eventId) {
  assertCanManage(user, await findEvent(eventId));
  const { rows } = await query(
    `SELECT json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email, 'role', u.role) AS user,
            r.registered_at, r.attended
       FROM event_registrations r JOIN users u ON u.id = r.user_id
      WHERE r.event_id = $1 ORDER BY r.registered_at`,
    [eventId]
  );
  return rows;
}

export async function myRegistrations(user) {
  const { rows } = await query(
    `SELECT ${EVENT_COLUMNS}, r.registered_at ${FROM_EVENTS}
       JOIN event_registrations r ON r.event_id = e.id
      WHERE r.user_id = $1 ORDER BY e.start_time ASC`,
    [user.id]
  );
  return rows;
}
