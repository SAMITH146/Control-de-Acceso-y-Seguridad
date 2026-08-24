const db = require('./db');
(async () => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM bitacora_visitas');
    console.log('Bitacora rows count:', rows[0].cnt);
  } catch (err) {
    console.error('Error querying bitacora:', err);
  }
})();
