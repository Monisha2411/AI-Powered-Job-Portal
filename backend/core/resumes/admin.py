from django.contrib import admin
from .models import Resume, ProfileMatch


class ResumeAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'user', 'analysis_status', 'is_primary', 'created_at')
    list_filter = ('analysis_status', 'is_primary', 'file_format')
    search_fields = ('user__username', 'file_name', 'full_name')


admin.site.register(Resume, ResumeAdmin)
admin.site.register(ProfileMatch)
