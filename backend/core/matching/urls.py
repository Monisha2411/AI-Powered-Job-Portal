from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.MatchingViewSet, basename='matching')

urlpatterns = [
    path('', include(router.urls)),
]
