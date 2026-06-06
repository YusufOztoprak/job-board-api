const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: () => isTest,
    message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skip: () => isTest,
    message: { success: false, message: 'Too many auth attempts, please try again later' },
});

module.exports = { globalLimiter, authLimiter };