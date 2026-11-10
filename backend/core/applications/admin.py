from django.contrib import admin
from .models import Application


class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('job', 'applicant', 'status', 'match_score', 'created_at')
    list_filter = ('status', 'is_ai_analyzed')
    search_fields = ('job__title', 'applicant__username')


admin.site.register(Application, ApplicationAdmin)
