const router = require('express').Router();
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const authenticate = require('../middleware/authenticate');

router.use('/auth', authRoutes);
router.use('/jobs', authenticate, jobRoutes); // jobs routes are protected and require authentication


module.exports = router;