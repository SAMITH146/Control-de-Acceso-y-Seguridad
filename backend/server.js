// server.js – Thin entry point that starts the modular Express app
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================================');
    console.log('🚀 Servidor "La Perla S.A." iniciado con éxito');
    console.log(`💻 Servidor:  http://localhost:${PORT}`);
    console.log('🌐 Porterías: http://<IP_DEL_SERVIDOR>:' + PORT);
    console.log('=================================================');
});
