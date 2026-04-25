const express = require('express');
const router = express.Router();
const Comissao = require('../models/Comissao');
const { protect } = require('../middleware/auth');

const COMISSOES = ['Arquivo', 'Capacitação', 'Certificados', 'Colaboração',
                   'Comunicação', 'Estrutura', 'Finanças', 'Formação', 'Software'];

// GET /api/comissao - Lista todas as comissões (sem mensagens para performance)
router.get('/', protect, async (req, res) => {
    try {
        const comissoes = await Comissao.find().select('-mensagens');
        // Retorna todas, inclusive as que ainda não têm doc no banco
        const resultado = COMISSOES.map(nome => {
            const found = comissoes.find(c => c.nome === nome);
            return found || { nome, mensagens: [] };
        });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar comissões.', error: error.message });
    }
});

// GET /api/comissao/:nome - Buscar comissão com mensagens
router.get('/:nome', protect, async (req, res) => {
    try {
        const nome = decodeURIComponent(req.params.nome);
        let comissao = await Comissao.findOne({ nome });

        if (!comissao) {
            // Cria automaticamente se ainda não existe
            comissao = await Comissao.create({ nome, mensagens: [] });
        }

        res.json(comissao);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar comissão.', error: error.message });
    }
});

// POST /api/comissao/:nome/mensagens - Enviar mensagem
router.post('/:nome/mensagens', protect, async (req, res) => {
    try {
        const nome = decodeURIComponent(req.params.nome);
        let comissao = await Comissao.findOne({ nome });

        if (!comissao) {
            comissao = await Comissao.create({ nome, mensagens: [] });
        }

        const novaMensagem = {
            author: req.user.name,
            authorId: req.user._id,
            text: req.body.text,
            timestamp: new Date()
        };

        comissao.mensagens.push(novaMensagem);
        await comissao.save();

        res.status(201).json(comissao.mensagens[comissao.mensagens.length - 1]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao enviar mensagem.', error: error.message });
    }
});

// DELETE /api/comissao/:nome/mensagens/:msgId
router.delete('/:nome/mensagens/:msgId', protect, async (req, res) => {
    try {
        const nome = decodeURIComponent(req.params.nome);
        const comissao = await Comissao.findOne({ nome });
        if (!comissao) return res.status(404).json({ message: 'Comissão não encontrada.' });

        const msg = comissao.mensagens.id(req.params.msgId);
        if (!msg) return res.status(404).json({ message: 'Mensagem não encontrada.' });

        // Só o autor ou monitor pode deletar
        if (String(msg.authorId) !== String(req.user._id) && req.user.memberType !== 'monitor') {
            return res.status(403).json({ message: 'Sem permissão para deletar esta mensagem.' });
        }

        comissao.mensagens.pull(req.params.msgId);
        await comissao.save();
        res.json({ message: 'Mensagem removida.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover mensagem.', error: error.message });
    }
});

module.exports = router;
