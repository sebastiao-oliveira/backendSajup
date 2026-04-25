const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Processo = require('../models/Processo');
const { protect } = require('../middleware/auth');

// Config Multer para upload de documentos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/processos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|doc|docx|jpg|jpeg|png/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) return cb(null, true);
        cb(new Error('Tipo de arquivo não permitido.'));
    }
});

// GET /api/processos
router.get('/', protect, async (req, res) => {
    try {
        const { search, status, assistidoId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (assistidoId) filter.assistidoId = assistidoId;
        if (search) {
            filter.$or = [
                { nome: { $regex: search, $options: 'i' } },
                { numero: { $regex: search, $options: 'i' } }
            ];
        }

        const processos = await Processo.find(filter)
            .populate('assistidoId', 'nome cpf')
            .sort({ createdAt: -1 });
        res.json(processos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar processos.', error: error.message });
    }
});

// GET /api/processos/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const processo = await Processo.findById(req.params.id)
            .populate('assistidoId', 'nome cpf telefone email');
        if (!processo) return res.status(404).json({ message: 'Processo não encontrado.' });
        res.json(processo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar processo.', error: error.message });
    }
});

// POST /api/processos
router.post('/', protect, async (req, res) => {
    try {
        const existente = await Processo.findOne({ numero: req.body.numero });
        if (existente) return res.status(400).json({ message: 'Número de processo já cadastrado.' });

        const processo = await Processo.create(req.body);
        await processo.populate('assistidoId', 'nome cpf');
        res.status(201).json(processo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar processo.', error: error.message });
    }
});

// PUT /api/processos/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const processo = await Processo.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        }).populate('assistidoId', 'nome cpf');
        if (!processo) return res.status(404).json({ message: 'Processo não encontrado.' });
        res.json(processo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar processo.', error: error.message });
    }
});

// DELETE /api/processos/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const processo = await Processo.findByIdAndDelete(req.params.id);
        if (!processo) return res.status(404).json({ message: 'Processo não encontrado.' });
        res.json({ message: 'Processo removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover processo.', error: error.message });
    }
});

// POST /api/processos/:id/documentos - Upload de documento
router.post('/:id/documentos', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

        const processo = await Processo.findById(req.params.id);
        if (!processo) return res.status(404).json({ message: 'Processo não encontrado.' });

        const doc = {
            name: req.body.name || req.file.originalname,
            fileName: req.file.originalname,
            filePath: `/uploads/processos/${req.file.filename}`
        };

        processo.documentos.push(doc);
        await processo.save();

        res.status(201).json(processo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao fazer upload do documento.', error: error.message });
    }
});

// DELETE /api/processos/:id/documentos/:docId
router.delete('/:id/documentos/:docId', protect, async (req, res) => {
    try {
        const processo = await Processo.findById(req.params.id);
        if (!processo) return res.status(404).json({ message: 'Processo não encontrado.' });

        const doc = processo.documentos.id(req.params.docId);
        if (!doc) return res.status(404).json({ message: 'Documento não encontrado.' });

        // Remover arquivo físico
        const filePath = path.join(__dirname, '../..', doc.filePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        processo.documentos.pull(req.params.docId);
        await processo.save();

        res.json({ message: 'Documento removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover documento.', error: error.message });
    }
});

module.exports = router;
