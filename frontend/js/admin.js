// =============================================================================
// PANEL DE ADMINISTRACIÓN - LA PERLA S.A.
// =============================================================================

// ---- INTERCEPTOR JWT HTTP ----
const originalFetchAdmin = window.fetch;
window.fetch = async function (url, options = {}) {
    options.headers = options.headers || {};
    const token = localStorage.getItem('auth_token');
    if (token) {
        if (options.headers instanceof Headers) {
            options.headers.set('Authorization', `Bearer ${token}`);
        } else {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    const response = await originalFetchAdmin(url, options);
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('usuario_activo');
        window.location.replace('index.html');
    }
    return response;
};

// ---- PROTECCIÓN DE RUTA ----
const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo'));
if (!usuarioActivo || usuarioActivo.id_rol !== 1) {
    window.location.replace('index.html');
}

// ---- AUTO-LOGOUT POR INACTIVIDAD (30 MINUTOS) ----
let inactividadTimerAdmin;
function resetearInactividadAdmin() {
    clearTimeout(inactividadTimerAdmin);
    inactividadTimerAdmin = setTimeout(() => {
        alert('⚠️ Tu sesión ha sido cerrada automáticamente por inactividad (30 minutos sin movimiento).');
        cerrarSesion();
    }, 30 * 60 * 1000);
}
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetearInactividadAdmin, true);
});
resetearInactividadAdmin();

// =============================================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Validar en el servidor que el Token JWT siga activo y no haya expirado
    fetch('/api/verify-token').catch(() => {});

    // Mostrar nombre del usuario en la barra superior
    if (usuarioActivo) {
        document.getElementById('topbarUsername').textContent = usuarioActivo.username;
    }

    // Mostrar fecha y hora actual en tiempo real
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    // Cargar datos del dashboard al inicio
    cargarDashboard();
    // Refrescar automáticamente cada 30 segundos
    setInterval(cargarDashboard, 30000);

    // Configurar menú lateral
    configurarNavegacion();

    // Botón de cerrar sesión
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);

    // Botón toggle sidebar (para pantallas pequeñas)
    document.getElementById('btnToggleSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('sidebar-collapsed');
    });

    // Botón refrescar dashboard manualmente
    document.getElementById('btnRefreshDashboard').addEventListener('click', cargarDashboard);

    // Buscador de visitante en el formulario (si existe)
    document.getElementById('btnBuscarVisitante')?.addEventListener('click', buscarVisitante);
    document.getElementById('inputBuscarDocumento')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarVisitante();
    });

    // Formulario de registro de visita (si existe)
    document.getElementById('formRegistrarVisita')?.addEventListener('submit', registrarIngreso);
});

// =============================================================================
// RELOJ EN TIEMPO REAL
// =============================================================================
function actualizarReloj() {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('topbarFecha').textContent = ahora.toLocaleDateString('es-CO', opciones);
}

// =============================================================================
// NAVEGACIÓN ENTRE PÁGINAS (SPA - Single Page Application)
// =============================================================================
function configurarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const paginaDestino = item.dataset.page;

            // Quitar clase active de todos
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

            // Activar el ítem del menú y la página correspondiente
            item.classList.add('active');
            const paginaEl = document.getElementById(`page-${paginaDestino}`);
            if (paginaEl) paginaEl.classList.add('active');
        });
    });
}

// =============================================================================
// DASHBOARD - ESTADÍSTICAS EN TIEMPO REAL
// =============================================================================
async function cargarDashboard() {
    try {
        const res = await fetch('/api/dashboard/stats');
        const datos = await res.json();

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

// =============================================================================
// CERRAR SESIÓN
// =============================================================================
function cerrarSesion() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario_activo');
    window.location.replace('index.html');
}

// =============================================================================
// UTILIDADES DE MODALES
// =============================================================================
function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function badgeEstado(activo) {
    return activo ? '<span class="badge-activo">Activo</span>' : '<span class="badge-inactivo">Inactivo</span>';
}

// Cerrar modales al hacer clic fuera o presionar Escape
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
});

// Cargar páginas al hacer clic en el menú lateral
document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;
    const page = navItem.dataset.page;
    if (page === 'dashboard') cargarDashboard();
    if (page === 'visitas-activas') cargarTablaVisitasActivas();
    if (page === 'visitantes') cargarTablaVisitantes();
    if (page === 'lista-negra') { cargarTablaListaNegra(); cargarSolicitudesPendientesAdmin(); cargarSolicitudesBloqueoPendientesAdmin(); }
    if (page === 'bitacora') cargarTablaBitacora();
    if (page === 'areas') cargarTablaAreas();
    if (page === 'usuarios') cargarTablaUsuarios();
    if (page === 'empleados') cargarTablaEmpleados();
});

// =============================================================================
// MÓDULO: ÁREAS
// =============================================================================
async function cargarTablaAreas() {
    try {
        const res = await fetch('/api/areas/all');
        const areas = await res.json();
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
    } catch (e) { alert('Error cargando datos del área.'); }
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
        const metodo = id ? 'PUT' : 'POST';
        const url = id ? `/api/areas/${id}` : '/api/areas';
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        cerrarModal('modalArea');
        cargarTablaAreas();
        cargarSelectAreas();
    } catch (err) { alert('❌ Error: ' + err.message); }
}

// =============================================================================
// MÓDULO: USUARIOS
// =============================================================================
async function cargarTablaUsuarios() {
    try {
        const res = await fetch('/api/usuarios');
        const usuarios = await res.json();
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
                    <button class="btn-accion btn-eliminar" style="background:#dc2626;color:#fff;margin-left:4px;" onclick="eliminarUsuario(${u.id_usuario}, '${u.username.replace(/'/g, "\\'")}')" title="Eliminar cuenta preservando historial">
                        <i class="ph ph-trash"></i> Eliminar
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
        const res = await fetch(`/api/usuarios/${id}/toggle-estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_activo: nuevoEstado })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje || 'Acción procesada correctamente.');
            cargarTablaUsuarios();
        } else {
            alert('❌ ' + (data.error || 'No se pudo cambiar el estado.'));
        }
    } catch (err) {
        alert('❌ Error al cambiar estado: ' + err.message);
    }
}

async function eliminarUsuario(id, username) {
    if (!confirm(`⚠️ ¿Estás seguro de que deseas eliminar al usuario '${username}'?\n\nLa cuenta desaparecerá de la lista de gestión, pero todo su historial de registros se conservará intacto para auditoría.`)) {
        return;
    }

    try {
        const res = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje || '🗑️ Usuario eliminado exitosamente.');
            cargarTablaUsuarios();
        } else {
            alert('❌ ' + (data.error || 'No se pudo eliminar el usuario.'));
        }
    } catch (err) {
        alert('❌ Error al eliminar usuario: ' + err.message);
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
        const res = await fetch(`/api/usuarios/${id}`);
        const u = await res.json();
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
    } catch (e) { alert('Error cargando datos del usuario.'); }
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
        const metodo = id ? 'PUT' : 'POST';
        const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert(data.mensaje || '✅ Usuario guardado exitosamente.');
        cerrarModal('modalUsuario');
        cargarTablaUsuarios();
    } catch (err) { alert(err.message); }
}

// =============================================================================
// MÓDULO: EMPLEADOS
// =============================================================================
async function cargarTablaEmpleados() {
    try {
        const res = await fetch('/api/empleados/all');
        const empleados = await res.json();
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
        const res = await fetch(`/api/empleados/${id}`);
        const em = await res.json();
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
    } catch (e) { alert('Error cargando datos del empleado.'); }
}

async function cargarSelectAreasModal() {
    const res = await fetch('/api/areas');
    const areas = await res.json();
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
        const metodo = id ? 'PUT' : 'POST';
        const url = id ? `/api/empleados/${id}` : '/api/empleados';
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        cerrarModal('modalEmpleado');
        cargarTablaEmpleados();
        cargarSelectEmpleados();
    } catch (err) { alert('❌ Error: ' + err.message); }
}

// =============================================================================
// MÓDULO: VISITAS ACTIVAS & REGISTRAR SALIDA
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

// =============================================================================
// MÓDULO: VISITANTES (DIRECTORIO MAESTRO)
// =============================================================================
async function cargarTablaVisitantes() {
    const q = document.getElementById('inputBuscarVisitantesTabla')?.value || '';
    try {
        const res = await fetch(`/api/visitantes?q=${encodeURIComponent(q)}`);
        const visitantes = await res.json();
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
                <td><span style="font-weight:700;color:var(--verde);">${v.total_visitas} visitas</span></td>
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
    } catch (e) { alert('Error cargando datos del visitante.'); }
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
        const res = await fetch(`/api/visitantes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        cerrarModal('modalEditarVisitante');
        cargarTablaVisitantes();
    } catch (err) { alert('❌ Error: ' + err.message); }
}

// =============================================================================
// MÓDULO: LISTA NEGRA (BLOQUEO Y DESBLOQUEO)
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

// =============================================================================
// MÓDULO: SOLICITUDES DE DESBLOQUEO (APROBACIÓN / RECHAZO POR ADMIN)
// =============================================================================
async function cargarSolicitudesPendientesAdmin() {
    try {
        const res = await fetch('/api/solicitudes-desbloqueo/pendientes');
        const solicitudes = await res.json();
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
        const res = await fetch(`/api/solicitudes-desbloqueo/${idSolicitud}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ respuesta_admin: justificacion })
        });
        const data = await res.json();
        if (res.ok) {
            alert('✅ ' + (data.mensaje || 'Solicitud aprobada y visitante desbloqueado.'));
            cargarSolicitudesPendientesAdmin();
            cargarTablaListaNegra();
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo aprobar la solicitud'));
        }
    } catch (e) {
        alert('❌ Error al aprobar solicitud: ' + e.message);
    }
}

async function rechazarSolicitudAdmin(idSolicitud, nombre) {
    const razonRechazo = prompt(`Indica la razón del rechazo para la solicitud de "${nombre}":`, 'Rechazado: Mantiene la restricción de seguridad activa.');
    if (razonRechazo === null) return;

    try {
        const res = await fetch(`/api/solicitudes-desbloqueo/${idSolicitud}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ respuesta_admin: razonRechazo })
        });
        const data = await res.json();
        if (res.ok) {
            alert('ℹ️ ' + (data.mensaje || 'Solicitud rechazada.'));
            cargarSolicitudesPendientesAdmin();
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo rechazar la solicitud'));
        }
    } catch (e) {
        alert('❌ Error al rechazar solicitud: ' + e.message);
    }
}

// =============================================================================
// MÓDULO: SOLICITUDES DE BLOQUEO / VETO (APROBACIÓN / RECHAZO POR ADMIN)
// =============================================================================
async function cargarSolicitudesBloqueoPendientesAdmin() {
    try {
        const res = await fetch('/api/solicitudes-bloqueo/pendientes');
        const solicitudes = await res.json();
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
        const res = await fetch(`/api/solicitudes-bloqueo/${idSolicitud}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ respuesta_admin: notaAdmin })
        });
        const data = await res.json();
        if (res.ok) {
            alert('✅ ' + (data.mensaje || 'Solicitud aprobada. El visitante ha sido vetado de La Perla S.A.'));
            cargarSolicitudesBloqueoPendientesAdmin();
            cargarTablaListaNegra();
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo aprobar la solicitud de veto'));
        }
    } catch (e) {
        alert('❌ Error al aprobar veto: ' + e.message);
    }
}

async function rechazarSolicitudBloqueoAdmin(idSolicitud, nombre) {
    const razonRechazo = prompt(`Indica la razón para rechazar la propuesta de veto de "${nombre}":`, 'Rechazado: Reporte no procedente.');
    if (razonRechazo === null) return;

    try {
        const res = await fetch(`/api/solicitudes-bloqueo/${idSolicitud}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ respuesta_admin: razonRechazo })
        });
        const data = await res.json();
        if (res.ok) {
            alert('ℹ️ ' + (data.mensaje || 'Solicitud de bloqueo rechazada.'));
            cargarSolicitudesBloqueoPendientesAdmin();
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo rechazar la solicitud de veto'));
        }
    } catch (e) {
        alert('❌ Error al rechazar veto: ' + e.message);
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

// =============================================================================
// MÓDULO: BITÁCORA HISTÓRICA (FILTROS AVANZADOS)
// =============================================================================
async function cargarTablaBitacora() {
    const desde = document.getElementById('filtroBitacoraDesde')?.value || '';
    const hasta = document.getElementById('filtroBitacoraHasta')?.value || '';
    const estado = document.getElementById('filtroBitacoraEstado')?.value || '';
    const buscar = document.getElementById('filtroBitacoraBuscar')?.value || '';

    const url = `/api/bitacora?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&estado=${encodeURIComponent(estado)}&buscar=${encodeURIComponent(buscar)}`;

    try {
        const res = await fetch(url);
        const bitacora = await res.json();
        const tbody = document.getElementById('tbodyBitacora');

        if (!bitacora.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No se encontraron registros de visitas con los filtros aplicados.</td></tr>';
            return;
        }

        tbody.innerHTML = bitacora.map((b) => {
            let badgeClass = 'badge-finalizado';
            if (b.estado_visita === 'EN_PLANTA') badgeClass = 'badge-en-planta';
            if (b.estado_visita === 'CANCELADO') badgeClass = 'badge-cancelado';

            const fechaIngreso = new Date(b.fecha_hora_ingreso).toLocaleString('es-CO');
            const fechaSalida = b.fecha_hora_salida ? new Date(b.fecha_hora_salida).toLocaleString('es-CO') : '<em style="color:#15803d;font-weight:700;">En Planta</em>';

            return `
                <tr>
                    <td><strong>#${b.id_visita}</strong></td>
                    <td style="font-size:0.83rem;">${fechaIngreso}</td>
                    <td style="font-size:0.83rem;">${fechaSalida}</td>
                    <td><strong>${b.visitante}</strong></td>
                    <td><span style="font-size:0.78rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${b.tipo_documento} ${b.numero_documento}</span></td>
                    <td>${b.area_destino}</td>
                    <td>${b.empleado_anfitrion}</td>
                    <td style="max-width:180px;font-size:0.8rem;">${b.objetos_ingresados || '—'}</td>
                    <td style="font-size:0.8rem;">
                        <div><i class="ph ph-arrow-down-right" style="color:var(--verde);"></i> Entró: <strong>${b.escolta_ingreso}</strong></div>
                        ${b.escolta_salida ? `<div><i class="ph ph-arrow-up-right" style="color:#b45309;"></i> Salió: <strong>${b.escolta_salida}</strong></div>` : ''}
                    </td>
                    <td><span class="${badgeClass}">${b.estado_visita}</span></td>
                </tr>
            `;
        }).join('');
    } catch (e) { console.error('Error cargando bitácora:', e); }
}

function limpiarFiltrosBitacora() {
    if (document.getElementById('filtroBitacoraDesde')) document.getElementById('filtroBitacoraDesde').value = '';
    if (document.getElementById('filtroBitacoraHasta')) document.getElementById('filtroBitacoraHasta').value = '';
    if (document.getElementById('filtroBitacoraEstado')) document.getElementById('filtroBitacoraEstado').value = '';
    if (document.getElementById('filtroBitacoraBuscar')) document.getElementById('filtroBitacoraBuscar').value = '';
    document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
    cargarTablaBitacora();
}

// =============================================================================
// FILTROS RÁPIDOS POR PERIODO (HOY, ESTA SEMANA, ESTE MES, ETC)
// =============================================================================
function aplicarRangoRapido(tipo, btn) {
    document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const inputDesde = document.getElementById('filtroBitacoraDesde');
    const inputHasta = document.getElementById('filtroBitacoraHasta');

    const hoy = new Date();
    const formatoFecha = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (tipo === 'hoy') {
        const hoyStr = formatoFecha(new Date());
        inputDesde.value = hoyStr;
        inputHasta.value = hoyStr;
    } else if (tipo === 'semana_actual') {
        const curr = new Date();
        const dia = curr.getDay(); // 0 domingo, 1 lunes...
        const diffLunes = curr.getDate() - dia + (dia === 0 ? -6 : 1);
        const lunes = new Date(curr.setDate(diffLunes));
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);

        inputDesde.value = formatoFecha(lunes);
        inputHasta.value = formatoFecha(domingo);
    } else if (tipo === 'ultimos_7_dias') {
        const hace7 = new Date();
        hace7.setDate(hace7.getDate() - 7);
        inputDesde.value = formatoFecha(hace7);
        inputHasta.value = formatoFecha(new Date());
    } else if (tipo === 'este_mes') {
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        inputDesde.value = formatoFecha(primerDia);
        inputHasta.value = formatoFecha(ultimoDia);
    } else if (tipo === 'ultimos_30_dias') {
        const hace30 = new Date();
        hace30.setDate(hace30.getDate() - 30);
        inputDesde.value = formatoFecha(hace30);
        inputHasta.value = formatoFecha(new Date());
    } else if (tipo === 'todo') {
        inputDesde.value = '';
        inputHasta.value = '';
    }

    cargarTablaBitacora();
}

// =============================================================================
// EXPORTAR A EXCEL (.XLSX) — LA PERLA S.A.
// =============================================================================
async function exportarBitacoraExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Cargando módulo de Excel, intenta de nuevo en unos segundos...');
        return;
    }

    const desde = document.getElementById('filtroBitacoraDesde')?.value || '';
    const hasta = document.getElementById('filtroBitacoraHasta')?.value || '';
    const estado = document.getElementById('filtroBitacoraEstado')?.value || '';
    const buscar = document.getElementById('filtroBitacoraBuscar')?.value || '';

    const url = `/api/bitacora?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&estado=${encodeURIComponent(estado)}&buscar=${encodeURIComponent(buscar)}`;

    try {
        const res = await fetch(url);
        const bitacora = await res.json();

        if (!bitacora || !bitacora.length) {
            alert('No hay registros de visitas para exportar con los filtros seleccionados.');
            return;
        }

        // Mapear los datos a formato limpio para la hoja de cálculo
        const datosExcel = bitacora.map((b, i) => {
            const fIngreso = new Date(b.fecha_hora_ingreso);
            const fSalida = b.fecha_hora_salida ? new Date(b.fecha_hora_salida) : null;

            return {
                'N°': i + 1,
                'ID Visita': b.id_visita,
                'Fecha Ingreso': fIngreso.toLocaleDateString('es-CO'),
                'Hora Ingreso': fIngreso.toLocaleTimeString('es-CO'),
                'Fecha Salida': fSalida ? fSalida.toLocaleDateString('es-CO') : 'En Planta',
                'Hora Salida': fSalida ? fSalida.toLocaleTimeString('es-CO') : 'En Planta',
                'Estado': b.estado_visita,
                'Tipo Documento': b.tipo_documento,
                'Número Documento': b.numero_documento,
                'Nombre del Visitante': b.visitante,
                'Área Destino': b.area_destino,
                'Empleado Anfitrión': b.empleado_anfitrion,
                'Objetos / Equipos': b.objetos_ingresados || 'Ninguno',
                'Escolta Entrada': b.escolta_ingreso,
                'Escolta Salida': b.escolta_salida || '—',
                'Observaciones': b.observaciones || '—'
            };
        });

        // Crear hoja de cálculo
        const ws = XLSX.utils.json_to_sheet(datosExcel);

        // Ajustar anchos automáticos de columnas para máxima legibilidad
        const colWidths = [
            { wch: 5 },  // N°
            { wch: 10 }, // ID
            { wch: 14 }, // Fecha Ingreso
            { wch: 14 }, // Hora Ingreso
            { wch: 14 }, // Fecha Salida
            { wch: 14 }, // Hora Salida
            { wch: 14 }, // Estado
            { wch: 8 },  // Tipo Doc
            { wch: 18 }, // Num Doc
            { wch: 32 }, // Nombre Visitante
            { wch: 24 }, // Area Destino
            { wch: 28 }, // Empleado
            { wch: 35 }, // Objetos
            { wch: 18 }, // Escolta In
            { wch: 18 }, // Escolta Out
            { wch: 35 }  // Observaciones
        ];
        ws['!cols'] = colWidths;

        // Crear libro y agregar la hoja
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bitácora de Visitas');

        // Construir nombre de archivo descriptivo según el filtro aplicado
        let sufijoFiltro = 'Completo';
        if (desde && hasta && desde === hasta) {
            sufijoFiltro = `Dia_${desde}`;
        } else if (desde && hasta) {
            sufijoFiltro = `Rango_${desde}_al_${hasta}`;
        } else if (desde) {
            sufijoFiltro = `Desde_${desde}`;
        } else if (hasta) {
            sufijoFiltro = `Hasta_${hasta}`;
        }

        const nombreArchivo = `Reporte_Visitas_LaPerlaSA_${sufijoFiltro}.xlsx`;

        // Descargar archivo Excel en el navegador
        XLSX.writeFile(wb, nombreArchivo);

    } catch (e) {
        console.error('Error exportando Excel:', e);
        alert('Ocurrió un error al generar el archivo Excel.');
    }
}
