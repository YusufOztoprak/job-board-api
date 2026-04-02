const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

    return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already in use' });
        }

        const user = await User.create({ email, password, role });
        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        res.status(201).json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, role: user.role },
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        res.json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, role: user.role },
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        next(err);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const tokens = generateTokens(user.id, user.role);

        res.json({ success: true, data: tokens });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, refresh };