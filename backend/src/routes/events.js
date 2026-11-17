const express = require('express');
const { requireAuth, requireOrganizer } = require('../middleware/auth');
const { createEvent, listEvents } = require('../controllers/eventController');

const router = express.Router();

// Discovery feed: any logged-in user can browse events.
router.get('/', requireAuth, listEvents);

router.post('/', requireAuth, requireOrganizer, createEvent);

module.exports = router;