// =============================================================================
// MÓDULO DE PORTERÍA — SOLICITUDES DE DESBLOQUEO Y VETO (LA PERLA S.A.)
// =============================================================================

function abrirModalSolicitarDesbloqueoDesdeAlerta() {
    if (!datosVetadoActual) {
        Toast.warning('No se encontraron los datos del visitante sancionado.');
        return;
    }
    abrirModalSolicitarDesbloqueo(
        datosVetadoActual.id_lista_negra,
        datosVetadoActual.id_visitante,
        datosVetadoActual.nombre_completo,
        datosVetadoActual.motivo_bloqueo
    );
}

function abrirModalSolicitarDesbloqueo(idListaNegra, idVisitante, nombre, motivoBloqueo) {
    document.getElementById('solicitudIdListaNegra').value = idListaNegra || '';
    document.getElementById('solicitudIdVisitante').value = idVisitante || '';
    document.getElementById('solicitudNombreVisitante').textContent = nombre || 'Visitante Sancionado';
    document.getElementById('solicitudMotivoBloqueo').textContent = `Motivo Sanción: ${motivoBloqueo || 'Sanción Activa'}`;
    document.getElementById('solicitudMotivoRazon').value = '';
    document.getElementById('modalSolicitarDesbloqueo').classList.remove('hidden');
}

function cerrarModalSolicitarDesbloqueo() {
    document.getElementById('modalSolicitarDesbloqueo').classList.add('hidden');
}

async function enviarSolicitudDesbloqueo(e) {
    e.preventDefault();

    const idListaNegra = document.getElementById('solicitudIdListaNegra').value;
    const idVisitante = document.getElementById('solicitudIdVisitante').value;
    const motivoSolicitud = document.getElementById('solicitudMotivoRazon').value.trim();

    if (!motivoSolicitud) {
        Toast.warning('Por favor ingresa la justificación o razón para solicitar el desbloqueo.');
        return;
    }

    try {
        const res = await Api.solicitudesDesbloqueo.crear({
            id_lista_negra: idListaNegra,
            id_visitante: idVisitante,
            motivo_solicitud: motivoSolicitud
        });

        const contentType = res.headers.get('content-type');
        let data = {};
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            throw new Error(`El servidor devolvió respuesta no válida (HTTP ${res.status}). Reinicia el servidor con 'node server.js'.`);
        }

        if (res.ok) {
            Toast.success(data.mensaje || 'Solicitud enviada exitosamente al Administrador.');
            cerrarModalSolicitarDesbloqueo();
        } else {
            Toast.error(data.error || 'No se pudo enviar la solicitud.');
        }
    } catch (err) {
        Toast.error('Error de conexión al enviar la solicitud: ' + err.message);
    }
}

// =============================================================================
// SOLICITUD DE BLOQUEO / VETO (PORTERÍA ➔ ADMIN)
// =============================================================================
function abrirModalSolicitarBloqueo(idVis, doc, nombre) {
    document.getElementById('solicitudBloqueoIdVisitante').value = idVis || '';
    document.getElementById('solicitudBloqueoNumDoc').value = doc || '';
    document.getElementById('solicitudBloqueoNombre').value = nombre || '';
    document.getElementById('solicitudBloqueoMotivoRazon').value = '';
    const statusMsg = document.getElementById('solicitudBloqueoStatus');
    const btnSubmit = document.getElementById('btnEnviarSolicitudBloqueo');
    if (statusMsg) {
        statusMsg.textContent = '';
        statusMsg.style.padding = '0';
        statusMsg.style.background = 'transparent';
    }
    if (btnSubmit) btnSubmit.disabled = false;

    document.getElementById('modalSolicitarBloqueo').classList.remove('hidden');

    if (doc) {
        autocompletarNombreBloqueo();
    }
}

async function autocompletarNombreBloqueo() {
    const doc = document.getElementById('solicitudBloqueoNumDoc').value.trim();
    const inputNombre = document.getElementById('solicitudBloqueoNombre');
    const inputIdVis = document.getElementById('solicitudBloqueoIdVisitante');
    const statusMsg = document.getElementById('solicitudBloqueoStatus');
    const btnSubmit = document.getElementById('btnEnviarSolicitudBloqueo');

    if (!doc) return;

    if (statusMsg) {
        statusMsg.textContent = '🔍 Consultando estado de la persona...';
        statusMsg.style.color = '#64748b';
        statusMsg.style.background = 'transparent';
        statusMsg.style.padding = '0';
    }

    try {
        const data = await Api.visitantes.buscarPorDocumento(doc);

        if (data.visitante) {
            inputIdVis.value = data.visitante.id_visitante;
            inputNombre.value = data.visitante.nombre_completo;
        } else {
            inputIdVis.value = '';
        }

        // VERIFICACIÓN CLARA: ¿ESTÁ EN PLANTA?
        if (data.en_planta) {
            if (btnSubmit) btnSubmit.disabled = true;
            if (statusMsg) {
                statusMsg.innerHTML = `⚠️ <strong>ACCESO DENEGADO PARA REPORTE DE BLOQUEO:</strong><br>Esta persona se encuentra actualmente <strong>EN PLANTA</strong> (Área: ${data.datos_visita_activa ? data.datos_visita_activa.area_destino : 'Planta'}).<br><em>Por seguridad, debes registrar primero su salida en portería antes de poder enviar una solicitud de bloqueo.</em>`;
                statusMsg.style.color = '#991b1b';
                statusMsg.style.background = '#fee2e2';
                statusMsg.style.borderLeft = '4px solid #dc2626';
                statusMsg.style.padding = '10px 12px';
                statusMsg.style.borderRadius = '6px';
                statusMsg.style.marginTop = '8px';
            }
            return;
        }

        // Habilitar si no está en planta
        if (btnSubmit) btnSubmit.disabled = false;

        if (data.visitante) {
            if (statusMsg) {
                statusMsg.textContent = `✓ Visitante Registrado: ${data.visitante.nombre_completo}`;
                statusMsg.style.color = '#0E773A';
                statusMsg.style.background = 'transparent';
                statusMsg.style.padding = '0';
            }
        } else {
            if (statusMsg) {
                statusMsg.textContent = 'ℹ️ Visitante no registrado previamente. Escribe el nombre completo.';
                statusMsg.style.color = '#d97706';
                statusMsg.style.background = 'transparent';
                statusMsg.style.padding = '0';
            }
        }
    } catch (e) {
        if (statusMsg) statusMsg.textContent = '';
    }
}

function cerrarModalSolicitarBloqueo() {
    document.getElementById('modalSolicitarBloqueo').classList.add('hidden');
}

async function enviarSolicitudBloqueo(e) {
    e.preventDefault();

    const idVisitante = document.getElementById('solicitudBloqueoIdVisitante').value;
    const numDoc = document.getElementById('solicitudBloqueoNumDoc').value.trim();
    const nombre = document.getElementById('solicitudBloqueoNombre').value.trim();
    const motivo = document.getElementById('solicitudBloqueoMotivoRazon').value.trim();

    if (!numDoc || !nombre || !motivo) {
        Toast.warning('Por favor completa todos los campos del reporte.');
        return;
    }

    try {
        const res = await Api.solicitudesBloqueo.crear({
            id_visitante: idVisitante || null,
            numero_documento: numDoc,
            nombre_visitante: nombre,
            motivo_solicitud: motivo
        });

        const contentType = res.headers.get('content-type');
        let data = {};
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            throw new Error(`El servidor devolvió respuesta no válida (HTTP ${res.status}). Reinicia el servidor con 'node server.js'.`);
        }

        if (res.ok) {
            Toast.success(data.mensaje || 'Solicitud de veto enviada al Administrador exitosamente.');
            cerrarModalSolicitarBloqueo();
        } else {
            Toast.error(data.error || 'No se pudo enviar la solicitud de bloqueo.');
        }
    } catch (err) {
        Toast.error('Error de conexión al enviar reporte: ' + err.message);
    }
}
