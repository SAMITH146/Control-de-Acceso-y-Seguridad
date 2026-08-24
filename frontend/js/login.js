document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const btnIngresar = document.querySelector('.btn-ingresar');
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');
    const recordarCheckbox = document.getElementById('recordar');
    const togglePassword = document.getElementById('togglePassword');

    // 1. AUTOCOMPLETAR USUARIO RECORDADO (SI EXISTE)
    const usuarioRecordado = localStorage.getItem('usuario_recordado');
    if (usuarioRecordado && usuarioInput && recordarCheckbox) {
        usuarioInput.value = usuarioRecordado;
        recordarCheckbox.checked = true;
    }

    // 2. TOGGLE PARA MOSTRAR / OCULTAR CONTRASEÑA (OJO 👁️)
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            if (isPassword) {
                togglePassword.classList.remove('ph-eye');
                togglePassword.classList.add('ph-eye-slash');
            } else {
                togglePassword.classList.remove('ph-eye-slash');
                togglePassword.classList.add('ph-eye');
            }
        });
    }

    // 3. EVENTO SUBMIT DEL FORMULARIO DE LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = usuarioInput.value.trim();
        const password = passwordInput.value.trim();

        // Efecto visual de carga
        const originalText = btnIngresar.innerHTML;
        btnIngresar.innerHTML = '<i class="ph ph-spinner ph-spin" style="animation: spin 1s linear infinite;"></i> Validando...';
        btnIngresar.disabled = true;
        btnIngresar.style.opacity = '0.8';

        try {
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: usuario, password: password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Guardar o borrar preferencia de usuario recordado
                if (recordarCheckbox && recordarCheckbox.checked) {
                    localStorage.setItem('usuario_recordado', usuario);
                } else {
                    localStorage.removeItem('usuario_recordado');
                }

                // Guardar Token JWT y usuario activo en variables globales y localStorage
                if (datos.usuario) {
                    window.usuarioLoginTemp = datos.usuario;
                    localStorage.setItem('usuario_activo', JSON.stringify(datos.usuario));
                }
                if (datos.token) {
                    localStorage.setItem('auth_token', datos.token);
                }

                // ¿REQUIERE CAMBIO DE CONTRASEÑA OBLIGATORIO AL PRIMER INGRESO?
                if (datos.requiere_cambio) {
                    btnIngresar.innerHTML = originalText;
                    btnIngresar.disabled = false;
                    btnIngresar.style.opacity = '1';
                    
                    const modalPrimer = document.getElementById('modalPrimerPassword');
                    if (modalPrimer) {
                        modalPrimer.style.display = 'flex';
                        modalPrimer.classList.remove('hidden');
                    }
                    return; // Detener navegación hasta que personalice su clave
                }

                // Éxito normal
                btnIngresar.style.backgroundColor = '#0E773A';
                btnIngresar.style.color = '#FFF';
                btnIngresar.innerHTML = '<i class="ph ph-check-circle"></i> ¡Acceso Autorizado!';

                setTimeout(() => {
                    if (datos.usuario.id_rol === 1) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'porteria.html';
                    }
                }, 800);
            } else {
                throw new Error(datos.error || 'Credenciales incorrectas');
            }
        } catch (error) {
            btnIngresar.innerHTML = originalText;
            btnIngresar.disabled = false;
            btnIngresar.style.opacity = '1';

            loginForm.classList.add('shake-error');
            setTimeout(() => loginForm.classList.remove('shake-error'), 500);

            alert('❌ ' + (error.message || 'Usuario o contraseña incorrectos. Verifica e intenta de nuevo.'));
        }
    });
});

// Función para alternar visibilidad de inputs de clave en modal
function toggleVisibilidadInput(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input || !iconEl) return;
    const isPass = input.getAttribute('type') === 'password';
    input.setAttribute('type', isPass ? 'text' : 'password');
    if (isPass) {
        iconEl.classList.remove('ph-eye');
        iconEl.classList.add('ph-eye-slash');
    } else {
        iconEl.classList.remove('ph-eye-slash');
        iconEl.classList.add('ph-eye');
    }
}

// Guardar primer contraseña personalizada
async function guardarPrimerPassword(e) {
    e.preventDefault();

    const nuevaPass = document.getElementById('primerNuevaPassword').value.trim();
    const confirmarPass = document.getElementById('primerConfirmarPassword').value.trim();
    const btnGuardar = document.getElementById('btnGuardarPrimerPass');
    
    let usuarioActivo = window.usuarioLoginTemp;
    if (!usuarioActivo) {
        try {
            usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo') || '{}');
        } catch(e) {
            usuarioActivo = {};
        }
    }

    const token = localStorage.getItem('auth_token');
    const idUsuario = usuarioActivo.id_usuario || usuarioActivo.id;
    const username = usuarioActivo.username || document.getElementById('usuario')?.value?.trim();

    if (!idUsuario && !username) {
        alert('❌ No se encontró la sesión del usuario. Por favor vuelve a ingresar tu usuario y contraseña.');
        document.getElementById('modalPrimerPassword')?.classList.add('hidden');
        return;
    }

    if (!nuevaPass || !confirmarPass) {
        alert('Por favor ingresa la nueva contraseña y su confirmación.');
        return;
    }

    if (nuevaPass !== confirmarPass) {
        alert('La nueva contraseña y la confirmación no coinciden.');
        return;
    }

    if (nuevaPass.length < 6) {
        alert('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const originalText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="ph ph-spinner ph-spin" style="animation: spin 1s linear infinite;"></i> Guardando...';
    btnGuardar.disabled = true;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/usuarios/cambiar-primer-password', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                id_usuario: idUsuario,
                username: username,
                nueva_password: nuevaPass,
                confirmar_password: confirmarPass
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('✅ ' + (data.mensaje || '¡Contraseña personalizada exitosamente!'));
            
            setTimeout(() => {
                const rol = usuarioActivo.id_rol || 2;
                if (rol === 1) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'porteria.html';
                }
            }, 500);
        } else {
            btnGuardar.innerHTML = originalText;
            btnGuardar.disabled = false;
            alert('❌ ' + (data.error || 'No se pudo guardar la contraseña.'));
        }
    } catch (err) {
        btnGuardar.innerHTML = originalText;
        btnGuardar.disabled = false;
        alert('❌ Error al actualizar contraseña: ' + err.message);
    }
}
