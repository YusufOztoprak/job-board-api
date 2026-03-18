const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors.map(e => e.message),
        });
    }

    // Sequelize unique constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            message: 'This resource already exists',
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server error',
    });
};

module.exports = errorHandler;