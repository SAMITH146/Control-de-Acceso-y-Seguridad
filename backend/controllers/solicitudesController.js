// backend/controllers/solicitudesController.js
const db = require('../db');

// Crear solicitud de desbloqueo (Escolta u Operador)
exports.crearSolicitud = async (req, res) => {
    const { id_lista_negra, id_visitante, motivo_solicitud } = req.body;
    const idUsuarioSolicita = req.user ? req.user.id_usuario : 1;

    if (!id_lista_negra || !id_visitante || !motivo_solicitud || !motivo_solicitud.trim()) {
        return res.status(400).json({ error: 'Por favor proporciona la razón o justificación para solicitar el desbloqueo.' });
    }

    try {
        // Verificar si ya existe una solicitud pendiente para esta sanción
        const [existente] = await db.execute(
            `SELECT id_solicitud FROM solicitudes_desbloqueo WHERE id_lista_negra = ? AND estado = 'PENDIENTE'`,
            [id_lista_negra]
        );

        if (existente.length > 0) {
            return res.status(400).json({ error: 'Ya existe una solicitud de desbloqueo pendiente de revisión por el Administrador para este visitante.' });
        }

        const [result] = await db.execute(
            `INSERT INTO solicitudes_desbloqueo (id_lista_negra, id_visitante, id_usuario_solicita, motivo_solicitud, estado) VALUES (?, ?, ?, ?, 'PENDIENTE')`,
            [id_lista_negra, id_visitante, idUsuarioSolicita, motivo_solicitud.trim()]
        );

        res.json({ mensaje: 'Solicitud de desbloqueo enviada al Administrador exitosamente.', id_solicitud: result.insertId });
    } catch (err) {
        console.error('Error en solicitudesController.crearSolicitud:', err);
        res.status(500).json({ error: 'Error al registrar la solicitud: ' + err.message });
    }
};

// Obtener todas las solicitudes pendientes (Admin)
exports.getSolicitudesPendientes = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                sd.id_solicitud, sd.id_lista_negra, sd.id_visitante, sd.motivo_solicitud, sd.fecha_solicitud, sd.estado,
                v.tipo_documento, v.numero_documento, v.nombre_completo AS visitante,
                ln.motivo_bloqueo, ln.fecha_bloqueo,
                u.username AS solicitado_por
            FROM solicitudes_desbloqueo sd
            INNER JOIN visitantes v ON sd.id_visitante = v.id_visitante
            INNER JOIN lista_negra ln ON sd.id_lista_negra = ln.id_lista_negra
            INNER JOIN usuarios u ON sd.id_usuario_solicita = u.id_usuario
            WHERE sd.estado = 'PENDIENTE'
            ORDER BY sd.fecha_solicitud DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error en solicitudesController.getSolicitudesPendientes:', err);
        res.status(500).json({ error: 'Error cargando solicitudes pendientes' });
    }
};

// Aprobar solicitud y desbloquear visitante (Admin)
exports.aprobarSolicitud = async (req, res) => {
    const idSolicitud = req.params.id;
    const { respuesta_admin } = req.body;
    const idAdmin = req.user ? req.user.id_usuario : 1;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [solicitud] = await connection.execute(
            `SELECT id_lista_negra FROM solicitudes_desbloqueo WHERE id_solicitud = ? AND estado = 'PENDIENTE'`,
            [idSolicitud]
        );

        if (solicitud.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'La solicitud no fue encontrada o ya ha sido procesada.' });
        }

        const idListaNegra = solicitud[0].id_lista_negra;
        const justificacionResp = respuesta_admin ? respuesta_admin.trim() : 'Aprobado por Administración';

        // 1. Actualizar estado de la solicitud
        await connection.execute(
            `UPDATE solicitudes_desbloqueo SET estado = 'APROBADO', fecha_respuesta = NOW(), respuesta_admin = ?, id_usuario_responde = ? WHERE id_solicitud = ?`,
            [justificacionResp, idAdmin, idSolicitud]
        );

        // 2. Levantar la sanción en lista_negra
        await connection.execute(
            `UPDATE lista_negra SET estado_activo = 0, fecha_desbloqueo = NOW(), motivo_desbloqueo = ?, id_usuario_desbloqueo = ? WHERE id_lista_negra = ?`,
            [`Solicitud Aprobada: ${justificacionResp}`, idAdmin, idListaNegra]
        );

        await connection.commit();
        res.json({ mensaje: 'Solicitud aprobada con éxito. El visitante ha sido desbloqueado de la lista negra.' });
    } catch (err) {
        await connection.rollback();
        console.error('Error en solicitudesController.aprobarSolicitud:', err);
        res.status(500).json({ error: 'Error al aprobar solicitud: ' + err.message });
    } finally {
        connection.release();
    }
};

// Rechazar solicitud (Admin)
exports.rechazarSolicitud = async (req, res) => {
    const idSolicitud = req.params.id;
    const { respuesta_admin } = req.body;
    const idAdmin = req.user ? req.user.id_usuario : 1;

    try {
        const [result] = await db.execute(
            `UPDATE solicitudes_desbloqueo SET estado = 'RECHAZADO', fecha_respuesta = NOW(), respuesta_admin = ?, id_usuario_responde = ? WHERE id_solicitud = ? AND estado = 'PENDIENTE'`,
            [respuesta_admin || 'Solicitud rechazada por el Administrador', idAdmin, idSolicitud]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'La solicitud no existe o ya fue procesada.' });
        }

        res.json({ mensaje: 'Solicitud rechazada. El veto en Lista Negra se mantiene activo.' });
    } catch (err) {
        console.error('Error en solicitudesController.rechazarSolicitud:', err);
        res.status(500).json({ error: 'Error al rechazar solicitud' });
    }
};

// =============================================================================
// SECCIÓN: SOLICITUDES DE BLOQUEO / VETO (ESCOLTA ➔ ADMIN)
// =============================================================================

// Crear solicitud de bloqueo / veto
exports.crearSolicitudBloqueo = async (req, res) => {
    const { id_visitante, numero_documento, nombre_visitante, motivo_solicitud } = req.body;
    const idUsuarioSolicita = req.user ? req.user.id_usuario : 1;

    if (!numero_documento || !nombre_visitante || !motivo_solicitud || !motivo_solicitud.trim()) {
        return res.status(400).json({ error: 'Por favor ingresa el número de documento, nombre y el motivo o razón del bloqueo.' });
    }

    try {
        const docTrimmed = numero_documento.trim();

        // 1. Verificar si ya tiene sanción activa en lista_negra
        const [vetoActivo] = await db.execute(
            `SELECT ln.id_lista_negra FROM lista_negra ln 
             INNER JOIN visitantes v ON ln.id_visitante = v.id_visitante 
             WHERE v.numero_documento = ? AND ln.estado_activo = 1`,
            [docTrimmed]
        );

        if (vetoActivo.length > 0) {
            return res.status(400).json({ error: 'Este visitante ya cuenta con un veto activo en Lista Negra.' });
        }

        // 2. Verificar si ya existe una solicitud de bloqueo pendiente
        const [pendiente] = await db.execute(
            `SELECT id_solicitud_bloqueo FROM solicitudes_bloqueo WHERE numero_documento = ? AND estado = 'PENDIENTE'`,
            [docTrimmed]
        );

        if (pendiente.length > 0) {
            return res.status(400).json({ error: 'Ya existe una solicitud de bloqueo/veto pendiente de revisión para esta persona.' });
        }

        // 3. VERIFICACIÓN DE SEGURIDAD: Verificar si el visitante se encuentra en planta
        const [enPlanta] = await db.execute(
            `SELECT v.id_visita FROM bitacora_visitas v 
             INNER JOIN visitantes vis ON v.id_visitante = vis.id_visitante 
             WHERE vis.numero_documento = ? AND v.estado_visita = 'EN_PLANTA'`,
            [docTrimmed]
        );

        if (enPlanta.length > 0) {
            return res.status(400).json({ error: '⚠️ El visitante se encuentra actualmente EN PLANTA. Por razones de seguridad, debes registrar primero su salida en portería antes de enviar la solicitud de bloqueo.' });
        }

        const [result] = await db.execute(
            `INSERT INTO solicitudes_bloqueo (id_visitante, numero_documento, nombre_visitante, id_usuario_solicita, motivo_solicitud, estado) VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
            [id_visitante || null, docTrimmed, nombre_visitante.trim(), idUsuarioSolicita, motivo_solicitud.trim()]
        );

        res.json({ mensaje: 'Solicitud de veto/bloqueo enviada al Administrador exitosamente.', id_solicitud_bloqueo: result.insertId });
    } catch (err) {
        console.error('Error en solicitudesController.crearSolicitudBloqueo:', err);
        res.status(500).json({ error: 'Error al registrar solicitud de bloqueo: ' + err.message });
    }
};

// Obtener todas las solicitudes de bloqueo pendientes (Admin)
exports.getSolicitudesBloqueoPendientes = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                sb.id_solicitud_bloqueo, sb.id_visitante, sb.numero_documento, sb.nombre_visitante,
                sb.motivo_solicitud, sb.fecha_solicitud, sb.estado,
                u.username AS solicitado_por
            FROM solicitudes_bloqueo sb
            INNER JOIN usuarios u ON sb.id_usuario_solicita = u.id_usuario
            WHERE sb.estado = 'PENDIENTE'
            ORDER BY sb.fecha_solicitud DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error en solicitudesController.getSolicitudesBloqueoPendientes:', err);
        res.status(500).json({ error: 'Error cargando solicitudes de bloqueo pendientes' });
    }
};

// Aprobar solicitud de bloqueo (Inserta el veto en lista_negra)
exports.aprobarSolicitudBloqueo = async (req, res) => {
    const idSolicitudBloqueo = req.params.id;
    const { respuesta_admin } = req.body;
    const idAdmin = req.user ? req.user.id_usuario : 1;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [solicitud] = await connection.execute(
            `SELECT * FROM solicitudes_bloqueo WHERE id_solicitud_bloqueo = ? AND estado = 'PENDIENTE'`,
            [idSolicitudBloqueo]
        );

        if (solicitud.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'La solicitud no existe o ya fue procesada.' });
        }

        const s = solicitud[0];
        let idVis = s.id_visitante;

        // Buscar o crear visitante en la tabla visitantes si no está registrado
        if (!idVis) {
            const [vRows] = await connection.execute(
                `SELECT id_visitante FROM visitantes WHERE numero_documento = ?`,
                [s.numero_documento]
            );
            if (vRows.length > 0) {
                idVis = vRows[0].id_visitante;
            } else {
                const [vNuevo] = await connection.execute(
                    `INSERT INTO visitantes (tipo_documento, numero_documento, nombre_completo, eps, estado_activo) VALUES ('CC', ?, ?, 'N/A', 0)`,
                    [s.numero_documento, s.nombre_visitante]
                );
                idVis = vNuevo.insertId;
            }
        }

        // VERIFICACIÓN DE SEGURIDAD: Impedir autorización de veto si la persona se encuentra EN PLANTA
        const [enPlantaAprob] = await connection.execute(
            `SELECT id_visita FROM bitacora_visitas WHERE id_visitante = ? AND estado_visita = 'EN_PLANTA'`,
            [idVis]
        );

        if (enPlantaAprob.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: '⚠️ No se puede autorizar el veto de este visitante porque actualmente se encuentra EN PLANTA. Debes registrar su salida en portería antes de aprobar el bloqueo.' });
        }

        // 1. Insertar en lista_negra
        const motivoFinal = `[REPORTE ESCOLTA: ${s.motivo_solicitud}]` + (respuesta_admin ? ` - ${respuesta_admin.trim()}` : '');
        await connection.execute(
            `INSERT INTO lista_negra (id_visitante, motivo_bloqueo, id_usuario_registro, estado_activo) VALUES (?, ?, ?, 1)`,
            [idVis, motivoFinal, s.id_usuario_solicita]
        );

        // 2. Marcar solicitud como APROBADO
        await connection.execute(
            `UPDATE solicitudes_bloqueo SET estado = 'APROBADO', fecha_respuesta = NOW(), respuesta_admin = ?, id_usuario_responde = ? WHERE id_solicitud_bloqueo = ?`,
            [respuesta_admin || 'Bloqueo aprobado por la Administración', idAdmin, idSolicitudBloqueo]
        );

        await connection.commit();
        res.json({ mensaje: 'Solicitud aprobada con éxito. El visitante ha sido vetado e ingresado a la Lista Negra.' });
    } catch (err) {
        await connection.rollback();
        console.error('Error en solicitudesController.aprobarSolicitudBloqueo:', err);
        res.status(500).json({ error: 'Error al aprobar bloqueo: ' + err.message });
    } finally {
        connection.release();
    }
};

// Rechazar solicitud de bloqueo
exports.rechazarSolicitudBloqueo = async (req, res) => {
    const idSolicitudBloqueo = req.params.id;
    const { respuesta_admin } = req.body;
    const idAdmin = req.user ? req.user.id_usuario : 1;

    try {
        const [result] = await db.execute(
            `UPDATE solicitudes_bloqueo SET estado = 'RECHAZADO', fecha_respuesta = NOW(), respuesta_admin = ?, id_usuario_responde = ? WHERE id_solicitud_bloqueo = ? AND estado = 'PENDIENTE'`,
            [respuesta_admin || 'Solicitud de bloqueo desestimada por el Administrador', idAdmin, idSolicitudBloqueo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'La solicitud no existe o ya fue procesada.' });
        }

        res.json({ mensaje: 'Solicitud de veto rechazada. No se aplicó sanción.' });
    } catch (err) {
        console.error('Error en solicitudesController.rechazarSolicitudBloqueo:', err);
        res.status(500).json({ error: 'Error al rechazar solicitud de bloqueo' });
    }
};
