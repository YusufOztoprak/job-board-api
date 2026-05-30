const { UniqueConstraintError } = require('sequelize');
const { Application, Job, User } = require('../models');

const apply = async (req, res, next) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({ success: false, message: 'Only candidates can apply' });
        }

        const { jobId, cover_letter } = req.body;

        const job = await Job.findByPk(jobId);
        if (!job || !job.is_active) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.userId === req.user.userId) {
            return res.status(400).json({ success: false, message: 'You cannot apply to your own job' });
        }

        const application = await Application.create({
            userId: req.user.userId,
            jobId,
            cover_letter,
        });

        res.status(201).json({ success: true, data: application });
    } catch (err) {
        if (err instanceof UniqueConstraintError) {
            return res.status(409).json({ success: false, message: 'You have already applied to this job' });
        }
        next(err);
    }
};

const getMyApplications = async (req, res, next) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Application.findAndCountAll({
            where: { userId: req.user.userId },
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset,
            include: [{ model: Job, as: 'job' }],
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum),
            },
        });
    } catch (err) {
        next(err);
    }
};

const getJobApplications = async (req, res, next) => {
    try {
        const job = await Job.findByPk(req.params.jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Application.findAndCountAll({
            where: { jobId: req.params.jobId },
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset,
            include: [{ model: User, as: 'candidate', attributes: ['id', 'email'] }],
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum),
            },
        });
    } catch (err) {
        next(err);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const application = await Application.findByPk(req.params.id, {
            include: [{ model: Job, as: 'job' }],
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.job.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        application.status = req.body.status;
        await application.save();

        res.json({ success: true, data: application });
    } catch (err) {
        next(err);
    }
};

const withdraw = async (req, res, next) => {
    try {
        const application = await Application.findByPk(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        await application.destroy();

        res.json({ success: true, message: 'Application withdrawn' });
    } catch (err) {
        next(err);
    }
};

module.exports = { apply, getMyApplications, getJobApplications, updateStatus, withdraw };
