require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(express.json());
app.use(globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;