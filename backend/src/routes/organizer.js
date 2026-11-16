const router = require('express').Router();
const { verifyToken, requireOrganizer } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { listMyEvents } = require('../controllers/organizerController');

// GET /api/v1/organizer/events?status=upcoming|past
router.get('/events', verifyToken, requireOrganizer, asyncHandler(listMyEvents));

module.exports = router;
