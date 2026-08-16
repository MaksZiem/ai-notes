import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PermissionsProvider } from './context/PermissionsContext'
import LoginPage from './pages/Auth/LoginPage'
import { PrivateRoute } from './components/routes/PrivateRoute'
import { AdminRoute } from './components/routes/AdminRoute'
import DashboardPage from './pages/DashboardPage'
import NotesPage from './pages/NotesPage'
import NoteEditorPage from './pages/NoteEditorPage'
import ProjectsPage from './pages/ProjectsPage'
import AdminPage from './pages/AdminPage'
import RegisterPage from './pages/Auth/RegisterPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PermissionsProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<PrivateRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/notes/:id" element={<NoteEditorPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id/notes" element={<NotesPage />} />

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Route>
            </Routes>
          </PermissionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}