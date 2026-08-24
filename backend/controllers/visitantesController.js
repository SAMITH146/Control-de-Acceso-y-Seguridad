// backend/controllers/visitantesController.js
const db = require('../db');

// Buscar visitante (por número de documento o query genérico)
exports.buscarVisitante = async (req, res) => {
    const { documento, q } = req.query;

    if (documento) {
        const docTrimmed = documento.trim();
        try {
            const [rows] = await db.execute(
                `SELECT * FROM visitantes WHERE numero_documento = ?`,
                [docTrimmed]
            );

            let visitante = rows.length > 0 ? rows[0] : null;
            let id_lista_negra = null;
            let en_lista_negra = false;
            let motivo_bloqueo = null;

            let en_planta = false;
            let datos_visita_activa = null;

            if (visitante) {
                const [sancion] = await db.execute(
                    `SELECT id_lista_negra, motivo_bloqueo FROM lista_negra WHERE id_visitante = ? AND estado_activo = 1`,
                    [visitante.id_visitante]
                );
                if (sancion.length > 0) {
                    en_lista_negra = true;
                    motivo_bloqueo = sancion[0].motivo_bloqueo;
                    id_lista_negra = sancion[0].id_lista_negra;
                }

                const [planta] = await db.execute(
                    `SELECT bv.id_visita, bv.fecha_hora_ingreso, a.nombre_area AS area_destino 
                     FROM bitacora_visitas bv
                     LEFT JOIN areas a ON bv.id_area_destino = a.id_area
                     WHERE bv.id_visitante = ? AND bv.estado_visita = 'EN_PLANTA'`,
                    [visitante.id_visitante]
                );
                if (planta.length > 0) {
                    en_planta = true;
                    datos_visita_activa = planta[0];
                }
            } else {
                const [sancionDoc] = await db.execute(
                    `SELECT ln.id_lista_negra, ln.motivo_bloqueo, v.id_visitante, v.nombre_completo, v.tipo_documento, v.numero_documento 
                     FROM lista_negra ln 
                     INNER JOIN visitantes v ON ln.id_visitante = v.id_visitante 
                     WHERE v.numero_documento = ? AND ln.estado_activo = 1`,
                    [docTrimmed]
                );
                if (sancionDoc.length > 0) {
                    en_lista_negra = true;
                    motivo_bloqueo = sancionDoc[0].motivo_bloqueo;
                    id_lista_negra = sancionDoc[0].id_lista_negra;
                    visitante = {
                        id_visitante: sancionDoc[0].id_visitante,
                        nombre_completo: sancionDoc[0].nombre_completo,
                        tipo_documento: sancionDoc[0].tipo_documento,
                        numero_documento: sancionDoc[0].numero_documento
                    };
                }

                const [plantaDoc] = await db.execute(
                    `SELECT bv.id_visita, bv.fecha_hora_ingreso, a.nombre_area AS area_destino 
                     FROM bitacora_visitas bv
                     INNER JOIN visitantes v ON bv.id_visitante = v.id_visitante
                     LEFT JOIN areas a ON bv.id_area_destino = a.id_area
                     WHERE v.numero_documento = ? AND bv.estado_visita = 'EN_PLANTA'`,
                    [docTrimmed]
                );
                if (plantaDoc.length > 0) {
                    en_planta = true;
                    datos_visita_activa = plantaDoc[0];
                }
            }

            return res.json({
                id_lista_negra,
                en_lista_negra,
                motivo_bloqueo,
                en_planta,
                datos_visita_activa,
                visitante
            });
        } catch (err) {
            console.error('Error en visitantesController.buscarVisitante:', err);
            return res.status(500).json({ error: 'Error al consultar visitante' });
        }
    }

    if (q) {
        try {
            const term = `%${q.trim()}%`;
            const [rows] = await db.execute(`
                SELECT id_visitante, nombre_completo, tipo_documento, numero_documento
                FROM visitantes
                WHERE nombre_completo LIKE ? OR numero_documento LIKE ?
                ORDER BY nombre_completo LIMIT 20
            `, [term, term]);
            return res.json(rows);
        } catch (err) {
            console.error('Error en visitantesController.buscarVisitante (autocomplete):', err);
            return res.status(500).json({ error: 'Error buscando visitantes' });
        }
    }

    return res.json({ en_lista_negra: false, visitante: null });
};

// Listar todos los visitantes (paginado y búsqueda)
exports.getVisitantes = async (req, res) => {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 100);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const q = (req.query.q || '').trim();

    try {
        let sql = `
            SELECT v.*,
                   (SELECT COUNT(*) FROM bitacora_visitas b WHERE b.id_visitante = v.id_visitante) AS total_visitas,
                   (SELECT COUNT(*) FROM lista_negra ln WHERE ln.id_visitante = v.id_visitante AND ln.estado_activo = 1) AS esta_vetado
            FROM visitantes v
        `;
        const params = [];

        if (q) {
            sql += ` WHERE v.nombre_completo LIKE ? OR v.numero_documento LIKE ?`;
            params.push(`%${q}%`, `%${q}%`);
        }

        sql += ` ORDER BY v.nombre_completo LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Error en visitantesController.getVisitantes:', err);
        res.status(500).json({ error: 'Error cargando visitantes' });
    }
};

// Obtener visitante por ID
exports.getVisitanteById = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM visitantes WHERE id_visitante = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Visitante no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo visitante' });
    }
};

// Crear visitante
exports.createVisitante = async (req, res) => {
    const { tipo_documento, numero_documento, nombre_completo, eps, estado_activo } = req.body;
    try {
        const [result] = await db.execute(`
            INSERT INTO visitantes (tipo_documento, numero_documento, nombre_completo, eps, estado_activo)
            VALUES (?, ?, ?, ?, ?)
        `, [tipo_documento, numero_documento, nombre_completo, eps || 'N/A', estado_activo ?? 1]);
        res.json({ mensaje: 'Visitante creado', id_visitante: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Visitante ya existe' });
        res.status(500).json({ error: 'Error creando visitante: ' + err.message });
    }
};

// Actualizar visitante
exports.updateVisitante = async (req, res) => {
    const { tipo_documento, numero_documento, nombre_completo, eps, estado_activo } = req.body;
    try {
        await db.execute(`
            UPDATE visitantes SET tipo_documento = ?, numero_documento = ?, nombre_completo = ?, eps = ?, estado_activo = ?
            WHERE id_visitante = ?
        `, [tipo_documento, numero_documento, nombre_completo, eps, estado_activo, req.params.id]);
        res.json({ mensaje: 'Visitante actualizado' });
    } catch (err) {
        res.status(500).json({ error: 'Error actualizando visitante: ' + err.message });
    }
};
