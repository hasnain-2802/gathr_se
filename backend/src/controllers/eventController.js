const supabase = require('../config/supabase');
const { validateEvent } = require('../validators/eventValidator');

// POST /api/v1/events
exports.createEvent = async (req, res) => {
  const errors = validateEvent(req.body);
  if (errors.length) {
    return res.status(400).json({ code: 400, message: errors.join('; ') });
  }

  const b = req.body;
  const { data, error } = await supabase
    .from('events')
    .insert({
      organizer_id: req.user.id, // from the token, never from the body
      title: b.title.trim(),
      description: b.description.trim(),
      start_time: new Date(b.start_time).toISOString(),
      end_time: new Date(b.end_time).toISOString(),
      venue: b.venue.trim(),
      location: b.location.trim(),
      capacity: b.capacity,
      category: b.category.trim().toLowerCase(),
      status: 'active', // active + future start = shows up in GET /events
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: 'Could not create event' });
  }
  return res.status(201).json({ data });
};

// Upper date limit for the Today / Week / Month filter
function rangeEnd(range) {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (range === 'week') return new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  if (range === 'month') return new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  return null;
}

// GET /api/v1/events  (discovery feed)
// Only active events that start in the future, soonest first.
// Optional filters: ?category=tech  ?location=clifton  ?range=today|week|month
exports.listEvents = async (req, res) => {
  const { category, location, range } = req.query;

  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(100);

  const end = rangeEnd(range);
  if (end) query = query.lte('start_time', end.toISOString());

  if (typeof category === 'string' && category.trim()) {
    query = query.eq('category', category.trim().toLowerCase());
  }

  if (typeof location === 'string' && location.trim()) {
    // escape % and _ so they are matched literally
    const safe = location.trim().replace(/[%_]/g, (c) => `\\${c}`);
    query = query.ilike('location', `%${safe}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: 'Could not load events' });
  }
  return res.status(200).json({ data });
};