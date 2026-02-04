// ============================================
// Gestión de Citas Médicas
// ============================================

let citas = [];
let calendarioActual = new Date();
let vistaCalendario = 'mes'; // 'mes', 'semana', 'dia'

// ============================================
// Funciones Principales
// ============================================

/**
 * Carga todas las citas desde localStorage
 */
async function cargarCitas() {
    try {
        mostrarLoading('proximasCitas');
        
        citas = obtenerTodos(colecciones.citas);
        
        // Ordenar por fecha y hora
        citas = ordenarDocumentos(citas, 'fechaHora');
        
        renderizarCalendario();
        renderizarProximasCitas();
        ocultarLoading('proximasCitas');
        
    } catch (error) {
        console.error('Error al cargar citas:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
        ocultarLoading('proximasCitas');
    }
}

/**
 * Renderiza el calendario de citas
 */
function renderizarCalendario() {
    const contenedor = document.getElementById('calendarioCitas');
    
    // Generar calendario del mes actual
    const primerDia = new Date(calendarioActual.getFullYear(), calendarioActual.getMonth(), 1);
    const ultimoDia = new Date(calendarioActual.getFullYear(), calendarioActual.getMonth() + 1, 0);
    const nombreMes = calendarioActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    let htmlCalendario = `
        <div class="calendario-header">
            <button class="btn btn-outline-purple btn-sm" onclick="cambiarMes(-1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h5 class="mb-0">${nombreMes}</h5>
            <button class="btn btn-outline-purple btn-sm" onclick="cambiarMes(1)">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        
        <div class="calendario-grid">
            <!-- Días de la semana -->
            <div class="text-center fw-bold">Dom</div>
            <div class="text-center fw-bold">Lun</div>
            <div class="text-center fw-bold">Mar</div>
            <div class="text-center fw-bold">Mié</div>
            <div class="text-center fw-bold">Jue</div>
            <div class="text-center fw-bold">Vie</div>
            <div class="text-center fw-bold">Sáb</div>
    `;
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < primerDia.getDay(); i++) {
        htmlCalendario += '<div></div>';
    }
    
    // Agregar días del mes
    const hoy = new Date();
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fechaActual = new Date(calendarioActual.getFullYear(), calendarioActual.getMonth(), dia);
        const esHoy = fechaActual.toDateString() === hoy.toDateString();
        const citasDelDia = obtenerCitasDelDia(fechaActual);
        
        let clases = 'calendario-dia';
        if (esHoy) clases += ' hoy';
        if (citasDelDia.length > 0) clases += ' con-cita';
        
        htmlCalendario += `
            <div class="${clases}" onclick="mostrarCitasDelDia('${fechaActual.toISOString()}')">
                ${dia}
                ${citasDelDia.length > 0 ? `<small class="d-block">${citasDelDia.length} cita(s)</small>` : ''}
            </div>
        `;
    }
    
    htmlCalendario += '</div>';
    contenedor.innerHTML = htmlCalendario;
}

/**
 * Renderiza las próximas citas
 */
function renderizarProximasCitas() {
    const contenedor = document.getElementById('proximasCitas');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const proximasCitas = citas.filter(cita => {
        const fechaCita = cita.fechaHora.toDate();
        return fechaCita >= hoy && cita.estado !== 'cancelada';
    }).slice(0, 5); // Mostrar solo las próximas 5 citas
    
    if (proximasCitas.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-calendar-times fa-2x mb-2"></i>
                <p>No hay próximas citas</p>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = proximasCitas.map(cita => `
        <div class="cita-card">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${cita.pacienteNombre}</h6>
                    <p class="mb-1">
                        <i class="fas fa-clock"></i> ${formatearFechaHora(cita.fechaHora)}
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-stethoscope"></i> ${cita.motivo || 'Consulta general'}
                    </p>
                </div>
                <div>
                    <span class="cita-estado ${cita.estado}">${obtenerTextoEstado(cita.estado)}</span>
                </div>
            </div>
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-purple" onclick="editarCita('${cita.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="cambiarEstadoCita('${cita.id}', 'atendida')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="cambiarEstadoCita('${cita.id}', 'cancelada')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Muestra el formulario para agendar/editar cita
 */
function mostrarFormularioCita(citaId = null) {
    // Crear modal dinámicamente si no existe
    if (!document.getElementById('modalCita')) {
        const modalHTML = `
            <div class="modal fade" id="modalCita" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-purple text-white">
                            <h5 class="modal-title" id="tituloModalCita">
                                <i class="fas fa-calendar-plus"></i> Nueva Cita
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formularioCita">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Paciente *</label>
                                        <select class="form-select" id="pacienteCita" required>
                                            <option value="">Seleccionar paciente...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Fecha y Hora *</label>
                                        <input type="datetime-local" class="form-control" id="fechaHoraCita" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Motivo de Consulta *</label>
                                        <input type="text" class="form-control" id="motivoCita" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Estado</label>
                                        <select class="form-select" id="estadoCita">
                                            <option value="pendiente">Pendiente</option>
                                            <option value="atendida">Atendida</option>
                                            <option value="cancelada">Cancelada</option>
                                        </select>
                                    </div>
                                    <div class="col-12 mb-3">
                                        <label class="form-label">Notas</label>
                                        <textarea class="form-control" id="notasCita" rows="3"></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-purple" onclick="guardarCita()">
                                <i class="fas fa-save"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Cargar pacientes en el select
    cargarPacientesEnSelect();
    
    const modal = new bootstrap.Modal(document.getElementById('modalCita'));
    const titulo = document.getElementById('tituloModalCita');
    const formulario = document.getElementById('formularioCita');
    
    if (citaId) {
        const cita = citas.find(c => c.id === citaId);
        titulo.innerHTML = '<i class="fas fa-calendar-edit"></i> Editar Cita';
        
        // Cargar datos de la cita
        document.getElementById('pacienteCita').value = cita.pacienteId;
        document.getElementById('fechaHoraCita').value = formatearDateTimeLocal(cita.fechaHora);
        document.getElementById('motivoCita').value = cita.motivo || '';
        document.getElementById('estadoCita').value = cita.estado || 'pendiente';
        document.getElementById('notasCita').value = cita.notas || '';
    } else {
        titulo.innerHTML = '<i class="fas fa-calendar-plus"></i> Nueva Cita';
        formulario.reset();
        
        // Establecer fecha y hora actual por defecto
        const ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
        document.getElementById('fechaHoraCita').value = ahora.toISOString().slice(0, 16);
    }
    
    modal.show();
}

/**
 * Guarda una cita nueva o editada
 */
function guardarCita() {
    try {
        const pacienteSelect = document.getElementById('pacienteCita');
        const pacienteOption = pacienteSelect.options[pacienteSelect.selectedIndex];
        
        const datosCita = {
            pacienteId: document.getElementById('pacienteCita').value,
            pacienteNombre: pacienteOption.textContent,
            fechaHora: document.getElementById('fechaHoraCita').value,
            motivo: document.getElementById('motivoCita').value.trim(),
            estado: document.getElementById('estadoCita').value,
            notas: document.getElementById('notasCita').value.trim()
        };
        
        // Validar campos obligatorios
        if (!validarDocumento(datosCita, ['pacienteId', 'fechaHora', 'motivo'])) {
            return;
        }
        
        if (pacienteActual) {
            // Editar cita existente
            actualizarDocumento(colecciones.citas, pacienteActual, datosCita);
            mostrarNotificacion('Cita actualizada exitosamente.', 'success');
        } else {
            // Crear nueva cita
            agregarDocumento(colecciones.citas, datosCita);
            mostrarNotificacion('Cita agendada exitosamente.', 'success');
        }
        
        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('modalCita')).hide();
        cargarCitas();
        
    } catch (error) {
        console.error('Error al guardar cita:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Edita una cita existente
 */
async function editarCita(citaId) {
    pacienteActual = citaId;
    mostrarFormularioCita(citaId);
}

/**
 * Cambia el estado de una cita
 */
async function cambiarEstadoCita(citaId, nuevoEstado) {
    try {
        await db.collection(colecciones.citas).doc(citaId).update({
            estado: nuevoEstado,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const mensaje = nuevoEstado === 'atendida' ? 'Cita marcada como atendida.' : 'Cita cancelada.';
        mostrarNotificacion(mensaje, 'success');
        
        await cargarCitas();
    } catch (error) {
        console.error('Error al cambiar estado de cita:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Elimina una cita
 */
async function eliminarCita(citaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        await db.collection(colecciones.citas).doc(citaId).delete();
        mostrarNotificacion('Cita eliminada exitosamente.', 'success');
        await cargarCitas();
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Muestra las citas de un día específico
 */
function mostrarCitasDelDia(fechaISO) {
    const fecha = new Date(fechaISO);
    const citasDelDia = obtenerCitasDelDia(fecha);
    
    if (citasDelDia.length === 0) {
        mostrarNotificacion(`No hay citas agendadas para ${fecha.toLocaleDateString('es-ES')}`, 'info');
        return;
    }
    
    let mensaje = `Citas para ${fecha.toLocaleDateString('es-ES')}:\n\n`;
    citasDelDia.forEach((cita, index) => {
        mensaje += `${index + 1}. ${cita.pacienteNombre} - ${formatearFechaHora(cita.fechaHora)}\n`;
        mensaje += `   Motivo: ${cita.motivo || 'Consulta general'}\n`;
        mensaje += `   Estado: ${obtenerTextoEstado(cita.estado)}\n\n`;
    });
    
    alert(mensaje);
}

// ============================================
// Funciones Utilitarias
// ============================================

/**
 * Obtiene las citas de un día específico
 */
function obtenerCitasDelDia(fecha) {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);
    
    return citas.filter(cita => {
        const fechaCita = cita.fechaHora.toDate();
        return fechaCita >= inicioDia && fechaCita <= finDia;
    });
}

/**
 * Cambia el mes del calendario
 */
function cambiarMes(direccion) {
    calendarioActual.setMonth(calendarioActual.getMonth() + direccion);
    renderizarCalendario();
}

/**
 * Formatea fecha y hora para mostrar
 */
function formatearFechaHora(timestamp) {
    if (!timestamp) return 'No disponible';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatea fecha para input datetime-local
 */
function formatearDateTimeLocal(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Obtiene el texto del estado de la cita
 */
function obtenerTextoEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'atendida': 'Atendida',
        'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
}

/**
 * Carga pacientes en el select del formulario
 */
function cargarPacientesEnSelect() {
    try {
        const pacientes = obtenerTodos(colecciones.pacientes);
        
        const select = document.getElementById('pacienteCita');
        select.innerHTML = '<option value="">Seleccionar paciente...</option>';
        
        pacientes.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.id;
            option.textContent = paciente.nombre;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
        mostrarNotificacion('Error al cargar pacientes', 'error');
    }
}

/**
 * Muestra/oculta indicador de carga
 */
function mostrarLoading(contenedorId) {
    document.getElementById(contenedorId).innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function ocultarLoading(contenedorId) {
    // Las funciones renderizar se encargarán de actualizar el contenido
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar citas al iniciar si estamos en la sección de citas
    if (document.getElementById('seccion-citas')) {
        cargarCitas();
    }
});

// Exportar funciones para uso global
window.citasModule = {
    cargarCitas,
    mostrarFormularioCita,
    guardarCita,
    editarCita,
    eliminarCita,
    cambiarEstadoCita,
    mostrarCitasDelDia,
    cambiarMes
};
