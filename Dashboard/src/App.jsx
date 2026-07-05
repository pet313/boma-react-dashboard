import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import './App.css';

function AppInner() {
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("kmc_theme") || "light");

  useEffect(() => {
    localStorage.setItem("kmc_theme", theme); // Persist theme preference
    document.body.className = theme === "light" ? "light-theme" : "dark-theme"; // Apply theme class to body
  }, [theme]);

  return (
    <>
      {isAuthenticated ? <Dashboard theme={theme} setTheme={setTheme} /> : <LoginPage theme={theme} setTheme={setTheme} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
