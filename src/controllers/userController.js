const { User } = require('../models');

const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'email', 'role', 'createdAt'],
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isValid = await user.validatePassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const bcrypt = require('bcryptjs');
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMe, updatePassword };
