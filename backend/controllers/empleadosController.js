// backend/controllers/empleadosController.js
const empleadosService = require('../services/empleadosService');

exports.getEmpleadosActivos = async (req, res, next) => {
    try { res.json(await empleadosService.getActivos()); } catch (err) { next(err); }
};

exports.getEmpleadosTodos = async (req, res, next) => {
    try { res.json(await empleadosService.getTodos()); } catch (err) { next(err); }
};

exports.getEmpleadoById = async (req, res, next) => {
    try {
        const emp = await empleadosService.getById(req.params.id);
        if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json(emp);
    } catch (err) { next(err); }
};

exports.createEmpleado = async (req, res, next) => {
    try {
        await empleadosService.crear(req.body);
        res.json({ mensaje: 'Empleado creado exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un empleado con ese número de documento.' });
        next(err);
    }
};

exports.updateEmpleado = async (req, res, next) => {
    try {
        await empleadosService.actualizar(req.params.id, req.body);
        res.json({ mensaje: 'Empleado actualizado exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un empleado con ese número de documento.' });
        next(err);
    }
};
