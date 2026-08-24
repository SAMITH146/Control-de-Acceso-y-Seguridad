// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'la_perla_seguridad_jwt_secret_key_2026_safe';

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Por favor ingresa usuario y contraseña' });
    }

    const uTrimmed = username.trim();
    const pTrimmed = password.trim();

    try {
        const [rows] = await db.execute(`
            SELECT u.id_usuario, u.username, u.email, u.id_rol, u.password_hash, u.estado_activo, u.requiere_cambio_password, r.nombre_rol
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE LOWER(u.username) = LOWER(?) AND u.estado_activo = 1
        `, [uTrimmed]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        const usuario = rows[0];

        // Verificar contraseña con bcrypt
        let coincide = false;
        if (usuario.password_hash.startsWith('$2a$') || usuario.password_hash.startsWith('$2b$')) {
            coincide = await bcrypt.compare(pTrimmed, usuario.password_hash);
        } else {
            coincide = (pTrimmed === usuario.password_hash);
            if (coincide) {
                const nuevoHash = await bcrypt.hash(pTrimmed, 10);
                await db.execute('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [nuevoHash, usuario.id_usuario]);
            }
        }

        if (!coincide) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos. Verifica e intenta de nuevo.' });
        }

        // Generar Token JWT firmado
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                username: usuario.username,
                email: usuario.email,
                id_rol: usuario.id_rol,
                nombre_rol: usuario.nombre_rol
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
        );

        const requiere_cambio = !!usuario.requiere_cambio_password;
        delete usuario.password_hash;

        res.json({
            mensaje: 'Acceso autorizado',
            token,
            usuario,
            requiere_cambio
        });
    } catch (err) {
        console.error('Error en authController.login:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.verificarToken = async (req, res) => {
    res.json({ valido: true, usuario: req.user });
};

// Cambiar contraseña obligatoria en el primer inicio de sesión
exports.cambiarPrimerPassword = async (req, res) => {
    const { id_usuario, username, nueva_password, confirmar_password } = req.body;
    let idUsuario = (req.user && req.user.id_usuario) ? req.user.id_usuario : id_usuario;

    if (!idUsuario && username) {
        const [uRows] = await db.execute(`SELECT id_usuario FROM usuarios WHERE LOWER(username) = LOWER(?)`, [username.trim()]);
        if (uRows.length > 0) {
            idUsuario = uRows[0].id_usuario;
        }
    }

    if (!idUsuario) {
        return res.status(400).json({ error: 'No se pudo identificar el usuario. Por favor vuelve a ingresar tu usuario y contraseña.' });
    }

    if (!nueva_password || !confirmar_password) {
        return res.status(400).json({ error: 'Debes ingresar la nueva contraseña y su confirmación' });
    }

    if (nueva_password.trim() !== confirmar_password.trim()) {
        return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden' });
    }

    if (nueva_password.trim().length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        const hash = await bcrypt.hash(nueva_password.trim(), 10);
        await db.execute(
            `UPDATE usuarios SET password_hash = ?, requiere_cambio_password = 0 WHERE id_usuario = ?`,
            [hash, idUsuario]
        );

        res.json({ mensaje: '¡Contraseña personalizada exitosamente! Ya puedes ingresar al sistema.' });
    } catch (err) {
        console.error('Error en authController.cambiarPrimerPassword:', err);
        res.status(500).json({ error: 'Error actualizando contraseña: ' + err.message });
    }
};

// Cambiar contraseña voluntario (Escolta / Admin desde el panel)
exports.cambiarPassword = async (req, res) => {
    const { password_actual, nueva_password, confirmar_password } = req.body;
    const idUsuario = req.user ? req.user.id_usuario : null;

    if (!idUsuario) {
        return res.status(401).json({ error: 'Sesión no válida o expirada' });
    }

    if (!password_actual || !nueva_password || !confirmar_password) {
        return res.status(400).json({ error: 'Por favor completa todos los campos' });
    }

    if (nueva_password.trim() !== confirmar_password.trim()) {
        return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden' });
    }

    if (nueva_password.trim().length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        const [rows] = await db.execute(`SELECT password_hash FROM usuarios WHERE id_usuario = ?`, [idUsuario]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const match = await bcrypt.compare(password_actual.trim(), rows[0].password_hash);
        if (!match) {
            return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta' });
        }

        const hash = await bcrypt.hash(nueva_password.trim(), 10);
        await db.execute(
            `UPDATE usuarios SET password_hash = ?, requiere_cambio_password = 0 WHERE id_usuario = ?`,
            [hash, idUsuario]
        );

        res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (err) {
        console.error('Error en authController.cambiarPassword:', err);
        res.status(500).json({ error: 'Error actualizando contraseña' });
    }
};
