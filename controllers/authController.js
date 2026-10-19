const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'default_dev_jwt_secret_key_change_in_prod';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn });
};

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is already registered.'
      });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password
    });

    const token = generateToken(user);

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: 'success',
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
