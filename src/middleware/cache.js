const redis = require('../config/redis');

const cache = (ttl) => async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    console.log('Cache middleware - key:', key);

    try {
        const cached = await redis.get(key);
        console.log('Cache hit:', !!cached);

        if (cached) {
            console.log('Serving from cache...');
            return res.json(JSON.parse(cached));
        }

        const originalJson = res.json.bind(res);
        res.json = (data) => {
            console.log('Writing to cache - key:', key);
            redis.setex(key, ttl, JSON.stringify(data));
            return originalJson(data);
        };

        next();
    } catch (err) {
        console.error('Cache error:', err);
        next();
    }
};

module.exports = cache;