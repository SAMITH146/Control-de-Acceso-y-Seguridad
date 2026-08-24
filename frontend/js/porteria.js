// =============================================================================
// MÓDULO DE PORTERÍA & OPERADOR DE SEGURIDAD — LA PERLA S.A.
// =============================================================================

// ---- INTERCEPTOR JWT HTTP ----
const originalFetchPorteria = window.fetch;
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
    const response = await originalFetchPorteria(url, options);
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('usuario_activo');
        window.location.replace('index.html');
    }
    return response;
};

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
        alert('⚠️ Tu sesión ha sido cerrada automáticamente por inactividad (30 minutos sin movimiento).');
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
    fetch('/api/verify-token').catch(() => {});

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
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        const conteo = data.en_planta ?? 0;
        document.getElementById('badgeEnPlantaCount').textContent = conteo;
    } catch (e) {
        console.error('Error actualizando aforo:', e);
    }
}

// =============================================================================
// CARGAR SELECTS DE ÁREAS Y EMPLEADOS
// =============================================================================
// CARGAR SELECTS DE ÁREAS Y EMPLEADOS (VINCULACIÓN DIRECTA POR ÁREA)
// =============================================================================
let todosLosEmpleadosCache = [];

async function cargarSelectsPorteria() {
    try {
        const [resAreas, resEmpleados] = await Promise.all([
            fetch('/api/areas'),
            fetch('/api/empleados')
        ]);
        const areas = await resAreas.json();
        const empData = await resEmpleados.json();
        todosLosEmpleadosCache = Array.isArray(empData) ? empData : [];

        const selectArea = document.getElementById('ingresoArea');
        selectArea.innerHTML = '<option value="">-- Selecciona el área destino --</option>';
        if (Array.isArray(areas)) {
            areas.forEach(a => {
                selectArea.innerHTML += `<option value="${a.id_area}">${a.nombre_area}</option>`;
            });
        }

        const selectEmp = document.getElementById('ingresoEmpleado');
        selectEmp.innerHTML = '<option value="">-- Primero selecciona el área de destino --</option>';
        selectEmp.disabled = true;

        selectArea.onchange = (e) => {
            filtrarEmpleadosPorArea(e.target.value);
        };

    } catch (e) {
        console.error('Error cargando catálogos:', e);
    }
}

async function filtrarEmpleadosPorArea(idArea) {
    const selectEmp = document.getElementById('ingresoEmpleado');
    if (!idArea) {
        selectEmp.innerHTML = '<option value="">-- Primero selecciona el área de destino --</option>';
        selectEmp.disabled = true;
        return;
    }

    if (!Array.isArray(todosLosEmpleadosCache) || todosLosEmpleadosCache.length === 0) {
        try {
            const res = await fetch('/api/empleados');
            const data = await res.json();
            if (Array.isArray(data)) todosLosEmpleadosCache = data;
        } catch (e) { console.error('Error cargando empleados:', e); }
    }

    const list = Array.isArray(todosLosEmpleadosCache) ? todosLosEmpleadosCache : [];
    const filtrados = list.filter(e => Number(e.id_area) === Number(idArea));

    if (filtrados.length > 0) {
        selectEmp.disabled = false;
        selectEmp.innerHTML = '<option value="">-- Selecciona el empleado anfitrión --</option>';
        filtrados.forEach(e => {
            selectEmp.innerHTML += `<option value="${e.id_empleado}">${e.nombre_completo} — ${e.cargo}</option>`;
        });
    } else {
        selectEmp.disabled = true;
        selectEmp.innerHTML = '<option value="">-- No hay empleados registrados en esta área --</option>';
    }
}

// =============================================================================
// PASO 1: BÚSQUEDA RÁPIDA DE CÉDULA
// =============================================================================
async function buscarCedulaPorteria() {
    const cedula = document.getElementById('inputBuscarCedula').value.trim();
    if (!cedula) {
        alert('Por favor digita el número de documento.');
        document.getElementById('inputBuscarCedula').focus();
        return;
    }

    // Resetear vistas
    document.getElementById('alertaListaNegra').classList.add('hidden');
    document.getElementById('wrapperFormIngreso').classList.add('hidden');
    idVisitanteEncontrado = null;

    try {
        const res = await fetch(`/api/visitantes/buscar?documento=${encodeURIComponent(cedula)}`);
        const data = await res.json();

        // 1. VERIFICACIÓN DE LISTA NEGRA
        if (data.en_lista_negra) {
            datosVetadoActual = {
                id_lista_negra: data.id_lista_negra || (data.visitante ? data.visitante.id_lista_negra : null),
                id_visitante: data.visitante ? data.visitante.id_visitante : null,
                nombre_completo: data.visitante ? data.visitante.nombre_completo : `Visitante Doc: ${cedula}`,
                motivo_bloqueo: data.motivo_bloqueo
            };
            document.getElementById('alertaListaNegra').classList.remove('hidden');
            document.getElementById('motivoBloqueoTexto').textContent = `Motivo de la sanción: ${data.motivo_bloqueo}`;
            return; // Detener flujo
        }

        // 2. MOSTRAR FORMULARIO
        document.getElementById('wrapperFormIngreso').classList.remove('hidden');
        document.getElementById('ingresoNumDoc').value = cedula;

        if (data.visitante) {
            // Visitante recurrente
            const v = data.visitante;
            idVisitanteEncontrado = v.id_visitante;
            document.getElementById('ingresoTipoDoc').value = v.tipo_documento;
            document.getElementById('ingresoNombre').value = v.nombre_completo;
            document.getElementById('ingresoTelefono').value = v.telefono || '';
            document.getElementById('ingresoEps').value = v.eps;

            document.getElementById('tagRegistradoVisitante').classList.remove('hidden');
            document.getElementById('tagNuevoVisitante').classList.add('hidden');
        } else {
            // Visitante nuevo
            idVisitanteEncontrado = null;
            document.getElementById('ingresoTipoDoc').value = 'CC';
            document.getElementById('ingresoNombre').value = '';
            document.getElementById('ingresoTelefono').value = '';
            document.getElementById('ingresoEps').value = '';

            document.getElementById('tagNuevoVisitante').classList.remove('hidden');
            document.getElementById('tagRegistradoVisitante').classList.add('hidden');
            document.getElementById('ingresoNombre').focus();
        }

    } catch (e) {
        alert('Error al consultar el documento. Verifica la conexión con el servidor.');
        console.error(e);
    }
}

// =============================================================================
// PASO 2: REGISTRAR ENTRADA
// =============================================================================
async function registrarEntradaPorteria(e) {
    e.preventDefault();

    const btn = document.getElementById('btnGuardarIngreso');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Registrando ingreso...';
    btn.disabled = true;

    const payload = {
        id_visitante_existente: idVisitanteEncontrado,
        tipo_documento: document.getElementById('ingresoTipoDoc').value,
        numero_documento: document.getElementById('ingresoNumDoc').value,
        nombre_completo: document.getElementById('ingresoNombre').value,
        telefono: document.getElementById('ingresoTelefono').value,
        eps: document.getElementById('ingresoEps').value,
        id_area_destino: document.getElementById('ingresoArea').value,
        id_empleado_visita: document.getElementById('ingresoEmpleado').value,
        objetos_ingresados: document.getElementById('ingresoObjetos').value,
        observaciones: document.getElementById('ingresoObservaciones').value,
        id_escolta_ingreso: usuarioActivo.id_usuario
    };

    try {
        const res = await fetch('/api/visitas/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (res.ok) {
            btn.innerHTML = originalText;
            btn.disabled = false;

            // Mostrar el Pase de Visitante Autorizado
            mostrarPaseExito(payload, result.id_visita);
            actualizarConteoEnPlanta();
        } else {
            throw new Error(result.error || 'No se pudo guardar el registro');
        }
    } catch (err) {
        alert('❌ Error: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function mostrarPaseExito(data, idVisita) {
    const areaTexto = document.getElementById('ingresoArea').selectedOptions[0]?.text || '';
    const empleadoTexto = document.getElementById('ingresoEmpleado').selectedOptions[0]?.text || '';
    const hora = new Date().toLocaleTimeString('es-CO');

    const html = `
        <div class="pase-fila"><span>ID Visita:</span> <strong>#${idVisita}</strong></div>
        <div class="pase-fila"><span>Visitante:</span> <strong>${data.nombre_completo}</strong></div>
        <div class="pase-fila"><span>Documento:</span> <strong>${data.tipo_documento} ${data.numero_documento}</strong></div>
        <div class="pase-fila"><span>EPS:</span> <strong>${data.eps}</strong></div>
        <div class="pase-fila"><span>Destino:</span> <strong>${areaTexto}</strong></div>
        <div class="pase-fila"><span>Anfitrión:</span> <strong>${empleadoTexto}</strong></div>
        <div class="pase-fila"><span>Hora Ingreso:</span> <strong>${hora}</strong></div>
        <div class="pase-fila"><span>Equipos/Objetos:</span> <strong>${data.objetos_ingresados || 'Ninguno'}</strong></div>
        <div class="pase-fila"><span>Escolta Autoriza:</span> <strong>${usuarioActivo.username}</strong></div>
    `;

    document.getElementById('paseDetalles').innerHTML = html;
    document.getElementById('modalExitoPase').classList.remove('hidden');
}

function cerrarPaseYContinuar() {
    document.getElementById('modalExitoPase').classList.add('hidden');
    document.getElementById('formIngresoVisitante').reset();
    document.getElementById('wrapperFormIngreso').classList.add('hidden');
    document.getElementById('inputBuscarCedula').value = '';
    
    const selectEmp = document.getElementById('ingresoEmpleado');
    if (selectEmp) {
        selectEmp.innerHTML = '<option value="">-- Primero selecciona el área de destino --</option>';
        selectEmp.disabled = true;
    }

    document.getElementById('inputBuscarCedula').focus();
}

// =============================================================================
// TAB 2: EN PLANTA & REGISTRAR SALIDAS
// =============================================================================
async function cargarVisitasEnPlantaPorteria() {
    try {
        const res = await fetch('/api/visitas/activas');
        const visitas = await res.json();
        listaVisitasEnPlantaCache = visitas;
        renderTablaPlanta(visitas);
        document.getElementById('badgeEnPlantaCount').textContent = visitas.length;
    } catch (e) {
        console.error('Error cargando visitas activas:', e);
    }
}

function renderTablaPlanta(visitas) {
    const tbody = document.getElementById('tbodyPlantaPorteria');
    if (!visitas.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty">✅ No hay personas externas dentro de la planta actualmente.</td></tr>';
        return;
    }

    tbody.innerHTML = visitas.map((v, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${v.visitante}</strong></td>
            <td><span style="font-size:0.8rem;background:#e2e8f0;padding:3px 8px;border-radius:10px;">${v.tipo_documento} ${v.numero_documento}</span></td>
            <td>${v.eps || '—'}</td>
            <td>${v.area_destino}</td>
            <td>${v.empleado_anfitrion}</td>
            <td>${new Date(v.fecha_hora_ingreso).toLocaleTimeString('es-CO')}</td>
            <td><strong style="color:${v.minutos_en_planta > 120 ? '#dc2626' : '#0E773A'};">${formatearMinutos(v.minutos_en_planta)}</strong></td>
            <td style="max-width:200px;font-size:0.82rem;">${v.objetos_ingresados || 'Ninguno'}</td>
            <td>
                <button class="btn-dar-salida" onclick="abrirModalSalidaPorteria(${v.id_visita}, '${v.visitante.replace(/'/g, "\\'")}', '${(v.objetos_ingresados || 'Ninguno').replace(/'/g, "\\'")}')">
                    <i class="ph ph-sign-out"></i> Dar Salida
                </button>
            </td>
        </tr>
    `).join('');
}

function filtrarTablaPlanta() {
    const txt = document.getElementById('filtroPlanta').value.toLowerCase().trim();
    if (!txt) {
        renderTablaPlanta(listaVisitasEnPlantaCache);
        return;
    }
    const filtrados = listaVisitasEnPlantaCache.filter(v => 
        v.visitante.toLowerCase().includes(txt) ||
        v.numero_documento.toLowerCase().includes(txt) ||
        v.empleado_anfitrion.toLowerCase().includes(txt) ||
        v.area_destino.toLowerCase().includes(txt)
    );
    renderTablaPlanta(filtrados);
}

function formatearMinutos(m) {
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// Modal de Salida
function abrirModalSalidaPorteria(idVisita, nombre, objetos) {
    document.getElementById('salidaPorteriaIdVisita').value = idVisita;
    document.getElementById('salidaPorteriaNombre').textContent = nombre;
    document.getElementById('salidaPorteriaObjetos').textContent = objetos || 'Ningún objeto registrado.';
    document.getElementById('salidaPorteriaObs').value = '';
    document.getElementById('modalSalidaPorteria').classList.remove('hidden');
}

function cerrarModalSalida() {
    document.getElementById('modalSalidaPorteria').classList.add('hidden');
}

async function ejecutarSalidaPorteria(e) {
    e.preventDefault();
    const idVisita = document.getElementById('salidaPorteriaIdVisita').value;
    const obs = document.getElementById('salidaPorteriaObs').value;

    try {
        const res = await fetch(`/api/visitas/salida/${idVisita}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_escolta_salida: usuarioActivo.id_usuario,
                observaciones_salida: obs
            })
        });

        if (!res.ok) throw new Error((await res.json()).error);

        cerrarModalSalida();
        cargarVisitasEnPlantaPorteria();
        actualizarConteoEnPlanta();
    } catch (err) {
        alert('❌ Error al registrar salida: ' + err.message);
    }
}

// =============================================================================
// TAB 3: CONSULTAR LISTA NEGRA (PORTERÍA)
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

// =============================================================================
// SOLICITUD DE DESBLOQUEO (PORTERÍA ➔ ADMIN)
// =============================================================================
function abrirModalSolicitarDesbloqueoDesdeAlerta() {
    if (!datosVetadoActual) {
        alert('No se encontraron los datos del visitante sancionado.');
        return;
    }
    abrirModalSolicitarDesbloqueo(
        datosVetadoActual.id_lista_negra,
        datosVetadoActual.id_visitante,
        datosVetadoActual.nombre_completo,
        datosVetadoActual.motivo_bloqueo
    );
}

function abrirModalSolicitarDesbloqueo(idListaNegra, idVisitante, nombre, motivoBloqueo) {
    document.getElementById('solicitudIdListaNegra').value = idListaNegra || '';
    document.getElementById('solicitudIdVisitante').value = idVisitante || '';
    document.getElementById('solicitudNombreVisitante').textContent = nombre || 'Visitante Sancionado';
    document.getElementById('solicitudMotivoBloqueo').textContent = `Motivo Sanción: ${motivoBloqueo || 'Sanción Activa'}`;
    document.getElementById('solicitudMotivoRazon').value = '';
    document.getElementById('modalSolicitarDesbloqueo').classList.remove('hidden');
}

function cerrarModalSolicitarDesbloqueo() {
    document.getElementById('modalSolicitarDesbloqueo').classList.add('hidden');
}

async function enviarSolicitudDesbloqueo(e) {
    e.preventDefault();

    const idListaNegra = document.getElementById('solicitudIdListaNegra').value;
    const idVisitante = document.getElementById('solicitudIdVisitante').value;
    const motivoSolicitud = document.getElementById('solicitudMotivoRazon').value.trim();

    if (!motivoSolicitud) {
        alert('Por favor ingresa la justificación o razón para solicitar el desbloqueo.');
        return;
    }

    try {
        const res = await fetch('/api/solicitudes-desbloqueo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_lista_negra: idListaNegra,
                id_visitante: idVisitante,
                motivo_solicitud: motivoSolicitud
            })
        });

        const contentType = res.headers.get('content-type');
        let data = {};
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            throw new Error(`El servidor devolvió respuesta no válida (HTTP ${res.status}). Reinicia el servidor con 'node server.js'.`);
        }

        if (res.ok) {
            alert('✅ ' + (data.mensaje || 'Solicitud enviada exitosamente al Administrador.'));
            cerrarModalSolicitarDesbloqueo();
        } else {
            alert('❌ ' + (data.error || 'No se pudo enviar la solicitud.'));
        }
    } catch (err) {
        alert('❌ Error de conexión al enviar la solicitud: ' + err.message);
    }
}

// =============================================================================
// SOLICITUD DE BLOQUEO / VETO (PORTERÍA ➔ ADMIN)
// =============================================================================
function abrirModalSolicitarBloqueo(idVis, doc, nombre) {
    document.getElementById('solicitudBloqueoIdVisitante').value = idVis || '';
    document.getElementById('solicitudBloqueoNumDoc').value = doc || '';
    document.getElementById('solicitudBloqueoNombre').value = nombre || '';
    document.getElementById('solicitudBloqueoMotivoRazon').value = '';
    const statusMsg = document.getElementById('solicitudBloqueoStatus');
    const btnSubmit = document.getElementById('btnEnviarSolicitudBloqueo');
    if (statusMsg) {
        statusMsg.textContent = '';
        statusMsg.style.padding = '0';
        statusMsg.style.background = 'transparent';
    }
    if (btnSubmit) btnSubmit.disabled = false;

    document.getElementById('modalSolicitarBloqueo').classList.remove('hidden');

    if (doc) {
        autocompletarNombreBloqueo();
    }
}

async function autocompletarNombreBloqueo() {
    const doc = document.getElementById('solicitudBloqueoNumDoc').value.trim();
    const inputNombre = document.getElementById('solicitudBloqueoNombre');
    const inputIdVis = document.getElementById('solicitudBloqueoIdVisitante');
    const statusMsg = document.getElementById('solicitudBloqueoStatus');
    const btnSubmit = document.getElementById('btnEnviarSolicitudBloqueo');

    if (!doc) return;

    if (statusMsg) {
        statusMsg.textContent = '🔍 Consultando estado de la persona...';
        statusMsg.style.color = '#64748b';
        statusMsg.style.background = 'transparent';
        statusMsg.style.padding = '0';
    }

    try {
        const res = await fetch(`/api/visitantes/buscar?documento=${encodeURIComponent(doc)}`);
        const data = await res.json();

        if (data.visitante) {
            inputIdVis.value = data.visitante.id_visitante;
            inputNombre.value = data.visitante.nombre_completo;
        } else {
            inputIdVis.value = '';
        }

        // VERIFICACIÓN CLARA: ¿ESTÁ EN PLANTA?
        if (data.en_planta) {
            if (btnSubmit) btnSubmit.disabled = true;
            if (statusMsg) {
                statusMsg.innerHTML = `⚠️ <strong>ACCESO DENEGADO PARA REPORTE DE BLOQUEO:</strong><br>Esta persona se encuentra actualmente <strong>EN PLANTA</strong> (Área: ${data.datos_visita_activa ? data.datos_visita_activa.area_destino : 'Planta'}).<br><em>Por seguridad, debes registrar primero su salida en portería antes de poder enviar una solicitud de bloqueo.</em>`;
                statusMsg.style.color = '#991b1b';
                statusMsg.style.background = '#fee2e2';
                statusMsg.style.borderLeft = '4px solid #dc2626';
                statusMsg.style.padding = '10px 12px';
                statusMsg.style.borderRadius = '6px';
                statusMsg.style.marginTop = '8px';
            }
            return;
        }

        // Habilitar si no está en planta
        if (btnSubmit) btnSubmit.disabled = false;

        if (data.visitante) {
            if (statusMsg) {
                statusMsg.textContent = `✓ Visitante Registrado: ${data.visitante.nombre_completo}`;
                statusMsg.style.color = '#0E773A';
                statusMsg.style.background = 'transparent';
                statusMsg.style.padding = '0';
            }
        } else {
            if (statusMsg) {
                statusMsg.textContent = 'ℹ️ Visitante no registrado previamente. Escribe el nombre completo.';
                statusMsg.style.color = '#d97706';
                statusMsg.style.background = 'transparent';
                statusMsg.style.padding = '0';
            }
        }
    } catch (e) {
        if (statusMsg) statusMsg.textContent = '';
    }
}

function cerrarModalSolicitarBloqueo() {
    document.getElementById('modalSolicitarBloqueo').classList.add('hidden');
}

async function enviarSolicitudBloqueo(e) {
    e.preventDefault();

    const idVisitante = document.getElementById('solicitudBloqueoIdVisitante').value;
    const numDoc = document.getElementById('solicitudBloqueoNumDoc').value.trim();
    const nombre = document.getElementById('solicitudBloqueoNombre').value.trim();
    const motivo = document.getElementById('solicitudBloqueoMotivoRazon').value.trim();

    if (!numDoc || !nombre || !motivo) {
        alert('Por favor completa todos los campos del reporte.');
        return;
    }

    try {
        const res = await fetch('/api/solicitudes-bloqueo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_visitante: idVisitante || null,
                numero_documento: numDoc,
                nombre_visitante: nombre,
                motivo_solicitud: motivo
            })
        });

        const contentType = res.headers.get('content-type');
        let data = {};
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            throw new Error(`El servidor devolvió respuesta no válida (HTTP ${res.status}). Reinicia el servidor con 'node server.js'.`);
        }

        if (res.ok) {
            alert('✅ ' + (data.mensaje || 'Solicitud de veto enviada al Administrador exitosamente.'));
            cerrarModalSolicitarBloqueo();
        } else {
            alert('❌ ' + (data.error || 'No se pudo enviar la solicitud de bloqueo.'));
        }
    } catch (err) {
        alert('❌ Error de conexión al enviar reporte: ' + err.message);
    }
}
