from django.urls import path
from . import views

app_name = 'clinica'

urlpatterns = [
    # Home
    path('', views.home, name='home'),
    
    # Pacientes
    path('pacientes/', views.lista_pacientes, name='lista_pacientes'),
    path('pacientes/crear/', views.crear_paciente, name='crear_paciente'),
    path('pacientes/<int:pk>/editar/', views.editar_paciente, name='editar_paciente'),
    path('pacientes/<int:pk>/', views.detalle_paciente, name='detalle_paciente'),
    path('pacientes/<int:pk>/eliminar/', views.eliminar_paciente, name='eliminar_paciente'),
    
    # Citas
    path('citas/', views.lista_citas, name='lista_citas'),
    path('citas/crear/', views.crear_cita, name='crear_cita'),
    path('citas/<int:pk>/editar/', views.editar_cita, name='editar_cita'),
    path('citas/<int:pk>/eliminar/', views.eliminar_cita, name='eliminar_cita'),
    
    # Historial Clínico
    path('historial/crear/<int:paciente_id>/', views.crear_historial, name='crear_historial'),
    path('historial/<int:pk>/editar/', views.editar_historial, name='editar_historial'),
    path('historial/<int:pk>/eliminar/', views.eliminar_historial, name='eliminar_historial'),
    
    # API Endpoints
    path('api/pacientes/', views.api_pacientes_json, name='api_pacientes'),
    path('api/citas/calendario/', views.api_citas_calendario, name='api_citas_calendario'),
]
