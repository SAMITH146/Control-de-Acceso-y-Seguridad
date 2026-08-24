// backend/controllers/visitasController.js
const db = require('../db');

// Registrar ingreso de visitante
exports.registrarIngreso = async (req, res) => {
    const {
        id_visitante_existente,
        tipo_documento,
        numero_documento,
        nombre_completo,
        telefono,
        eps,
        id_area_destino,
        id_empleado_visita,
        objetos_ingresados,
        observaciones,
        id_escolta_ingreso
    } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let id_visitante = id_visitante_existente;

        // Buscar por número de documento si no se proporcionó id_visitante
        if (!id_visitante && numero_documento) {
            const [vis] = await connection.execute(
                `SELECT id_visitante FROM visitantes WHERE numero_documento = ?`,
                [numero_documento.toString().trim()]
            );
            if (vis.length > 0) {
                id_visitante = vis[0].id_visitante;
            }
        }

        if (!id_visitante) {
            // Visitante totalmente nuevo
            const [result] = await connection.execute(
                `INSERT INTO visitantes (tipo_documento, numero_documento, nombre_completo, telefono, eps, estado_activo) VALUES (?, ?, ?, ?, ?, 1)`,
                [tipo_documento, numero_documento.toString().trim(), nombre_completo, telefono || null, eps]
            );
            id_visitante = result.insertId;
        } else {
            // Visitante existente: actualizar sus datos más recientes
            await connection.execute(
                `UPDATE visitantes SET tipo_documento = ?, nombre_completo = ?, telefono = ?, eps = ?, estado_activo = 1 WHERE id_visitante = ?`,
                [tipo_documento, nombre_completo, telefono || null, eps, id_visitante]
            );
        }

        // Validación preventiva de Lista Negra
        const [veto] = await connection.execute(
            `SELECT motivo_bloqueo FROM lista_negra WHERE id_visitante = ? AND estado_activo = 1`,
            [id_visitante]
        );
        if (veto.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                error: `ACCESO DENEGADO: El visitante tiene un veto activo en Lista Negra. Motivo: ${veto[0].motivo_bloqueo}`
            });
        }

        // Validación preventiva: verificar si el visitante YA SE ENCUENTRA DENTRO DE PLANTA
        const [visitaActiva] = await connection.execute(
            `SELECT id_visita, fecha_hora_ingreso FROM bitacora_visitas WHERE id_visitante = ? AND estado_visita = 'EN_PLANTA'`,
            [id_visitante]
        );
        if (visitaActiva.length > 0) {
            await connection.rollback();
            const horaIngreso = new Date(visitaActiva[0].fecha_hora_ingreso).toLocaleTimeString('es-CO');
            return res.status(400).json({
                error: `INGRESO BLOQUEADO: El visitante ya se encuentra dentro de la planta (ingresó a las ${horaIngreso}). Debe registrar su salida antes de un nuevo ingreso.`
            });
        }

        // Utilizar la identidad del usuario extraída del Token JWT si no se envía id_escolta_ingreso explicito
        const idEscolta = id_escolta_ingreso || (req.user ? req.user.id_usuario : 1);

        // Registrar visita en bitácora
        const [resultBitacora] = await connection.execute(
            `INSERT INTO bitacora_visitas (id_visitante, id_empleado_visita, id_area_destino, objetos_ingresados, observaciones, id_escolta_ingreso, estado_visita) VALUES (?, ?, ?, ?, ?, ?, 'EN_PLANTA')`,
            [id_visitante, id_empleado_visita, id_area_destino, objetos_ingresados || null, observaciones || null, idEscolta]
        );

        await connection.commit();
        res.json({ mensaje: 'Ingreso registrado exitosamente', id_visita: resultBitacora.insertId });
    } catch (err) {
        await connection.rollback();
        console.error('Error en visitasController.registrarIngreso:', err);
        res.status(500).json({ error: 'Error registrando el ingreso: ' + err.message });
    } finally {
        connection.release();
    }
};

// Obtener lista de visitas activas (EN_PLANTA)
exports.getVisitasActivas = async (req, res) => {
    try {
        const [visitas] = await db.execute(`
            SELECT b.id_visita, v.tipo_documento, v.numero_documento, v.nombre_completo AS visitante,
                   v.eps, a.nombre_area AS area_destino,
                   CONCAT(e.nombres, ' ', e.apellidos) AS empleado_anfitrion,
                   b.objetos_ingresados, b.fecha_hora_ingreso,
                   TIMESTAMPDIFF(MINUTE, b.fecha_hora_ingreso, NOW()) AS minutos_en_planta
            FROM bitacora_visitas b
            INNER JOIN visitantes v ON b.id_visitante = v.id_visitante
            INNER JOIN empleados e ON b.id_empleado_visita = e.id_empleado
            INNER JOIN areas a ON b.id_area_destino = a.id_area
            WHERE b.estado_visita = 'EN_PLANTA'
            ORDER BY b.fecha_hora_ingreso ASC
        `);
        res.json(visitas);
    } catch (err) {
        console.error('Error en visitasController.getVisitasActivas:', err);
        res.status(500).json({ error: 'Error cargando visitas activas' });
    }
};

// Registrar salida de visita
exports.registrarSalida = async (req, res) => {
    const { id_escolta_salida, observaciones_salida } = req.body;
    const id_visita = req.params.id;
    const idEscoltaOut = id_escolta_salida || (req.user ? req.user.id_usuario : 1);

    try {
        const [result] = await db.execute(`
            UPDATE bitacora_visitas
            SET fecha_hora_salida = NOW(),
                estado_visita = 'FINALIZADO',
                id_escolta_salida = ?,
                observaciones = IF(observaciones IS NULL OR observaciones = '', ?, CONCAT(observaciones, ' [Salida: ', ?, ']'))
            WHERE id_visita = ? AND estado_visita = 'EN_PLANTA'
        `, [idEscoltaOut, observaciones_salida || 'Salida registrada', observaciones_salida || 'Todo en orden', id_visita]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'La visita no existe o ya había finalizado' });
        }

        res.json({ mensaje: 'Salida registrada exitosamente' });
    } catch (err) {
        console.error('Error en visitasController.registrarSalida:', err);
        res.status(500).json({ error: 'Error registrando la salida' });
    }
};
