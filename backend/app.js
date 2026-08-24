// backend/app.js – Main Express application (modularized)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./db'); // keep db connection available if needed in middleware

const app = express();
const PORT = process.env.PORT || 3000;

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import route modules
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const visitantesRouter = require('./routes/visitantes');
const visitasRouter = require('./routes/visitas');
const areasRouter = require('./routes/areas');
const usuariosRouter = require('./routes/usuarios');
const empleadosRouter = require('./routes/empleados');
const blacklistRouter = require('./routes/blacklist');
const bitacoraRouter = require('./routes/bitacora');
const solicitudesRouter = require('./routes/solicitudes');

// Mount routers – each router defines full path (e.g., /api/login)
app.use('/', authRouter);
app.use('/', dashboardRouter);
app.use('/', visitantesRouter);
app.use('/', visitasRouter);
app.use('/', areasRouter);
app.use('/', usuariosRouter);
app.use('/', empleadosRouter);
app.use('/', blacklistRouter);
app.use('/', bitacoraRouter);
app.use('/', solicitudesRouter);

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('=================================================');
        console.log('🚀 Servidor "La Perla S.A." iniciado con éxito');
        console.log(`💻 Servidor:  http://localhost:${PORT}`);
        console.log('🌐 Porterías: http://<IP_DEL_SERVIDOR>:' + PORT);
        console.log('=================================================');
    });
}

module.exports = app;

