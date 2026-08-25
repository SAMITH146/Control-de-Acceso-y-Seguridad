// =============================================================================
// MÓDULO: DASHBOARD — ESTADÍSTICAS EN TIEMPO REAL (LA PERLA S.A.)
// =============================================================================
async function cargarDashboard() {
    try {
        const datos = await Api.dashboard.getStats();

        const stats = datos.stats || datos;
        const listaPlanta = datos.plantaList || datos.visitantes_en_planta || [];

        const elEnPlanta = document.getElementById('statEnPlanta');
        const elHoy = document.getElementById('statHoy');
        const elTotalVis = document.getElementById('statTotalVisitantes');
        const elListaNegra = document.getElementById('statListaNegra');

        if (elEnPlanta) elEnPlanta.textContent = stats.en_planta ?? 0;
        if (elHoy) elHoy.textContent = stats.visitas_hoy ?? 0;
        if (elTotalVis) elTotalVis.textContent = stats.total_visitantes ?? 0;
        if (elListaNegra) elListaNegra.textContent = stats.veto_activos ?? stats.en_lista_negra ?? 0;

        // Cargar tabla de visitantes en planta
        cargarTablaEnPlanta(listaPlanta);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

function cargarTablaEnPlanta(visitantes) {
    const tbody = document.getElementById('tbodyEnPlanta');

    if (visitantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">✅ No hay visitantes en la planta en este momento.</td></tr>';
        return;
    }

    tbody.innerHTML = visitantes.map((v, i) => `
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
                    <i class="ph ph-sign-out"></i> Salida
                </button>
            </td>
        </tr>
    `).join('');
}

function formatearTiempo(minutos) {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m}m`;
}
