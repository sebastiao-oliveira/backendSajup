const express = require('express');
const router = express.Router();
const Membro = require('../models/Membro');
const { protect } = require('../middleware/auth');

// GET /api/membros - Listar todos os membros
router.get('/', protect, async (req, res) => {
    try {
        const { memberType, status, search } = req.query;
        const filter = {};

        if (memberType && memberType !== 'all') filter.memberType = memberType;
        if (status) filter.status = status;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const membros = await Membro.find(filter).select('-password').sort({ name: 1 });
        res.json(membros);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar membros.', error: error.message });
    }
});

// GET /api/membros/:id - Buscar membro por ID ou CPF
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        // Busca por _id (ObjectId) ou por CPF
        const membro = await Membro.findOne({
            $or: [
                { cpf: id },
                ...(id.match(/^[a-fA-F0-9]{24}$/) ? [{ _id: id }] : [])
            ]
        }).select('-password');

        if (!membro) return res.status(404).json({ message: 'Membro não encontrado.' });
        res.json(membro);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar membro.', error: error.message });
    }
});

// POST /api/membros - Criar novo membro
router.post('/', protect, async (req, res) => {
    try {
        const { cpf, email } = req.body;

        const existente = await Membro.findOne({ $or: [{ cpf }, { email }] });
        if (existente) {
            return res.status(400).json({ message: 'CPF ou email já cadastrado.' });
        }

        // Senha padrão = CPF sem formatação (usuário deve trocar depois)
        const senhaInicial = cpf.replace(/\D/g, '');
        const novoMembro = await Membro.create({ ...req.body, password: senhaInicial });

        const membroSemSenha = novoMembro.toObject();
        delete membroSemSenha.password;

        res.status(201).json(membroSemSenha);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'CPF ou email já cadastrado.' });
        }
        res.status(500).json({ message: 'Erro ao criar membro.', error: error.message });
    }
});

// PUT /api/membros/:id - Atualizar membro
router.put('/:id', protect, async (req, res) => {
    try {
        // Não permitir alterar senha por esta rota
        delete req.body.password;

        const membro = await Membro.findOneAndUpdate(
            { $or: [{ _id: req.params.id.match(/^[a-fA-F0-9]{24}$/) ? req.params.id : null }, { cpf: req.params.id }] },
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!membro) return res.status(404).json({ message: 'Membro não encontrado.' });
        res.json(membro);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar membro.', error: error.message });
    }
});

// DELETE /api/membros/:id - Desligar membro (soft delete: status = Desligado)
router.delete('/:id', protect, async (req, res) => {
    try {
        const membro = await Membro.findOneAndUpdate(
            { $or: [{ _id: req.params.id.match(/^[a-fA-F0-9]{24}$/) ? req.params.id : null }, { cpf: req.params.id }] },
            { status: 'Desligado' },
            { new: true }
        ).select('-password');

        if (!membro) return res.status(404).json({ message: 'Membro não encontrado.' });
        res.json({ message: 'Membro desligado com sucesso.', membro });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao desligar membro.', error: error.message });
    }
});

module.exports = router;
