// backend/controllers/usuariosController.js
const usuariosService = require('../services/usuariosService');

exports.getUsuarios = async (req, res, next) => {
    try { res.json(await usuariosService.getAll()); } catch (err) { next(err); }
};

exports.getUsuarioById = async (req, res, next) => {
    try {
        const u = await usuariosService.getById(req.params.id);
        if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(u);
    } catch (err) { next(err); }
};

exports.createUsuario = async (req, res, next) => {
    const { username, password_hash } = req.body;
    if (!username?.trim()) return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    if (!password_hash?.trim()) return res.status(400).json({ error: 'La contrasena es obligatoria para usuarios nuevos' });
    try {
        await usuariosService.crear(req.body);
        res.json({ mensaje: 'Usuario creado exitosamente. Al iniciar sesion se le pedira personalizar su clave.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('numero_documento')) return res.status(400).json({ error: `La cedula '${req.body.numero_documento}' ya esta registrada.` });
            return res.status(400).json({ error: `El usuario '${username}' ya existe. Elige otro nombre.` });
        }
        next(err);
    }
};

exports.updateUsuario = async (req, res, next) => {
    try {
        const cambioClave = await usuariosService.actualizar(req.params.id, req.body);
        const msg = cambioClave
            ? 'Contrasena temporal asignada. El usuario debera cambiarla en su proximo inicio de sesion.'
            : 'Usuario actualizado exitosamente.';
        res.json({ mensaje: msg });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('numero_documento')) return res.status(400).json({ error: `La cedula '${req.body.numero_documento}' ya le pertenece a otro usuario.` });
            return res.status(400).json({ error: `El usuario '${req.body.username}' ya esta siendo usado por otra persona.` });
        }
        next(err);
    }
};

exports.toggleEstadoUsuario = async (req, res, next) => {
    const idUsuario = req.params.id;
    if (req.user && parseInt(req.user.id_usuario) === parseInt(idUsuario)) {
        return res.status(400).json({ error: 'No puedes cambiar el estado de tu propia cuenta activa.' });
    }
    try {
        await usuariosService.toggleEstado(idUsuario, req.body.estado_activo);
        const estadoTxt = req.body.estado_activo ? 'Activada' : 'Inhabilitada';
        res.json({ mensaje: `Cuenta ${estadoTxt} exitosamente.` });
    } catch (err) { next(err); }
};

