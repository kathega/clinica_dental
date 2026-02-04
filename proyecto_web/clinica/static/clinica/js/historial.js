// ============================================
// Gestión de Historial Clínico
// ============================================

let historialClinico = [];
let pacienteActualHistorial = null;

// ============================================
// Funciones Principales
// ============================================

/**
 * Carga el historial clínico de un paciente
 */
async function cargarHistorialPaciente(pacienteId) {
    try {
        pacienteActualHistorial = pacienteId;
        
        historialClinico = buscarDocumentos(colecciones.historialClinico, 'pacienteId', pacienteId);
        
        // Ordenar por fecha descendente
        historialClinico = ordenarDocumentos(historialClinico, 'fecha', 'desc');
        
        renderizarHistorial();
        
    } catch (error) {
        console.error('Error al cargar historial clínico:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Renderiza el historial clínico
 */
function renderizarHistorial() {
    const contenedor = document.getElementById('contenidoHistorial');
    
    if (!pacienteActualHistorial) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-user-search"></i>
                <h5>Selecciona un paciente</h5>
                <p>Primero selecciona un paciente para ver su historial clínico.</p>
            </div>
        `;
        return;
    }
    
    if (historialClinico.length === 0) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-file-medical"></i>
                <h5>No hay historial clínico</h5>
                <p>Este paciente no tiene registros médicos aún.</p>
                <button class="btn btn-purple" onclick="mostrarFormularioHistorial()">
                    <i class="fas fa-plus"></i> Agregar Registro
                </button>
            </div>
        `;
        return;
    }
    
    // Agrupar historial por tipo
    const historialAgrupado = agruparHistorialPorTipo(historialClinico);
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Historial Clínico del Paciente</h4>
            <button class="btn btn-purple" onclick="mostrarFormularioHistorial()">
                <i class="fas fa-plus"></i> Agregar Registro
            </button>
        </div>
    `;
    
    // Renderizar cada tipo de historial
    if (historialAgrupado.procedimientos.length > 0) {
        html += renderizarSeccionHistorial('Procedimientos Realizados', historialAgrupado.procedimientos, 'procedimiento');
    }
    
    if (historialAgrupado.tratamientos.length > 0) {
        html += renderizarSeccionHistorial('Tratamientos Indicados', historialAgrupado.tratamientos, 'tratamiento');
    }
    
    if (historialAgrupado.observaciones.length > 0) {
        html += renderizarSeccionHistorial('Observaciones Médicas', historialAgrupado.observaciones, 'observacion');
    }
    
    contenedor.innerHTML = html;
}

/**
 * Muestra el formulario para agregar registro al historial
 */
function mostrarFormularioHistorial(registroId = null) {
    // Crear modal dinámicamente si no existe
    if (!document.getElementById('modalHistorial')) {
        const modalHTML = `
            <div class="modal fade" id="modalHistorial" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-purple text-white">
                            <h5 class="modal-title" id="tituloModalHistorial">
                                <i class="fas fa-file-medical"></i> Agregar Registro Médico
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formularioHistorial">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Tipo de Registro *</label>
                                        <select class="form-select" id="tipoRegistro" required onchange="actualizarFormularioPorTipo()">
                                            <option value="">Seleccionar tipo...</option>
                                            <option value="procedimiento">Procedimiento Realizado</option>
                                            <option value="tratamiento">Tratamiento Indicado</option>
                                            <option value="observacion">Observación Médica</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Fecha *</label>
                                        <input type="date" class="form-control" id="fechaRegistro" required>
                                    </div>
                                    <div class="col-12 mb-3">
                                        <label class="form-label">Descripción *</label>
                                        <textarea class="form-control" id="descripcionRegistro" rows="4" required></textarea>
                                    </div>
                                    
                                    <!-- Campos específicos para procedimientos -->
                                    <div id="camposProcedimiento" style="display: none;">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Duración (minutos)</label>
                                            <input type="number" class="form-control" id="duracionProcedimiento">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Costo</label>
                                            <input type="number" class="form-control" id="costoProcedimiento" step="0.01">
                                        </div>
                                    </div>
                                    
                                    <!-- Campos específicos para tratamientos -->
                                    <div id="camposTratamiento" style="display: none;">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Duración Estimada (días)</label>
                                            <input type="number" class="form-control" id="duracionTratamiento">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Frecuencia</label>
                                            <select class="form-select" id="frecuenciaTratamiento">
                                                <option value="diario">Diario</option>
                                                <option value="semanal">Semanal</option>
                                                <option value="quincenal">Quincenal</option>
                                                <option value="mensual">Mensual</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <!-- Campos específicos para observaciones -->
                                    <div id="camposObservacion" style="display: none;">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Gravedad</label>
                                            <select class="form-select" id="gravedadObservacion">
                                                <option value="leve">Leve</option>
                                                <option value="moderado">Moderado</option>
                                                <option value="grave">Grave</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Requiere Seguimiento</label>
                                            <select class="form-select" id="seguimientoObservacion">
                                                <option value="no">No</option>
                                                <option value="si">Sí</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 mb-3">
                                        <label class="form-label">Notas Adicionales</label>
                                        <textarea class="form-control" id="notasRegistro" rows="2"></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-purple" onclick="guardarRegistroHistorial()">
                                <i class="fas fa-save"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalHistorial'));
    const titulo = document.getElementById('tituloModalHistorial');
    const formulario = document.getElementById('formularioHistorial');
    
    if (registroId) {
        const registro = historialClinico.find(r => r.id === registroId);
        titulo.innerHTML = '<i class="fas fa-edit"></i> Editar Registro Médico';
        
        // Cargar datos del registro
        document.getElementById('tipoRegistro').value = registro.tipo;
        document.getElementById('fechaRegistro').value = registro.fecha;
        document.getElementById('descripcionRegistro').value = registro.descripcion;
        
        actualizarFormularioPorTipo();
        
        // Cargar campos específicos según el tipo
        if (registro.tipo === 'procedimiento') {
            document.getElementById('duracionProcedimiento').value = registro.duracion || '';
            document.getElementById('costoProcedimiento').value = registro.costo || '';
        } else if (registro.tipo === 'tratamiento') {
            document.getElementById('duracionTratamiento').value = registro.duracionEstimada || '';
            document.getElementById('frecuenciaTratamiento').value = registro.frecuencia || 'diario';
        } else if (registro.tipo === 'observacion') {
            document.getElementById('gravedadObservacion').value = registro.gravedad || 'leve';
            document.getElementById('seguimientoObservacion').value = registro.requiereSeguimiento ? 'si' : 'no';
        }
        
        document.getElementById('notasRegistro').value = registro.notas || '';
    } else {
        titulo.innerHTML = '<i class="fas fa-file-medical"></i> Agregar Registro Médico';
        formulario.reset();
        
        // Establecer fecha actual por defecto
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaRegistro').value = hoy;
    }
    
    modal.show();
}

/**
 * Guarda un registro del historial clínico
 */
function guardarRegistroHistorial() {
    try {
        const tipo = document.getElementById('tipoRegistro').value;
        const datosRegistro = {
            pacienteId: pacienteActualHistorial,
            tipo: tipo,
            fecha: document.getElementById('fechaRegistro').value,
            descripcion: document.getElementById('descripcionRegistro').value.trim(),
            notas: document.getElementById('notasRegistro').value.trim()
        };
        
        // Validar campos obligatorios
        if (!validarDocumento(datosRegistro, ['pacienteId', 'tipo', 'fecha', 'descripcion'])) {
            return;
        }
        
        // Agregar campos específicos según el tipo
        if (tipo === 'procedimiento') {
            datosRegistro.duracion = parseInt(document.getElementById('duracionProcedimiento').value) || null;
            datosRegistro.costo = parseFloat(document.getElementById('costoProcedimiento').value) || null;
        } else if (tipo === 'tratamiento') {
            datosRegistro.duracionEstimada = parseInt(document.getElementById('duracionTratamiento').value) || null;
            datosRegistro.frecuencia = document.getElementById('frecuenciaTratamiento').value;
        } else if (tipo === 'observacion') {
            datosRegistro.gravedad = document.getElementById('gravedadObservacion').value;
            datosRegistro.requiereSeguimiento = document.getElementById('seguimientoObservacion').value === 'si';
        }
        
        if (pacienteActual) {
            // Editar registro existente
            actualizarDocumento(colecciones.historialClinico, pacienteActual, datosRegistro);
            mostrarNotificacion('Registro actualizado exitosamente.', 'success');
        } else {
            // Crear nuevo registro
            agregarDocumento(colecciones.historialClinico, datosRegistro);
            mostrarNotificacion('Registro agregado exitosamente.', 'success');
        }
        
        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('modalHistorial')).hide();
        cargarHistorialPaciente(pacienteActualHistorial);
        
    } catch (error) {
        console.error('Error al guardar registro:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

/**
 * Edita un registro del historial
 */
function editarRegistroHistorial(registroId) {
    pacienteActual = registroId;
    mostrarFormularioHistorial(registroId);
}

/**
 * Elimina un registro del historial
 */
async function eliminarRegistroHistorial(registroId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro médico? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        eliminarDocumento(colecciones.historialClinico, registroId);
        mostrarNotificacion('Registro eliminado exitosamente.', 'success');
        await cargarHistorialPaciente(pacienteActualHistorial);
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        mostrarNotificacion(manejarErrorFirebase(error), 'error');
    }
}

// ============================================
// Funciones Utilitarias
// ============================================

/**
 * Agrupa el historial por tipo
 */
function agruparHistorialPorTipo(historial) {
    const agrupado = {
        procedimientos: [],
        tratamientos: [],
        observaciones: []
    };
    
    historial.forEach(registro => {
        switch (registro.tipo) {
            case 'procedimiento':
                agrupado.procedimientos.push(registro);
                break;
            case 'tratamiento':
                agrupado.tratamientos.push(registro);
                break;
            case 'observacion':
                agrupado.observaciones.push(registro);
                break;
        }
    });
    
    return agrupado;
}

/**
 * Renderiza una sección del historial
 */
function renderizarSeccionHistorial(titulo, registros, tipo) {
    const iconos = {
        'procedimiento': 'fa-procedures',
        'tratamiento': 'fa-prescription-bottle',
        'observacion': 'fa-notes-medical'
    };
    
    return `
        <div class="historial-seccion">
            <h6><i class="fas ${iconos[tipo]}"></i> ${titulo}</h6>
            ${registros.map(registro => `
                <div class="tratamiento-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6>${registro.descripcion}</h6>
                            <p class="mb-1">
                                <i class="fas fa-calendar"></i> ${formatearFecha(registro.fecha)}
                            </p>
                            ${renderizarCamposEspecificos(registro)}
                            ${registro.notas ? `<p class="mb-1"><i class="fas fa-sticky-note"></i> ${registro.notas}</p>` : ''}
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-purple" onclick="editarRegistroHistorial('${registro.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistroHistorial('${registro.id}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Renderiza campos específicos según el tipo de registro
 */
function renderizarCamposEspecificos(registro) {
    let html = '';
    
    if (registro.tipo === 'procedimiento') {
        if (registro.duracion) {
            html += `<p class="mb-1"><i class="fas fa-clock"></i> Duración: ${registro.duracion} minutos</p>`;
        }
        if (registro.costo) {
            html += `<p class="mb-1"><i class="fas fa-dollar-sign"></i> Costo: $${registro.costo.toFixed(2)}</p>`;
        }
    } else if (registro.tipo === 'tratamiento') {
        if (registro.duracionEstimada) {
            html += `<p class="mb-1"><i class="fas fa-hourglass-half"></i> Duración estimada: ${registro.duracionEstimada} días</p>`;
        }
        if (registro.frecuencia) {
            html += `<p class="mb-1"><i class="fas fa-redo"></i> Frecuencia: ${registro.frecuencia}</p>`;
        }
    } else if (registro.tipo === 'observacion') {
        if (registro.gravedad) {
            html += `<p class="mb-1"><i class="fas fa-exclamation-triangle"></i> Gravedad: ${registro.gravedad}</p>`;
        }
        if (registro.requiereSeguimiento) {
            html += `<p class="mb-1"><i class="fas fa-eye"></i> Requiere seguimiento: ${registro.requiereSeguimiento ? 'Sí' : 'No'}</p>`;
        }
    }
    
    return html;
}

/**
 * Actualiza el formulario según el tipo de registro seleccionado
 */
function actualizarFormularioPorTipo() {
    const tipo = document.getElementById('tipoRegistro').value;
    
    // Ocultar todos los campos específicos
    document.getElementById('camposProcedimiento').style.display = 'none';
    document.getElementById('camposTratamiento').style.display = 'none';
    document.getElementById('camposObservacion').style.display = 'none';
    
    // Mostrar campos específicos según el tipo
    switch (tipo) {
        case 'procedimiento':
            document.getElementById('camposProcedimiento').style.display = 'block';
            break;
        case 'tratamiento':
            document.getElementById('camposTratamiento').style.display = 'block';
            break;
        case 'observacion':
            document.getElementById('camposObservacion').style.display = 'block';
            break;
    }
}

/**
 * Formatea una fecha para mostrar
 */
function formatearFecha(fecha) {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar historial al iniciar si estamos en la sección de historial
    if (document.getElementById('seccion-historial')) {
        renderizarHistorial();
    }
});

// Exportar funciones para uso global
window.historialModule = {
    cargarHistorialPaciente,
    mostrarFormularioHistorial,
    guardarRegistroHistorial,
    editarRegistroHistorial,
    eliminarRegistroHistorial,
    renderizarHistorial
};
