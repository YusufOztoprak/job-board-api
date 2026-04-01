const Joi = require('joi');

const createJobSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    company: Joi.string().min(2).max(100).required(),
    location: Joi.string().max(100),
    salary_min: Joi.number().integer().min(0),
    salary_max: Joi.number().integer().min(Joi.ref('salary_min')),
});

const updateJobSchema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(1000).required(),
    company: Joi.string().min(2).max(100),
    location: Joi.string().max(100),
    salary_min: Joi.number().integer().min(0),
    salary_max: Joi.number().integer().min(Joi.ref('salary_min')),
    is_active: Joi.boolean(),
});

module.exports = {
    createJobSchema,
    updateJobSchema,
};