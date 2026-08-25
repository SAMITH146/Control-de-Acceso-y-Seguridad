// =============================================================================
// SERVICIO: AREAS — LA PERLA S.A.
// Contiene toda la logica de base de datos para el dominio de Areas.
// Los controladores llaman a estas funciones sin saber como funciona la DB.
// =============================================================================
const db = require('../db');

/**
 * Retorna todas las areas activas.
 * @returns {Promise<Array>}
 */
exports.getActivas = async () => {
    const [rows] = await db.execute(
        `SELECT id_area, nombre_area FROM areas WHERE estado_activo = 1 ORDER BY nombre_area`
    );
    return rows;
};

/**
 * Retorna todas las areas sin importar su estado.
 * @returns {Promise<Array>}
 */
exports.getTodas = async () => {
    const [rows] = await db.execute(`SELECT * FROM areas ORDER BY nombre_area`);
    return rows;
};

/**
 * Retorna un area por su ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
exports.getById = async (id) => {
    const [rows] = await db.execute(`SELECT * FROM areas WHERE id_area = ?`, [id]);
    return rows[0] || null;
};

/**
 * Crea una nueva area.
 * @param {{nombre_area:string, descripcion?:string, estado_activo?:number}} data
 */
exports.crear = async ({ nombre_area, descripcion, estado_activo = 1 }) => {
    await db.execute(
        `INSERT INTO areas (nombre_area, descripcion, estado_activo) VALUES (?, ?, ?)`,
        [nombre_area, descripcion || null, estado_activo]
    );
};

/**
 * Actualiza un area existente.
 * @param {number} id
 * @param {{nombre_area:string, descripcion?:string, estado_activo:number}} data
 */
exports.actualizar = async (id, { nombre_area, descripcion, estado_activo }) => {
    await db.execute(
        `UPDATE areas SET nombre_area = ?, descripcion = ?, estado_activo = ? WHERE id_area = ?`,
        [nombre_area, descripcion || null, estado_activo, id]
    );
};
