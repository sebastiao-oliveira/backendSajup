const mongoose = require('mongoose');

const mensagemSchema = new mongoose.Schema({
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membro' },
    text: { type: String, required: [true, 'Texto da mensagem é obrigatório'] },
    timestamp: { type: Date, default: Date.now }
}, { _id: true });

const comissaoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome da comissão é obrigatório'],
        enum: ['Arquivo', 'Capacitação', 'Certificados', 'Colaboração',
               'Comunicação', 'Estrutura', 'Finanças', 'Formação', 'Software'],
        unique: true
    },
    mensagens: [mensagemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Comissao', comissaoSchema);
