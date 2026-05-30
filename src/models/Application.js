const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cover_letter: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [10, 2000],
        },
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    jobId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: 'applications',
    indexes: [{ unique: true, fields: ['userId', 'jobId'] }],
});

module.exports = Application;
