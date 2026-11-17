const router = require('express').Router();
const { verifyToken, requireOrganizer } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  getEvent,
  editEvent,
  createEvent,
  listEvents,
} = require('../controllers/eventController');

// GET  /api/v1/events        — discovery feed (any logged-in user)
router.get('/', verifyToken, asyncHandler(listEvents));

// POST /api/v1/events        — create event (organizer only)
router.post('/', verifyToken, requireOrganizer, asyncHandler(createEvent));

// GET  /api/v1/events/:id    — fetch a single event (for edit form pre-fill)
router.get('/:id', verifyToken, requireOrganizer, asyncHandler(getEvent));

// PUT  /api/v1/events/:id    — GTR-23: edit event, GTR-24: RSVPs stay intact
router.put('/:id', verifyToken, requireOrganizer, asyncHandler(editEvent));

module.exports = router;