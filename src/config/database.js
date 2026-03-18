const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Username
    process.env.DB_PASSWORD, // Password
    {
        host: process.env.DB_HOST, // Host
        port: process.env.DB_PORT, // Port
        dialect: 'postgres', // Database dialect
        logging: false, // Disable logging; default: console.log
    }
);

module.exports = sequelize;