// =============================================================================
// MÓDULO: EMPLEADOS (LA PERLA S.A.)
// =============================================================================
async function cargarTablaEmpleados() {
    try {
        const empleados = await Api.empleados.getAllAdmin();
        const tbody = document.getElementById('tbodyEmpleados');

        if (!empleados.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay empleados registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = empleados.map((em, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${em.nombres} ${em.apellidos}</strong></td>
                <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${em.tipo_documento} ${em.numero_documento}</span></td>
                <td>${em.cargo}</td>
                <td>${em.nombre_area}</td>
                <td>${em.email_corporativo}</td>
                <td>${badgeEstado(em.estado_activo)}</td>
                <td>
                    <button class="btn-accion btn-editar" onclick="editarEmpleado(${em.id_empleado})">
                        <i class="ph ph-pencil"></i> Editar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error cargando empleados:', e); }
}

async function abrirModalEmpleado() {
    document.getElementById('empleadoId').value = '';
    document.getElementById('empleadoTipoDoc').value = 'CC';
    document.getElementById('empleadoNumDoc').value = '';
    document.getElementById('empleadoNombres').value = '';
    document.getElementById('empleadoApellidos').value = '';
    document.getElementById('empleadoCargo').value = '';
    document.getElementById('empleadoEmail').value = '';
    document.getElementById('empleadoTelefono').value = '';
    document.getElementById('empleadoEstado').value = '1';
    document.getElementById('modalEmpleadoTitulo').innerHTML = '<i class="ph ph-identification-card"></i> Nuevo Empleado';

    // Cargar áreas en el select del modal
    await cargarSelectAreasModal();
    document.getElementById('modalEmpleado').classList.remove('hidden');
}

async function editarEmpleado(id) {
    try {
        const em = await Api.empleados.getById(id);
        await cargarSelectAreasModal();

        document.getElementById('empleadoId').value = em.id_empleado;
        document.getElementById('empleadoTipoDoc').value = em.tipo_documento;
        document.getElementById('empleadoNumDoc').value = em.numero_documento;
        document.getElementById('empleadoNombres').value = em.nombres;
        document.getElementById('empleadoApellidos').value = em.apellidos;
        document.getElementById('empleadoCargo').value = em.cargo;
        document.getElementById('empleadoArea').value = em.id_area;
        document.getElementById('empleadoEmail').value = em.email_corporativo;
        document.getElementById('empleadoTelefono').value = em.telefono_contacto || '';
        document.getElementById('empleadoEstado').value = em.estado_activo;
        document.getElementById('modalEmpleadoTitulo').innerHTML = '<i class="ph ph-pencil"></i> Editar Empleado';
        document.getElementById('modalEmpleado').classList.remove('hidden');
    } catch (e) { Toast.error('Error cargando datos del empleado.'); }
}

async function cargarSelectAreasModal() {
    const areas = await Api.areas.getAll();
    const select = document.getElementById('empleadoArea');
    select.innerHTML = '<option value="">-- Selecciona el área --</option>';
    areas.forEach(a => {
        select.innerHTML += `<option value="${a.id_area}">${a.nombre_area}</option>`;
    });
}

async function guardarEmpleado(e) {
    e.preventDefault();
    const id = document.getElementById('empleadoId').value;
    const payload = {
        tipo_documento: document.getElementById('empleadoTipoDoc').value,
        numero_documento: document.getElementById('empleadoNumDoc').value,
        nombres: document.getElementById('empleadoNombres').value,
        apellidos: document.getElementById('empleadoApellidos').value,
        cargo: document.getElementById('empleadoCargo').value,
        id_area: document.getElementById('empleadoArea').value,
        email_corporativo: document.getElementById('empleadoEmail').value,
        telefono_contacto: document.getElementById('empleadoTelefono').value || null,
        estado_activo: document.getElementById('empleadoEstado').value
    };

    try {
        const res = id ? await Api.empleados.editar(id, payload) : await Api.empleados.crear(payload);
        if (!res.ok) throw new Error((await res.json()).error);
        cerrarModal('modalEmpleado');
        cargarTablaEmpleados();
        cargarSelectEmpleados();
    } catch (err) { Toast.error('Error: ' + err.message); }
}
