// backend/controllers/usuariosController.js
const bcrypt = require('bcryptjs');
const db = require('../db');

exports.getUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.execute(`
            SELECT u.id_usuario, u.username, u.nombre_completo, u.numero_documento, u.email, u.id_rol, u.estado_activo, r.nombre_rol
            FROM usuarios u 
            INNER JOIN roles r ON u.id_rol = r.id_rol 
            WHERE u.eliminado = 0
            ORDER BY u.username
        `);
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando usuarios' });
    }
};

exports.getUsuarioById = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id_usuario, username, nombre_completo, numero_documento, email, id_rol, estado_activo 
            FROM usuarios 
            WHERE id_usuario = ? AND eliminado = 0
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando usuario' });
    }
};

exports.createUsuario = async (req, res) => {
    const { username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }
    if (!password_hash || !password_hash.trim()) {
        return res.status(400).json({ error: 'La contraseña es obligatoria para usuarios nuevos' });
    }
    try {
        const uTrim = username.trim();
        const nomTrim = nombre_completo ? nombre_completo.trim() : null;
        const docTrim = numero_documento ? numero_documento.trim() : null;

        const hash = await bcrypt.hash(password_hash.trim(), 10);
        await db.execute(`
            INSERT INTO usuarios (username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo, requiere_cambio_password, eliminado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
        `, [uTrim, nomTrim, docTrim, email ? email.trim() : null, hash, id_rol, estado_activo ?? 1]);

        res.json({ mensaje: '✅ Usuario creado exitosamente. Al iniciar sesión se le pedirá obligatoriamente personalizar su clave.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('numero_documento')) {
                return res.status(400).json({ error: `❌ La cédula/documento '${numero_documento}' ya está registrada para otro usuario.` });
            }
            return res.status(400).json({ error: `❌ El usuario '${username}' ya existe en el sistema. Elige otro nombre de usuario.` });
        }
        res.status(500).json({ error: 'Error creando usuario: ' + err.message });
    }
};

exports.updateUsuario = async (req, res) => {
    const { username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo } = req.body;
    try {
        const uTrim = username ? username.trim() : null;
        const nomTrim = nombre_completo ? nombre_completo.trim() : null;
        const docTrim = numero_documento ? numero_documento.trim() : null;
        let cambioClave = false;

        if (password_hash && password_hash.trim()) {
            cambioClave = true;
            const hash = await bcrypt.hash(password_hash.trim(), 10);
            await db.execute(`
                UPDATE usuarios 
                SET username = ?, nombre_completo = ?, numero_documento = ?, email = ?, password_hash = ?, id_rol = ?, estado_activo = ?, requiere_cambio_password = 1 
                WHERE id_usuario = ? AND eliminado = 0
            `, [uTrim, nomTrim, docTrim, email ? email.trim() : null, hash, id_rol, estado_activo, req.params.id]);
        } else {
            await db.execute(`
                UPDATE usuarios 
                SET username = ?, nombre_completo = ?, numero_documento = ?, email = ?, id_rol = ?, estado_activo = ? 
                WHERE id_usuario = ? AND eliminado = 0
            `, [uTrim, nomTrim, docTrim, email ? email.trim() : null, id_rol, estado_activo, req.params.id]);
        }

        const msg = cambioClave
            ? '🔑 Contraseña temporal asignada exitosamente. El usuario deberá cambiarla obligatoriamente en su próximo inicio de sesión.'
            : '✅ Usuario actualizado exitosamente.';

        res.json({ mensaje: msg });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('numero_documento')) {
                return res.status(400).json({ error: `❌ La cédula/documento '${numero_documento}' ya le pertenece a otro usuario.` });
            }
            return res.status(400).json({ error: `❌ El usuario '${username}' ya está siendo usado por otra persona.` });
        }
        res.status(500).json({ error: 'Error actualizando usuario: ' + err.message });
    }
};

// Cambiar estado Activo/Inactivo (Inhabilitación Temporal)
exports.toggleEstadoUsuario = async (req, res) => {
    const idUsuario = req.params.id;
    const { estado_activo } = req.body;

    if (req.user && parseInt(req.user.id_usuario) === parseInt(idUsuario)) {
        return res.status(400).json({ error: 'No puedes cambiar el estado de tu propia cuenta activa.' });
    }

    try {
        await db.execute(`UPDATE usuarios SET estado_activo = ? WHERE id_usuario = ? AND eliminado = 0`, [estado_activo ? 1 : 0, idUsuario]);
        const estadoTxt = estado_activo ? 'Activada' : 'Inhabilitada';
        res.json({ mensaje: `✅ Cuenta ${estadoTxt} exitosamente.` });
    } catch (err) {
        res.status(500).json({ error: 'Error al cambiar estado del usuario.' });
    }
};

// Eliminación de la lista (Borrado Lógico manteniendo historial intacto)
exports.deleteUsuario = async (req, res) => {
    const idUsuario = req.params.id;

    if (req.user && parseInt(req.user.id_usuario) === parseInt(idUsuario)) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de usuario activa.' });
    }

    try {
        const [updResult] = await db.execute(`UPDATE usuarios SET eliminado = 1, estado_activo = 0 WHERE id_usuario = ?`, [idUsuario]);
        if (updResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ 
            mensaje: '🗑️ Usuario eliminado de la lista de gestión. Todo su historial de registros se preservó 100% intacto en auditoría.' 
        });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error al procesar la eliminación del usuario.' });
    }
};
