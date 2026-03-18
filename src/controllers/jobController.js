const { Job } = require('../models');
const redis = require('../config/redis');

const getAllJobs = async (req, res, next) => {
    try {
        console.log('Fetching from database');
        const jobs = await Job.findAll({
            where: { is_active: true },
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: jobs });
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

        await redis.del('cache:/api/v1/jobs');

        res.status(201).json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

const updateJob = async (req, res, next) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        await job.update(req.body);

        await redis.del('cache:/api/v1/jobs');

        res.json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

const deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        await job.update({ is_active: false });

        await redis.del('cache:/api/v1/jobs');

        res.json({ success: true, message: 'Job removed successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob };