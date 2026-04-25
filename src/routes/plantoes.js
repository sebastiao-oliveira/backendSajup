const express = require('express');
const router = express.Router();
const Plantao = require('../models/Plantao');
const { protect } = require('../middleware/auth');

// GET /api/plantoes
router.get('/', protect, async (req, res) => {
    try {
        const plantoes = await Plantao.find({ status: 'Ativo' }).sort({ diaSemana: 1 });
        res.json(plantoes);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar plantões.', error: error.message });
    }
});

// GET /api/plantoes/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const plantao = await Plantao.findOne({ id: req.params.id });
        if (!plantao) return res.status(404).json({ message: 'Plantão não encontrado.' });
        res.json(plantao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar plantão.', error: error.message });
    }
});

// POST /api/plantoes
router.post('/', protect, async (req, res) => {
    try {
        const existente = await Plantao.findOne({ id: req.body.id });
        if (existente) return res.status(400).json({ message: 'Identificador de plantão já existe.' });

        const plantao = await Plantao.create(req.body);
        res.status(201).json(plantao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar plantão.', error: error.message });
    }
});

// PUT /api/plantoes/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const plantao = await Plantao.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!plantao) return res.status(404).json({ message: 'Plantão não encontrado.' });
        res.json(plantao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar plantão.', error: error.message });
    }
});

// DELETE /api/plantoes/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const plantao = await Plantao.findOneAndUpdate(
            { id: req.params.id },
            { status: 'Inativo' },
            { new: true }
        );
        if (!plantao) return res.status(404).json({ message: 'Plantão não encontrado.' });
        res.json({ message: 'Plantão desativado.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover plantão.', error: error.message });
    }
});

// POST /api/plantoes/:id/triunviratos - Adicionar triunvirato ao plantão
router.post('/:id/triunviratos', protect, async (req, res) => {
    try {
        const plantao = await Plantao.findOne({ id: req.params.id });
        if (!plantao) return res.status(404).json({ message: 'Plantão não encontrado.' });

        plantao.triunviratos.push(req.body);
        await plantao.save();
        res.status(201).json(plantao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar triunvirato.', error: error.message });
    }
});

// PUT /api/plantoes/:id/triunviratos/:triunviratoId
router.put('/:id/triunviratos/:triunviratoId', protect, async (req, res) => {
    try {
        const plantao = await Plantao.findOne({ id: req.params.id });
        if (!plantao) return res.status(404).json({ message: 'Plantão não encontrado.' });

        const triunvirato = plantao.triunviratos.id(req.params.triunviratoId);
        if (!triunvirato) return res.status(404).json({ message: 'Triunvirato não encontrado.' });

        Object.assign(triunvirato, req.body);
        await plantao.save();
        res.json(plantao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar triunvirato.', error: error.message });
    }
});

// DELETE /api/plantoes/:id/triunviratos/:triunviratoId
router.delete('/:id/triunviratos/:triunviratoId', protect, async (req, res) => {
    try {
        const plantao = await Plantao.findOne({ id: req.params.id });
        if (!plantao) return res.status(404).json({ message: 'Plantão não encontrado.' });

        plantao.triunviratos.pull(req.params.triunviratoId);
        await plantao.save();
        res.json({ message: 'Triunvirato removido.', plantao });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover triunvirato.', error: error.message });
    }
});

module.exports = router;
