from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Resume
        fields = ['id', 'user', 'user_name', 'file', 'file_name', 'file_format',
                  'file_size', 'full_name', 'email', 'phone', 'location', 'summary',
                  'skills', 'education', 'experience', 'certifications',
                  'is_analyzed', 'analysis_status', 'analysis_error', 'is_primary',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'file_name', 'file_format', 'file_size',
                            'full_name', 'email', 'phone', 'location', 'summary',
                            'skills', 'education', 'experience', 'certifications',
                            'is_analyzed', 'analysis_status', 'analysis_error',
                            'is_primary', 'created_at', 'updated_at']

    def validate_file(self, value):
        import os
        ext = os.path.splitext(value.name)[1].lower()
        allowed = ['.pdf', '.docx', '.doc', '.txt']
        if ext not in allowed:
            raise serializers.ValidationError(
                f"Unsupported file type '{ext}'. Allowed types: {', '.join(allowed)}")
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size exceeds 10MB limit.")
        return value
