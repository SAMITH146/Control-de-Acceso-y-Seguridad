// =============================================================================
// MÓDULO: VISITANTES — DIRECTORIO MAESTRO (LA PERLA S.A.)
// =============================================================================
async function cargarTablaVisitantes() {
    const q = document.getElementById('inputBuscarVisitantesTabla')?.value || '';
    try {
        const visitantes = await Api.visitantes.getAll(q);
        const tbody = document.getElementById('tbodyVisitantes');

        if (!visitantes.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No se encontraron visitantes.</td></tr>';
            return;
        }

        tbody.innerHTML = visitantes.map((v, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${v.nombre_completo}</strong></td>
                <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${v.tipo_documento} ${v.numero_documento}</span></td>
                <td>${v.telefono || '—'}</td>
                <td>${v.eps}</td>
                <td><span style="font-weight:700;color:var(--verde);">${v.total_visitas ?? 0} visitas</span></td>
                <td>
                    ${v.esta_vetado > 0 ? '<span class="badge-vetado"><i class="ph ph-prohibit"></i> SANCIONADO</span>' : '<span class="badge-activo"><i class="ph ph-check"></i> AUTORIZADO</span>'}
                </td>
                <td>
                    <button class="btn-accion btn-editar" onclick="abrirModalEditarVisitante(${v.id_visitante})">
                        <i class="ph ph-pencil"></i> Editar
                    </button>
                    ${v.esta_vetado > 0 ? '' : `
                        <button class="btn-accion btn-bloquear" onclick="abrirModalBloquearVisitante(${v.id_visitante}, '${v.numero_documento}', '${v.nombre_completo.replace(/'/g, "\\'")}')">
                            <i class="ph ph-prohibit"></i> Vetar
                        </button>
                    `}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error cargando visitantes:', e); }
}

async function abrirModalEditarVisitante(id) {
    try {
        const res = await fetch(`/api/visitantes/${id}`);
        const v = await res.json();
        document.getElementById('editVisitanteId').value = v.id_visitante;
        document.getElementById('editVisitanteTipoDoc').value = v.tipo_documento;
        document.getElementById('editVisitanteNumDoc').value = v.numero_documento;
        document.getElementById('editVisitanteNombre').value = v.nombre_completo;
        document.getElementById('editVisitanteTelefono').value = v.telefono || '';
        document.getElementById('editVisitanteEps').value = v.eps;
        document.getElementById('modalEditarVisitante').classList.remove('hidden');
    } catch (e) { Toast.error('Error cargando datos del visitante.'); }
}

async function guardarEdicionVisitante(e) {
    e.preventDefault();
    const id = document.getElementById('editVisitanteId').value;
    const payload = {
        tipo_documento: document.getElementById('editVisitanteTipoDoc').value,
        numero_documento: document.getElementById('editVisitanteNumDoc').value,
        nombre_completo: document.getElementById('editVisitanteNombre').value,
        telefono: document.getElementById('editVisitanteTelefono').value,
        eps: document.getElementById('editVisitanteEps').value
    };

    try {
        const res = await Api.visitantes.editar(id, payload);
        if (!res.ok) throw new Error((await res.json()).error);
        cerrarModal('modalEditarVisitante');
        cargarTablaVisitantes();
    } catch (err) { Toast.error('Error: ' + err.message); }
}
