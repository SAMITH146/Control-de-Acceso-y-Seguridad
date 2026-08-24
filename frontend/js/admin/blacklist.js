// =============================================================================
// MÓDULO: LISTA NEGRA — BLOQUEO Y DESBLOQUEO (LA PERLA S.A.)
// =============================================================================
async function cargarTablaListaNegra() {
    try {
        const res = await fetch('/api/lista-negra');
        const lista = await res.json();
        const tbody = document.getElementById('tbodyListaNegra');

        if (!lista.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">✅ No hay visitantes sancionados en este momento.</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map((item, i) => `
            <tr style="${item.estado_activo ? 'background:#fff5f5;' : 'opacity:0.75;'}">
                <td>${i + 1}</td>
                <td><strong>${item.visitante}</strong></td>
                <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${item.tipo_documento} ${item.numero_documento}</span></td>
                <td>${new Date(item.fecha_bloqueo).toLocaleDateString('es-CO')}</td>
                <td style="max-width:250px;font-size:0.85rem;color:#b91c1c;"><strong>${item.motivo_bloqueo}</strong></td>
                <td>${item.registrado_por}</td>
                <td>
                    ${item.estado_activo ? '<span class="badge-vetado">BLOQUEO ACTIVO</span>' : '<span class="badge-inactivo">LEVANTADO</span>'}
                </td>
                <td>
                    ${item.estado_activo ? `
                        <button class="btn-accion btn-desbloquear" onclick="abrirModalDesbloquear(${item.id_lista_negra}, '${item.visitante.replace(/'/g, "\\'")}')">
                            <i class="ph ph-lock-open"></i> Desbloquear
                        </button>
                    ` : `<span style="font-size:0.75rem;color:#64748b;">Levantado: ${item.motivo_desbloqueo || '—'}</span>`}
                    <button class="btn-accion" style="background:#fee2e2;color:#991b1b;margin-left:4px;padding:4px 8px;" onclick="eliminarSancionListaNegra(${item.id_lista_negra})" title="Eliminar registro">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error cargando lista negra:', e); }
}

async function eliminarSancionListaNegra(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de la lista negra permanentemente?')) return;
    try {
        const res = await fetch(`/api/lista-negra/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            alert('✅ ' + (data.mensaje || 'Registro eliminado'));
            cargarTablaListaNegra();
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo eliminar el registro'));
        }
    } catch (e) {
        alert('❌ Error eliminando registro: ' + e.message);
    }
}

function abrirModalBloquearDirecto() {
    document.getElementById('bloquearIdVisitante').value = '';
    document.getElementById('bloqueoDocGroup').style.display = 'block';
    document.getElementById('bloquearNumeroDoc').value = '';
    document.getElementById('bloquearNombreVisitante').value = '(Se buscará por cédula)';
    document.getElementById('bloquearMotivo').value = '';
    document.getElementById('modalBloquear').classList.remove('hidden');
}

function abrirModalBloquearVisitante(id, doc, nombre) {
    document.getElementById('bloquearIdVisitante').value = id;
    document.getElementById('bloqueoDocGroup').style.display = 'none';
    document.getElementById('bloquearNumeroDoc').value = doc;
    document.getElementById('bloquearNombreVisitante').value = nombre;
    document.getElementById('bloquearMotivo').value = '';
    document.getElementById('modalBloquear').classList.remove('hidden');
}

async function confirmarBloqueo(e) {
    e.preventDefault();
    const idVisitante = document.getElementById('bloquearIdVisitante').value;
    const numeroDoc = document.getElementById('bloquearNumeroDoc').value;
    const nombreVis = document.getElementById('bloquearNombreVisitante').value;
    const motivo = document.getElementById('bloquearMotivo').value;

    try {
        const res = await fetch('/api/lista-negra/bloquear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_visitante: idVisitante || null,
                numero_documento: numeroDoc || null,
                nombre_visitante: nombreVis || null,
                motivo_bloqueo: motivo,
                id_usuario_registro: usuarioActivo.id_usuario
            })
        });

        if (!res.ok) throw new Error((await res.json()).error);

        cerrarModal('modalBloquear');
        cargarDashboard();
        cargarTablaListaNegra();
        cargarTablaVisitantes();
    } catch (err) { alert('❌ Error: ' + err.message); }
}

function abrirModalDesbloquear(idListaNegra, nombre) {
    document.getElementById('desbloquearIdListaNegra').value = idListaNegra;
    document.getElementById('desbloquearNombreVisitante').textContent = nombre;
    document.getElementById('desbloquearMotivo').value = '';
    document.getElementById('modalDesbloquear').classList.remove('hidden');
}

async function confirmarDesbloqueo(e) {
    e.preventDefault();
    const id = document.getElementById('desbloquearIdListaNegra').value;
    const motivo = document.getElementById('desbloquearMotivo').value;

    try {
        const res = await fetch(`/api/lista-negra/desbloquear/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                motivo_desbloqueo: motivo,
                id_usuario_desbloqueo: usuarioActivo.id_usuario
            })
        });

        if (!res.ok) throw new Error((await res.json()).error);

        cerrarModal('modalDesbloquear');
        cargarDashboard();
        cargarTablaListaNegra();
        cargarTablaVisitantes();
    } catch (err) { alert('❌ Error: ' + err.message); }
}
