import "./App.css";

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import StudentDetails from "./pages/student/StudentDetails";
import IndustryProfilePage from "./pages/industry/IndustryProfile";
import IndustryOpportunities from "./pages/industry/IndustryOpportunities";
import StudentOpportunities from "./pages/student/StudentOpportunities";
import StudentApplicationsPage from "./pages/student/StudentApplications";
import IndustryDemandReport from "./pages/student/IndustryDemandReport";
import CompaniesPage from "./pages/student/CompaniesPage";
import SkillGapAnalysisPage from "./pages/student/SkillGapAnalysis";
import SavedOpportunities from "./pages/student/SavedOpportunities";
import LearningHub from "./pages/student/LearningHub";
import ExperiencesPage from "./pages/student/ExperiencesPage";
import ComingSoonPage from "./pages/ComingSoon";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import InstitutionStudents from "./pages/institution/InstitutionStudents";
import CollaborationsPage from "./pages/collaborations/CollaborationsPage";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";

// Protected Route wrapper: Ensures unauthenticated users see Login page first
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Guard: Ensures only authenticated admin users access admin routes
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role ? user.role.toString().toLowerCase() : "";
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Institution Guard: Ensures only authenticated institution users access institution routes
const InstitutionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role ? user.role.toString().toLowerCase() : "";
  const allowed = ["institution", "academician", "faculty", "institute", "admin"];
  if (!allowed.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Only Route: Redirects to appropriate home route if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const role = user?.role ? user.role.toString().toLowerCase() : "";
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === "industry") {
      return <Navigate to="/industry/profile" replace />;
    } else if (["institution", "academician", "faculty", "institute"].includes(role)) {
      return <Navigate to="/institution/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main Dashboard Router Component to handle role-based Landing Page
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ? user.role.toString().toLowerCase() : "";

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (role === "industry") {
    return <Navigate to="/industry/profile" replace />;
  } else if (["institution", "academician", "faculty", "institute"].includes(role)) {
    return <Navigate to="/institution/dashboard" replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Login / Signup route shown first */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              }
            />

            {/* Public Root Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Details Route */}
            <Route
              path="/student/details"
              element={
                <ProtectedRoute>
                  <StudentDetails />
                </ProtectedRoute>
              }
            />

            {/* Protected Industry Profile Route */}
            <Route
              path="/industry/profile"
              element={
                <ProtectedRoute>
                  <IndustryProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Industry Opportunities Management Route */}
            <Route
              path="/industry/opportunities"
              element={
                <ProtectedRoute>
                  <IndustryOpportunities />
                </ProtectedRoute>
              }
            />

            {/* Protected Student / Public Opportunities Route */}
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute>
                  <StudentOpportunities />
                </ProtectedRoute>
              }
            />

            {/* Protected Academia-Industry Collaborations Route */}
            <Route
              path="/collaborations"
              element={
                <ProtectedRoute>
                  <CollaborationsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Applications Route */}
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute>
                  <StudentApplicationsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Industry Demand Report Route */}
            <Route
              path="/student/industry-demand"
              element={
                <ProtectedRoute>
                  <IndustryDemandReport />
                </ProtectedRoute>
              }
            />

            {/* Protected Partner Companies Directory Route */}
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <CompaniesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Skill Gap Analysis Route */}
            <Route
              path="/student/skill-gap"
              element={
                <ProtectedRoute>
                  <SkillGapAnalysisPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Saved Opportunities Route */}
            <Route
              path="/student/saved"
              element={
                <ProtectedRoute>
                  <SavedOpportunities />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Learning Hub Route */}
            <Route
              path="/student/learning"
              element={
                <ProtectedRoute>
                  <LearningHub />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Experiences Route */}
            <Route
              path="/student/experiences"
              element={
                <ProtectedRoute>
                  <ExperiencesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/experiences"
              element={
                <ProtectedRoute>
                  <ExperiencesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Coming Soon Route for unbuilt features */}
            <Route
              path="/coming-soon"
              element={
                <ProtectedRoute>
                  <ComingSoonPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Dashboard Route */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Protected Institution Dashboard Route */}
            <Route
              path="/institution/dashboard"
              element={
                <InstitutionRoute>
                  <InstitutionDashboard />
                </InstitutionRoute>
              }
            />

            {/* Protected Institution Enrolled Students Route */}
            <Route
              path="/institution/students"
              element={
                <InstitutionRoute>
                  <InstitutionStudents />
                </InstitutionRoute>
              }
            />

            {/* Catch-all redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

