// Configuración de Base de Datos Local (localStorage)
// ============================================

// Configuración de colecciones locales
const colecciones = {
    pacientes: 'clinica_dental_pacientes',
    citas: 'clinica_dental_citas',
    historialClinico: 'clinica_dental_historial',
    tratamientos: 'clinica_dental_tratamientos',
    procedimientos: 'clinica_dental_procedimientos',
    observaciones: 'clinica_dental_observaciones'
};

// ============================================
// Funciones Utilitarias de Base de Datos Local
// ============================================

/**
 * Obtiene todos los documentos de una colección
 * @param {string} coleccion - Nombre de la colección
 * @returns {Array} Array de documentos
 */
function obtenerTodos(coleccion) {
    const datos = localStorage.getItem(coleccion);
    return datos ? JSON.parse(datos) : [];
}

/**
 * Guarda todos los documentos en una colección
 * @param {string} coleccion - Nombre de la colección
 * @param {Array} documentos - Array de documentos a guardar
 */
function guardarTodos(coleccion, documentos) {
    localStorage.setItem(coleccion, JSON.stringify(documentos));
}

/**
 * Agrega un nuevo documento a una colección
 * @param {string} coleccion - Nombre de la colección
 * @param {Object} documento - Documento a agregar
 * @returns {string} ID del documento creado
 */
function agregarDocumento(coleccion, documento) {
    const documentos = obtenerTodos(coleccion);
    const id = generarId();
    const nuevoDocumento = {
        id: id,
        ...documento,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
    };
    documentos.push(nuevoDocumento);
    guardarTodos(coleccion, documentos);
    return id;
}

/**
 * Actualiza un documento existente
 * @param {string} coleccion - Nombre de la colección
 * @param {string} id - ID del documento a actualizar
 * @param {Object} datos - Nuevos datos del documento
 * @returns {boolean} True si se actualizó correctamente
 */
function actualizarDocumento(coleccion, id, datos) {
    const documentos = obtenerTodos(coleccion);
    const indice = documentos.findIndex(doc => doc.id === id);
    
    if (indice !== -1) {
        documentos[indice] = {
            ...documentos[indice],
            ...datos,
            fechaActualizacion: new Date().toISOString()
        };
        guardarTodos(coleccion, documentos);
        return true;
    }
    return false;
}

/**
 * Elimina un documento
 * @param {string} coleccion - Nombre de la colección
 * @param {string} id - ID del documento a eliminar
 * @returns {boolean} True si se eliminó correctamente
 */
function eliminarDocumento(coleccion, id) {
    const documentos = obtenerTodos(coleccion);
    const documentosFiltrados = documentos.filter(doc => doc.id !== id);
    
    if (documentosFiltrados.length !== documentos.length) {
        guardarTodos(coleccion, documentosFiltrados);
        return true;
    }
    return false;
}

/**
 * Busca documentos por campo y valor
 * @param {string} coleccion - Nombre de la colección
 * @param {string} campo - Campo a buscar
 * @param {*} valor - Valor a buscar
 * @returns {Array} Documentos que coinciden
 */
function buscarDocumentos(coleccion, campo, valor) {
    const documentos = obtenerTodos(coleccion);
    return documentos.filter(doc => 
        doc[campo] && doc[campo].toString().toLowerCase().includes(valor.toString().toLowerCase())
    );
}

/**
 * Ordena documentos por campo
 * @param {Array} documentos - Array de documentos
 * @param {string} campo - Campo para ordenar
 * @param {string} direccion - 'asc' o 'desc'
 * @returns {Array} Documentos ordenados
 */
function ordenarDocumentos(documentos, campo, direccion = 'asc') {
    return [...documentos].sort((a, b) => {
        let valorA = a[campo] || '';
        let valorB = b[campo] || '';
        
        // Manejo especial para fechas
        if (campo.includes('fecha') || campo.includes('Fecha')) {
            valorA = new Date(valorA);
            valorB = new Date(valorB);
        }
        
        if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Convierte una fecha a formato legible
 * @param {string} fecha - Fecha en formato ISO o string
 * @returns {string} Fecha formateada
 */
function formatearTimestamp(fecha) {
    if (!fecha) return 'No disponible';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Convierte una fecha a timestamp
 * @param {Date|string} fecha - Fecha a convertir
 * @returns {string} Fecha en formato ISO
 */
function aTimestamp(fecha) {
    if (typeof fecha === 'string') {
        fecha = new Date(fecha);
    }
    return fecha.toISOString();
}

/**
 * Genera un ID único para documentos
 * @returns {string} ID único
 */
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Maneja errores de manera consistente
 * @param {Error} error - Error a manejar
 * @returns {string} Mensaje de error formateado
 */
function manejarErrorFirebase(error) {
    console.error('Error en base de datos local:', error);
    
    if (error.name === 'QuotaExceededError') {
        return 'El almacenamiento local está lleno. Por favor, elimina algunos datos.';
    } else if (error.name === 'SecurityError') {
        return 'Error de seguridad al acceder al almacenamiento local.';
    } else {
        return 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.';
    }
}

/**
 * Muestra una notificación al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación (success, error, warning, info)
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacion.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notificacion);
    
    // Auto eliminar después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
        }
    }, 5000);
}

/**
 * Valida si un documento tiene los campos requeridos
 * @param {Object} documento - Documento a validar
 * @param {Array} camposRequeridos - Array de campos requeridos
 * @returns {boolean} True si es válido
 */
function validarDocumento(documento, camposRequeridos) {
    for (const campo of camposRequeridos) {
        if (!documento[campo] || documento[campo].toString().trim() === '') {
            mostrarNotificacion(`El campo "${campo}" es obligatorio.`, 'error');
            return false;
        }
    }
    return true;
}

// ============================================
// Simulación de Firebase para compatibilidad
// ============================================

const db = {
    collection: function(nombreColeccion) {
        return {
            add: function(documento) {
                return Promise.resolve({
                    id: agregarDocumento(nombreColeccion, documento)
                });
            },
            
            doc: function(id) {
                return {
                    get: function() {
                        const documentos = obtenerTodos(nombreColeccion);
                        const documento = documentos.find(doc => doc.id === id);
                        return Promise.resolve({
                            exists: !!documento,
                            data: () => documento || null
                        });
                    },
                    
                    update: function(datos) {
                        const exito = actualizarDocumento(nombreColeccion, id, datos);
                        return Promise.resolve(exito);
                    },
                    
                    delete: function() {
                        const exito = eliminarDocumento(nombreColeccion, id);
                        return Promise.resolve(exito);
                    }
                };
            },
            
            get: function() {
                const documentos = obtenerTodos(nombreColeccion);
                return Promise.resolve({
                    forEach: function(callback) {
                        documentos.forEach(doc => {
                            callback({
                                id: doc.id,
                                data: () => doc
                            });
                        });
                    }
                });
            },
            
            where: function(campo, operador, valor) {
                const documentos = buscarDocumentos(nombreColeccion, campo, valor);
                return {
                    get: function() {
                        return Promise.resolve({
                            forEach: function(callback) {
                                documentos.forEach(doc => {
                                    callback({
                                        id: doc.id,
                                        data: () => doc
                                    });
                                });
                            }
                        });
                    },
                    
                    orderBy: function(campoOrden, direccion) {
                        const ordenados = ordenarDocumentos(documentos, campoOrden, direccion);
                        return {
                            get: function() {
                                return Promise.resolve({
                                    forEach: function(callback) {
                                        ordenados.forEach(doc => {
                                            callback({
                                                id: doc.id,
                                                data: () => doc
                                            });
                                        });
                                    }
                                });
                            }
                        };
                    }
                };
            },
            
            orderBy: function(campo, direccion) {
                const documentos = obtenerTodos(nombreColeccion);
                const ordenados = ordenarDocumentos(documentos, campo, direccion);
                return {
                    get: function() {
                        return Promise.resolve({
                            forEach: function(callback) {
                                ordenados.forEach(doc => {
                                    callback({
                                        id: doc.id,
                                        data: () => doc
                                    });
                                });
                            }
                        });
                    }
                };
            }
        };
    }
};

// Simulación de FieldValue para compatibilidad
const firebase = {
    firestore: {
        FieldValue: {
            serverTimestamp: function() {
                return new Date().toISOString();
            }
        }
    }
};

// ============================================
// Inicialización
// ============================================

// Inicializar datos de ejemplo cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar conexión con Firebase
    // db.enablePersistence()
    //     .then(() => {
    //         console.log('Persistencia de Firebase habilitada');
    //     })
    //     .catch((err) => {
    //         if (err.code === 'failed-precondition') {
    //             console.log('Múltiples pestañas abiertas, persistencia deshabilitada');
    //         } else if (err.code === 'unimplemented') {
    //             console.log('El navegador no soporta persistencia');
    //         }
    //     });

    // Inicializar datos de ejemplo
    const pacientes = obtenerTodos(colecciones.pacientes);
    if (pacientes.length === 0) {
        // Agregar pacientes de ejemplo
        const pacientesEjemplo = [
            {
                nombre: 'Juan Pérez González',
                cedula: '12.345.678-9',
                telefono: '+56 9 1234 5678',
                fechaNacimiento: '1985-06-15',
                direccion: 'Av. Principal #123, Santiago',
                notasMedicas: 'Alergico a la penicilina',
                apellido: 'Pérez'
            },
            {
                nombre: 'María Rodríguez Silva',
                cedula: '98.765.432-1',
                telefono: '+56 9 8765 4321',
                fechaNacimiento: '1990-03-22',
                direccion: 'Calle Secundaria #456, Santiago',
                notasMedicas: 'Paciente regular',
                apellido: 'Rodríguez'
            }
        ];
        
        pacientesEjemplo.forEach(paciente => {
            agregarDocumento(colecciones.pacientes, paciente);
        });
        
        mostrarNotificacion('Datos de ejemplo cargados exitosamente', 'success');
    }
});

// Exportar para uso en otros archivos
window.firebaseConfig = {
    db,
    colecciones,
    formatearTimestamp,
    aTimestamp,
    generarId,
    manejarErrorFirebase,
    mostrarNotificacion,
    validarDocumento,
    obtenerTodos,
    agregarDocumento,
    actualizarDocumento,
    eliminarDocumento,
    buscarDocumentos,
    ordenarDocumentos
};
