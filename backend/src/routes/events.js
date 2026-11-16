const express = require('express');
const { requireAuth, requireOrganizer } = require('../middleware/auth');
const { createEvent } = require('../controllers/eventController');

const router = express.Router();

// If Hasnain's GET /events lives in this file, keep it and just add the line below.
router.post('/', requireAuth, requireOrganizer, createEvent);

module.exports = router;
