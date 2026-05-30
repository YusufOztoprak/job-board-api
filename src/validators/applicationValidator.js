const Joi = require('joi');

const createApplicationSchema = Joi.object({
    jobId: Joi.string().uuid().required(),
    cover_letter: Joi.string().min(10).max(2000).required(),
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'accepted', 'rejected').required(),
});

module.exports = { createApplicationSchema, updateStatusSchema };
