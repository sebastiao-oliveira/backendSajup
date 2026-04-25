const express = require('express');
const router = express.Router();
const Assistido = require('../models/Assistido');
const Processo = require('../models/Processo');
const Membro = require('../models/Membro');
const Plantao = require('../models/Plantao');
const Presenca = require('../models/Presenca');
const { protect } = require('../middleware/auth');

// GET /api/relatorios - Gerar relatório consolidado
router.get('/', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        // Contagem de membros
        const totalMembros = await Membro.countDocuments({ status: 'Ativo' });
        const totalSajuanos = await Membro.countDocuments({ status: 'Ativo', memberType: 'sajuano' });
        const totalMonitores = await Membro.countDocuments({ status: 'Ativo', memberType: 'monitor' });

        // Processos
        const processoFilter = hasDateFilter ? { dataEntrada: dateFilter } : {};
        const processos = await Processo.find(processoFilter);
        const statusProcessos = processos.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});

        // Assistidos com processo aberto
        const assistidosComProcessoAberto = await Processo.distinct('assistidoId', {
            status: 'Em andamento',
            ...(hasDateFilter ? { dataEntrada: dateFilter } : {})
        });

        // Plantões e triunviratos
        const plantoes = await Plantao.find({ status: 'Ativo' });
        const totalTriunviratos = plantoes.reduce((acc, p) => acc + (p.triunviratos?.length || 0), 0);

        // Assistidos
        const assistidoFilter = hasDateFilter ? { dataEntrada: dateFilter } : {};
        const totalAssistidos = await Assistido.countDocuments(assistidoFilter);

        const relatorio = {
            periodo: { startDate, endDate },
            membros: { total: totalMembros, sajuanos: totalSajuanos, monitores: totalMonitores },
            processos: {
                total: processos.length,
                porStatus: statusProcessos,
                assistidosComProcessoAberto: assistidosComProcessoAberto.length
            },
            plantoes: { total: plantoes.length, totalTriunviratos },
            assistidos: { total: totalAssistidos },
            geradoEm: new Date().toISOString()
        };

        res.json(relatorio);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar relatório.', error: error.message });
    }
});

// GET /api/relatorios/csv - Exportar dados como CSV
router.get('/csv', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        const processoFilter = hasDateFilter ? { dataEntrada: dateFilter } : {};
        const processos = await Processo.find(processoFilter).populate('assistidoId', 'nome cpf');

        const rows = [
            ['Relatório SAJU'],
            [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
            [],
            ['Número', 'Nome', 'Assistido', 'CPF Assistido', 'Status', 'Data Entrada'],
            ...processos.map(p => [
                p.numero,
                p.nome,
                p.assistidoId?.nome || '',
                p.assistidoId?.cpf || '',
                p.status,
                p.dataEntrada ? new Date(p.dataEntrada).toLocaleDateString('pt-BR') : ''
            ])
        ];

        const csv = rows.map(r => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio-saju.csv');
        res.send('\uFEFF' + csv); // BOM para UTF-8 no Excel
    } catch (error) {
        res.status(500).json({ message: 'Erro ao exportar CSV.', error: error.message });
    }
});

module.exports = router;
