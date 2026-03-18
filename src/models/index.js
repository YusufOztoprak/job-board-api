const sequelize = require('../config/database');
const User = require('./User');
const Job = require('./Job');

// One employer can post many jobs
User.hasMany(Job, { foreignKey: 'userId', as: 'jobs' });
Job.belongsTo(User, { foreignKey: 'userId', as: 'employer' });

module.exports = {
    sequelize,
    User,
    Job,
};