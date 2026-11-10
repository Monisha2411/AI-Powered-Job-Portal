
import api from './client'

export const jobsApi = {
  list: (params = {}) => api.get('/jobs/', { params }),
  get: (id) => api.get(`/jobs/${id}/`),
  create: (data) => api.post('/jobs/', data),
  update: (id, data) => api.patch(`/jobs/${id}/`, data),
  delete: (id) => api.delete(`/jobs/${id}/`),
  analyze: (jobId) => api.post('/ai/jobs/', { job_id: jobId }),

  external: (params = {}) => api.get('/jobs/external/', { params }),
}
