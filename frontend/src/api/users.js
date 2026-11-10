import api from './client'

export const usersApi = {
  list: () => api.get('/users/'),
  get: (id) => api.get(`/users/${id}/`),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  toggleActive: (id) => api.post(`/users/${id}/toggle-active/`),
}
