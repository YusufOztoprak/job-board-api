const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;
const MAX_DB_RETRIES = 10;
const DB_RETRY_DELAY_MS = 3000;

// Bind the port immediately so Railway's health check passes
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Failed to start HTTP server:', err);
    process.exit(1);
});

const connectWithRetry = async (attempt = 1) => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');

        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('Models synchronized with the database');
        }
    } catch (err) {
        console.error(`DB connection attempt ${attempt}/${MAX_DB_RETRIES} failed:`, err.message);

        if (attempt >= MAX_DB_RETRIES) {
            console.error('Could not connect to PostgreSQL after maximum retries. Shutting down.');
            process.exit(1);
        }

        setTimeout(() => connectWithRetry(attempt + 1), DB_RETRY_DELAY_MS);
    }
};

connectWithRetry();
