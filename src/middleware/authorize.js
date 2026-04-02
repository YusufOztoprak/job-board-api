const { Job } = require('../models');

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
};

const requireOwnership = async (req, res, next) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        if (job.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        req.job = job;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { requireRole, requireOwnership };
