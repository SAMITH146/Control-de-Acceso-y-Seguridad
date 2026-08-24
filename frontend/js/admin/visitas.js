// =============================================================================
// MÓDULO: VISITAS ACTIVAS & REGISTRAR SALIDA (LA PERLA S.A.)
// =============================================================================
async function cargarTablaVisitasActivas() {
    try {
        const res = await fetch('/api/visitas/activas');
        const visitas = await res.json();
        const tbody = document.getElementById('tbodyVisitasActivas');

        if (!visitas.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-state">✅ No hay visitantes en la planta en este momento.</td></tr>';
            return;
        }

        tbody.innerHTML = visitas.map((v, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${v.visitante}</strong></td>
                <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${v.tipo_documento} ${v.numero_documento}</span></td>
                <td>${v.eps ?? '-'}</td>
                <td>${v.area_destino}</td>
                <td>${v.empleado_anfitrion}</td>
                <td>${new Date(v.fecha_hora_ingreso).toLocaleTimeString('es-CO')}</td>
                <td><span style="color:${v.minutos_en_planta > 120 ? '#dc2626' : '#0E773A'};font-weight:700;">${formatearTiempo(v.minutos_en_planta)}</span></td>
                <td style="max-width:200px;font-size:0.82rem;">${v.objetos_ingresados ?? '—'}</td>
                <td>
                    <button class="btn-accion btn-salida" onclick="abrirModalSalida(${v.id_visita}, '${v.visitante.replace(/'/g, "\\'")}', '${(v.objetos_ingresados || 'Ninguno').replace(/'/g, "\\'")}')">
                        <i class="ph ph-sign-out"></i> Registrar Salida
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error cargando visitas activas:', e); }
}

function abrirModalSalida(idVisita, nombre, objetos) {
    document.getElementById('salidaIdVisita').value = idVisita;
    document.getElementById('salidaNombreVisitante').textContent = nombre;
    document.getElementById('salidaObjetosReportados').textContent = objetos || 'Ningún objeto registrado al ingreso.';
    document.getElementById('salidaObservaciones').value = '';
    document.getElementById('modalSalida').classList.remove('hidden');
}

async function confirmarSalida(e) {
    e.preventDefault();
    const idVisita = document.getElementById('salidaIdVisita').value;
    const observaciones = document.getElementById('salidaObservaciones').value;

    try {
        const res = await fetch(`/api/visitas/salida/${idVisita}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_escolta_salida: usuarioActivo.id_usuario,
                observaciones_salida: observaciones
            })
        });

        if (!res.ok) throw new Error((await res.json()).error);

        cerrarModal('modalSalida');
        cargarDashboard();
        cargarTablaVisitasActivas();
    } catch (err) {
        alert('❌ Error al registrar salida: ' + err.message);
    }
}
