const supabase = require('../lib/supabase');

const EVENT_COLUMNS =
  'id, organizer_id, title, description, start_time, end_time, venue, location, capacity, category, status, created_at';

async function getOrganizerEvents(organizerId, status) {
  // One query: this organizer's events plus a count of CONFIRMED rsvps only.
  // The filter on rsvps.status applies to the embedded count, not to the events.
  const { data, error } = await supabase
    .from('events')
    .select(`${EVENT_COLUMNS}, rsvps(count)`)
    .eq('organizer_id', organizerId)
    .eq('rsvps.status', 'confirmed')
    .order('start_time', { ascending: true });

  if (error) throw error;

  const now = Date.now();
  const upcoming = [];
  const past = [];

  for (const row of data) {
    const { rsvps, ...event } = row;
    event.rsvp_count = rsvps && rsvps[0] ? rsvps[0].count : 0;
    // Cancelled events are included and placed by start time (API 3.4)
    if (new Date(event.start_time).getTime() >= now) upcoming.push(event);
    else past.push(event);
  }

  // Upcoming: soonest first (already sorted ascending)
  // Past: most recent first
  past.reverse();

  if (status === 'upcoming') return { upcoming };
  if (status === 'past') return { past };
  return { upcoming, past };
}

module.exports = { getOrganizerEvents };
