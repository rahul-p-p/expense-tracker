
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// -------------------- VALIDATION HELPERS --------------------

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
        typeof email === 'string' &&
        email.length <= 254 &&
        emailRegex.test(email.trim())
    );
};

const isValidName = (name) => {
    return (
        typeof name === 'string' &&
        name.trim().length >= 2 &&
        name.trim().length <= 50
    );
};

const isValidPassword = (password) => {
    return (
        typeof password === 'string' &&
        password.length >= 6 &&
        Buffer.byteLength(password, 'utf8') <= 72
    );
};

// -------------------- GENERATE JWT --------------------

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        { id: id.toString() },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d',
            algorithm: 'HS256'
        }
    );
};

// -------------------- REGISTER USER --------------------

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (
            name === undefined ||
            email === undefined ||
            password === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        if (!isValidName(name)) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 50 characters'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters and cannot exceed 72 UTF-8 bytes'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if email already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration information'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

// -------------------- LOGIN USER --------------------

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// -------------------- GET LOGGED-IN USER --------------------

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get current user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Could not fetch user'
        });
    }
};

// -------------------- EXPORT CONTROLLERS --------------------

module.exports = {
    registerUser,
    loginUser,
    getMe
};
