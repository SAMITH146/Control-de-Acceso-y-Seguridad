// =============================================================================
// LÓGICA DE CARGUE MASIVO - LA PERLA S.A.
// =============================================================================

function abrirModalUpload(tipo) {
    document.getElementById('uploadType').value = tipo;
    const modal = document.getElementById('modalUpload');
    const title = document.getElementById('modalUploadTitle');
    const instructions = document.getElementById('uploadInstructions');
    const link = document.getElementById('linkDownloadTemplate');
    const resultBox = document.getElementById('uploadResult');
    
    resultBox.classList.add('hidden');
    resultBox.innerHTML = '';
    document.getElementById('formUpload').reset();
    document.getElementById('btnUploadSubmit').disabled = false;

    if (tipo === 'areas') {
        title.textContent = 'Carga Masiva de Áreas';
        instructions.textContent = 'Asegúrate de no cambiar los títulos de las columnas (NOMBRE_AREA, DESCRIPCION).';
        link.href = 'templates/Plantilla_Areas.xlsx';
    } else if (tipo === 'empleados') {
        title.textContent = 'Carga Masiva de Empleados';
        instructions.textContent = 'Asegúrate de que el Área escrita en el Excel exista en el sistema previamente.';
        link.href = 'templates/Plantilla_Empleados.xlsx';
    } else if (tipo === 'usuarios') {
        title.textContent = 'Carga Masiva de Usuarios (Escoltas)';
        instructions.textContent = 'Por defecto, se asignará el Rol de Escolta y la contraseña inicial será igual al número de documento.';
        link.href = 'templates/Plantilla_Usuarios.xlsx';
    }

    modal.classList.remove('hidden');
}

function cerrarModalUpload() {
    document.getElementById('modalUpload').classList.add('hidden');
}

async function submitUpload() {
    const tipo = document.getElementById('uploadType').value;
    const fileInput = document.getElementById('uploadFile');
    const btnSubmit = document.getElementById('btnUploadSubmit');
    const resultBox = document.getElementById('uploadResult');

    if (!fileInput.files.length) {
        Toast.warning('Por favor selecciona un archivo Excel.');
        return;
    }

    const formData = new FormData();
    formData.append('excelFile', fileInput.files[0]);

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Procesando...';
    resultBox.classList.add('hidden');
    resultBox.innerHTML = '';

    try {
        let res;
        if (tipo === 'areas') res = await Api.upload.areas(formData);
        else if (tipo === 'empleados') res = await Api.upload.empleados(formData);
        else if (tipo === 'usuarios') res = await Api.upload.usuarios(formData);

        if (res.error) throw new Error(res.error);

        // Mostrar resumen
        let html = `
            <div style="background: rgba(16, 185, 129, 0.1); color: #047857; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                <strong><i class="ph ph-check-circle"></i> Procesamiento Terminado</strong><br>
                Registros insertados: ${res.success}<br>
                Registros fallidos/ignorados: ${res.failed}
            </div>
        `;

        if (res.errores && res.errores.length > 0) {
            html += `
                <div style="background: rgba(239, 68, 68, 0.1); color: #b91c1c; padding: 10px; border-radius: 6px;">
                    <strong><i class="ph ph-warning"></i> Detalle de Errores:</strong>
                    <ul style="margin: 5px 0 0 20px; font-size: 0.85rem; padding: 0;">
                        ${res.errores.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            `;
            if (res.success > 0) Toast.info(`Carga con advertencias: ${res.success} exitosos, ${res.failed} fallidos.`);
            else Toast.error('Todos los registros fallaron. Revisa el detalle.');
        } else {
            Toast.success(`¡Carga masiva completada! (${res.success} registros)`);
            setTimeout(cerrarModalUpload, 2000);
        }

        resultBox.innerHTML = html;
        resultBox.classList.remove('hidden');

        // Refrescar tablas
        if (res.success > 0) {
            if (tipo === 'areas' && typeof cargarTablaAreas === 'function') cargarTablaAreas();
            if (tipo === 'empleados' && typeof cargarTablaEmpleados === 'function') cargarTablaEmpleados();
            if (tipo === 'usuarios' && typeof cargarTablaUsuarios === 'function') cargarTablaUsuarios();
        }

    } catch (err) {
        Toast.error('Error al procesar el archivo: ' + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="ph ph-upload"></i> Procesar Archivo';
    }
}
