
import api from './client'

export const matchingApi = {
  recommendations: (data = {}) => api.post('/matching/recommendations/', data),
  skillGap: (data) => api.post('/matching/skill-gap/', data),
  applicants: (params = {}) => api.get('/matching/applicants/', { params }),

  externalRecommendations: (data = {}) =>
    api.post('/matching/external-recommendations/', data),
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard/'),
}
