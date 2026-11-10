import api from './client'

export const applicationsApi = {
  list: (params = {}) => api.get('/applications/', { params }),
  get: (id) => api.get(`/applications/${id}/`),
  create: (data) => api.post('/applications/', data),
  updateStatus: (id, data) => api.patch(`/applications/${id}/`, data),
  analyzeWithAi: (id) => api.post(`/applications/${id}/analyze_with_ai/`),
  myApplications: () => api.get('/applications/my_applications/'),
  withdraw: (id) => api.post(`/applications/${id}/withdraw/`),
  delete: (id) => api.delete(`/applications/${id}/`),
}
