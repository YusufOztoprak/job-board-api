const app = require('./app');
const { sequelize } = require('./models');

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