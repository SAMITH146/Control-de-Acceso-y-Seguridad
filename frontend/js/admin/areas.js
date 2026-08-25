// =============================================================================
// MÓDULO: ÁREAS (LA PERLA S.A.)
// =============================================================================
async function cargarTablaAreas() {
    try {
        const areas = await Api.areas.getAllAdmin();
        const tbody = document.getElementById('tbodyAreas');

        if (!areas.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay áreas registradas aún.</td></tr>';
            return;
        }

        tbody.innerHTML = areas.map((a, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${a.nombre_area}</strong></td>
                <td>${a.descripcion || '—'}</td>
                <td>${badgeEstado(a.estado_activo)}</td>
                <td>
                    <button class="btn-accion btn-editar" onclick="editarArea(${a.id_area})">
                        <i class="ph ph-pencil"></i> Editar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error cargando áreas:', e); }
}

function abrirModalArea() {
    document.getElementById('areaId').value = '';
    document.getElementById('areaNombre').value = '';
    document.getElementById('areaDescripcion').value = '';
    document.getElementById('areaEstado').value = '1';
    document.getElementById('modalAreaTitulo').innerHTML = '<i class="ph ph-buildings"></i> Nueva Área';
    document.getElementById('modalArea').classList.remove('hidden');
}

async function editarArea(id) {
    try {
        const res = await fetch(`/api/areas/${id}`);
        const area = await res.json();
        document.getElementById('areaId').value = area.id_area;
        document.getElementById('areaNombre').value = area.nombre_area;
        document.getElementById('areaDescripcion').value = area.descripcion || '';
        document.getElementById('areaEstado').value = area.estado_activo;
        document.getElementById('modalAreaTitulo').innerHTML = '<i class="ph ph-pencil"></i> Editar Área';
        document.getElementById('modalArea').classList.remove('hidden');
    } catch (e) { Toast.error('Error cargando datos del área.'); }
}

async function guardarArea(e) {
    e.preventDefault();
    const id = document.getElementById('areaId').value;
    const payload = {
        nombre_area: document.getElementById('areaNombre').value,
        descripcion: document.getElementById('areaDescripcion').value,
        estado_activo: document.getElementById('areaEstado').value
    };

    try {
        const res = id ? await Api.areas.editar(id, payload) : await Api.areas.crear(payload);
        if (!res.ok) throw new Error((await res.json()).error);
        cerrarModal('modalArea');
        cargarTablaAreas();
        cargarSelectAreas();
    } catch (err) { Toast.error('Error: ' + err.message); }
}
