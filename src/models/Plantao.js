const mongoose = require('mongoose');

const triunviratoSchema = new mongoose.Schema({
    codigo: { type: String, required: true },
    sajuanos: [{ type: String }],
    monitores: [{ type: String }],
    nome: { type: String }
}, { _id: true });

const plantaoSchema = new mongoose.Schema({
    id: { type: String, required: [true, 'Identificador é obrigatório'], unique: true },
    diaSemana: { type: String, required: [true, 'Dia da semana é obrigatório'] },
    horario: { type: String, required: [true, 'Horário é obrigatório'] },
    coordenador: { type: String, required: [true, 'Coordenador é obrigatório'] },
    triunviratos: [triunviratoSchema],
    status: {
        type: String,
        enum: ['Ativo', 'Inativo'],
        default: 'Ativo'
    }
}, { timestamps: true });

module.exports = mongoose.model('Plantao', plantaoSchema);
