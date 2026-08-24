const db = require('./db');
(async () => {
  try {
    const [colsV] = await db.execute('SHOW COLUMNS FROM visitantes');
    console.log('visitantes cols:', colsV.map(c => c.Field));

    const [colsB] = await db.execute('SHOW COLUMNS FROM bitacora_visitas');
    console.log('bitacora_visitas cols:', colsB.map(c => c.Field));
  } catch (e) {
    console.error(e);
  }
})();
