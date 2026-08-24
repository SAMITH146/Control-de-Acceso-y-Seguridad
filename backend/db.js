const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la conexión a MySQL usando variables de entorno (.env)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin_escoltas',
    password: process.env.DB_PASSWORD || 'PERLA80',
    database: process.env.DB_NAME || 'sistema_escoltas',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir pool para usar Promesas (async/await)
const promisePool = pool.promise();

// Probar la conexión al iniciar
promisePool.getConnection()
    .then(connection => {
        console.log(`✅ Conexión exitosa a MySQL (${process.env.DB_NAME || 'sistema_escoltas'})`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL. Revisa tus variables en el archivo .env o que el servicio de MySQL esté encendido.');
        console.error('Detalle:', err.message);
    });

module.exports = promisePool;
