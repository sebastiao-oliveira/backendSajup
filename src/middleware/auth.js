const jwt = require('jsonwebtoken');
const Membro = require('../models/Membro');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await Membro.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

// Middleware para restringir acesso por tipo de membro
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.memberType)) {
            return res.status(403).json({
                message: 'Você não tem permissão para realizar esta ação.'
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
