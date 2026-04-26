// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\App.jsx
import { useEffect, useState } from "react";
import AdminLayout from "./layouts/AdminLayout";
import SupplierLayout from "./layouts/SupplierLayout";
import LoginPage from "./pages/auth/LoginPage";
import LandingPage from "./pages/public/LandingPage";
import PublicResultsPage from "./pages/public/PublicResultsPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { authAPI } from "./services/api";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("landing");
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await authAPI.me();
        setCurrentUser(response.data);
        setCurrentScreen(response.data.role);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setCurrentUser(null);
        setCurrentScreen("landing");
      } finally {
        setIsInitializing(false);
      }
    }

    restoreSession();
  }, []);

  function handleLogin(role, user) {
    setCurrentUser(user || null);
    setCurrentScreen(role);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setCurrentUser(null);
    setCurrentScreen("landing");
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center text-slate-700 shadow-sm">
          <p className="text-sm font-medium">Restoring session, please wait...</p>
        </div>
      </div>
    );
  }

  if (currentScreen === "landing") {
    return (
      <LandingPage
        onAdminLogin={() => setCurrentScreen("login")}
        onViewResults={() => setCurrentScreen("public-results")}
        onRegister={() => setCurrentScreen("register")}
      />
    );
  }

  if (currentScreen === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBack={() => setCurrentScreen("landing")}
        onGoToRegister={() => setCurrentScreen("register")}
      />
    );
  }

  if (currentScreen === "register") {
    return (
      <RegisterPage
        onBack={() => setCurrentScreen("landing")}
        onSuccess={() => {
          setCurrentScreen("login");
        }}
      />
    );
  }

  if (currentScreen === "public-results") {
    return <PublicResultsPage onBack={() => setCurrentScreen("landing")} />;
  }

  if (currentScreen === "admin") {
    return <AdminLayout user={currentUser} currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (currentScreen === "supplier") {
    return <SupplierLayout user={currentUser} currentUser={currentUser} onLogout={handleLogout} />;
  }

  return <LandingPage onAdminLogin={() => setCurrentScreen("login")} onViewResults={() => setCurrentScreen("public-results")} onRegister={() => setCurrentScreen("register")} />;
}
