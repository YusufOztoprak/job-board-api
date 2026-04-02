const { Op } = require('sequelize');
const { Job } = require('../models');
const redis = require('../config/redis');

const clearJobsCache = async () => {
    const keys = await redis.keys('cache:/api/v1/jobs*');
    if (keys.length > 0) await redis.del(...keys);
};

const getAllJobs = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, title, company, location, salary_min, salary_max } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const where = { is_active: true };
        if (title) where.title = { [Op.iLike]: `%${title}%` };
        if (company) where.company = { [Op.iLike]: `%${company}%` };
        if (location) where.location = { [Op.iLike]: `%${location}%` };
        if (salary_min) where.salary_min = { [Op.gte]: parseInt(salary_min) };
        if (salary_max) where.salary_max = { [Op.lte]: parseInt(salary_max) };

        const { count, rows } = await Job.findAndCountAll({
            where,
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

const getJobById = async (req, res, next) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        res.json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

const createJob = async (req, res, next) => {
    try {
        const { title, description, company, location, salary_min, salary_max } = req.body;
        const job = await Job.create({
            title,
            description,
            company,
            location,
            salary_min,
            salary_max,
            userId: req.user.userId,
        });

        clearJobsCache().catch(() => {});

        res.status(201).json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

const updateJob = async (req, res, next) => {
    try {
        await req.job.update(req.body);
        clearJobsCache().catch(() => {});
        res.json({ success: true, data: req.job });
    } catch (err) {
        next(err);
    }
};

const deleteJob = async (req, res, next) => {
    try {
        await req.job.update({ is_active: false });
        clearJobsCache().catch(() => {});
        res.json({ success: true, message: 'Job removed successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob };
