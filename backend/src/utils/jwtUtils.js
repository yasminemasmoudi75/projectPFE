const jwt = require('jsonwebtoken');

/**
 * Sign a JWT token
 * @param {Object} payload - Data to encode in the token
 * @returns {string} - Signed JWT
 */
const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

/**
 * Sign a Refresh token
 * @param {Object} payload - Data to encode in the token
 * @returns {string} - Signed Refresh JWT
 */
const signRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d' // Usually longer for refresh tokens
    });
};

/**
 * Verify a JWT token
 * @param {string} token - Token to verify
 * @returns {Object} - Decoded payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
    signToken,
    signRefreshToken,
    verifyToken
};
