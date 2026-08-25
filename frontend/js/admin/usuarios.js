// =============================================================================
// MÓDULO: USUARIOS (LA PERLA S.A.)
// =============================================================================
async function cargarTablaUsuarios() {
    try {
        const usuarios = await Api.usuarios.getAll();
        const tbody = document.getElementById('tbodyUsuarios');

        if (!usuarios.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay usuarios registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map((u, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${u.nombre_completo || '—'}</strong></td>
                <td><span style="font-size:0.8rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${u.numero_documento || '—'}</span></td>
                <td><span style="font-weight:600;"><i class="ph ph-user-circle"></i> ${u.username}</span></td>
                <td>${u.email || '—'}</td>
                <td>${u.nombre_rol}</td>
                <td>${badgeEstado(u.estado_activo)}</td>
                <td style="white-space:nowrap;">
                    <button class="btn-accion btn-editar" onclick="editarUsuario(${u.id_usuario})">
                        <i class="ph ph-pencil"></i> Editar
                    </button>
                    <button class="btn-accion" style="background:${u.estado_activo ? '#d97706' : '#15803d'};color:#fff;margin-left:4px;" onclick="toggleEstadoUsuario(${u.id_usuario}, ${u.estado_activo}, '${u.username.replace(/'/g, "\\'")}')" title="${u.estado_activo ? 'Inhabilitar temporalmente' : 'Habilitar acceso'}">
                        <i class="ph ph-${u.estado_activo ? 'prohibit' : 'check-circle'}"></i> ${u.estado_activo ? 'Inhabilitar' : 'Habilitar'}
                    </button>
                    
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error cargando usuarios:', e); }
}

async function toggleEstadoUsuario(id, estadoActual, username) {
    const nuevoEstado = estadoActual ? 0 : 1;
    const accionTxt = nuevoEstado ? 'habilitar el acceso a' : 'inhabilitar temporalmente a';

    if (!confirm(`¿Deseas ${accionTxt} el usuario '${username}'?`)) {
        return;
    }

    try {
        const res = await Api.usuarios.toggleEstado(id);

        const data = await res.json();
        if (res.ok) {
            Toast.success(data.mensaje || 'Acción procesada correctamente.');
            cargarTablaUsuarios();
        } else {
            Toast.error(data.error || 'No se pudo cambiar el estado.');
        }
    } catch (err) {
        Toast.error('Error al cambiar estado: ' + err.message);
    }
}

function abrirModalUsuario() {
    document.getElementById('usuarioId').value = '';
    document.getElementById('usuarioNombreCompleto').value = '';
    document.getElementById('usuarioNumeroDocumento').value = '';
    document.getElementById('usuarioUsername').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioPassword').value = '';
    document.getElementById('usuarioRol').value = '2';
    document.getElementById('usuarioEstado').value = '1';
    document.getElementById('modalUsuarioTitulo').innerHTML = '<i class="ph ph-user-plus"></i> Nuevo Usuario';
    document.getElementById('modalUsuario').classList.remove('hidden');
}

async function editarUsuario(id) {
    try {
        const u = await Api.usuarios.getById(id);
        document.getElementById('usuarioId').value = u.id_usuario;
        document.getElementById('usuarioNombreCompleto').value = u.nombre_completo || '';
        document.getElementById('usuarioNumeroDocumento').value = u.numero_documento || '';
        document.getElementById('usuarioUsername').value = u.username;
        document.getElementById('usuarioEmail').value = u.email || '';
        document.getElementById('usuarioPassword').value = '';
        document.getElementById('usuarioRol').value = u.id_rol;
        document.getElementById('usuarioEstado').value = u.estado_activo;
        document.getElementById('modalUsuarioTitulo').innerHTML = '<i class="ph ph-pencil"></i> Editar Usuario';
        document.getElementById('modalUsuario').classList.remove('hidden');
    } catch (e) { Toast.error('Error cargando datos del usuario.'); }
}

async function guardarUsuario(e) {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const password = document.getElementById('usuarioPassword').value;
    const payload = {
        nombre_completo: document.getElementById('usuarioNombreCompleto').value,
        numero_documento: document.getElementById('usuarioNumeroDocumento').value,
        username: document.getElementById('usuarioUsername').value,
        email: document.getElementById('usuarioEmail').value,
        id_rol: document.getElementById('usuarioRol').value,
        estado_activo: document.getElementById('usuarioEstado').value
    };
    if (password) payload.password_hash = password;

    try {
        const res = id ? await Api.usuarios.editar(id, payload) : await Api.usuarios.crear(payload);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        Toast.success(data.mensaje || 'Usuario guardado exitosamente.');
        cerrarModal('modalUsuario');
        cargarTablaUsuarios();
    } catch (err) { Toast.error(err.message); }
}
