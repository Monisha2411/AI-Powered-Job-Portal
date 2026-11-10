from django.db import migrations


def set_existing_ai_source(apps, schema_editor):
    Application = apps.get_model('applications', 'Application')
    Application.objects.filter(is_ai_analyzed=True).exclude(match_source='ai').update(match_source='ai')


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0003_application_match_source'),
    ]

    operations = [
        migrations.RunPython(set_existing_ai_source, migrations.RunPython.noop),
    ]