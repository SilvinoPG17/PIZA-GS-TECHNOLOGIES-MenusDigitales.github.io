const API_URL = 'https://localhost:7095/api/usuarios/login';

        document.getElementById('formLogin').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnLogin');
            const errorP = document.getElementById('errorMsg');
            errorP.style.display = 'none';

            const credentials = {
                correo: document.getElementById('correo').value,
                passWord: document.getElementById('passWord').value
            };

            btn.innerText = "Verificando...";
            btn.disabled = true;

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.mensaje || 'Error al iniciar sesión.');
                }

                // Guardamos la sesión en el navegador
                localStorage.setItem('usuarioLogueado', JSON.stringify(data.usuario));

                // Redirigimos a tu vista principal de gestión de menús
                window.location.href = 'GestionMenus.html';

            } catch (error) {
                errorP.innerText = error.message;
                errorP.style.display = 'block';
            } finally {
                btn.innerText = "Entrar al Sistema";
                btn.disabled = false;
            }
        });