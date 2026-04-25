const express = require('express');
const router = express.Router();
const Assistido = require('../models/Assistido');
const Processo = require('../models/Processo');
const { protect } = require('../middleware/auth');

// GET /api/assistidos
router.get('/', protect, async (req, res) => {
    try {
        const { search, status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) filter.nome = { $regex: search, $options: 'i' };

        const assistidos = await Assistido.find(filter).sort({ nome: 1 });
        res.json(assistidos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar assistidos.', error: error.message });
    }
});

// GET /api/assistidos/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const assistido = await Assistido.findById(req.params.id);
        if (!assistido) return res.status(404).json({ message: 'Assistido não encontrado.' });
        res.json(assistido);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar assistido.', error: error.message });
    }
});

// POST /api/assistidos
router.post('/', protect, async (req, res) => {
    try {
        const { cpf, nomeProcesso, numeroProcesso, ...assistidoData } = req.body;

        const existente = await Assistido.findOne({ cpf });
        if (existente) return res.status(400).json({ message: 'CPF já cadastrado.' });

        const novoAssistido = await Assistido.create({ cpf, ...assistidoData });

        // Se vier dados de processo, criar junto
        if (nomeProcesso && numeroProcesso) {
            await Processo.create({
                nome: nomeProcesso,
                numero: numeroProcesso,
                assistidoId: novoAssistido._id,
                status: 'Em andamento'
            });
        }

        res.status(201).json(novoAssistido);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'CPF já cadastrado.' });
        res.status(500).json({ message: 'Erro ao criar assistido.', error: error.message });
    }
});

// PUT /api/assistidos/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const assistido = await Assistido.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        });
        if (!assistido) return res.status(404).json({ message: 'Assistido não encontrado.' });
        res.json(assistido);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar assistido.', error: error.message });
    }
});

// DELETE /api/assistidos/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const assistido = await Assistido.findByIdAndUpdate(
            req.params.id,
            { status: 'Arquivado' },
            { new: true }
        );
        if (!assistido) return res.status(404).json({ message: 'Assistido não encontrado.' });
        res.json({ message: 'Assistido arquivado.', assistido });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao arquivar assistido.', error: error.message });
    }
});

module.exports = router;
