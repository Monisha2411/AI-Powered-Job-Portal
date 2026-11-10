import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import DashboardLayout from './components/layout/DashboardLayout'
import RequireAuth from './components/layout/RequireAuth'

import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import Profile from './pages/Profile'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminJobs from './pages/admin/AdminJobs'
import AdminApplications from './pages/admin/AdminApplications'

// Recruiter pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard'
import RecruiterJobs from './pages/recruiter/RecruiterJobs'
import RecruiterNewJob from './pages/recruiter/RecruiterNewJob'
import RecruiterJobDetail from './pages/recruiter/RecruiterJobDetail'
import RecruiterApplicants from './pages/recruiter/RecruiterApplicants'

// Job seeker pages
import SeekerDashboard from './pages/jobseeker/SeekerDashboard'
import SeekerJobs from './pages/jobseeker/SeekerJobs'
import SeekerRecommendations from './pages/jobseeker/SeekerRecommendations'
import SeekerResume from './pages/jobseeker/SeekerResume'
import SeekerApplications from './pages/jobseeker/SeekerApplications'
import SeekerApplicationDetail from './pages/jobseeker/SeekerApplicationDetail'

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="public-page-content">
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Admin pages */}
      <Route
        path="/admin"
        element={
          <RequireAuth roles={['admin']}>
            <DashboardLayout role="admin" />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="applications" element={<AdminApplications />} />
      </Route>

      {/* Recruiter pages */}
      <Route
        path="/recruiter"
        element={
          <RequireAuth roles={['recruiter']}>
            <DashboardLayout role="recruiter" />
          </RequireAuth>
        }
      >
        <Route index element={<RecruiterDashboard />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="jobs/:id" element={<RecruiterJobDetail />} />
        <Route path="new-job" element={<RecruiterNewJob />} />
        <Route path="applicants" element={<RecruiterApplicants />} />
      </Route>

      {/* Job seeker pages */}
      <Route
        path="/seeker"
        element={
          <RequireAuth roles={['jobseeker']}>
            <DashboardLayout role="jobseeker" />
          </RequireAuth>
        }
      >
        <Route index element={<SeekerDashboard />} />
        <Route path="jobs" element={<SeekerJobs />} />
        <Route path="recommendations" element={<SeekerRecommendations />} />
        <Route path="resume" element={<SeekerResume />} />
        <Route path="applications" element={<SeekerApplications />} />
        <Route path="applications/:id" element={<SeekerApplicationDetail />} />
      </Route>

      {/* Shared profile page for authenticated users */}
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
