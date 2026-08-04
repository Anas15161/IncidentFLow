// ============================================
// hooks/useAuth.js — Authentification & Session
// ============================================
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8080/api';

export const USERS = [
  { id: 1, name: "Anas Haddou", firstName: "Anas", lastName: "Haddou", email: "anas@netmar.com", role: "Administrateur", department: "Informatique", post: "Administrateur Système", avatarColor: "bg-blue-600" },
  { id: 2, name: "Sophie Martin", firstName: "Sophie", lastName: "Martin", email: "sophie.m@netmar.com", role: "Responsable", department: "Sécurité", post: "Responsable SSI", avatarColor: "bg-purple-600" },
  { id: 3, name: "Marie Laurent", firstName: "Marie", lastName: "Laurent", email: "marie.l@netmar.com", role: "Opérateur", department: "Support client", post: "Opératrice Réseau", avatarColor: "bg-emerald-600" },
  { id: 4, name: "Dr. Jean Robert", firstName: "Jean", lastName: "Robert", email: "jean.r@netmar.com", role: "Opérateur médical", department: "Urgences médicales", post: "Médecin Coordinateur", avatarColor: "bg-red-600" }
];

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const [sessionDuration, setSessionDuration] = useState(() => {
    return parseInt(localStorage.getItem('sessionDuration') || '600');
  });
  const [sessionTimeLeft, setSessionTimeLeft] = useState(() => {
    return parseInt(localStorage.getItem('sessionDuration') || '600');
  });

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Mock-User': currentUser.email
    };
  };

  // Load Session on start
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch (err) {
      console.error("Error on logout:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setToken('');
      setCurrentUser(USERS[0]);
    }
  };

  // Session timer auto-logout
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          handleLogout();
          alert("Votre session a expiré. Déconnexion automatique.");
          return sessionDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionDuration]);

  // Handle Login Form Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError("L'adresse email et le mot de passe sont obligatoires.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Identifiants invalides.");
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      setSessionTimeLeft(sessionDuration);
      return { success: true };
    } catch (err) {
      setLoginError(err.message);
      return { success: false };
    }
  };

  // Quick click login buttons for testing
  const triggerQuickLogin = (email) => {
    setLoginEmail(email);
    setLoginPassword('password');
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    token,
    currentUser,
    setCurrentUser,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    showLoginPassword,
    setShowLoginPassword,
    isCapsLockOn,
    setIsCapsLockOn,
    sessionDuration,
    setSessionDuration,
    sessionTimeLeft,
    setSessionTimeLeft,
    getHeaders,
    handleLogout,
    handleLoginSubmit,
    triggerQuickLogin
  };
}
