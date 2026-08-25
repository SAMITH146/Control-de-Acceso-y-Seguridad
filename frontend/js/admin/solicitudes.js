// =============================================================================
// MÓDULO: SOLICITUDES — APROBACIÓN/RECHAZO POR ADMIN (LA PERLA S.A.)
// =============================================================================
async function cargarSolicitudesPendientesAdmin() {
    try {
        const solicitudes = await Api.solicitudesDesbloqueo.getPendientes();
        const tbody = document.getElementById('tbodySolicitudesPendientes');
        const badgeCount = document.getElementById('badgeSolicitudesCount');

        if (!Array.isArray(solicitudes) || !solicitudes.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-state">✅ No hay solicitudes de desbloqueo pendientes en este momento.</td></tr>';
            if (badgeCount) badgeCount.textContent = '0 PENDIENTES';
            return;
        }

        if (badgeCount) badgeCount.textContent = `${solicitudes.length} PENDIENTES`;

        if (tbody) {
            tbody.innerHTML = solicitudes.map((s, i) => `
                <tr style="background:#fffbeb;">
                    <td>${i + 1}</td>
                    <td><strong>${s.visitante}</strong></td>
                    <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${s.tipo_documento} ${s.numero_documento}</span></td>
                    <td style="font-size:0.85rem;color:#b91c1c;"><strong>${s.motivo_bloqueo}</strong></td>
                    <td><i class="ph ph-user-shield" style="color:#d97706;"></i> <strong>${s.solicitado_por}</strong></td>
                    <td style="max-width:280px;font-size:0.88rem;color:#1e293b;background:#fef3c7;padding:8px;border-radius:6px;">
                        <i class="ph ph-chat-text"></i> ${s.motivo_solicitud}
                    </td>
                    <td style="font-size:0.8rem;">${new Date(s.fecha_solicitud).toLocaleString('es-CO')}</td>
                    <td>
                        <div style="display:flex;gap:6px;">
                            <button class="btn-accion" style="background:#0E773A;color:#fff;font-weight:700;padding:5px 10px;" onclick="aprobarSolicitudAdmin(${s.id_solicitud}, '${s.visitante.replace(/'/g, "\\'")}')">
                                <i class="ph ph-check-circle"></i> Aprobar
                            </button>
                            <button class="btn-accion" style="background:#dc2626;color:#fff;font-weight:700;padding:5px 10px;" onclick="rechazarSolicitudAdmin(${s.id_solicitud}, '${s.visitante.replace(/'/g, "\\'")}')">
                                <i class="ph ph-x-circle"></i> Rechazar
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) { console.error('Error cargando solicitudes pendientes:', e); }
}

async function aprobarSolicitudAdmin(idSolicitud, nombre) {
    const justificacion = prompt(`Escribe una nota para aprobar el desbloqueo de "${nombre}" (Opcional):`, 'Aprobado tras revisión de antecedentes.');
    if (justificacion === null) return;

    try {
        const res = await Api.solicitudesDesbloqueo.aprobar(idSolicitud, { respuesta_admin: justificacion });
        const data = await res.json();
        if (res.ok) {
            Toast.success(data.mensaje || 'Solicitud aprobada y visitante desbloqueado.');
            cargarSolicitudesPendientesAdmin();
            cargarTablaListaNegra();
        } else {
            Toast.error('Error: ' + (data.error || 'No se pudo aprobar la solicitud'));
        }
    } catch (e) {
        Toast.error('Error al aprobar solicitud: ' + e.message);
    }
}

async function rechazarSolicitudAdmin(idSolicitud, nombre) {
    const razonRechazo = prompt(`Indica la razón del rechazo para la solicitud de "${nombre}":`, 'Rechazado: Mantiene la restricción de seguridad activa.');
    if (razonRechazo === null) return;

    try {
        const res = await Api.solicitudesDesbloqueo.rechazar(idSolicitud, { respuesta_admin: razonRechazo });
        const data = await res.json();
        if (res.ok) {
            Toast.info(data.mensaje || 'Solicitud rechazada.');
            cargarSolicitudesPendientesAdmin();
        } else {
            Toast.error('Error: ' + (data.error || 'No se pudo rechazar la solicitud'));
        }
    } catch (e) {
        Toast.error('Error al rechazar solicitud: ' + e.message);
    }
}

// =============================================================================
// MÓDULO: SOLICITUDES DE BLOQUEO / VETO (APROBACIÓN / RECHAZO POR ADMIN)
// =============================================================================
async function cargarSolicitudesBloqueoPendientesAdmin() {
    try {
        const solicitudes = await Api.solicitudesBloqueo.getPendientes();
        const tbody = document.getElementById('tbodySolicitudesBloqueoPendientes');
        const badgeCount = document.getElementById('badgeSolicitudesBloqueoCount');

        if (!Array.isArray(solicitudes) || !solicitudes.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-state">✅ No hay reportes de veto pendientes en este momento.</td></tr>';
            if (badgeCount) badgeCount.textContent = '0 PENDIENTES';
            return;
        }

        if (badgeCount) badgeCount.textContent = `${solicitudes.length} PENDIENTES`;

        if (tbody) {
            tbody.innerHTML = solicitudes.map((s, i) => `
                <tr style="background:#fef2f2;">
                    <td>${i + 1}</td>
                    <td><strong>${s.nombre_visitante}</strong></td>
                    <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">CC ${s.numero_documento}</span></td>
                    <td><i class="ph ph-user-shield" style="color:#dc2626;"></i> <strong>${s.solicitado_por}</strong></td>
                    <td style="max-width:280px;font-size:0.88rem;color:#991b1b;background:#fee2e2;padding:8px;border-radius:6px;">
                        <i class="ph ph-warning-octagon"></i> ${s.motivo_solicitud}
                    </td>
                    <td style="font-size:0.8rem;">${new Date(s.fecha_solicitud).toLocaleString('es-CO')}</td>
                    <td>
                        <div style="display:flex;gap:6px;">
                            <button class="btn-accion" style="background:#dc2626;color:#fff;font-weight:700;padding:5px 10px;" onclick="aprobarSolicitudBloqueoAdmin(${s.id_solicitud_bloqueo}, '${s.nombre_visitante.replace(/'/g, "\\'")}')">
                                <i class="ph ph-shield-check"></i> Aprobar Veto
                            </button>
                            <button class="btn-accion" style="background:#64748b;color:#fff;font-weight:700;padding:5px 10px;" onclick="rechazarSolicitudBloqueoAdmin(${s.id_solicitud_bloqueo}, '${s.nombre_visitante.replace(/'/g, "\\'")}')">
                                <i class="ph ph-x-circle"></i> Rechazar
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) { console.error('Error cargando solicitudes de bloqueo pendientes:', e); }
}

async function aprobarSolicitudBloqueoAdmin(idSolicitud, nombre) {
    const notaAdmin = prompt(`Escribe una nota para confirmar el VETO y BLOQUEO OFICIAL de "${nombre}":`, 'Bloqueo aprobado tras reporte de seguridad.');
    if (notaAdmin === null) return;

    try {
        const res = await Api.solicitudesBloqueo.aprobar(idSolicitud, { respuesta_admin: notaAdmin });
        const data = await res.json();
        if (res.ok) {
            Toast.success(data.mensaje || 'Solicitud aprobada. El visitante ha sido vetado de La Perla S.A.');
            cargarSolicitudesBloqueoPendientesAdmin();
            cargarTablaListaNegra();
        } else {
            Toast.error('Error: ' + (data.error || 'No se pudo aprobar la solicitud de veto'));
        }
    } catch (e) {
        Toast.error('Error al aprobar veto: ' + e.message);
    }
}

async function rechazarSolicitudBloqueoAdmin(idSolicitud, nombre) {
    const razonRechazo = prompt(`Indica la razón para rechazar la propuesta de veto de "${nombre}":`, 'Rechazado: Reporte no procedente.');
    if (razonRechazo === null) return;

    try {
        const res = await Api.solicitudesBloqueo.rechazar(idSolicitud, { respuesta_admin: razonRechazo });
        const data = await res.json();
        if (res.ok) {
            Toast.info(data.mensaje || 'Solicitud de bloqueo rechazada.');
            cargarSolicitudesBloqueoPendientesAdmin();
        } else {
            Toast.error('Error: ' + (data.error || 'No se pudo rechazar la solicitud de veto'));
        }
    } catch (e) {
        Toast.error('Error al rechazar veto: ' + e.message);
    }
}
