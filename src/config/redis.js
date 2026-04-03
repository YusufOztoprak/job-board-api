const Redis = require('ioredis');

const isTest = process.env.NODE_ENV === 'test';

const sharedOptions = {
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (isTest) return null;
        if (times > 5) return null; // give up after 5 retries, don't crash the app
        return Math.min(times * 200, 2000);
    },
};

const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, sharedOptions)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        ...sharedOptions,
    });

redis.on('connect', () => {
    console.log('Connected to Redis successfully');
});

redis.on('error', (err) => {
    console.warn('Redis error (cache disabled):', err.message);
});

module.exports = redis;
