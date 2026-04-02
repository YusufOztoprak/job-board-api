const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
    },
    salary_min: {
        type: DataTypes.INTEGER,
    },
    salary_max: {
        type: DataTypes.INTEGER,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});

module.exports = Job;