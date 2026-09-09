// Cambiar entre pestañas de la interfaz
        function cambiarVista(vista) {
            document.getElementById('seccionNuevo').classList.toggle('active', vista === 'nuevo');
            document.getElementById('seccionExistente').classList.toggle('active', vista === 'existente');
            document.querySelectorAll('.tab-btn')[0].classList.toggle('active', vista === 'nuevo');
            document.querySelectorAll('.tab-btn')[1].classList.toggle('active', vista === 'existente');
            document.getElementById('resultado').style.display = 'none';

            if (vista === 'existente') {
                cargarListadoNegocios(); // Carga la tabla al abrir la pestaña
            }
        }

        // URL base de tu API .NET (asegúrate de que coincida con tu puerto actual)
        const API_BASE = 'https://menusqr-febmaxevaueva3e5.mexicentral-01.azurewebsites.net/api/menus';

        // 1. EVENTO: NUEVO REGISTRO (Conecta con POST /api/menus/subir)
        document.getElementById('formNuevo').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('archivoPdf', document.getElementById('pdfFileNuevo').files[0]);
            formData.append('nombreNegocio', document.getElementById('nombreNegocioNuevo').value);

            await enviarPeticion(`${API_BASE}/subir`, formData, document.getElementById('btnNuevo'));
        });

        // 2. EVENTO: ACTUALIZAR QR (Conecta con POST /api/menus/actualizar)
        document.getElementById('formExistente').addEventListener('submit', async (e) => {
            e.preventDefault();
            const idNegocio = document.getElementById('idNegocioExistente').value;
            const nombreNegocio = document.getElementById('nombreNegocioExistente').value;
            const archivo = document.getElementById('pdfFileExistente').files[0];

            const formData = new FormData();
            formData.append('archivoPdf', archivo);
            formData.append('idNegocio', idNegocio);
            formData.append('nombreNegocio', nombreNegocio);

            await enviarPeticion(`${API_BASE}/actualizar`, formData, document.getElementById('btnActualizar'));
            document.getElementById('btnActualizar').scrollIntoView({ behavior: 'smooth' });
        });

        // Cargar el listado de negocios llamando a GET /api/menus/listar
        async function cargarListadoNegocios() {
            try {
                const response = await fetch(`${API_BASE}/listar`);
                if (!response.ok) throw new Error('No se pudo obtener el listado.');

                const menus = await response.json();
                const tbody = document.getElementById('tablaMenusBody');
                tbody.innerHTML = '';

                menus.forEach(menu => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${menu.id}</td>
                        <td>${menu.nombreNegocio || 'N/D'}</td>
                        <td>${menu.fechaCreacion ? new Date(menu.fechaCreacion).toLocaleDateString() : 'N/D'}</td>
                        <td>${menu.nombreArchivoOriginal || 'N/D'}</td>
                        <td style="word-break: break-all;">${menu.nombreArchivoServidor || 'N/D'}</td>
                        <td><a href="${menu.urlPdf}" target="_blank">Ver PDF</a></td>
                        <td>
                            <div class="acciones-container">
                                <button class="btn-seleccionar" onclick="habilitarEdicion(${menu.id}, '${menu.nombreNegocio}')">Editar</button>
                                <button class="btn-ver-qr" onclick="verQrNegocio('${menu.qrCodeBase64}', '${menu.nombreNegocio}', '${menu.urlPdf}')">Ver QR</button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                alert("Error al cargar el listado: " + error.message);
            }
        }

        // Nueva función para mostrar el QR del negocio seleccionado en la sección de resultados
        function verQrNegocio(qrBase64, nombreNegocio, urlPdf) {
            document.getElementById('mensajeEstado').innerText = `Código QR actual del negocio: ${nombreNegocio}`;
            document.getElementById('qrImage').src = qrBase64;
            document.getElementById('downloadQrBtn').href = qrBase64;
            document.getElementById('pdfLink').href = urlPdf;
            document.getElementById('pdfLink').innerText = urlPdf;

            // Mostramos el contenedor de resultados y subimos la vista hacia él
            document.getElementById('resultado').style.display = 'block';
            document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
        }

        // Habilitar los campos de edición cuando el usuario elige un negocio de la tabla
        function habilitarEdicion(id, nombre) {
            document.getElementById('idNegocioExistente').value = id;
            document.getElementById('nombreNegocioExistente').value = nombre;
            
            // Habilitar controles del formulario de actualización
            document.getElementById('nombreNegocioExistente').disabled = false;
            document.getElementById('pdfFileExistente').disabled = false;
            document.getElementById('btnActualizar').disabled = false;

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Función centralizada para enviar peticiones a la API
        async function enviarPeticion(url, formData, boton) {
            const textoOriginal = boton.innerText;
            boton.innerText = "Procesando...";
            boton.disabled = true;

            try {
                const response = await fetch(url, { method: 'POST', body: formData });
                
                // Intentamos parsear la respuesta a JSON (funciona tanto para éxito como para errores controlados de .NET)
                const data = await response.json();

                // Si el servidor devolvió un error (ej. 400 Bad Request por no ser PDF)
                if (!response.ok) {
                    throw new Error(data.mensaje || 'Ocurrió un error en el servidor.');
                }
                
                // Pintar los resultados exitosos devueltos por el backend
                document.getElementById('mensajeEstado').innerText = data.mensaje;
                document.getElementById('qrImage').src = data.qrCodeBase64;
                document.getElementById('downloadQrBtn').href = data.qrCodeBase64;
                document.getElementById('pdfLink').href = data.urlPdf;
                document.getElementById('pdfLink').innerText = data.urlPdf;

                document.getElementById('resultado').style.display = 'block';
                
                if (url.includes('actualizar')) {
                    cargarListadoNegocios(); // Refrescar tabla si fue actualización
                }
            } catch (error) {
                // Aquí se atrapa el mensaje exacto enviado por .NET (ej. "El archivo debe ser un formato PDF válido.")
                alert("Aviso: " + error.message);
            } finally {
                boton.innerText = textoOriginal;
                boton.disabled = false;
            }
        }

        // 1. Al cargar la página, inyectamos el nombre del usuario logueado
        document.addEventListener('DOMContentLoaded', () => {
            const usuarioGuardado = localStorage.getItem('usuarioLogueado');
            if (usuarioGuardado) {
                try {
                    const usuario = JSON.parse(usuarioGuardado);
                    // Muestra el nombre obtenido de la base de datos
                    document.getElementById('saludoUsuario').innerText = `👤 ${usuario.nombre}`;
                } catch (e) {
                    console.error("Error al leer los datos del usuario", e);
                }
            }
        });

        // 2. Función para cerrar sesión limpiamente
        function cerrarSesion() {
            if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
                localStorage.removeItem('usuarioLogueado'); // Borramos la sesión
                window.location.href = 'index.html'; // Redirigimos al login
            }
        }