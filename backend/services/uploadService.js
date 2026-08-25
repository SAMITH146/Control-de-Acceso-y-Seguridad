// =============================================================================
// SERVICIO: CARGUE MASIVO EXCEL — LA PERLA S.A.
// =============================================================================
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * Parsea el buffer de un Excel y devuelve el JSON de la primera hoja
 */
function parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

/**
 * Cargue masivo de Áreas
 * Columnas esperadas: NOMBRE_AREA, DESCRIPCION
 */
exports.cargarAreas = async (buffer) => {
    const filas = parseExcel(buffer);
    let success = 0, failed = 0;
    const errores = [];

    for (const [index, fila] of filas.entries()) {
        const nombre = fila['NOMBRE_AREA'] || fila['nombre_area'] || fila['Nombre Area'] || '';
        const desc = fila['DESCRIPCION'] || fila['descripcion'] || fila['Descripción'] || '';
        const numFila = index + 2; // +1 porque el array es 0-based, +1 por el header

        if (!nombre.trim()) {
            failed++;
            errores.push(`Fila ${numFila}: NOMBRE_AREA está vacío.`);
            continue;
        }

        try {
            await db.execute(`INSERT INTO areas (nombre_area, descripcion, estado_activo) VALUES (?, ?, 1)`, [nombre.trim(), desc.trim() || null]);
            success++;
        } catch (err) {
            failed++;
            if (err.code === 'ER_DUP_ENTRY') {
                errores.push(`Fila ${numFila}: El área '${nombre}' ya existe.`);
            } else {
                errores.push(`Fila ${numFila}: ${err.message}`);
            }
        }
    }
    return { success, failed, errores };
};

/**
 * Cargue masivo de Empleados
 * Columnas: TIPO_DOCUMENTO, NUMERO_DOCUMENTO, NOMBRES, APELLIDOS, CARGO, AREA, EMAIL, TELEFONO
 */
exports.cargarEmpleados = async (buffer) => {
    const filas = parseExcel(buffer);
    let success = 0, failed = 0;
    const errores = [];

    // Mapeo rápido de áreas para no consultar BD en cada iteración
    const [areasRows] = await db.execute('SELECT id_area, LOWER(nombre_area) as nom FROM areas');
    const mapAreas = {};
    areasRows.forEach(a => mapAreas[a.nom] = a.id_area);

    for (const [index, fila] of filas.entries()) {
        const numFila = index + 2;
        const tipoDoc = (fila['TIPO_DOCUMENTO'] || fila['Tipo Documento'] || '').toString().trim();
        const numDoc = (fila['NUMERO_DOCUMENTO'] || fila['Numero Documento'] || fila['Cédula'] || '').toString().trim();
        const nombres = (fila['NOMBRES'] || fila['Nombres'] || '').toString().trim();
        const apellidos = (fila['APELLIDOS'] || fila['Apellidos'] || '').toString().trim();
        const cargo = (fila['CARGO'] || fila['Cargo'] || '').toString().trim();
        const areaStr = (fila['AREA'] || fila['Area'] || fila['Área'] || '').toString().trim().toLowerCase();
        const email = (fila['EMAIL'] || fila['Email'] || '').toString().trim() || null;
        const tel = (fila['TELEFONO'] || fila['Telefono'] || fila['Teléfono'] || '').toString().trim() || null;

        if (!tipoDoc || !numDoc || !nombres || !apellidos || !cargo || !areaStr) {
            failed++;
            errores.push(`Fila ${numFila}: Faltan campos obligatorios (requiere Tipo Doc, Número, Nombres, Apellidos, Cargo y Área).`);
            continue;
        }

        const idArea = mapAreas[areaStr];
        if (!idArea) {
            failed++;
            errores.push(`Fila ${numFila}: El área '${areaStr}' no existe en el sistema. Asegúrate de que esté escrita exactamente igual.`);
            continue;
        }

        try {
            await db.execute(`
                INSERT INTO empleados (tipo_documento, numero_documento, nombres, apellidos, cargo, id_area, email_corporativo, telefono_contacto, estado_activo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [tipoDoc.toUpperCase(), numDoc, nombres, apellidos, cargo, idArea, email, tel]);
            success++;
        } catch (err) {
            failed++;
            if (err.code === 'ER_DUP_ENTRY') {
                errores.push(`Fila ${numFila}: El documento '${numDoc}' o email ya está registrado.`);
            } else {
                errores.push(`Fila ${numFila}: Error BD -> ${err.message}`);
            }
        }
    }
    return { success, failed, errores };
};

/**
 * Cargue masivo de Usuarios (Escoltas)
 * Columnas: USERNAME, NOMBRE_COMPLETO, NUMERO_DOCUMENTO, EMAIL
 * Nota: Asigna ROL=2 (Escolta) por defecto. La clave será igual a NUMERO_DOCUMENTO.
 */
exports.cargarUsuarios = async (buffer) => {
    const filas = parseExcel(buffer);
    let success = 0, failed = 0;
    const errores = [];

    for (const [index, fila] of filas.entries()) {
        const numFila = index + 2;
        const user = (fila['USERNAME'] || fila['Username'] || fila['Usuario'] || '').toString().trim();
        const nombre = (fila['NOMBRE_COMPLETO'] || fila['Nombre Completo'] || '').toString().trim();
        const numDoc = (fila['NUMERO_DOCUMENTO'] || fila['Numero Documento'] || fila['Cédula'] || '').toString().trim();
        const email = (fila['EMAIL'] || fila['Email'] || '').toString().trim() || null;

        if (!user || !nombre || !numDoc) {
            failed++;
            errores.push(`Fila ${numFila}: Faltan campos (Username, Nombre Completo, Numero Documento).`);
            continue;
        }

        try {
            // Contraseña por defecto = El número de documento
            const hash = await bcrypt.hash(numDoc, 10);
            
            // id_rol = 2 asumiendo que 2 es Escolta/Vigilante
            await db.execute(`
                INSERT INTO usuarios (username, nombre_completo, numero_documento, email, password_hash, id_rol, estado_activo, requiere_cambio_password, eliminado) 
                VALUES (?, ?, ?, ?, ?, 2, 1, 1, 0)
            `, [user, nombre, numDoc, email, hash]);
            success++;
        } catch (err) {
            failed++;
            if (err.code === 'ER_DUP_ENTRY') {
                errores.push(`Fila ${numFila}: El usuario '${user}' o documento '${numDoc}' ya existe.`);
            } else {
                errores.push(`Fila ${numFila}: Error BD -> ${err.message}`);
            }
        }
    }
    return { success, failed, errores };
};
