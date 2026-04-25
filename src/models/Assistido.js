const mongoose = require('mongoose');

const assistidoSchema = new mongoose.Schema({
    nome: { type: String, required: [true, 'Nome é obrigatório'], trim: true },
    cpf: { type: String, required: [true, 'CPF é obrigatório'], unique: true, trim: true },
    rg: { type: String, trim: true },
    emissor: { type: String, trim: true },
    dataNascimento: { type: String },
    telefone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },

    // Endereço
    cep: { type: String, trim: true },
    rua: { type: String, trim: true },
    numero: { type: String, trim: true },
    bairro: { type: String, trim: true },
    complemento: { type: String, trim: true },

    status: {
        type: String,
        enum: ['Ativo', 'Inativo', 'Arquivado'],
        default: 'Ativo'
    },
    dataEntrada: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model('Assistido', assistidoSchema);
