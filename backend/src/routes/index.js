const router = require('express').Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/organizer', require('./organizer'));
router.use('/events', require('./events'));
// Teammates add their routes here, one line each:
// router.use('/auth', require('./auth'));
// router.use('/rsvps', require('./rsvps'));

module.exports = router;
