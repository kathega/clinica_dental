from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Paciente

@receiver(post_save, sender=Paciente)
def paciente_creado_signal(sender, instance, created, **kwargs):
    """Signal que se ejecuta cuando se crea un nuevo paciente"""
    if created:
        print(f"Nuevo paciente creado: {instance.nombre}")
