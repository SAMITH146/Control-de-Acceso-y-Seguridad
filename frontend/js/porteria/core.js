// =============================================================================
// MÓDULO DE PORTERÍA — NÚCLEO (LA PERLA S.A.)
// =============================================================================

// ---- PROTECCIÓN DE SESIÓN ----
const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo'));
if (!usuarioActivo) {
    window.location.replace('index.html');
}

let idVisitanteEncontrado = null;
let listaVisitasEnPlantaCache = [];
let datosVetadoActual = null;

// ---- AUTO-LOGOUT POR INACTIVIDAD (30 MINUTOS) ----
let inactividadTimerPorteria;
function resetearInactividadPorteria() {
    clearTimeout(inactividadTimerPorteria);
    inactividadTimerPorteria = setTimeout(() => {
        Toast.warning('Tu sesión ha sido cerrada automáticamente por inactividad (30 minutos sin movimiento).');
        cerrarSesionPorteria();
    }, 30 * 60 * 1000);
}
function cerrarSesionPorteria() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario_activo');
    window.location.replace('index.html');
}
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetearInactividadPorteria, true);
});
resetearInactividadPorteria();

// =============================================================================
// INICIALIZACIÓN
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Validar en el servidor que el Token JWT siga activo y no haya expirado
    Api.auth.verificarToken().catch(() => {});

    // 1. Mostrar nombre del operador activo
    if (usuarioActivo) {
        document.getElementById('nombreOperador').textContent = usuarioActivo.username;
    }

    // 2. Reloj en tiempo real
    actualizarRelojPorteria();
    setInterval(actualizarRelojPorteria, 1000);

    // 3. Cargar catálogos iniciales
    cargarSelectsPorteria();
    actualizarConteoEnPlanta();
    setInterval(actualizarConteoEnPlanta, 20000); // Refresco automático cada 20s

    // 4. Configurar Navegación por Pestañas
    configurarTabs();

    // 5. Listeners de Búsqueda y Registro
    document.getElementById('btnBuscarCedula').addEventListener('click', buscarCedulaPorteria);
    document.getElementById('inputBuscarCedula').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarCedulaPorteria();
    });

    document.getElementById('formIngresoVisitante').addEventListener('submit', registrarEntradaPorteria);

    // 6. Cerrar Sesión
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('usuario_activo');
        window.location.replace('index.html');
    });
});

// =============================================================================
// RELOJ EN VIVO
// =============================================================================
function actualizarRelojPorteria() {
    const ahora = new Date();
    const opciones = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('relojPorteria').textContent = ahora.toLocaleDateString('es-CO', opciones);
}

// =============================================================================
// NAVEGACIÓN ENTRE TABS
// =============================================================================
function configurarTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(`tab-${target}`);
            if (targetContent) targetContent.classList.add('active');

            // Cargar datos según el tab seleccionado
            if (target === 'en-planta') cargarVisitasEnPlantaPorteria();
            if (target === 'lista-negra') buscarEnListaNegraPorteria();
            if (target === 'mi-turno') cargarMiTurno();
            if (target === 'entrada') {
                setTimeout(() => document.getElementById('inputBuscarCedula').focus(), 100);
            }
        });
    });
}

// =============================================================================
// ACTUALIZAR CONTADOR DE AFORO EN PLANTA
// =============================================================================
async function actualizarConteoEnPlanta() {
    try {
        const data = await Api.dashboard.getStats();
        const conteo = data.en_planta ?? 0;
        document.getElementById('badgeEnPlantaCount').textContent = conteo;
    } catch (e) {
        console.error('Error actualizando aforo:', e);
    }
}

// Cierre de modales al hacer clic fuera o presionar Escape
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
