// backend/controllers/blacklistController.js
const db = require('../db');

// Obtener toda la lista negra
exports.getListaNegra = async (req, res) => {
    try {
        const [lista] = await db.execute(`
            SELECT ln.id_lista_negra, ln.id_visitante, ln.fecha_bloqueo, ln.motivo_bloqueo,
                   ln.estado_activo, ln.fecha_desbloqueo, ln.motivo_desbloqueo,
                   v.tipo_documento, v.numero_documento, v.nombre_completo AS visitante,
                   u_reg.username AS registrado_por,
                   u_des.username AS desbloqueado_por
            FROM lista_negra ln
            INNER JOIN visitantes v ON ln.id_visitante = v.id_visitante
            INNER JOIN usuarios u_reg ON ln.id_usuario_registro = u_reg.id_usuario
            LEFT JOIN usuarios u_des ON ln.id_usuario_desbloqueo = u_des.id_usuario
            ORDER BY ln.estado_activo DESC, ln.fecha_bloqueo DESC
        `);
        res.json(lista);
    } catch (err) {
        console.error('Error en blacklistController.getListaNegra:', err);
        res.status(500).json({ error: 'Error cargando lista negra' });
    }
};

// Agregar sanción / vetar visitante
exports.bloquearVisitante = async (req, res) => {
    const { numero_documento, id_visitante, nombre_visitante, motivo_bloqueo, id_usuario_registro } = req.body;
    const idUserReg = id_usuario_registro || (req.user ? req.user.id_usuario : 1);

    try {
        let idVis = id_visitante;
        if (!idVis && numero_documento) {
            const [vis] = await db.execute(`SELECT id_visitante FROM visitantes WHERE numero_documento = ?`, [numero_documento.trim()]);
            if (vis.length > 0) {
                idVis = vis[0].id_visitante;
            } else {
                const nombre = nombre_visitante && nombre_visitante !== '(Se buscará por cédula)' ? nombre_visitante.trim() : `Persona Vetada (Doc: ${numero_documento.trim()})`;
                const [nuevoVis] = await db.execute(
                    `INSERT INTO visitantes (tipo_documento, numero_documento, nombre_completo, eps, estado_activo) VALUES ('CC', ?, ?, 'N/A', 0)`,
                    [numero_documento.trim(), nombre]
                );
                idVis = nuevoVis.insertId;
            }
        }
        if (!idVis) {
            return res.status(400).json({ error: 'Debes proporcionar un documento o seleccionar un visitante.' });
        }

        const [activo] = await db.execute(`SELECT id_lista_negra FROM lista_negra WHERE id_visitante = ? AND estado_activo = 1`, [idVis]);
        if (activo.length) {
            return res.status(400).json({ error: 'Este visitante ya tiene una sanción activa en lista negra' });
        }

        // VERIFICACIÓN DE SEGURIDAD: Impedir bloqueo si la persona se encuentra EN PLANTA
        const [enPlanta] = await db.execute(
            `SELECT id_visita FROM bitacora_visitas WHERE id_visitante = ? AND estado_visita = 'EN_PLANTA'`,
            [idVis]
        );

        if (enPlanta.length > 0) {
            return res.status(400).json({ error: '⚠️ No se puede bloquear a este visitante porque actualmente se encuentra EN PLANTA. Debes registrar su salida en portería antes de aplicarle el bloqueo de seguridad.' });
        }

        await db.execute(
            `INSERT INTO lista_negra (id_visitante, motivo_bloqueo, id_usuario_registro, estado_activo) VALUES (?, ?, ?, 1)`,
            [idVis, motivo_bloqueo, idUserReg]
        );
        res.json({ mensaje: 'Visitante agregado a lista negra exitosamente' });
    } catch (err) {
        console.error('Error en blacklistController.bloquearVisitante:', err);
        res.status(500).json({ error: 'Error al aplicar sanción: ' + err.message });
    }
};

// Levantar sanción / desbloquear
exports.desbloquearVisitante = async (req, res) => {
    const { motivo_desbloqueo, id_usuario_desbloqueo } = req.body;
    const idUserDes = id_usuario_desbloqueo || (req.user ? req.user.id_usuario : 1);

    try {
        await db.execute(
            `UPDATE lista_negra SET estado_activo = 0, fecha_desbloqueo = NOW(), motivo_desbloqueo = ?, id_usuario_desbloqueo = ? WHERE id_lista_negra = ?`,
            [motivo_desbloqueo, idUserDes, req.params.id]
        );
        res.json({ mensaje: 'Sanción levantada exitosamente. El visitante está autorizado nuevamente.' });
    } catch (err) {
        console.error('Error en blacklistController.desbloquearVisitante:', err);
        res.status(500).json({ error: 'Error al desbloquear: ' + err.message });
    }
};

// Eliminar registro de lista negra (solo Admin)
exports.eliminarSancion = async (req, res) => {
    try {
        const [result] = await db.execute(`DELETE FROM lista_negra WHERE id_lista_negra = ?`, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El registro no fue encontrado' });
        }
        res.json({ mensaje: 'Registro de lista negra eliminado exitosamente' });
    } catch (err) {
        console.error('Error en blacklistController.eliminarSancion:', err);
        res.status(500).json({ error: 'Error al eliminar el registro' });
    }
};
