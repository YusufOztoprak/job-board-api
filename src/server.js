const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');

        await sequelize.sync({ alter: true });
        console.log('Models synchronized with the database');

        // Fixed syntax error, used the correct PORT variable, and bound to "0.0.0.0"
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

start();