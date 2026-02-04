// ============================================
// Gestión de Pacientes
// ============================================

let pacientes = [];
let pacienteActual = null;
let vistaActual = 'tarjetas'; // 'tarjetas' o 'tabla'

// ============================================
// Funciones Principales
// ============================================

/**
 * Carga todos los pacientes desde localStorage
 */
async function cargarPacientes() {
    try {
        mostrarLoading('listaPacientes');
        
        pacientes = obtenerTodos(colecciones.pacientes);
        
        // Ordenar por apellido automáticamente
        pacientes = ordenarDocumentos(pacientes, 'apellido');
        
        renderizarPacientes();
        ocultarLoading('listaPacientes');
        
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
        ocultarLoading('listaPacientes');
    }
}

/**
 * Renderiza la lista de pacientes según la vista actual
 */
function renderizarPacientes() {
    const contenedor = document.getElementById('listaPacientes');
    
    if (pacientes.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="estado-vacio">
                    <i class="fas fa-users"></i>
                    <h5>No hay pacientes registrados</h5>
                    <p>Comienza agregando tu primer paciente.</p>
                    <button class="btn btn-purple" onclick="mostrarFormularioPaciente()">
                        <i class="fas fa-plus"></i> Agregar Paciente
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    if (vistaActual === 'tarjetas') {
        renderizarTarjetasPacientes(contenedor);
    } else {
        renderizarTablaPacientes(contenedor);
    }
}

/**
 * Renderiza pacientes en formato de tarjetas
 */
function renderizarTarjetasPacientes(contenedor) {
    contenedor.innerHTML = pacientes.map(paciente => `
        <div class="col-md-6 col-lg-4">
            <div class="paciente-card">
                <div class="d-flex align-items-start">
                    <div class="paciente-avatar">
                        ${obtenerIniciales(paciente.nombre)}
                    </div>
                    <div class="paciente-info flex-grow-1 ms-3">
                        <h5>${paciente.nombre}</h5>
                        <p><i class="fas fa-id-card"></i> ${paciente.cedula}</p>
                        <p><i class="fas fa-phone"></i> ${paciente.telefono}</p>
                        <p><i class="fas fa-birthday-cake"></i> ${formatearFecha(paciente.fechaNacimiento)}</p>
                        ${paciente.direccion ? `<p><i class="fas fa-map-marker-alt"></i> ${paciente.direccion}</p>` : ''}
                    </div>
                </div>
                <div class="paciente-acciones mt-3">
                    <button class="btn btn-sm btn-purple" onclick="verFichaPaciente('${paciente.id}')">
                        <i class="fas fa-file-medical"></i> Ficha
                    </button>
                    <button class="btn btn-sm btn-outline-purple" onclick="editarPaciente('${paciente.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarPaciente('${paciente.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Renderiza pacientes en formato de tabla
 */
function renderizarTablaPacientes(contenedor) {
    contenedor.innerHTML = `
        <div class="col-12">
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Cédula</th>
                            <th>Teléfono</th>
                            <th>Fecha Nacimiento</th>
                            <th>Dirección</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pacientes.map(paciente => `
                            <tr>
                                <td>${paciente.nombre}</td>
                                <td>${paciente.cedula}</td>
                                <td>${paciente.telefono}</td>
                                <td>${formatearFecha(paciente.fechaNacimiento)}</td>
                                <td>${paciente.direccion || 'No especificada'}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-purple" onclick="verFichaPaciente('${paciente.id}')" title="Ver Ficha">
                                            <i class="fas fa-file-medical"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-purple" onclick="editarPaciente('${paciente.id}')" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarPaciente('${paciente.id}')" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Muestra el formulario para agregar/editar paciente
 */
function mostrarFormularioPaciente(pacienteId = null) {
    pacienteActual = pacienteId;
    const modal = new bootstrap.Modal(document.getElementById('modalPaciente'));
    const titulo = document.getElementById('tituloModalPaciente');
    const formulario = document.getElementById('formularioPaciente');
    
    if (pacienteId) {
        const paciente = pacientes.find(p => p.id === pacienteId);
        titulo.innerHTML = '<i class="fas fa-user-edit"></i> Editar Paciente';
        
        // Cargar datos del paciente
        document.getElementById('nombrePaciente').value = paciente.nombre;
        document.getElementById('cedulaPaciente').value = paciente.cedula;
        document.getElementById('telefonoPaciente').value = paciente.telefono;
        document.getElementById('fechaNacimientoPaciente').value = paciente.fechaNacimiento || '';
        document.getElementById('direccionPaciente').value = paciente.direccion || '';
        document.getElementById('notasMedicasPaciente').value = paciente.notasMedicas || '';
    } else {
        titulo.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Paciente';
        formulario.reset();
    }
    
    modal.show();
}

/**
 * Guarda un paciente nuevo o editado
 */
async function guardarPaciente() {
    try {
        const datosPaciente = {
            nombre: document.getElementById('nombrePaciente').value.trim(),
            cedula: document.getElementById('cedulaPaciente').value.trim(),
            telefono: document.getElementById('telefonoPaciente').value.trim(),
            fechaNacimiento: document.getElementById('fechaNacimientoPaciente').value,
            direccion: document.getElementById('direccionPaciente').value.trim(),
            notasMedicas: document.getElementById('notasMedicasPaciente').value.trim()
        };
        
        // Validar campos obligatorios
        if (!validarDocumento(datosPaciente, ['nombre', 'cedula', 'telefono'])) {
            return;
        }
        
        // Extraer apellido para ordenamiento
        const nombreCompleto = datosPaciente.nombre.split(' ');
        datosPaciente.apellido = nombreCompleto[nombreCompleto.length - 1];
        
        if (pacienteActual) {
            // Editar paciente existente
            actualizarDocumento(colecciones.pacientes, pacienteActual, datosPaciente);
            mostrarNotificacion('Paciente actualizado exitosamente.', 'success');
        } else {
            // Crear nuevo paciente
            agregarDocumento(colecciones.pacientes, datosPaciente);
            mostrarNotificacion('Paciente agregado exitosamente.', 'success');
        }
        
        // Cerrar modal y recargar lista
        bootstrap.Modal.getInstance(document.getElementById('modalPaciente')).hide();
        await cargarPacientes();
        
    } catch (error) {
        console.error('Error al guardar paciente:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Edita un paciente existente
 */
function editarPaciente(pacienteId) {
    mostrarFormularioPaciente(pacienteId);
}

/**
 * Elimina un paciente
 */
async function eliminarPaciente(pacienteId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        eliminarDocumento(colecciones.pacientes, pacienteId);
        mostrarNotificacion('Paciente eliminado exitosamente.', 'success');
        await cargarPacientes();
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Busca pacientes por nombre o cédula
 */
function buscarPacientes() {
    const terminoBusqueda = document.getElementById('busquedaPaciente').value.toLowerCase().trim();
    
    if (!terminoBusqueda) {
        renderizarPacientes();
        return;
    }
    
    const pacientesFiltrados = pacientes.filter(paciente => 
        paciente.nombre.toLowerCase().includes(terminoBusqueda) ||
        paciente.cedula.toLowerCase().includes(terminoBusqueda)
    );
    
    const contenedor = document.getElementById('listaPacientes');
    
    if (pacientesFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="estado-vacio">
                    <i class="fas fa-search"></i>
                    <h5>No se encontraron resultados</h5>
                    <p>No hay pacientes que coincidan con "${terminoBusqueda}"</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar pacientes filtrados
    const pacientesOriginales = pacientes;
    pacientes = pacientesFiltrados;
    renderizarPacientes();
    pacientes = pacientesOriginales;
}

/**
 * Ordena pacientes según el criterio seleccionado
 */
function ordenarPacientes() {
    const criterio = document.getElementById('ordenPacientes').value;
    
    pacientes.sort((a, b) => {
        switch (criterio) {
            case 'nombre':
                return a.nombre.localeCompare(b.nombre);
            case 'apellido':
                return a.apellido.localeCompare(b.apellido);
            case 'cedula':
                return a.cedula.localeCompare(b.cedula);
            case 'fecha':
                return (a.fechaCreacion?.seconds || 0) - (b.fechaCreacion?.seconds || 0);
            default:
                return 0;
        }
    });
    
    renderizarPacientes();
}

/**
 * Cambia la vista de pacientes (tarjetas/tabla)
 */
function cambiarVistaPacientes(vista) {
    vistaActual = vista;
    renderizarPacientes();
}

/**
 * Muestra la ficha clínica completa de un paciente
 */
async function verFichaPaciente(pacienteId) {
    try {
        const paciente = pacientes.find(p => p.id === pacienteId);
        if (!paciente) {
            mostrarNotificacion('Paciente no encontrado.', 'error');
            return;
        }
        
        // Cargar historial clínico del paciente
        const historial = buscarDocumentos(colecciones.historialClinico, 'pacienteId', pacienteId);
        
        // Ordenar historial por fecha
        const historialOrdenado = ordenarDocumentos(historial, 'fecha', 'desc');
        
        // Renderizar ficha
        const contenido = document.getElementById('contenidoFichaPaciente');
        contenido.innerHTML = generarHTMLFichaPaciente(paciente, historialOrdenado);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalFichaPaciente'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar ficha del paciente:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

// ============================================
// Funciones Utilitarias
// ============================================

/**
 * Obtiene las iniciales de un nombre
 */
function obtenerIniciales(nombre) {
    const palabras = nombre.split(' ');
    if (palabras.length >= 2) {
        return palabras[0][0] + palabras[palabras.length - 1][0];
    }
    return nombre.substring(0, 2).toUpperCase();
}

/**
 * Formatea una fecha para mostrar
 */
function formatearFecha(fecha) {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
}

/**
 * Genera el HTML para la ficha del paciente
 */
function generarHTMLFichaPaciente(paciente, historial) {
    return `
        <div class="row">
            <div class="col-md-4">
                <div class="text-center mb-4">
                    <div class="paciente-avatar mx-auto mb-3" style="width: 100px; height: 100px; font-size: 2rem;">
                        ${obtenerIniciales(paciente.nombre)}
                    </div>
                    <h4 class="text-purple">${paciente.nombre}</h4>
                    <p class="text-muted">Paciente ID: ${paciente.id}</p>
                </div>
                
                <div class="card">
                    <div class="card-header bg-purple text-white">
                        <h6 class="mb-0">Información Personal</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Cédula:</strong> ${paciente.cedula}</p>
                        <p><strong>Teléfono:</strong> ${paciente.telefono}</p>
                        <p><strong>Fecha de Nacimiento:</strong> ${formatearFecha(paciente.fechaNacimiento)}</p>
                        <p><strong>Dirección:</strong> ${paciente.direccion || 'No especificada'}</p>
                        <p><strong>Fecha de Registro:</strong> ${formatearTimestamp(paciente.fechaCreacion)}</p>
                    </div>
                </div>
                
                ${paciente.notasMedicas ? `
                    <div class="card mt-3">
                        <div class="card-header bg-purple text-white">
                            <h6 class="mb-0">Notas Médicas</h6>
                        </div>
                        <div class="card-body">
                            <p>${paciente.notasMedicas}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="col-md-8">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5>Historial Clínico</h5>
                    <button class="btn btn-purple btn-sm" onclick="agregarRegistroHistorial('${paciente.id}')">
                        <i class="fas fa-plus"></i> Agregar Registro
                    </button>
                </div>
                
                ${historial.length === 0 ? `
                    <div class="estado-vacio">
                        <i class="fas fa-file-medical"></i>
                        <h5>No hay historial clínico</h5>
                        <p>Este paciente no tiene registros médicos aún.</p>
                    </div>
                ` : `
                    <div class="historial-seccion">
                        ${historial.map(registro => `
                            <div class="tratamiento-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6>${registro.tipo}</h6>
                                        <p class="mb-1">${registro.descripcion}</p>
                                        <small class="text-muted">${formatearTimestamp(registro.fecha)}</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistroHistorial('${registro.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

/**
 * Agrega un nuevo registro al historial clínico
 */
async function agregarRegistroHistorial(pacienteId) {
    // Implementar formulario para agregar registro
    mostrarNotificación('Función en desarrollo...', 'info');
}

/**
 * Elimina un registro del historial clínico
 */
async function eliminarRegistroHistorial(registroId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        return;
    }
    
    try {
        eliminarDocumento(colecciones.historialClinico, registroId);
        mostrarNotificacion('Registro eliminado exitosamente.', 'success');
        // Recargar ficha
        const pacienteId = document.querySelector('#modalFichaPaciente .paciente-avatar').textContent;
        await verFichaPaciente(pacienteId);
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Muestra/oculta indicador de carga
 */
function mostrarLoading(contenedorId) {
    document.getElementById(contenedorId).innerHTML = `
        <div class="col-12">
            <div class="loading">
                <div class="spinner"></div>
            </div>
        </div>
    `;
}

function ocultarLoading(contenedorId) {
    // La función renderizarPacientes se encargará de actualizar el contenido
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar pacientes al iniciar
    cargarPacientes();
});

// Exportar funciones para uso global
window.pacientesModule = {
    cargarPacientes,
    mostrarFormularioPaciente,
    guardarPaciente,
    editarPaciente,
    eliminarPaciente,
    buscarPacientes,
    ordenarPacientes,
    cambiarVistaPacientes,
    verFichaPaciente
};
