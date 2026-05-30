const sequelize = require('../config/database');
const User = require('./User');
const Job = require('./Job');
const Application = require('./Application');

// One employer can post many jobs
User.hasMany(Job, { foreignKey: 'userId', as: 'jobs' });
Job.belongsTo(User, { foreignKey: 'userId', as: 'employer' });

// Application associations
User.hasMany(Application, { foreignKey: 'userId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });

Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });
Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

module.exports = {
    sequelize,
    User,
    Job,
    Application,
};