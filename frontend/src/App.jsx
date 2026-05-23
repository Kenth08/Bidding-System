import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import PublicResultsPage from "./pages/public/PublicResultsPage";

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const SupplierLayout = lazy(() => import("./layouts/SupplierLayout"));
const SchoolHeadLayout = lazy(() => import("./layouts/SchoolHeadLayout"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center text-slate-700 shadow-sm">
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

function getRolePath(role) {
  if (role === "school_head") return "/school-head";
  return `/${role}`;
}

export default function App() {
  const { user, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <LoadingFallback />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to={getRolePath(user.role)} replace />
              : <LandingPage
                  onAdminLogin={() => navigate("/login")}
                  onViewResults={() => navigate("/results")}
                  onRegister={() => navigate("/register")}
                />
          }
        />
        <Route
          path="/login"
          element={
            user
              ? <Navigate to={getRolePath(user.role)} replace />
              : <LoginPage
                  onLogin={(_role, userData) => login(userData)}
                  onBack={() => navigate("/")}
                  onGoToRegister={() => navigate("/register")}
                />
          }
        />
        <Route
          path="/register"
          element={
            user
              ? <Navigate to={getRolePath(user.role)} replace />
              : <RegisterPage
                  onBack={() => navigate("/")}
                  onSuccess={() => navigate("/login")}
                  onGoToLogin={() => navigate("/login")}
                />
          }
        />
        <Route path="/results" element={<PublicResultsPage onBack={() => navigate("/")} />} />

        {/* Protected routes */}
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout currentUser={user} onLogout={logout} /></ProtectedRoute>} />
        <Route path="/supplier/*" element={<ProtectedRoute allowedRoles={["supplier"]}><SupplierLayout user={user} currentUser={user} onLogout={logout} /></ProtectedRoute>} />
        <Route path="/school-head/*" element={<ProtectedRoute allowedRoles={["school_head"]}><SchoolHeadLayout user={user} currentUser={user} onLogout={logout} /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
