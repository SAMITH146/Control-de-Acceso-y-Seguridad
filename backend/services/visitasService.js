// =============================================================================
// SERVICIO: VISITAS — LA PERLA S.A.
// Logica de base de datos para registro de entradas y salidas.
// =============================================================================
const db = require('../db');

/**
 * Registra el ingreso de un visitante (transaccion completa).
 * @param {Object} datos - Datos del visitante y la visita
 * @param {number} idEscolta - ID del usuario que registra
 * @returns {Promise<{id_visita: number}>}
 */
exports.registrarIngreso = async (datos, idEscolta) => {
    const {
        id_visitante_existente, tipo_documento, numero_documento,
        nombre_completo, telefono, eps,
        id_area_destino, id_empleado_visita, objetos_ingresados, observaciones
    } = datos;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let id_visitante = id_visitante_existente;

        if (!id_visitante && numero_documento) {
            const [vis] = await connection.execute(
                `SELECT id_visitante FROM visitantes WHERE numero_documento = ?`,
                [numero_documento.toString().trim()]
            );
            if (vis.length > 0) id_visitante = vis[0].id_visitante;
        }

        if (!id_visitante) {
            const [result] = await connection.execute(
                `INSERT INTO visitantes (tipo_documento, numero_documento, nombre_completo, telefono, eps, estado_activo) VALUES (?, ?, ?, ?, ?, 1)`,
                [tipo_documento, numero_documento.toString().trim(), nombre_completo, telefono || null, eps]
            );
            id_visitante = result.insertId;
        } else {
            await connection.execute(
                `UPDATE visitantes SET tipo_documento = ?, nombre_completo = ?, telefono = ?, eps = ?, estado_activo = 1 WHERE id_visitante = ?`,
                [tipo_documento, nombre_completo, telefono || null, eps, id_visitante]
            );
        }

        const [veto] = await connection.execute(
            `SELECT motivo_bloqueo FROM lista_negra WHERE id_visitante = ? AND estado_activo = 1`,
            [id_visitante]
        );
        if (veto.length > 0) {
            await connection.rollback();
            const err = new Error(`ACCESO DENEGADO: El visitante tiene un veto activo. Motivo: ${veto[0].motivo_bloqueo}`);
            err.status = 400;
            throw err;
        }

        const [visitaActiva] = await connection.execute(
            `SELECT id_visita, fecha_hora_ingreso FROM bitacora_visitas WHERE id_visitante = ? AND estado_visita = 'EN_PLANTA'`,
            [id_visitante]
        );
        if (visitaActiva.length > 0) {
            await connection.rollback();
            const horaIngreso = new Date(visitaActiva[0].fecha_hora_ingreso).toLocaleTimeString('es-CO');
            const err = new Error(`INGRESO BLOQUEADO: El visitante ya se encuentra dentro de la planta (ingresó a las ${horaIngreso}).`);
            err.status = 400;
            throw err;
        }

        const [resultBitacora] = await connection.execute(
            `INSERT INTO bitacora_visitas (id_visitante, id_empleado_visita, id_area_destino, objetos_ingresados, observaciones, id_escolta_ingreso, estado_visita) VALUES (?, ?, ?, ?, ?, ?, 'EN_PLANTA')`,
            [id_visitante, id_empleado_visita, id_area_destino, objetos_ingresados || null, observaciones || null, idEscolta]
        );

        await connection.commit();
        return { id_visita: resultBitacora.insertId };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

/**
 * Obtiene todas las visitas con estado EN_PLANTA.
 * @returns {Promise<Array>}
 */
exports.getActivas = async () => {
    const [visitas] = await db.execute(`
        SELECT b.id_visita, v.tipo_documento, v.numero_documento, v.nombre_completo AS visitante,
               v.eps, a.nombre_area AS area_destino,
               CONCAT(e.nombres, ' ', e.apellidos) AS empleado_anfitrion,
               b.objetos_ingresados, b.fecha_hora_ingreso,
               TIMESTAMPDIFF(MINUTE, b.fecha_hora_ingreso, NOW()) AS minutos_en_planta
        FROM bitacora_visitas b
        INNER JOIN visitantes v ON b.id_visitante = v.id_visitante
        INNER JOIN empleados e ON b.id_empleado_visita = e.id_empleado
        INNER JOIN areas a ON b.id_area_destino = a.id_area
        WHERE b.estado_visita = 'EN_PLANTA'
        ORDER BY b.fecha_hora_ingreso ASC
    `);
    return visitas;
};

/**
 * Registra la salida de una visita.
 * @param {number} idVisita
 * @param {number} idEscolta
 * @param {string} observaciones
 * @returns {Promise<boolean>} true si se actualizó, false si no existía
 */
exports.registrarSalida = async (idVisita, idEscolta, observaciones) => {
    const [result] = await db.execute(`
        UPDATE bitacora_visitas
        SET fecha_hora_salida = NOW(), estado_visita = 'FINALIZADO',
            id_escolta_salida = ?,
            observaciones = IF(observaciones IS NULL OR observaciones = '', ?, CONCAT(observaciones, ' [Salida: ', ?, ']'))
        WHERE id_visita = ? AND estado_visita = 'EN_PLANTA'
    `, [idEscolta, observaciones || 'Salida registrada', observaciones || 'Todo en orden', idVisita]);
    return result.affectedRows > 0;
};
