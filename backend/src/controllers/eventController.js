const { HttpError } = require('../utils/httpError');
const { updateEvent, getEventById, getConfirmedRsvpCount } = require('../services/eventService');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/events/:id
 * Fetch a single event (for the edit form to pre-populate).
 * Any authenticated organizer can fetch any event's data,
 * but only the owner can edit it (enforced in editEvent).
 */
async function getEvent(req, res) {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    throw new HttpError(400, 'Invalid event ID');
  }

  const event = await getEventById(id);
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  // Attach confirmed RSVP count so the edit form can show it
  const rsvpCount = await getConfirmedRsvpCount(id);

  res.json({ data: { ...event, rsvp_count: rsvpCount } });
}

/**
 * PUT /api/v1/events/:id
 * GTR-23: Edit an event (ownership checked in service).
 * GTR-24: RSVPs stay intact because we UPDATE the row, never delete it.
 */
async function editEvent(req, res) {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    throw new HttpError(400, 'Invalid event ID');
  }

  const updated = await updateEvent(id, req.user.id, req.body);
  res.json({ data: updated });
}

module.exports = { getEvent, editEvent };
