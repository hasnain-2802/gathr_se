const router = require('express').Router();
const { verifyToken, requireOrganizer } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { getEvent, editEvent } = require('../controllers/eventController');

// GET  /api/v1/events/:id   — fetch a single event (for edit form pre-fill)
router.get('/:id', verifyToken, requireOrganizer, asyncHandler(getEvent));

// PUT  /api/v1/events/:id   — GTR-23: edit event, GTR-24: RSVPs stay intact
router.put('/:id', verifyToken, requireOrganizer, asyncHandler(editEvent));

// Teammates add other event routes here:
// POST   /              — create event (GTR-21)
// PATCH  /:id/cancel    — cancel event
// GET    /              — public event listing / feed

module.exports = router;
