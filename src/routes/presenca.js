const express = require('express');
const router = express.Router();
const Presenca = require('../models/Presenca');
const { protect } = require('../middleware/auth');

// GET /api/presenca
router.get('/', protect, async (req, res) => {
    try {
        const { date, memberId } = req.query;
        const filter = {};
        if (date) filter.date = date;
        if (memberId) filter.memberId = memberId;

        const presencas = await Presenca.find(filter)
            .populate('memberId', 'name cpf memberType')
            .sort({ date: -1, entryTime: 1 });
        res.json(presencas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar presenças.', error: error.message });
    }
});

// POST /api/presenca
router.post('/', protect, async (req, res) => {
    try {
        const presenca = await Presenca.create(req.body);
        await presenca.populate('memberId', 'name cpf');
        res.status(201).json(presenca);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar presença.', error: error.message });
    }
});

// DELETE /api/presenca/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const presenca = await Presenca.findByIdAndDelete(req.params.id);
        if (!presenca) return res.status(404).json({ message: 'Presença não encontrada.' });
        res.json({ message: 'Presença removida.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover presença.', error: error.message });
    }
});

module.exports = router;
