// =============================================================================
// CAPA DE API CENTRALIZADA — LA PERLA S.A.
// Todos los endpoints del sistema en un solo lugar.
// Si el backend cambia una ruta, solo se modifica aqui.
// =============================================================================

const Api = {

    // -------------------------------------------------------------------------
    // AUTH
    // -------------------------------------------------------------------------
    auth: {
        /** Verifica que el token JWT siga activo */
        verificarToken: () => fetch('/api/verify-token')
    },

    // -------------------------------------------------------------------------
    // DASHBOARD
    // -------------------------------------------------------------------------
    dashboard: {
        /** Obtiene las estadisticas generales del sistema */
        getStats: () => fetch('/api/dashboard/stats').then(r => r.json())
    },

    // -------------------------------------------------------------------------
    // VISITAS
    // -------------------------------------------------------------------------
    visitas: {
        /** Lista todas las visitas con estado EN_PLANTA */
        getActivas: () => fetch('/api/visitas/activas').then(r => r.json()),

        /** Registra el ingreso de un visitante */
        registrarIngreso: (payload) => fetch('/api/visitas/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Registra la salida de una visita */
        registrarSalida: (idVisita, payload) => fetch(`/api/visitas/salida/${idVisita}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
    },

    // -------------------------------------------------------------------------
    // VISITANTES
    // -------------------------------------------------------------------------
    visitantes: {
        /** Lista visitantes, con busqueda opcional */
        getAll: (q = '') => fetch(`/api/visitantes?q=${encodeURIComponent(q)}`).then(r => r.json()),

        /** Busca un visitante por numero de documento */
        buscarPorDocumento: (doc) => fetch(`/api/visitantes/buscar?documento=${encodeURIComponent(doc)}`).then(r => r.json()),

        /** Edita los datos de un visitante */
        editar: (id, payload) => fetch(`/api/visitantes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Elimina un visitante */
        eliminar: (id) => fetch(`/api/visitantes/${id}`, { method: 'DELETE' })
    },

    // -------------------------------------------------------------------------
    // AREAS
    // -------------------------------------------------------------------------
    areas: {
        /** Lista todas las areas activas */
        getAll: () => fetch('/api/areas').then(r => r.json()),

        /** Lista TODAS las areas incluyendo inactivas */
        getAllAdmin: () => fetch('/api/areas/all').then(r => r.json()),

        /** Crea una nueva area */
        crear: (payload) => fetch('/api/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Edita un area existente */
        editar: (id, payload) => fetch(`/api/areas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Elimina un area */
        eliminar: (id) => fetch(`/api/areas/${id}`, { method: 'DELETE' })
    },

    // -------------------------------------------------------------------------
    // USUARIOS
    // -------------------------------------------------------------------------
    usuarios: {
        /** Lista todos los usuarios */
        getAll: () => fetch('/api/usuarios').then(r => r.json()),

        /** Obtiene un usuario por id */
        getById: (id) => fetch(`/api/usuarios/${id}`).then(r => r.json()),

        /** Activa o desactiva un usuario */
        toggleEstado: (id) => fetch(`/api/usuarios/${id}/toggle-estado`, { method: 'PUT' }),

        /** Crea un nuevo usuario */
        crear: (payload) => fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Edita un usuario */
        editar: (id, payload) => fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Elimina un usuario */
        eliminar: (id) => fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    },

    // -------------------------------------------------------------------------
    // EMPLEADOS
    // -------------------------------------------------------------------------
    empleados: {
        /** Lista todos los empleados activos */
        getAll: () => fetch('/api/empleados').then(r => r.json()),

        /** Lista TODOS los empleados incluyendo inactivos */
        getAllAdmin: () => fetch('/api/empleados/all').then(r => r.json()),

        /** Obtiene un empleado por id */
        getById: (id) => fetch(`/api/empleados/${id}`).then(r => r.json()),

        /** Crea un nuevo empleado */
        crear: (payload) => fetch('/api/empleados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Edita un empleado */
        editar: (id, payload) => fetch(`/api/empleados/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Elimina un empleado */
        eliminar: (id) => fetch(`/api/empleados/${id}`, { method: 'DELETE' })
    },

    // -------------------------------------------------------------------------
    // LISTA NEGRA
    // -------------------------------------------------------------------------
    listaNegra: {
        /** Lista todos los bloqueos */
        getAll: () => fetch('/api/lista-negra').then(r => r.json()),

        /** Bloquea un visitante directamente */
        bloquear: (payload) => fetch('/api/lista-negra/bloquear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Desbloquea un visitante */
        desbloquear: (id, payload) => fetch(`/api/lista-negra/desbloquear/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Elimina un registro de lista negra */
        eliminar: (id) => fetch(`/api/lista-negra/${id}`, { method: 'DELETE' })
    },

    // -------------------------------------------------------------------------
    // SOLICITUDES DE DESBLOQUEO
    // -------------------------------------------------------------------------
    solicitudesDesbloqueo: {
        /** Lista las solicitudes pendientes */
        getPendientes: () => fetch('/api/solicitudes-desbloqueo/pendientes').then(r => r.json()),

        /** Crea una solicitud de desbloqueo */
        crear: (payload) => fetch('/api/solicitudes-desbloqueo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Aprueba una solicitud */
        aprobar: (id, payload) => fetch(`/api/solicitudes-desbloqueo/${id}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Rechaza una solicitud */
        rechazar: (id, payload) => fetch(`/api/solicitudes-desbloqueo/${id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
    },

    // -------------------------------------------------------------------------
    // SOLICITUDES DE BLOQUEO
    // -------------------------------------------------------------------------
    solicitudesBloqueo: {
        /** Lista las solicitudes pendientes */
        getPendientes: () => fetch('/api/solicitudes-bloqueo/pendientes').then(r => r.json()),

        /** Crea una solicitud de bloqueo */
        crear: (payload) => fetch('/api/solicitudes-bloqueo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Aprueba una solicitud */
        aprobar: (id, payload) => fetch(`/api/solicitudes-bloqueo/${id}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),

        /** Rechaza una solicitud */
        rechazar: (id, payload) => fetch(`/api/solicitudes-bloqueo/${id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
    },

    // -------------------------------------------------------------------------
    // BITACORA
    // -------------------------------------------------------------------------
    bitacora: {
        /**
         * Consulta la bitacora con filtros opcionales
         * @param {{desde?:string, hasta?:string, estado?:string, buscar?:string}} filtros
         */
        getAll: (filtros = {}) => {
            const { desde = '', hasta = '', estado = '', buscar = '' } = filtros;
            const url = `/api/bitacora?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&estado=${encodeURIComponent(estado)}&buscar=${encodeURIComponent(buscar)}`;
            return fetch(url).then(r => r.json());
        }
    }
};
