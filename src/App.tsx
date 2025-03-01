import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Issues } from './pages/Issues';
import { TeamPerformance } from './pages/TeamPerformance';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { ApiProvider } from './context/ApiContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ApiProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/:id" element={<ProjectDetails />} />
                        <Route path="/issues" element={<Issues />} />
                        <Route path="/team" element={<TeamPerformance />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </ApiProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;