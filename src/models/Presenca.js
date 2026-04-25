const mongoose = require('mongoose');

const presencaSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membro',
        required: [true, 'Membro é obrigatório']
    },
    memberName: { type: String, required: true },
    date: { type: String, required: [true, 'Data é obrigatória'] },
    entryTime: { type: String, required: [true, 'Horário de entrada é obrigatório'] },
    exitTime: { type: String, required: [true, 'Horário de saída é obrigatório'] }
}, { timestamps: true });

module.exports = mongoose.model('Presenca', presencaSchema);
