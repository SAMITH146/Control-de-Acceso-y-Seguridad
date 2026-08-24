// =============================================================================
// INTERCEPTOR JWT HTTP — COMPARTIDO (LA PERLA S.A.)
// =============================================================================
const _originalFetch = window.fetch;
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
    const response = await _originalFetch(url, options);
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('usuario_activo');
        window.location.replace('index.html');
    }
    return response;
};
