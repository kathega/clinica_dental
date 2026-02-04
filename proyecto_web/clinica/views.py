from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import datetime, date
import json

from .models import Paciente, Cita, HistorialClinico
from .forms import PacienteForm, CitaForm, HistorialClinicoForm, BusquedaPacienteForm

def home(request):
    """Vista principal del sistema"""
    # Estadísticas básicas
    total_pacientes = Paciente.objects.count()
    total_citas = Cita.objects.count()
    citas_hoy = Cita.objects.filter(
        fecha_hora__date=date.today(),
        estado='pendiente'
    ).count()
    
    # Próximas citas
    proximas_citas = Cita.objects.filter(
        fecha_hora__gte=timezone.now(),
        estado='pendiente'
    ).order_by('fecha_hora')[:5]
    
    context = {
        'total_pacientes': total_pacientes,
        'total_citas': total_citas,
        'citas_hoy': citas_hoy,
        'proximas_citas': proximas_citas,
    }
    return render(request, 'clinica/home.html', context)

# ============================================
# Vistas de Pacientes
# ============================================

def lista_pacientes(request):
    """Lista todos los pacientes con opción de búsqueda"""
    form_busqueda = BusquedaPacienteForm(request.GET)
    pacientes = Paciente.objects.all()
    
    if form_busqueda.is_valid():
        termino = form_busqueda.cleaned_data['termino']
        if termino:
            pacientes = pacientes.filter(
                Q(nombre__icontains=termino) | 
                Q(cedula__icontains=termino)
            )
    
    pacientes = pacientes.order_by('nombre')
    
    context = {
        'pacientes': pacientes,
        'form_busqueda': form_busqueda,
    }
    return render(request, 'clinica/pacientes/lista.html', context)

def crear_paciente(request):
    """Crea un nuevo paciente"""
    if request.method == 'POST':
        form = PacienteForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Paciente creado exitosamente.')
            return redirect('clinica:lista_pacientes')
    else:
        form = PacienteForm()
    
    return render(request, 'clinica/pacientes/form.html', {
        'form': form,
        'titulo': 'Nuevo Paciente',
        'accion': 'Crear'
    })

def editar_paciente(request, pk):
    """Edita un paciente existente"""
    paciente = get_object_or_404(Paciente, pk=pk)
    
    if request.method == 'POST':
        form = PacienteForm(request.POST, instance=paciente)
        if form.is_valid():
            form.save()
            messages.success(request, 'Paciente actualizado exitosamente.')
            return redirect('clinica:lista_pacientes')
    else:
        form = PacienteForm(instance=paciente)
    
    return render(request, 'clinica/pacientes/form.html', {
        'form': form,
        'paciente': paciente,
        'titulo': 'Editar Paciente',
        'accion': 'Actualizar'
    })

def detalle_paciente(request, pk):
    """Muestra la ficha completa de un paciente"""
    paciente = get_object_or_404(Paciente, pk=pk)
    
    # Obtener historial clínico
    historial = HistorialClinico.objects.filter(paciente=paciente).order_by('-fecha', '-fecha_creacion')
    
    # Obtener citas del paciente
    citas = Cita.objects.filter(paciente=paciente).order_by('-fecha_hora')
    
    context = {
        'paciente': paciente,
        'historial': historial,
        'citas': citas,
    }
    return render(request, 'clinica/pacientes/detalle.html', context)

@require_POST
def eliminar_paciente(request, pk):
    """Elimina un paciente"""
    paciente = get_object_or_404(Paciente, pk=pk)
    paciente.delete()
    messages.success(request, 'Paciente eliminado exitosamente.')
    return redirect('clinica:lista_pacientes')

# ============================================
# Vistas de Citas
# ============================================

def lista_citas(request):
    """Lista todas las citas con calendario"""
    citas = Cita.objects.all().order_by('fecha_hora')
    
    # Obtener fecha seleccionada (por defecto hoy)
    fecha_seleccionada = request.GET.get('fecha', date.today().strftime('%Y-%m-%d'))
    fecha_obj = datetime.strptime(fecha_seleccionada, '%Y-%m-%d').date()
    
    # Citas del día seleccionado
    citas_dia = citas.filter(fecha_hora__date=fecha_obj)
    
    context = {
        'citas': citas,
        'citas_dia': citas_dia,
        'fecha_seleccionada': fecha_seleccionada,
        'fecha_obj': fecha_obj,
    }
    return render(request, 'clinica/citas/lista.html', context)

def crear_cita(request):
    """Crea una nueva cita"""
    if request.method == 'POST':
        form = CitaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Cita agendada exitosamente.')
            return redirect('clinica:lista_citas')
    else:
        form = CitaForm()
        # Establecer fecha y hora actual por defecto
        ahora = timezone.now().strftime('%Y-%m-%dT%H:%M')
        form.fields['fecha_hora'].widget.attrs['value'] = ahora
    
    return render(request, 'clinica/citas/form.html', {
        'form': form,
        'titulo': 'Nueva Cita',
        'accion': 'Agendar'
    })

def editar_cita(request, pk):
    """Edita una cita existente"""
    cita = get_object_or_404(Cita, pk=pk)
    
    if request.method == 'POST':
        form = CitaForm(request.POST, instance=cita)
        if form.is_valid():
            form.save()
            messages.success(request, 'Cita actualizada exitosamente.')
            return redirect('clinica:lista_citas')
    else:
        form = CitaForm(instance=cita)
        # Formatear fecha y hora para el input
        fecha_hora = cita.fecha_hora.strftime('%Y-%m-%dT%H:%M')
        form.fields['fecha_hora'].widget.attrs['value'] = fecha_hora
    
    return render(request, 'clinica/citas/form.html', {
        'form': form,
        'cita': cita,
        'titulo': 'Editar Cita',
        'accion': 'Actualizar'
    })

@require_POST
def eliminar_cita(request, pk):
    """Elimina una cita"""
    cita = get_object_or_404(Cita, pk=pk)
    cita.delete()
    messages.success(request, 'Cita eliminada exitosamente.')
    return redirect('clinica:lista_citas')

# ============================================
# Vistas de Historial Clínico
# ============================================

def crear_historial(request, paciente_id):
    """Crea un nuevo registro en el historial clínico"""
    paciente = get_object_or_404(Paciente, pk=paciente_id)
    
    if request.method == 'POST':
        form = HistorialClinicoForm(request.POST)
        if form.is_valid():
            historial = form.save(commit=False)
            historial.paciente = paciente
            historial.save()
            messages.success(request, 'Registro agregado exitosamente.')
            return redirect('clinica:detalle_paciente', pk=paciente_id)
    else:
        form = HistorialClinicoForm()
        # Establecer fecha actual por defecto
        hoy = date.today().strftime('%Y-%m-%d')
        form.fields['fecha'].widget.attrs['value'] = hoy
    
    return render(request, 'clinica/historial/form.html', {
        'form': form,
        'paciente': paciente,
        'titulo': 'Nuevo Registro Clínico',
        'accion': 'Agregar'
    })

def editar_historial(request, pk):
    """Edita un registro del historial clínico"""
    historial = get_object_or_404(HistorialClinico, pk=pk)
    
    if request.method == 'POST':
        form = HistorialClinicoForm(request.POST, instance=historial)
        if form.is_valid():
            form.save()
            messages.success(request, 'Registro actualizado exitosamente.')
            return redirect('clinica:detalle_paciente', pk=historial.paciente.pk)
    else:
        form = HistorialClinicoForm(instance=historial)
        # Formatear fecha para el input
        fecha = historial.fecha.strftime('%Y-%m-%d')
        form.fields['fecha'].widget.attrs['value'] = fecha
    
    return render(request, 'clinica/historial/form.html', {
        'form': form,
        'historial': historial,
        'paciente': historial.paciente,
        'titulo': 'Editar Registro Clínico',
        'accion': 'Actualizar'
    })

@require_POST
def eliminar_historial(request, pk):
    """Elimina un registro del historial clínico"""
    historial = get_object_or_404(HistorialClinico, pk=pk)
    paciente_id = historial.paciente.pk
    historial.delete()
    messages.success(request, 'Registro eliminado exitosamente.')
    return redirect('clinica:detalle_paciente', pk=paciente_id)

# ============================================
# API Endpoints para AJAX
# ============================================

def api_pacientes_json(request):
    """API para obtener pacientes en formato JSON"""
    pacientes = Paciente.objects.all().order_by('nombre')
    data = []
    for paciente in pacientes:
        data.append({
            'id': paciente.pk,
            'nombre': paciente.nombre,
            'cedula': paciente.cedula,
            'telefono': paciente.telefono,
            'edad': paciente.edad
        })
    return JsonResponse(data, safe=False)

def api_citas_calendario(request):
    """API para obtener citas para el calendario"""
    año = request.GET.get('año', date.today().year)
    mes = request.GET.get('mes', date.today().month)
    
    citas = Cita.objects.filter(
        fecha_hora__year=año,
        fecha_hora__month=mes
    )
    
    data = []
    for cita in citas:
        data.append({
            'id': cita.pk,
            'title': f"{cita.paciente.nombre} - {cita.motivo}",
            'start': cita.fecha_hora.isoformat(),
            'estado': cita.estado,
            'paciente': cita.paciente.nombre
        })
    
    return JsonResponse(data, safe=False)
