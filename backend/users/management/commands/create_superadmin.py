from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = 'Create superadmin user (username/email: superadmin, password: superadmin1234)'

    def handle(self, *args, **options):
        username = 'superadmin'
        email = 'superadmin'
        password = 'superadmin1234'
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User "{username}" already exists.'))
            return
        user = User(
            username=username,
            email=email,
            role=Role.SUPERADMIN,
            organization=None,
            is_staff=True,
            is_superuser=True,
        )
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f'Superadmin created: username/email={username}, password={password}'))
        self.stdout.write('Login at /api/v1/auth/token/ with username and password.')
