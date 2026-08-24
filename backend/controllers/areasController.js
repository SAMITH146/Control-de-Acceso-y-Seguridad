// backend/controllers/areasController.js
const db = require('../db');

exports.getAreasActivas = async (req, res) => {
    try {
        const [areas] = await db.execute(`SELECT id_area, nombre_area FROM areas WHERE estado_activo = 1 ORDER BY nombre_area`);
        res.json(areas);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando áreas' });
    }
};

exports.getAreasTodas = async (req, res) => {
    try {
        const [areas] = await db.execute(`SELECT * FROM areas ORDER BY nombre_area`);
        res.json(areas);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando áreas' });
    }
};

exports.getAreaById = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM areas WHERE id_area = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Área no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando área' });
    }
};

exports.createArea = async (req, res) => {
    const { nombre_area, descripcion, estado_activo } = req.body;
    try {
        await db.execute(`INSERT INTO areas (nombre_area, descripcion, estado_activo) VALUES (?, ?, ?)`,
            [nombre_area, descripcion || null, estado_activo ?? 1]);
        res.json({ mensaje: 'Área creada exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
        res.status(500).json({ error: 'Error creando área: ' + err.message });
    }
};

exports.updateArea = async (req, res) => {
    const { nombre_area, descripcion, estado_activo } = req.body;
    try {
        await db.execute(`UPDATE areas SET nombre_area = ?, descripcion = ?, estado_activo = ? WHERE id_area = ?`,
            [nombre_area, descripcion || null, estado_activo, req.params.id]);
        res.json({ mensaje: 'Área actualizada exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
        res.status(500).json({ error: 'Error actualizando área: ' + err.message });
    }
};
