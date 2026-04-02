const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
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