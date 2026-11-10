export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatSalary(min, max) {
  if (!min && !max) return 'Not specified'
  if (min && max) return `${toCurrency(min)} - ${toCurrency(max)}`
  if (min) return `${toCurrency(min)} / year`
  if (max) return `Up to ${toCurrency(max)}`
  return 'Not specified'
}

export function toCurrency(value) {
  if (value === null || value === undefined) return 'N/A'
  const num = Number(value)
  if (isNaN(num)) return 'N/A'
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export const jobTypeLabel = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
}

export const experienceLevelLabel = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  lead: 'Lead / Manager',
}

export const applicationStatusLabel = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  interview: 'Interview',
  offer: 'Offer Given',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function getApiError(error, fallback = 'An error occurred. Please try again.') {
  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    if (data.non_field_errors) return data.non_field_errors.join(', ')
    if (data.message) return data.message
    if (typeof data === 'object') {
      const parts = []
      Object.entries(data).forEach(([key, val]) => {
        const v = Array.isArray(val) ? val.join(', ') : val
        parts.push(`${key}: ${v}`)
      })
      if (parts.length) return parts.join('; ')
    }
  }
  if (error?.message) return error.message
  return fallback
}

export const roleBadgeColor = {
  admin: 'danger',
  recruiter: 'primary',
  jobseeker: 'success',
}

export const statusBadgeColor = {
  open: 'success',
  closed: 'secondary',
  filled: 'info',
}
