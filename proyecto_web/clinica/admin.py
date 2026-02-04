from django.contrib import admin
from .models import Paciente, Cita, HistorialClinico

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'cedula', 'telefono', 'fecha_nacimiento', 'edad', 'fecha_creacion']
    list_filter = ['fecha_nacimiento', 'fecha_creacion']
    search_fields = ['nombre', 'cedula', 'telefono']
    ordering = ['nombre']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'cedula', 'telefono', 'direccion', 'fecha_nacimiento')
        }),
        ('Información Médica', {
            'fields': ('notas_medicas',)
        }),
        ('Información del Sistema', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'fecha_hora', 'motivo', 'estado', 'fecha_creacion']
    list_filter = ['estado', 'fecha_hora', 'fecha_creacion']
    search_fields = ['paciente__nombre', 'motivo', 'notas']
    ordering = ['fecha_hora']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    fieldsets = (
        ('Información de la Cita', {
            'fields': ('paciente', 'fecha_hora', 'motivo', 'estado')
        }),
        ('Información Adicional', {
            'fields': ('notas',)
        }),
        ('Información del Sistema', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

@admin.register(HistorialClinico)
class HistorialClinicoAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'tipo', 'fecha', 'descripcion', 'fecha_creacion']
    list_filter = ['tipo', 'fecha', 'gravedad', 'requiere_seguimiento', 'fecha_creacion']
    search_fields = ['paciente__nombre', 'descripcion', 'notas']
    ordering = ['-fecha', '-fecha_creacion']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('paciente', 'tipo', 'fecha', 'descripcion', 'notas')
        }),
        ('Información de Procedimientos', {
            'fields': ('duracion', 'costo'),
            'classes': ('collapse',),
            'description': 'Campos específicos para procedimientos'
        }),
        ('Información de Tratamientos', {
            'fields': ('duracion_estimada', 'frecuencia'),
            'classes': ('collapse',),
            'description': 'Campos específicos para tratamientos'
        }),
        ('Información de Observaciones', {
            'fields': ('gravedad', 'requiere_seguimiento'),
            'classes': ('collapse',),
            'description': 'Campos específicos para observaciones'
        }),
        ('Información del Sistema', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )
