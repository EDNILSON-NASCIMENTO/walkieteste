import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Defina a URL base da API usando a variável de ambiente
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error(
    "A variável de ambiente 'VITE_API_URL' não está definida. Verifique seu arquivo .env."
  );
}

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("walkie_token"));

  // Configurar axios com o token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.post(`/auth/verify-token`, { token });
          setUser(response.data.user);
        } catch (error) {
          console.error("Token inválido:", error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("walkie_token", newToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao fazer login",
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`/auth/register`, {
        name,
        email,
        password,
      });
      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("walkie_token", newToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao criar conta",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("walkie_token");
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
