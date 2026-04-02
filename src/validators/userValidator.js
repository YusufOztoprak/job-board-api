const Joi = require('joi');

const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
});

module.exports = { updatePasswordSchema };
