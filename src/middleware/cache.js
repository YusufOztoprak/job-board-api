const redis = require('../config/redis');

const cache = (ttl) => async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;

    try {
        const cached = await redis.get(key);

        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const originalJson = res.json.bind(res);
        res.json = (data) => {
            redis.setex(key, ttl, JSON.stringify(data));
            return originalJson(data);
        };

        next();
    } catch (err) {
        next();
    }
};

module.exports = cache;