from django.db import models
from django.core.validators import RegexValidator
import datetime

class Paciente(models.Model):
    """Modelo para gestionar pacientes de la clínica dental"""
    
    nombre = models.CharField(max_length=200, verbose_name="Nombre completo")
    cedula = models.CharField(
        max_length=20, 
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[0-9\-]+$',
                message='La cédula solo puede contener números y guiones'
            )
        ],
        verbose_name="Cédula"
    )
    telefono = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^[0-9\-\+\(\)\s]+$',
                message='El teléfono solo puede contener números y símbolos telefónicos'
            )
        ],
        verbose_name="Teléfono"
    )
    direccion = models.TextField(blank=True, verbose_name="Dirección")
    fecha_nacimiento = models.DateField(verbose_name="Fecha de nacimiento")
    notas_medicas = models.TextField(blank=True, verbose_name="Notas médicas")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"
    
    def __str__(self):
        return self.nombre
    
    @property
    def apellido(self):
        """Extrae el apellido del nombre completo para ordenamiento"""
        partes = self.nombre.split()
        return partes[-1] if partes else self.nombre
    
    @property
    def edad(self):
        """Calcula la edad actual del paciente"""
        hoy = datetime.date.today()
        return hoy.year - self.fecha_nacimiento.year - (
            (hoy.month, hoy.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )

class Cita(models.Model):
    """Modelo para gestionar citas médicas"""
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('atendida', 'Atendida'),
        ('cancelada', 'Cancelada'),
    ]
    
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, verbose_name="Paciente")
    fecha_hora = models.DateTimeField(verbose_name="Fecha y hora")
    motivo = models.CharField(max_length=200, verbose_name="Motivo de consulta")
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='pendiente',
        verbose_name="Estado"
    )
    notas = models.TextField(blank=True, verbose_name="Notas adicionales")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['fecha_hora']
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
    
    def __str__(self):
        return f"{self.paciente.nombre} - {self.fecha_hora.strftime('%d/%m/%Y %H:%M')}"

class HistorialClinico(models.Model):
    """Modelo para gestionar el historial clínico de pacientes"""
    
    TIPO_CHOICES = [
        ('procedimiento', 'Procedimiento'),
        ('tratamiento', 'Tratamiento'),
        ('observacion', 'Observación'),
    ]
    
    GRAVEDAD_CHOICES = [
        ('leve', 'Leve'),
        ('moderada', 'Moderada'),
        ('grave', 'Grave'),
    ]
    
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, verbose_name="Paciente")
    tipo = models.CharField(
        max_length=20, 
        choices=TIPO_CHOICES,
        verbose_name="Tipo de registro"
    )
    fecha = models.DateField(verbose_name="Fecha del registro")
    descripcion = models.TextField(verbose_name="Descripción")
    notas = models.TextField(blank=True, verbose_name="Notas adicionales")
    
    # Campos específicos para procedimientos
    duracion = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        help_text="Duración en minutos (solo para procedimientos)",
        verbose_name="Duración (minutos)"
    )
    costo = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Costo del procedimiento (solo para procedimientos)",
        verbose_name="Costo"
    )
    
    # Campos específicos para tratamientos
    duracion_estimada = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Duración estimada en días (solo para tratamientos)",
        verbose_name="Duración estimada (días)"
    )
    frecuencia = models.CharField(
        max_length=100,
        blank=True,
        help_text="Frecuencia del tratamiento (solo para tratamientos)",
        verbose_name="Frecuencia"
    )
    
    # Campos específicos para observaciones
    gravedad = models.CharField(
        max_length=20,
        choices=GRAVEDAD_CHOICES,
        blank=True,
        help_text="Gravedad de la observación (solo para observaciones)",
        verbose_name="Gravedad"
    )
    requiere_seguimiento = models.BooleanField(
        default=False,
        help_text="Requiere seguimiento (solo para observaciones)",
        verbose_name="Requiere seguimiento"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fecha', '-fecha_creacion']
        verbose_name = "Registro del historial clínico"
        verbose_name_plural = "Registros del historial clínico"
    
    def __str__(self):
        return f"{self.paciente.nombre} - {self.get_tipo_display()} - {self.fecha.strftime('%d/%m/%Y')}"
