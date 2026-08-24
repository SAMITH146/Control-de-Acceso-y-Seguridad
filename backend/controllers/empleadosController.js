// backend/controllers/empleadosController.js
const db = require('../db');

exports.getEmpleadosActivos = async (req, res) => {
    try {
        const [empleados] = await db.execute(`
            SELECT e.id_empleado, e.id_area, CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo, e.cargo, a.nombre_area
            FROM empleados e
            INNER JOIN areas a ON e.id_area = a.id_area
            WHERE e.estado_activo = 1 AND a.estado_activo = 1
            ORDER BY e.apellidos
        `);
        res.json(empleados);
    } catch (err) {
        console.error('Error en getEmpleadosActivos:', err);
        res.status(500).json({ error: 'Error cargando empleados' });
    }
};

exports.getEmpleadosTodos = async (req, res) => {
    try {
        const [empleados] = await db.execute(`
            SELECT e.*, a.nombre_area FROM empleados e
            INNER JOIN areas a ON e.id_area = a.id_area ORDER BY e.apellidos
        `);
        res.json(empleados);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando empleados' });
    }
};

exports.getEmpleadoById = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM empleados WHERE id_empleado = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error cargando empleado' });
    }
};

exports.createEmpleado = async (req, res) => {
    const { tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo } = req.body;
    try {
        await db.execute(`
            INSERT INTO empleados (tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto || null, estado_activo ?? 1]);
        res.json({ mensaje: 'Empleado creado exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un empleado con ese documento o email' });
        res.status(500).json({ error: 'Error creando empleado: ' + err.message });
    }
};

exports.updateEmpleado = async (req, res) => {
    const { tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo } = req.body;
    try {
        await db.execute(`
            UPDATE empleados SET tipo_documento=?, numero_documento=?, nombres=?, apellidos=?, cargo=?, id_area=?, email_corporativo=?, telefono_contacto=?, estado_activo=? WHERE id_empleado=?
        `, [tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto || null, estado_activo, req.params.id]);
        res.json({ mensaje: 'Empleado actualizado exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un empleado con ese documento o email' });
        res.status(500).json({ error: 'Error actualizando empleado: ' + err.message });
    }
};
