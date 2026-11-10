from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('jobs', views.JobAnalysisViewSet, basename='ai-jobs')
router.register('resumes', views.ResumeAnalysisViewSet, basename='ai-resumes')
router.register('match', views.MatchRequestsViewSet, basename='ai-match')

urlpatterns = [
    path('', include(router.urls)),
]
