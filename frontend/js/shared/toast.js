// =============================================================================
// SISTEMA DE NOTIFICACIONES TOAST — LA PERLA S.A.
// Reemplaza alert() nativo con notificaciones no bloqueantes
// Uso: Toast.success('Mensaje'), Toast.error('Error'), Toast.info('Info')
// =============================================================================

const Toast = (() => {
    let _container = null;

    function _getContainer() {
        if (_container) return _container;
        _container = document.createElement('div');
        _container.id = 'toast-container';
        document.body.appendChild(_container);
        return _container;
    }

    function _mostrar(mensaje, tipo = 'info', duracion = 3500) {
        const container = _getContainer();

        const toast = document.createElement('div');
        toast.className = 	oast toast-;

        const iconos = {
            success: 'ph-check-circle',
            error:   'ph-x-circle',
            info:    'ph-info',
            warning: 'ph-warning'
        };

        toast.innerHTML = 
            <i class="ph "></i>
            <span></span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="ph ph-x"></i>
            </button>
        ;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast-visible'));

        setTimeout(() => {
            toast.classList.remove('toast-visible');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duracion);
    }

    return {
        success: (msg, dur) => _mostrar(msg, 'success', dur),
        error:   (msg, dur) => _mostrar(msg, 'error', dur),
        info:    (msg, dur) => _mostrar(msg, 'info', dur),
        warning: (msg, dur) => _mostrar(msg, 'warning', dur)
    };
})();
