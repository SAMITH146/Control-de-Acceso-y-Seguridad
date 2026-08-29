// =============================================================================
// MÓDULO DE PORTERÍA — REGISTRO DE INGRESO (LA PERLA S.A.)
// =============================================================================

// =============================================================================
// CARGAR SELECTS DE ÁREAS Y EMPLEADOS (VINCULACIÓN DIRECTA POR ÁREA)
// =============================================================================
let todosLosEmpleadosCache = [];

async function cargarSelectsPorteria() {
    try {
        const [areas, empData] = await Promise.all([
            Api.areas.getAll(),
            Api.empleados.getAll()
        ]);
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
            const data = await Api.empleados.getAll();
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
        Toast.warning('Por favor digita el número de documento.');
        document.getElementById('inputBuscarCedula').focus();
        return;
    }

    // Resetear vistas
    document.getElementById('alertaListaNegra').classList.add('hidden');
    document.getElementById('wrapperFormIngreso').classList.add('hidden');
    idVisitanteEncontrado = null;

    try {
        const data = await Api.visitantes.buscarPorDocumento(cedula);

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
        Toast.error('Error al consultar el documento. Verifica la conexión con el servidor.');
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

    if (!payload.id_empleado_visita) {
        Toast.error('Debes seleccionar un Empleado (Anfitrión). Si no hay empleados, no puedes registrar el ingreso a esa área.');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }
try {
        const res = await Api.visitas.registrarIngreso(payload);
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
        Toast.error('Error: ' + err.message);
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
