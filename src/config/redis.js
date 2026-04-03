const Redis = require('ioredis');

const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (process.env.NODE_ENV === 'test') return null;
            return Math.min(times * 50, 2000);
        },
    })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (process.env.NODE_ENV === 'test') return null;
            return Math.min(times * 50, 2000);
        },
    });

redis.on('connect', () => {
    console.log('Connected to Redis successfully');
});

redis.on('error', () => {});

module.exports = redis;