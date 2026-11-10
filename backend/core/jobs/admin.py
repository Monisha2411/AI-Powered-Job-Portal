from django.contrib import admin
from .models import Job, JobSkill


class JobSkillInline(admin.TabularInline):
    model = JobSkill
    extra = 1


class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'recruiter', 'status', 'is_active', 'created_at')
    list_filter = ('status', 'job_type', 'experience_level', 'is_active')
    search_fields = ('title', 'company', 'location')
    inlines = [JobSkillInline]


admin.site.register(Job, JobAdmin)
admin.site.register(JobSkill)
