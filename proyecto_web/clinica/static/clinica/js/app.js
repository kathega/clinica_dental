// ============================================
// Aplicación Principal - Clínica Dental
// ============================================

// Variables globales
let seccionActual = 'pacientes';
let pacienteActual = null;

// ============================================
// Funciones de Navegación
// ============================================

/**
 * Muestra una sección específica de la aplicación
 * @param {string} seccion - Nombre de la sección a mostrar
 */
function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-activa, .seccion-inactiva').forEach(el => {
        el.classList.remove('seccion-activa');
        el.classList.add('seccion-inactiva');
    });
    
    // Mostrar la sección seleccionada
    const seccionElement = document.getElementById(`seccion-${seccion}`);
    if (seccionElement) {
        seccionElement.classList.remove('seccion-inactiva');
        seccionElement.classList.add('seccion-activa');
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const navLink = document.querySelector(`[href="#${seccion}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    seccionActual = seccion;
    
    // Cargar datos específicos de la sección
    cargarDatosSeccion(seccion);
}

/**
 * Carga los datos específicos de cada sección
 * @param {string} seccion - Nombre de la sección
 */
async function cargarDatosSeccion(seccion) {
    switch (seccion) {
        case 'pacientes':
            if (window.pacientesModule) {
                await window.pacientesModule.cargarPacientes();
            }
            break;
        case 'citas':
            if (window.citasModule) {
                await window.citasModule.cargarCitas();
            }
            break;
        case 'historial':
            if (window.historialModule) {
                window.historialModule.renderizarHistorial();
            }
            break;
    }
}

// ============================================
// Funciones de Inicialización
// ============================================

/**
 * Inicializa la aplicación
 */
async function inicializarApp() {
    try {
        console.log('🦷 Iniciando Clínica Dental Web App...');
        
        // Verificar conexión con Firebase
        if (!window.firebaseConfig) {
            throw new Error('Configuración de Firebase no encontrada');
        }
        
        // Mostrar notificación de bienvenida
        mostrarNotificacion('¡Bienvenido al Sistema de Clínica Dental!', 'success');
        
        // Cargar sección inicial
        await mostrarSeccion('pacientes');
        
        // Configurar event listeners globales
        configurarEventListeners();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        mostrarNotificacion('Error al iniciar la aplicación. Por favor, recarga la página.', 'error');
    }
}

/**
 * Configura los event listeners globales
 */
function configurarEventListeners() {
    // Prevenir envío de formularios por defecto
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    });
    
    // Configurar atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + N: Nuevo paciente
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            if (seccionActual === 'pacientes') {
                window.pacientesModule.mostrarFormularioPaciente();
            } else if (seccionActual === 'citas') {
                window.citasModule.mostrarFormularioCita();
            }
        }
        
        // Ctrl + F: Buscar
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const busquedaInput = document.getElementById('busquedaPaciente');
            if (busquedaInput) {
                busquedaInput.focus();
            }
        }
        
        // Escape: Cerrar modales
        if (e.key === 'Escape') {
            const modales = document.querySelectorAll('.modal.show');
            modales.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            });
        }
    });
    
    // Detectar cambios en el estado de conexión
    window.addEventListener('online', () => {
        mostrarNotificacion('Conexión restaurada', 'success');
    });
    
    window.addEventListener('offline', () => {
        mostrarNotificacion('Conexión perdida. Trabajando en modo offline.', 'warning');
    });
    
    // Configurar lazy loading para imágenes si es necesario
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ============================================
// Funciones Utilitarias Globales
// ============================================

/**
 * Formatea números como moneda
 * @param {number} cantidad - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda
 */
function formatearMoneda(cantidad) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(cantidad);
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 * @param {string} fechaNacimiento - Fecha de nacimiento
 * @returns {number} Edad en años
 */
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si es válido
 */
function validarRUT(rut) {
    if (!rut || typeof rut !== 'string') return false;
    
    // Limpiar RUT
    rut = rut.replace(/[^\dKk]/g, '');
    
    // Validar formato
    if (rut.length < 8 || rut.length > 9) return false;
    
    // Separar cuerpo y dígito verificador
    const cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    let dvCalculado = 11 - (suma % 11);
    dvCalculado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
    
    return dv === dvCalculado;
}

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT a formatear
 * @returns {string} RUT formateado
 */
function formatearRUT(rut) {
    if (!rut) return '';
    
    rut = rut.replace(/[^\dKk]/g, '');
    
    if (rut.length <= 1) return rut;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Formatear cuerpo con puntos
    let cuerpoFormateado = '';
    let contador = 0;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        cuerpoFormateado = cuerpo[i] + cuerpoFormateado;
        contador++;
        
        if (contador === 3 && i !== 0) {
            cuerpoFormateado = '.' + cuerpoFormateado;
            contador = 0;
        }
    }
    
    return cuerpoFormateado + '-' + dv;
}

/**
 * Genera un reporte de pacientes
 */
async function generarReportePacientes() {
    try {
        if (!window.pacientesModule) {
            mostrarNotificacion('Módulo de pacientes no disponible', 'error');
            return;
        }
        
        const pacientes = await window.pacientesModule.cargarPacientes();
        
        let reporte = 'REPORTE DE PACIENTES\n';
        reporte += '=====================\n\n';
        reporte += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
        reporte += `Total de pacientes: ${pacientes.length}\n\n`;
        
        pacientes.forEach((paciente, index) => {
            reporte += `${index + 1}. ${paciente.nombre}\n`;
            reporte += `   Cédula: ${paciente.cedula}\n`;
            reporte += `   Teléfono: ${paciente.telefono}\n`;
            reporte += `   Dirección: ${paciente.direccion || 'No especificada'}\n`;
            reporte += `   Fecha de registro: ${formatearFecha(paciente.fechaCreacion)}\n\n`;
        });
        
        // Descargar reporte
        const blob = new Blob([reporte], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_pacientes_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('Reporte generado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarNotificacion('Error al generar reporte', 'error');
    }
}

/**
 * Exporta datos a formato JSON
 */
async function exportarDatosJSON() {
    try {
        const datos = {
            pacientes: [],
            citas: [],
            historial: [],
            fechaExportacion: new Date().toISOString()
        };
        
        // Exportar pacientes
        if (window.pacientesModule) {
            const pacientesSnapshot = await db.collection(colecciones.pacientes).get();
            pacientesSnapshot.forEach(doc => {
                datos.pacientes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        // Exportar citas
        if (window.citasModule) {
            const citasSnapshot = await db.collection(colecciones.citas).get();
            citasSnapshot.forEach(doc => {
                datos.citas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        // Exportar historial
        const historialSnapshot = await db.collection(colecciones.historialClinico).get();
        historialSnapshot.forEach(doc => {
            datos.historial.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Descargar JSON
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clinica_dental_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('Datos exportados exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar datos:', error);
        mostrarNotificacion('Error al exportar datos', 'error');
    }
}

/**
 * Muestra información sobre la aplicación
 */
function mostrarAcercaDe() {
    const info = `
        Clínica Dental Web App v1.0.0
        ============================
        
        Sistema de gestión integral para clínicas dentales.
        
        Características principales:
        • Gestión completa de pacientes
        • Sistema de agendamiento de citas
        • Historial clínico digital
        • Interfaz moderna y responsiva
        • Almacenamiento en la nube
        
        Tecnologías utilizadas:
        • HTML5, CSS3, JavaScript ES6+
        • Bootstrap 5
        • Firebase Firestore
        • Font Awesome Icons
        
        Desarrollado con ❤️ para profesionales de la salud dental.
    `;
    
    alert(info);
}

// ============================================
// Event Listeners Principales
// ============================================

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarApp);

// Prevenir cerrar la aplicación si hay cambios sin guardar
window.addEventListener('beforeunload', (e) => {
    // Aquí podrías agregar lógica para detectar cambios sin guardar
    // Por ahora, permitimos cerrar sin advertencia
});

// Manejar errores no capturados
window.addEventListener('error', (e) => {
    console.error('Error no capturado:', e.error);
    mostrarNotificacion('Ha ocurrido un error inesperado', 'error');
});

// ============================================
// Exportar funciones globales
// ============================================

window.app = {
    mostrarSeccion,
    cargarDatosSeccion,
    generarReportePacientes,
    exportarDatosJSON,
    mostrarAcercaDe,
    formatearMoneda,
    calcularEdad,
    validarRUT,
    formatearRUT
};

// Hacer funciones disponibles globalmente para onclick en HTML
window.mostrarSeccion = mostrarSeccion;
window.mostrarFormularioPaciente = () => window.pacientesModule?.mostrarFormularioPaciente();
window.mostrarFormularioCita = () => window.citasModule?.mostrarFormularioCita();
window.guardarPaciente = () => window.pacientesModule?.guardarPaciente();
window.guardarCita = () => window.citasModule?.guardarCita();
window.guardarRegistroHistorial = () => window.historialModule?.guardarRegistroHistorial();
window.actualizarFormularioPorTipo = () => window.historialModule?.actualizarFormularioPorTipo();
