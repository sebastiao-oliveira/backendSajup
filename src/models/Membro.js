const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema para dados de OAB (apenas para monitores)
const oabSchema = new mongoose.Schema({
    number: { type: String },
    state: { type: String, default: 'BA' }
}, { _id: false });

// Schema principal do Membro
const membroSchema = new mongoose.Schema({
    // Tipo de membro no SAJU
    memberType: {
        type: String,
        enum: ['sajuano', 'monitor'],
        required: [true, 'Tipo de membro é obrigatório']
    },

    // Dados pessoais
    name: { type: String, required: [true, 'Nome é obrigatório'], trim: true },
    cpf: {
        type: String,
        required: [true, 'CPF é obrigatório'],
        unique: true,
        trim: true
    },
    rg: { type: String, trim: true },
    sender: { type: String, trim: true }, // Emissor do RG
    born: { type: String }, // Data de nascimento
    skin: { type: String }, // Cor/raça
    gender: { type: String },
    orientationSex: { type: String },

    // Contato
    phone: { type: String, trim: true },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true
    },

    // Dados acadêmicos/profissionais
    institution: { type: String, trim: true },
    type: { type: String }, // Tipo (ex: bolsista, voluntário)
    status: {
        type: String,
        enum: ['Ativo', 'Inativo', 'Desligado'],
        default: 'Ativo'
    },
    oab: { type: oabSchema }, // OAB (apenas para monitores)

    // Endereço
    cep: { type: String, trim: true },
    street: { type: String, trim: true },
    number: { type: String, trim: true },
    neighbor: { type: String, trim: true },
    complement: { type: String, trim: true },

    // Dados do SAJU
    entryDuty: { type: String }, // Horário entrada plantão
    exitDuty: { type: String },  // Horário saída plantão
    entrySaju: { type: String }, // Data de entrada no SAJU
    triunvirate: { type: String }, // Triunvirato ao qual pertence

    // Senha para login (hash)
    password: {
        type: String,
        minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
        select: false // Não retorna a senha nas queries por padrão
    }

}, { timestamps: true });

// Hash da senha antes de salvar
membroSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Método para comparar senha
membroSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Membro', membroSchema);
