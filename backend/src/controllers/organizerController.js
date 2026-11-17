const { HttpError } = require('../utils/httpError');
const { getOrganizerEvents } = require('../services/organizerService');

const VALID_STATUS = ['upcoming', 'past'];

async function listMyEvents(req, res) {
  const { status } = req.query;

  if (status !== undefined && (typeof status !== 'string' || !VALID_STATUS.includes(status))) {
    throw new HttpError(400, "status must be 'upcoming' or 'past'");
  }

  // The organizer id comes from the verified token, never from the request
  const data = await getOrganizerEvents(req.user.id, status);
  res.json({ data });
}

module.exports = { listMyEvents };
