from django.apps import AppConfig

class ClinicaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'clinica'
    verbose_name = 'Clínica Dental'
    
    def ready(self):
        import clinica.signals
