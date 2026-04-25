const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const processoSchema = new mongoose.Schema({
    nome: { type: String, required: [true, 'Nome do processo é obrigatório'], trim: true },
    numero: { type: String, required: [true, 'Número do processo é obrigatório'], trim: true, unique: true },
    assistidoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistido',
        required: [true, 'Assistido é obrigatório']
    },
    status: {
        type: String,
        enum: ['Em andamento', 'Concluído', 'Arquivado', 'Suspenso'],
        default: 'Em andamento'
    },
    documentos: [documentoSchema],
    observacoes: { type: String },
    dataEntrada: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model('Processo', processoSchema);
