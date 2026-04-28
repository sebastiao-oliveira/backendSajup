require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const membrosRoutes = require('./routes/membros');
const assistidosRoutes = require('./routes/assistidos');
const processosRoutes = require('./routes/processos');
const plantoesRoutes = require('./routes/plantoes');
const presencaRoutes = require('./routes/presenca');
const comissaoRoutes = require('./routes/comissao');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();

// Conectar ao MongoDB
connectDB();

// Middlewares

app.use(cors({
    origin: '*',
    credentials: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de upload estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/membros', membrosRoutes);
app.use('/api/assistidos', assistidosRoutes);
app.use('/api/processos', processosRoutes);
app.use('/api/plantoes', plantoesRoutes);
app.use('/api/presenca', presencaRoutes);
app.use('/api/comissao', comissaoRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handler para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({ message: `Rota ${req.originalUrl} não encontrada.` });
});

// Handler global de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Erro interno no servidor.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor SAJUP rodando na porta ${PORT}`);
    console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 http://localhost:${PORT}/api/health`);
});

module.exports = app;
