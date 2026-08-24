const db = require('./db');
(async () => {
  try {
    const sql = `SELECT id_bitacora, id_visitante, id_empleado_visita, id_area_destino,
                   objetos_ingresados, observaciones, id_escolta_ingreso,
                   fecha_hora_ingreso, fecha_hora_salida, estado_visita
            FROM bitacora_visitas
            ORDER BY fecha_hora_ingreso DESC
            LIMIT 10`;
    const [rows] = await db.execute(sql);
    console.log('Rows fetched:', rows.length);
    console.log(rows);
  } catch (err) {
    console.error('Direct query error:', err);
  }
})();
