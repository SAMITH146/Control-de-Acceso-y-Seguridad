// =============================================================================
// SERVICIO: USUARIOS — LA PERLA S.A.
// Logica de base de datos para gestion de cuentas de usuario.
// =============================================================================
const bcrypt = require('bcryptjs');
const db = require('../db');

/** Retorna todos los usuarios no eliminados. */
exports.getAll = async () => {
    const [rows] = await db.execute(`
        SELECT u.id_usuario, u.username, u.nombre_completo, u.numero_documento,
               u.email, u.id_rol, u.estado_activo, r.nombre_rol
        FROM usuarios u INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.eliminado = 0 ORDER BY u.username
    `);
    return rows;
};

/** Retorna un usuario por ID. */
exports.getById = async (id) => {
    const [rows] = await db.execute(`
        SELECT id_usuario, username, nombre_completo, numero_documento, email, id_rol, estado_activo
        FROM usuarios WHERE id_usuario = ? AND eliminado = 0
    `, [id]);
    return rows[0] || null;
};

/** Crea un nuevo usuario con hash de password. */
exports.crear = async ({ username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo }) => {
    const hash = await bcrypt.hash(password_hash.trim(), 10);
    await db.execute(`
        INSERT INTO usuarios (username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo, requiere_cambio_password, eliminado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
    `, [username.trim(), nombre_completo?.trim() || null, numero_documento?.trim() || null, email?.trim() || null, hash, id_rol, estado_activo ?? 1]);
};

/** Actualiza un usuario. Si se pasa password la hashea. */
exports.actualizar = async (id, { username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo }) => {
    if (password_hash && password_hash.trim()) {
        const hash = await bcrypt.hash(password_hash.trim(), 10);
        await db.execute(`
            UPDATE usuarios SET username=?, nombre_completo=?, numero_documento=?, email=?, password_hash=?, id_rol=?, estado_activo=?, requiere_cambio_password=1
            WHERE id_usuario=? AND eliminado=0
        `, [username?.trim(), nombre_completo?.trim() || null, numero_documento?.trim() || null, email?.trim() || null, hash, id_rol, estado_activo, id]);
        return true; // indica que cambio clave
    } else {
        await db.execute(`
            UPDATE usuarios SET username=?, nombre_completo=?, numero_documento=?, email=?, id_rol=?, estado_activo=?
            WHERE id_usuario=? AND eliminado=0
        `, [username?.trim(), nombre_completo?.trim() || null, numero_documento?.trim() || null, email?.trim() || null, id_rol, estado_activo, id]);
        return false;
    }
};

/** Cambia el estado activo/inactivo de un usuario. */
exports.toggleEstado = async (id, nuevoEstado) => {
    await db.execute(`UPDATE usuarios SET estado_activo = ? WHERE id_usuario = ? AND eliminado = 0`, [nuevoEstado ? 1 : 0, id]);
};

/** Borrado logico de un usuario. */
exports.eliminar = async (id) => {
    const [result] = await db.execute(`UPDATE usuarios SET eliminado = 1, estado_activo = 0 WHERE id_usuario = ?`, [id]);
    return result.affectedRows > 0;
};
