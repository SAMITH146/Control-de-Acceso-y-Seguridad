// =============================================================================
// MÓDULO DE PORTERÍA — EN PLANTA & SALIDAS (LA PERLA S.A.)
// =============================================================================

async function cargarVisitasEnPlantaPorteria() {
    try {
        const res = await fetch('/api/visitas/activas');
        const visitas = await res.json();
        listaVisitasEnPlantaCache = visitas;
        renderTablaPlanta(visitas);
        document.getElementById('badgeEnPlantaCount').textContent = visitas.length;
    } catch (e) {
        console.error('Error cargando visitas activas:', e);
    }
}

function renderTablaPlanta(visitas) {
    const tbody = document.getElementById('tbodyPlantaPorteria');
    if (!visitas.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty">✅ No hay personas externas dentro de la planta actualmente.</td></tr>';
        return;
    }

    tbody.innerHTML = visitas.map((v, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${v.visitante}</strong></td>
            <td><span style="font-size:0.8rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${v.tipo_documento} ${v.numero_documento}</span></td>
            <td>${v.eps || '—'}</td>
            <td>${v.area_destino}</td>
            <td>${v.empleado_anfitrion}</td>
            <td>${new Date(v.fecha_hora_ingreso).toLocaleTimeString('es-CO')}</td>
            <td><strong style="color:${v.minutos_en_planta > 120 ? '#dc2626' : '#0E773A'};">${formatearMinutos(v.minutos_en_planta)}</strong></td>
            <td style="max-width:200px;font-size:0.82rem;">${v.objetos_ingresados || 'Ninguno'}</td>
            <td>
                <button class="btn-dar-salida" onclick="abrirModalSalidaPorteria(${v.id_visita}, '${v.visitante.replace(/'/g, "\\'")}', '${(v.objetos_ingresados || 'Ninguno').replace(/'/g, "\\'")}')">
                    <i class="ph ph-sign-out"></i> Dar Salida
                </button>
            </td>
        </tr>
    `).join('');
}

function filtrarTablaPlanta() {
    const txt = document.getElementById('filtroPlanta').value.toLowerCase().trim();
    if (!txt) {
        renderTablaPlanta(listaVisitasEnPlantaCache);
        return;
    }
    const filtrados = listaVisitasEnPlantaCache.filter(v => 
        v.visitante.toLowerCase().includes(txt) ||
        v.numero_documento.toLowerCase().includes(txt) ||
        v.empleado_anfitrion.toLowerCase().includes(txt) ||
        v.area_destino.toLowerCase().includes(txt)
    );
    renderTablaPlanta(filtrados);
}

function formatearMinutos(m) {
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// Modal de Salida
function abrirModalSalidaPorteria(idVisita, nombre, objetos) {
    document.getElementById('salidaPorteriaIdVisita').value = idVisita;
    document.getElementById('salidaPorteriaNombre').textContent = nombre;
    document.getElementById('salidaPorteriaObjetos').textContent = objetos || 'Ningún objeto registrado.';
    document.getElementById('salidaPorteriaObs').value = '';
    document.getElementById('modalSalidaPorteria').classList.remove('hidden');
}

function cerrarModalSalida() {
    document.getElementById('modalSalidaPorteria').classList.add('hidden');
}

async function ejecutarSalidaPorteria(e) {
    e.preventDefault();
    const idVisita = document.getElementById('salidaPorteriaIdVisita').value;
    const obs = document.getElementById('salidaPorteriaObs').value;

    try {
        const res = await fetch(`/api/visitas/salida/${idVisita}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_escolta_salida: usuarioActivo.id_usuario,
                observaciones_salida: obs
            })
        });

        if (!res.ok) throw new Error((await res.json()).error);

        cerrarModalSalida();
        cargarVisitasEnPlantaPorteria();
        actualizarConteoEnPlanta();
    } catch (err) {
        alert('❌ Error al registrar salida: ' + err.message);
    }
}
