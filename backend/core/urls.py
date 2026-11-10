from django.contrib import admin
from django.urls import path, include
from .stats import DashboardStatsView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.users.urls_auth')),
    path('api/users/', include('core.users.urls')),
    path('api/jobs/', include('core.jobs.urls')),
    path('api/applications/', include('core.applications.urls')),
    path('api/resumes/', include('core.resumes.urls')),
    path('api/ai/', include('core.ai_services.urls')),
    path('api/matching/', include('core.matching.urls')),
    path('api/stats/dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
