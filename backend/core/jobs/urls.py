
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.JobViewSet, basename='jobs')

urlpatterns = [
    path('external/', views.external_jobs, name='external-jobs'),
    path('', include(router.urls)),
]
