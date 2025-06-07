import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import MainLayout from '@/components/Layout/MainLayout'
import Home from '@/pages/Home'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="reporting-events" element={<div>Reporting Events</div>} />
          <Route path="analyses" element={<div>Analyses</div>} />
          <Route path="outputs" element={<div>Outputs</div>} />
          <Route path="displays" element={<div>Displays</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App