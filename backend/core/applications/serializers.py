from django.utils import timezone
from rest_framework import serializers
from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    job_company = serializers.SerializerMethodField()
    job_status = serializers.SerializerMethodField()
    applicant_name = serializers.CharField(source='applicant.get_full_name', read_only=True)
    applicant_username = serializers.CharField(source='applicant.username', read_only=True)
    recruiter_id = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'external_job_id', 'external_job_url',
            'external_job_title', 'external_company', 'external_location',
            'job_title', 'job_company', 'job_status', 'applicant',
            'applicant_name', 'applicant_username', 'recruiter_id', 'resume',
            'cover_letter', 'status', 'notes', 'match_score', 'matched_skills',
            'missing_skills', 'ai_analysis', 'is_ai_analyzed', 'match_source',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'applicant', 'match_score', 'matched_skills',
            'missing_skills', 'ai_analysis', 'is_ai_analyzed',
            'match_source', 'created_at', 'updated_at',
        ]

    def get_job_title(self, obj):
        return obj.job.title if obj.job else obj.external_job_title

    def get_job_company(self, obj):
        return obj.job.company if obj.job else obj.external_company

    def get_job_status(self, obj):
        return obj.job.status if obj.job else 'external'

    def get_recruiter_id(self, obj):
        return obj.job.recruiter_id if obj.job else None


class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            'id', 'job', 'external_job_id', 'external_job_url',
            'external_job_title', 'external_company', 'external_location',
            'resume', 'cover_letter',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        job = attrs.get('job')
        external_job_id = (attrs.get('external_job_id') or '').strip()

        if bool(job) == bool(external_job_id):
            raise serializers.ValidationError(
                'Provide either an internal job or an external job ID, not both.'
            )

        if job and (not job.is_active or job.status != 'open'):
            raise serializers.ValidationError(
                {'job': 'This job is not accepting applications.'}
            )

        if external_job_id:
            if not attrs.get('external_job_title'):
                raise serializers.ValidationError(
                    {'external_job_title': 'A title is required for an external job.'}
                )
            if not attrs.get('external_job_url'):
                raise serializers.ValidationError(
                    {'external_job_url': 'An application URL is required for an external job.'}
                )

        request = self.context.get('request')
        if request and request.user.is_authenticated:
            lookup = {'applicant': request.user}
            if job:
                lookup['job'] = job
                existing = Application.objects.filter(**lookup).first()
            else:
                lookup['external_job_id'] = external_job_id
                existing = Application.objects.filter(**lookup).first()

            if existing and existing.status != 'withdrawn':
                raise serializers.ValidationError(
                    'You have already marked this job as applied.'
                )
            if existing:
                self.context['withdrawn_application'] = existing

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['applicant'] = request.user
        existing = self.context.get('withdrawn_application')

        if existing:
            for field in (
                'job', 'external_job_id', 'external_job_url',
                'external_job_title', 'external_company', 'external_location',
                'resume', 'cover_letter',
            ):
                if field in validated_data:
                    setattr(existing, field, validated_data[field])
            existing.status = 'submitted'
            existing.is_ai_analyzed = False
            existing.match_source = 'local'
            existing.match_score = None
            existing.matched_skills = []
            existing.missing_skills = []
            existing.ai_analysis = {}
            existing.created_at = timezone.now()
            existing.save()
            return existing

        return super().create(validated_data)


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status', 'notes']

    def validate_status(self, value):
        allowed = ['under_review', 'interview', 'offer', 'hired', 'rejected']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status transition to '{value}'."
            )
        return value
