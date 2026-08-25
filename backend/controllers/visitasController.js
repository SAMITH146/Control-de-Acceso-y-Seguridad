// backend/controllers/visitasController.js
const visitasService = require('../services/visitasService');

exports.registrarIngreso = async (req, res, next) => {
    const idEscolta = req.body.id_escolta_ingreso || (req.user ? req.user.id_usuario : 1);
    try {
        const result = await visitasService.registrarIngreso(req.body, idEscolta);
        res.json({ mensaje: 'Ingreso registrado exitosamente', id_visita: result.id_visita });
    } catch (err) {
        if (err.status === 400) return res.status(400).json({ error: err.message });
        next(err);
    }
};

exports.getVisitasActivas = async (req, res, next) => {
    try {
        res.json(await visitasService.getActivas());
    } catch (err) { next(err); }
};

exports.registrarSalida = async (req, res, next) => {
    const { id_escolta_salida, observaciones_salida } = req.body;
    const idEscolta = id_escolta_salida || (req.user ? req.user.id_usuario : 1);
    try {
        const ok = await visitasService.registrarSalida(req.params.id, idEscolta, observaciones_salida);
        if (!ok) return res.status(404).json({ error: 'La visita no existe o ya habia finalizado' });
        res.json({ mensaje: 'Salida registrada exitosamente' });
    } catch (err) { next(err); }
};
