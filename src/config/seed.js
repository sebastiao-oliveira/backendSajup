require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./database');
const Membro = require('../models/Membro');
const Comissao = require('../models/Comissao');

const COMISSOES = ['Arquivo', 'Capacitação', 'Certificados', 'Colaboração',
                   'Comunicação', 'Estrutura', 'Finanças', 'Formação', 'Software'];

const seed = async () => {
    await connectDB();
    console.log('🌱 Iniciando seed do banco de dados...\n');

    try {
        // Criar comissões base
        console.log('📋 Criando comissões...');
        for (const nome of COMISSOES) {
            await Comissao.findOneAndUpdate({ nome }, { nome }, { upsert: true });
        }
        console.log(`   ✅ ${COMISSOES.length} comissões criadas.\n`);

        // Criar membro administrador padrão
        console.log('👤 Criando membro administrador padrão...');
        const adminExistente = await Membro.findOne({ cpf: '000.000.000-00' });

        if (!adminExistente) {
            await Membro.create({
                memberType: 'monitor',
                name: 'Administrador SAJU',
                cpf: '000.000.000-00',
                email: 'admin@saju.com',
                phone: '(00) 00000-0000',
                status: 'Ativo',
                password: 'saju@2024',
                institution: 'SAJU',
                entrySaju: new Date().toISOString().split('T')[0]
            });
            console.log('   ✅ Administrador criado.');
            console.log('   📧 Email: admin@saju.com');
            console.log('   🔑 Senha: saju@2024');
            console.log('   ⚠️  TROQUE A SENHA após o primeiro login!\n');
        } else {
            console.log('   ℹ️  Administrador já existe.\n');
        }

        console.log('✅ Seed concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante seed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();
