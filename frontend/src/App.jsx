// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\App.jsx
import { useState } from "react";
import AdminLayout from "./layouts/AdminLayout";
import SupplierLayout from "./layouts/SupplierLayout";
import LoginPage from "./pages/auth/LoginPage";
import LandingPage from "./pages/public/LandingPage";
import PublicResultsPage from "./pages/public/PublicResultsPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { logoutUser } from "./services/authService";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("landing");
  const [currentUser, setCurrentUser] = useState(null);

  function handleLogin(role, user) {
    setCurrentUser(user || null);
    setCurrentScreen(role);
  }

  async function handleLogout() {
    await logoutUser();
    setCurrentUser(null);
    setCurrentScreen("landing");
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
          setLoginRole("supplier");
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

  return null;
}
