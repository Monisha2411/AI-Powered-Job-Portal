from rest_framework import status
from rest_framework.test import APITestCase

from core.users.models import User


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='pwuser', password='oldpass123', role='jobseeker')
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'oldpass123',
            'new_password': 'newpass456',
            'confirm_password': 'newpass456',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass456'))

    def test_change_password_wrong_old_password(self):
        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'wrongpass',
            'new_password': 'newpass456',
            'confirm_password': 'newpass456',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_password', res.data)

    def test_change_password_mismatch(self):
        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'oldpass123',
            'new_password': 'newpass456',
            'confirm_password': 'otherpass',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', res.data)

    def test_change_password_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'oldpass123',
            'new_password': 'newpass456',
            'confirm_password': 'newpass456',
        })
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))