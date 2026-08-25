// =============================================================================
// MÓDULO: BITÁCORA HISTÓRICA — FILTROS Y EXPORTACIÓN EXCEL (LA PERLA S.A.)
// =============================================================================
async function cargarTablaBitacora() {
    const desde = document.getElementById('filtroBitacoraDesde')?.value || '';
    const hasta = document.getElementById('filtroBitacoraHasta')?.value || '';
    const estado = document.getElementById('filtroBitacoraEstado')?.value || '';
    const buscar = document.getElementById('filtroBitacoraBuscar')?.value || '';

    try {
        const bitacora = await Api.bitacora.getAll({ desde, hasta, estado, buscar });
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
        Toast.warning('Cargando módulo de Excel, intenta de nuevo en unos segundos...');
        return;
    }

    const desde = document.getElementById('filtroBitacoraDesde')?.value || '';
    const hasta = document.getElementById('filtroBitacoraHasta')?.value || '';
    const estado = document.getElementById('filtroBitacoraEstado')?.value || '';
    const buscar = document.getElementById('filtroBitacoraBuscar')?.value || '';

    try {
        const bitacora = await Api.bitacora.getAll({ desde, hasta, estado, buscar });

        if (!bitacora || !bitacora.length) {
            Toast.info('No hay registros de visitas para exportar con los filtros seleccionados.');
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
        Toast.error('Ocurrió un error al generar el archivo Excel.');
    }
}
