const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Membro = require('../models/Membro');
const { protect } = require('../middleware/auth');

// Gerar token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { cpf, email, password } = req.body;

        if ((!cpf && !email) || !password) {
            return res.status(400).json({ message: 'CPF/Email e senha são obrigatórios.' });
        }

        // Busca por CPF ou email
        const query = cpf ? { cpf } : { email };
        const membro = await Membro.findOne(query).select('+password');

        if (!membro || !membro.password) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isPasswordCorrect = await membro.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        if (membro.status === 'Desligado') {
            return res.status(403).json({ message: 'Conta desativada. Entre em contato com o administrador.' });
        }

        const token = generateToken(membro._id);

        res.json({
            token,
            user: {
                id: membro._id,
                name: membro.name,
                email: membro.email,
                cpf: membro.cpf,
                memberType: membro.memberType,
                status: membro.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message });
    }
});

// GET /api/auth/me - Retorna dados do usuário logado
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

// POST /api/auth/recover-password - Solicitar recuperação de senha
router.post('/recover-password', async (req, res) => {
    try {
        const { email } = req.body;
        const membro = await Membro.findOne({ email });

        // Por segurança, sempre retornar sucesso mesmo que email não exista
        if (!membro) {
            return res.json({ message: 'Se o email estiver cadastrado, você receberá as instruções.' });
        }

        // TODO: Implementar envio de email real (nodemailer)
        // Por enquanto, gera um token temporário
        const resetToken = jwt.sign({ id: membro._id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Instruções de recuperação enviadas.',
            // Em produção, remova o token da resposta e envie por email:
            resetToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message });
    }
});

// POST /api/auth/reset-password - Redefinir senha com token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'reset') {
            return res.status(400).json({ message: 'Token inválido.' });
        }

        const membro = await Membro.findById(decoded.id);
        if (!membro) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }

        membro.password = newPassword;
        await membro.save();

        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
});

module.exports = router;
