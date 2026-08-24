// backend/controllers/dashboardController.js
const db = require('../db');

exports.getStats = async (req, res) => {
    try {
        const [[{ en_planta }]] = await db.execute(`SELECT COUNT(*) as en_planta FROM bitacora_visitas WHERE estado_visita = 'EN_PLANTA'`);
        const [[{ visitas_hoy }]] = await db.execute(`SELECT COUNT(*) as visitas_hoy FROM bitacora_visitas WHERE DATE(fecha_hora_ingreso) = CURDATE()`);
        const [[{ veto_activos }]] = await db.execute(`SELECT COUNT(*) as veto_activos FROM lista_negra WHERE estado_activo = 1`);
        const [[{ total_visitantes }]] = await db.execute(`SELECT COUNT(*) as total_visitantes FROM visitantes`);

        const [plantaList] = await db.execute(`
            SELECT b.id_visita, v.tipo_documento, v.numero_documento, v.nombre_completo AS visitante, v.eps,
                   a.nombre_area AS area_destino,
                   CONCAT(e.nombres, ' ', e.apellidos) AS empleado_anfitrion,
                   b.fecha_hora_ingreso, b.objetos_ingresados,
                   TIMESTAMPDIFF(MINUTE, b.fecha_hora_ingreso, NOW()) AS minutos_en_planta
            FROM bitacora_visitas b
            INNER JOIN visitantes v ON b.id_visitante = v.id_visitante
            INNER JOIN empleados e ON b.id_empleado_visita = e.id_empleado
            INNER JOIN areas a ON b.id_area_destino = a.id_area
            WHERE b.estado_visita = 'EN_PLANTA'
            ORDER BY b.fecha_hora_ingreso ASC LIMIT 10
        `);

        res.json({
            stats: {
                en_planta,
                visitas_hoy,
                veto_activos,
                total_visitantes
            },
            en_planta,
            visitas_hoy,
            veto_activos,
            total_visitantes,
            plantaList,
            visitantes_en_planta: plantaList
        });
    } catch (err) {
        console.error('Error en dashboardController.getStats:', err);
        res.status(500).json({ error: 'Error cargando datos del dashboard' });
    }
};
