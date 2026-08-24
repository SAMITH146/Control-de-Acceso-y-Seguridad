// backend/controllers/bitacoraController.js
const db = require('../db');

exports.getBitacora = async (req, res) => {
    const { desde, hasta, estado, buscar, limit = 5000, offset = 0 } = req.query;

    try {
        const conditions = [];
        const params = [];

        if (desde && desde.trim()) {
            conditions.push('b.fecha_hora_ingreso >= ?');
            params.push(`${desde.trim()} 00:00:00`);
        }
        if (hasta && hasta.trim()) {
            conditions.push('b.fecha_hora_ingreso <= ?');
            params.push(`${hasta.trim()} 23:59:59`);
        }
        if (estado && estado.trim()) {
            conditions.push('b.estado_visita = ?');
            params.push(estado.trim());
        }
        if (buscar && buscar.trim()) {
            const term = `%${buscar.trim()}%`;
            conditions.push(`(
                v.nombre_completo LIKE ? OR 
                v.numero_documento LIKE ? OR 
                CONCAT(e.nombres, ' ', e.apellidos) LIKE ? OR 
                a.nombre_area LIKE ?
            )`);
            params.push(term, term, term, term);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const lim = Math.max(1, parseInt(limit, 10) || 5000);
        const off = Math.max(0, parseInt(offset, 10) || 0);

        const sql = `
            SELECT 
                b.id_visita,
                b.fecha_hora_ingreso,
                b.fecha_hora_salida,
                b.estado_visita,
                b.objetos_ingresados,
                b.observaciones,
                v.nombre_completo AS visitante,
                v.tipo_documento,
                v.numero_documento,
                a.nombre_area AS area_destino,
                CONCAT(e.nombres, ' ', e.apellidos) AS empleado_anfitrion,
                u_in.username AS escolta_ingreso,
                u_out.username AS escolta_salida
            FROM bitacora_visitas b
            INNER JOIN visitantes v ON b.id_visitante = v.id_visitante
            INNER JOIN empleados e ON b.id_empleado_visita = e.id_empleado
            INNER JOIN areas a ON b.id_area_destino = a.id_area
            LEFT JOIN usuarios u_in ON b.id_escolta_ingreso = u_in.id_usuario
            LEFT JOIN usuarios u_out ON b.id_escolta_salida = u_out.id_usuario
            ${whereClause}
            ORDER BY b.fecha_hora_ingreso DESC
            LIMIT ${lim} OFFSET ${off}
        `;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Error en bitacoraController.getBitacora:', err);
        res.status(500).json({ error: 'Error cargando bitácora: ' + err.message });
    }
};
