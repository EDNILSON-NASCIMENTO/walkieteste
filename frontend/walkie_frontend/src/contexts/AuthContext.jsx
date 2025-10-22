import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Estado inicial de loading

  // --- AJUSTE COM CONSOLE.LOG ---
  useEffect(() => {
    console.log('[AuthContext] Verificando token no carregamento...');
    const token = localStorage.getItem('token');
    console.log('[AuthContext] Token encontrado no localStorage:', token); // Log 1: Mostra o token lido

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log('[AuthContext] Token decodificado:', decodedToken); // Log 2: Mostra o conteúdo do token

        // Verifica se o token expirou (opcional, mas recomendado)
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          console.warn('[AuthContext] Token expirado.'); // Log 3a: Avisa se expirou
          localStorage.removeItem('token');
          setUser(null);
        } else {
          // Se o token for válido, tenta buscar os dados do utilizador (ou usa os dados do token se disponíveis)
          // Idealmente, você buscaria os dados do perfil aqui para ter info atualizada
          // Por agora, vamos assumir que o token contém dados suficientes ou vamos buscar
          console.log('[AuthContext] Token válido. Tentando definir utilizador...'); // Log 3b: Indica token válido
          // Aqui você pode querer buscar o perfil do utilizador novamente
          // Ex: fetchUserProfile(token);
          // Por simplicidade, vamos tentar definir um utilizador básico se tivermos id
          if (decodedToken.sub) { // 'sub' geralmente contém o user_id
             // Simulando dados do utilizador - IDEALMENTE BUSCAR DA API /profile
             setUser({ id: decodedToken.sub /*, ... outros dados se tiver no token ou buscar da API */ });
             console.log('[AuthContext] Utilizador definido a partir do token (ID):', decodedToken.sub); // Log 4: Confirma definição do utilizador
          } else {
             console.warn('[AuthContext] Token não contém ID (sub). Removendo token.');
             localStorage.removeItem('token');
             setUser(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao decodificar ou validar token:', error); // Log 5: Erro na decodificação
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      console.log('[AuthContext] Nenhum token encontrado no localStorage.'); // Log 6: Nenhum token
      setUser(null);
    }
    setLoading(false); // Termina o loading inicial
    console.log('[AuthContext] Verificação inicial concluída. Loading:', loading); // Log 7: Fim da verificação
  }, []);
  // --- FIM DO AJUSTE ---


  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Tenta definir o utilizador a partir da resposta do login
         if (response.data.user) {
           setUser(response.data.user);
           console.log('[AuthContext] Login bem-sucedido. Utilizador definido:', response.data.user);
         } else {
            // Se a API de login não retornar o utilizador, tenta decodificar o token
            try {
               const decoded = jwtDecode(response.data.token);
               setUser({ id: decoded.sub /* ... */}); // Define pelo menos o ID
               console.log('[AuthContext] Login bem-sucedido. Utilizador definido a partir do token (ID):', decoded.sub);
            } catch (e) {
               console.error('[AuthContext] Erro ao decodificar token após login:', e);
               setUser(null); // Falha em obter dados do utilizador
            }
         }
        return { success: true };
      }
      // Se não houver token na resposta
      console.error('[AuthContext] Resposta de login não contém token:', response.data);
      return { success: false, error: 'Resposta inválida do servidor ao fazer login.' };
    } catch (error) {
      console.error('[AuthContext] Erro no login:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    console.log('[AuthContext] Utilizador fez logout.');
    // Idealmente, redirecionar para a página de login
    // navigate('/login'); // Se tiver acesso ao navigate aqui
  };

  const isAuthenticated = !!user && !!localStorage.getItem('token'); // Verifica user E token

  // Retorna o loading no value para que outros componentes possam usá-lo
  const value = { user, login, logout, isAuthenticated, loading };

  // Renderiza children apenas quando o loading inicial terminar
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};