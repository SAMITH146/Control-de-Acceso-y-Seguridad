// =============================================================================
// SERVICIO: EMPLEADOS — LA PERLA S.A.
// =============================================================================
const db = require('../db');

exports.getActivos = async () => {
    const [rows] = await db.execute(`
        SELECT e.id_empleado, e.id_area, CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
               e.cargo, a.nombre_area
        FROM empleados e INNER JOIN areas a ON e.id_area = a.id_area
        WHERE e.estado_activo = 1 AND a.estado_activo = 1 ORDER BY e.apellidos
    `);
    return rows;
};

exports.getTodos = async () => {
    const [rows] = await db.execute(`
        SELECT e.*, a.nombre_area FROM empleados e
        INNER JOIN areas a ON e.id_area = a.id_area ORDER BY e.apellidos
    `);
    return rows;
};

exports.getById = async (id) => {
    const [rows] = await db.execute(`SELECT * FROM empleados WHERE id_empleado = ?`, [id]);
    return rows[0] || null;
};

exports.crear = async ({ tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo }) => {
    await db.execute(
        `INSERT INTO empleados (tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo || null, telefono_contacto || null, estado_activo ?? 1]
    );
};

exports.actualizar = async (id, { tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo }) => {
    await db.execute(
        `UPDATE empleados SET tipo_documento=?, numero_documento=?, nombres=?, apellidos=?, cargo=?, id_area=?, email_corporativo=?, telefono_contacto=?, estado_activo=? WHERE id_empleado=?`,
        [tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo || null, telefono_contacto || null, estado_activo, id]
    );
};
