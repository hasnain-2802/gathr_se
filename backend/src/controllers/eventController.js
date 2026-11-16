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
