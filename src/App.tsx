import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Issues } from './pages/Issues';
import { IssueDetails } from './pages/IssueDetails';
import { KanbanBoard } from './pages/KanbanBoard';
import { TeamPerformance } from './pages/TeamPerformance';
import { MemberPerformance } from './pages/MemberPerformance';
import { UserManagement } from './pages/UserManagement';
import { UserDetails } from './pages/UserDetails';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Sprints } from './pages/Sprints';
import { ApiProvider } from './context/ApiContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ApiProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <Dashboard />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/projects" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <Projects />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <ProjectDetails />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/issues" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <Issues />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/issues/:id" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <IssueDetails />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/kanban" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <KanbanBoard />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/sprints" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <Sprints />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/team" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <TeamPerformance />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/member-performance" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <MemberPerformance />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <AdminRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <UserManagement />
                    </main>
                  </div>
                </div>
              </AdminRoute>
            } />
            
            <Route path="/users/:id" element={
              <AdminRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <UserDetails />
                    </main>
                  </div>
                </div>
              </AdminRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <Settings />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />

            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ApiProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
