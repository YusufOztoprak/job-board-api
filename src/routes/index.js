const router = require('express').Router();
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const userRoutes = require('./userRoutes');
const authenticate = require('../middleware/authenticate');

router.use('/auth', authRoutes);
router.use('/jobs', authenticate, jobRoutes);
router.use('/users', authenticate, userRoutes);

module.exports = router;
