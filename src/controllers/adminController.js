const { Job, Application, User } = require('../models');

const getStats = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [activeJobs, inactiveJobs] = await Promise.all([
            Job.count({ where: { userId, is_active: true } }),
            Job.count({ where: { userId, is_active: false } }),
        ]);

        const appInclude = [{
            model: Job,
            as: 'job',
            where: { userId },
            required: true,
            attributes: [],
        }];

        const [total, pending, reviewed, accepted, rejected] = await Promise.all([
            Application.count({ include: appInclude }),
            Application.count({ where: { status: 'pending' }, include: appInclude }),
            Application.count({ where: { status: 'reviewed' }, include: appInclude }),
            Application.count({ where: { status: 'accepted' }, include: appInclude }),
            Application.count({ where: { status: 'rejected' }, include: appInclude }),
        ]);

        res.json({
            success: true,
            data: {
                jobs: {
                    active: activeJobs,
                    inactive: inactiveJobs,
                    total: activeJobs + inactiveJobs,
                },
                applications: {
                    total,
                    byStatus: { pending, reviewed, accepted, rejected },
                },
            },
        });
    } catch (err) {
        next(err);
    }
};

const getMyJobs = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Job.findAndCountAll({
            where: { userId: req.user.userId },
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset,
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

const getMyApplications = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, jobId } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const appWhere = {};
        if (jobId) appWhere.jobId = jobId;

        const { count, rows } = await Application.findAndCountAll({
            where: appWhere,
            include: [
                {
                    model: Job,
                    as: 'job',
                    where: { userId: req.user.userId },
                    required: true,
                },
                {
                    model: User,
                    as: 'candidate',
                    attributes: ['id', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset,
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

module.exports = { getStats, getMyJobs, getMyApplications };
