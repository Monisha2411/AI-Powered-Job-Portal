import api from './client'

export const authApi = {
  login: (username, password) =>
    api.post('/auth/login/', { username, password }),
  register: (data) =>
    api.post('/auth/register/', data),
  refresh: (refresh) =>
    api.post('/auth/refresh/', { refresh }),
  getProfile: () =>
    api.get('/auth/me/'),
  updateProfile: (data) =>
    api.patch('/auth/me/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) =>
    api.post('/auth/change-password/', data),
}
