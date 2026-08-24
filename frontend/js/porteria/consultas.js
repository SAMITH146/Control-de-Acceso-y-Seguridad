// =============================================================================
// MÓDULO DE PORTERÍA — CONSULTAS: LISTA NEGRA & MI TURNO (LA PERLA S.A.)
// =============================================================================

async function buscarEnListaNegraPorteria() {
    const q = document.getElementById('inputBuscarListaNegraPorteria')?.value.toLowerCase().trim() || '';
    try {
        const res = await fetch('/api/lista-negra');
        const lista = await res.json();
        const tbody = document.getElementById('tbodyListaNegraPorteria');

        const filtrados = lista.filter(item => {
            if (!q) return item.estado_activo === 1; // Por defecto mostrar solo los bloqueos vigentes
            return item.visitante.toLowerCase().includes(q) || item.numero_documento.toLowerCase().includes(q);
        });

        if (!filtrados.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty">✅ No se encontraron registros de sanción para este criterio.</td></tr>';
            return;
        }

        tbody.innerHTML = filtrados.map(item => `
            <tr style="${item.estado_activo ? 'background:#fff5f5;' : ''}">
                <td><strong>${item.visitante}</strong></td>
                <td><span style="font-size:0.8rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${item.tipo_documento} ${item.numero_documento}</span></td>
                <td>${new Date(item.fecha_bloqueo).toLocaleDateString('es-CO')}</td>
                <td style="color:#b91c1c;font-weight:700;">${item.motivo_bloqueo}</td>
                <td>
                    ${item.estado_activo ? '<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:800;">VETADO</span>' : '<span style="background:#f1f5f9;color:#64748b;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:800;">LEVANTADO</span>'}
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Error consultando lista negra:', e);
    }
}

// =============================================================================
// TAB 4: MI TURNO (HOY)
// =============================================================================
async function cargarMiTurno() {
    const hoy = new Date().toISOString().split('T')[0];
    try {
        const res = await fetch(`/api/bitacora?desde=${hoy}&hasta=${hoy}`);
        const bitacora = await res.json();
        const tbody = document.getElementById('tbodyMiTurno');

        if (!bitacora.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">Aún no hay registros de visitas en la jornada de hoy.</td></tr>';
            return;
        }

        tbody.innerHTML = bitacora.map(b => {
            const hEntrada = new Date(b.fecha_hora_ingreso).toLocaleTimeString('es-CO');
            const hSalida = b.fecha_hora_salida ? new Date(b.fecha_hora_salida).toLocaleTimeString('es-CO') : '<strong style="color:#0E773A;">En Planta</strong>';
            
            return `
                <tr>
                    <td><strong>${hEntrada}</strong></td>
                    <td>${hSalida}</td>
                    <td><strong>${b.visitante}</strong></td>
                    <td><span style="font-size:0.8rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${b.tipo_documento} ${b.numero_documento}</span></td>
                    <td>${b.area_destino}</td>
                    <td>${b.empleado_anfitrion}</td>
                    <td style="max-width:180px;font-size:0.8rem;">${b.objetos_ingresados || '—'}</td>
                    <td>
                        ${b.estado_visita === 'EN_PLANTA' ? '<span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:800;">EN PLANTA</span>' : '<span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:800;">FINALIZADO</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('Error cargando mi turno:', e);
    }
}
