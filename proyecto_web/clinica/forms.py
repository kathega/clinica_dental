from django import forms
from django.forms import DateInput, DateTimeInput
from .models import Paciente, Cita, HistorialClinico

class PacienteForm(forms.ModelForm):
    """Formulario para crear y editar pacientes"""
    
    class Meta:
        model = Paciente
        fields = ['nombre', 'cedula', 'telefono', 'direccion', 'fecha_nacimiento', 'notas_medicas']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese el nombre completo'
            }),
            'cedula': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 12345678-9'
            }),
            'telefono': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: +56 9 1234 5678'
            }),
            'direccion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Ingrese la dirección completa'
            }),
            'fecha_nacimiento': DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'notas_medicas': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Notas médicas relevantes'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['nombre'].label = "Nombre completo *"
        self.fields['cedula'].label = "Cédula *"
        self.fields['telefono'].label = "Teléfono *"
        self.fields['direccion'].label = "Dirección"
        self.fields['fecha_nacimiento'].label = "Fecha de nacimiento *"
        self.fields['notas_medicas'].label = "Notas médicas"

class CitaForm(forms.ModelForm):
    """Formulario para crear y editar citas"""
    
    class Meta:
        model = Cita
        fields = ['paciente', 'fecha_hora', 'motivo', 'estado', 'notas']
        widgets = {
            'paciente': forms.Select(attrs={
                'class': 'form-select'
            }),
            'fecha_hora': DateTimeInput(attrs={
                'class': 'form-control',
                'type': 'datetime-local'
            }),
            'motivo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Motivo de la consulta'
            }),
            'estado': forms.Select(attrs={
                'class': 'form-select'
            }),
            'notas': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Notas adicionales sobre la cita'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['paciente'].label = "Paciente *"
        self.fields['fecha_hora'].label = "Fecha y hora *"
        self.fields['motivo'].label = "Motivo de consulta *"
        self.fields['estado'].label = "Estado"
        self.fields['notas'].label = "Notas adicionales"

class HistorialClinicoForm(forms.ModelForm):
    """Formulario para crear y editar registros del historial clínico"""
    
    class Meta:
        model = HistorialClinico
        fields = ['tipo', 'fecha', 'descripcion', 'notas', 'duracion', 'costo', 
                 'duracion_estimada', 'frecuencia', 'gravedad', 'requiere_seguimiento']
        widgets = {
            'tipo': forms.Select(attrs={
                'class': 'form-select',
                'onchange': 'toggleTipoFields()'
            }),
            'fecha': DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción detallada del registro'
            }),
            'notas': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Notas adicionales'
            }),
            'duracion': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Duración en minutos',
                'min': '1'
            }),
            'costo': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Costo del procedimiento',
                'step': '0.01',
                'min': '0'
            }),
            'duracion_estimada': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Duración estimada en días',
                'min': '1'
            }),
            'frecuencia': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Diaria, semanal, mensual'
            }),
            'gravedad': forms.Select(attrs={
                'class': 'form-select'
            }),
            'requiere_seguimiento': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['tipo'].label = "Tipo de registro *"
        self.fields['fecha'].label = "Fecha del registro *"
        self.fields['descripcion'].label = "Descripción *"
        self.fields['notas'].label = "Notas adicionales"
        self.fields['duracion'].label = "Duración (minutos)"
        self.fields['costo'].label = "Costo"
        self.fields['duracion_estimada'].label = "Duración estimada (días)"
        self.fields['frecuencia'].label = "Frecuencia"
        self.fields['gravedad'].label = "Gravedad"
        self.fields['requiere_seguimiento'].label = "Requiere seguimiento"

class BusquedaPacienteForm(forms.Form):
    """Formulario para buscar pacientes"""
    termino = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por nombre o cédula...'
        }),
        label="Buscar paciente"
    )
