import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Pets from "./pages/Pets";
import Walk from "./pages/Walk";
import Ranking from "./pages/Ranking";
import "./App.css";

// NOVOS IMPORTS 
import AdminUsers from "./pages/AdminUsers";
import AdminPets from "./pages/AdminPets";
import AdminWalks from "./pages/AdminWalks";

// Configurar base URL do axios
import axios from "axios";
//axios.defaults.baseURL = 'http://localhost:5001'; retirado para usar variável de ambiente
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="pets" element={<Pets />} />
            <Route path="walk" element={<Walk />} />
            <Route path="ranking" element={<Ranking />} />

            {/* ⬇️ NOVAS ROTAS ADMIN ⬇️ */}
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/pets" element={<AdminPets />} />
            <Route path="admin/walks" element={<AdminWalks />} />
          </Route>

          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
