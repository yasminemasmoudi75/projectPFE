const { verifyToken } = require('../utils/jwtUtils');
const { User } = require('../models');

/**
 * Middleware pour protéger les routes (vérification du JWT)
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        console.log('🔒 Auth Check:', req.method, req.originalUrl);

        // 1. Récupérer le token depuis le header Authorization
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.log('⚠️ No token provided');
            return res.status(401).json({
                status: 'error',
                message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
            });
        }

        // 2. Vérifier le token
        let decoded;
        try {
            decoded = verifyToken(token);
            console.log('✅ Token decoded, UserID:', decoded.id);
        } catch (err) {
            console.log('❌ Token verification failed:', err.message);
            return res.status(401).json({
                status: 'error',
                message: 'Token invalide ou expiré'
            });
        }

        // 3. Vérifier si l'utilisateur existe toujours
        const currentUser = await User.findByPk(decoded.id);
        if (!currentUser) {
            console.log('❌ User not found in DB:', decoded.id);
            return res.status(401).json({
                status: 'error',
                message: 'L\'utilisateur détenteur de ce token n\'existe plus'
            });
        }

        // 4. Vérifier si l'utilisateur est toujours actif
        if (!currentUser.IsActive || !currentUser.Enabled) {
            console.log('❌ User is inactive/disabled:', decoded.id);
            return res.status(403).json({
                status: 'error',
                message: 'Votre compte a été désactivé'
            });
        }

        // 5. Autoriser l'accès et stocker l'utilisateur dans l'objet request
        req.user = currentUser;
        console.log('✅ Auth success for:', currentUser.LoginName);
        next();
    } catch (error) {
        console.error('❌ Error in protect middleware:', error);
        next(error);
    }
};

/**
 * Middleware pour restreindre l'accès à certains rôles
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles est un tableau ['Admin', 'Manager']
        // Conversion en minuscules pour comparaison insensible à la casse
        const lowerRoles = roles.map(r => r.toLowerCase());
        const userRole = req.user.UserRole ? req.user.UserRole.toLowerCase() : '';

        if (!lowerRoles.includes(userRole)) {
            return res.status(403).json({
                status: 'error',
                message: 'Vous n\'avez pas la permission d\'effectuer cette action'
            });
        }
        next();
    };
};

