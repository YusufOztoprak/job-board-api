const router = require('express').Router();
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const userRoutes = require('./userRoutes');
const applicationRoutes = require('./applicationRoutes');
const adminRoutes = require('./adminRoutes');
const authenticate = require('../middleware/authenticate');

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/applications', applicationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
