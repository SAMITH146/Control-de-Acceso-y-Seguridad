const db = require('./db');

(async () => {
    try {
        console.log('--- COLUMNAS VISITANTES ---');
        const [colsV] = await db.execute('SHOW COLUMNS FROM visitantes');
        console.log(colsV.map(c => `${c.Field} (${c.Type})`));

        console.log('--- COLUMNAS BITACORA_VISITAS ---');
        const [colsB] = await db.execute('SHOW COLUMNS FROM bitacora_visitas');
        console.log(colsB.map(c => `${c.Field} (${c.Type})`));

        console.log('--- FILAS EN VISITANTES ---');
        const [vis] = await db.execute('SELECT * FROM visitantes');
        console.log(vis);

        console.log('--- FILAS EN BITACORA_VISITAS ---');
        const [bit] = await db.execute('SELECT * FROM bitacora_visitas');
        console.log(bit);
    } catch (err) {
        console.error('Error inspeccionando BD:', err);
    }
})();
