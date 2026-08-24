// =============================================================================
// PANEL DE ADMINISTRACIÓN — NÚCLEO (LA PERLA S.A.)
// =============================================================================

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
