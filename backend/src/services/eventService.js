const supabase = require('../lib/supabase');
const { HttpError } = require('../utils/httpError');

const EVENT_COLUMNS =
  'id, organizer_id, title, description, start_time, end_time, venue, location, capacity, category, status, created_at';

/**
 * Fetch a single event by ID. Returns null if not found.
 */
async function getEventById(eventId) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Count confirmed RSVPs for a given event.
 */
async function getConfirmedRsvpCount(eventId) {
  const { count, error } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  if (error) throw error;
  return count ?? 0;
}

/**
 * GTR-23: Update an event.
 * GTR-24: The UPDATE touches the existing row — RSVPs reference event.id via FK and are never deleted.
 *
 * Business rules:
 *  - 404 if event does not exist
 *  - 403 if the caller is not the organizer who owns the event
 *  - 409 if the event is cancelled (cannot edit a cancelled event)
 *  - 400 if new capacity < current confirmed RSVP count
 *  - Validation mirrors create-event rules (title ≤ 120 chars, end > start, capacity > 0, etc.)
 */
async function updateEvent(eventId, organizerId, updates) {
  // 1. Fetch the existing event
  const event = await getEventById(eventId);
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  // 2. Ownership check
  if (event.organizer_id !== organizerId) {
    throw new HttpError(403, 'You can only edit your own events');
  }

  // 3. Cannot edit a cancelled event
  if (event.status === 'cancelled') {
    throw new HttpError(409, 'Cannot edit a cancelled event');
  }

  // 4. Build the patch — only include fields that were sent
  const patch = {};
  const allowed = ['title', 'description', 'start_time', 'end_time', 'venue', 'location', 'capacity', 'category'];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      patch[field] = updates[field];
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'No valid fields to update');
  }

  // 5. Validate individual fields

  // Title: required string, ≤ 120 characters (matches DB constraint)
  if (patch.title !== undefined) {
    if (typeof patch.title !== 'string' || patch.title.trim().length === 0) {
      throw new HttpError(400, 'Title is required');
    }
    if (patch.title.length > 120) {
      throw new HttpError(400, 'Title must be 120 characters or fewer');
    }
    patch.title = patch.title.trim();
  }

  // Description: required string
  if (patch.description !== undefined) {
    if (typeof patch.description !== 'string' || patch.description.trim().length === 0) {
      throw new HttpError(400, 'Description is required');
    }
    patch.description = patch.description.trim();
  }

  // Venue: required string
  if (patch.venue !== undefined) {
    if (typeof patch.venue !== 'string' || patch.venue.trim().length === 0) {
      throw new HttpError(400, 'Venue is required');
    }
    patch.venue = patch.venue.trim();
  }

  // Location: required string
  if (patch.location !== undefined) {
    if (typeof patch.location !== 'string' || patch.location.trim().length === 0) {
      throw new HttpError(400, 'Location is required');
    }
    patch.location = patch.location.trim();
  }

  // Category: required string
  if (patch.category !== undefined) {
    if (typeof patch.category !== 'string' || patch.category.trim().length === 0) {
      throw new HttpError(400, 'Category is required');
    }
    patch.category = patch.category.trim();
  }

  // Capacity: positive integer
  if (patch.capacity !== undefined) {
    const cap = Number(patch.capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      throw new HttpError(400, 'Capacity must be a positive integer');
    }
    patch.capacity = cap;
  }

  // Dates: must be valid ISO strings
  if (patch.start_time !== undefined) {
    if (isNaN(Date.parse(patch.start_time))) {
      throw new HttpError(400, 'start_time must be a valid date');
    }
  }
  if (patch.end_time !== undefined) {
    if (isNaN(Date.parse(patch.end_time))) {
      throw new HttpError(400, 'end_time must be a valid date');
    }
  }

  // end_time > start_time — use the patched values, falling back to existing
  const finalStart = new Date(patch.start_time ?? event.start_time);
  const finalEnd = new Date(patch.end_time ?? event.end_time);
  if (finalEnd <= finalStart) {
    throw new HttpError(400, 'end_time must be after start_time');
  }

  // 6. Capacity cannot drop below confirmed RSVP count (GTR-24 protection)
  if (patch.capacity !== undefined) {
    const confirmedCount = await getConfirmedRsvpCount(eventId);
    if (patch.capacity < confirmedCount) {
      throw new HttpError(
        400,
        `Capacity cannot be less than the current confirmed RSVP count (${confirmedCount})`
      );
    }
  }

  // 7. Perform the update — this is an UPDATE on the existing row.
  //    RSVPs reference events.id via FK and are untouched (GTR-24).
  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', eventId)
    .select(EVENT_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

module.exports = { getEventById, getConfirmedRsvpCount, updateEvent };
