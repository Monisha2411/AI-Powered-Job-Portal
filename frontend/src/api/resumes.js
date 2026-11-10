import api from './client'

export const resumesApi = {
  list: () => api.get('/resumes/'),
  get: (id) => api.get(`/resumes/${id}/`),
  upload: (formData) =>
    api.post('/resumes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/resumes/${id}/`),
  analyze: (id) => api.post(`/resumes/${id}/analyze/`),
  setPrimary: (id) => api.post(`/resumes/${id}/set_primary/`),
}
