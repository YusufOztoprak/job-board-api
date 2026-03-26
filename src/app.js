require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(express.json());
app.use(globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');

        await sequelize.sync({ alter: true });
        console.log('Models synchronized with the database');

        app.listen(PORT, () => console.log(`Server is running: http://localhost:${PORT}`));
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

start();