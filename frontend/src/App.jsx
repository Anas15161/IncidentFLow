import { useState, useEffect } from 'react';
import { 
  Shield, Activity, FileText, AlertTriangle, CheckCircle, Clock, 
  Search, User, Plus, X, Bell, Paperclip, Download, Send, 
  Globe, Cpu, Stethoscope, ArrowLeft, Eye, RefreshCw, Layers,
  Lock, LogOut, Users, Trash2, Edit3, Settings, AlertCircle,
  ChevronDown, HelpCircle
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

const USERS = [
  { id: 1, name: "Anas Haddou", firstName: "Anas", lastName: "Haddou", email: "anas@netmar.com", role: "Administrateur", department: "Informatique", post: "Administrateur Système", avatarColor: "bg-blue-600" },
  { id: 2, name: "Sophie Martin", firstName: "Sophie", lastName: "Martin", email: "sophie.m@netmar.com", role: "Responsable", department: "Sécurité", post: "Responsable SSI", avatarColor: "bg-purple-600" },
  { id: 3, name: "Marie Laurent", firstName: "Marie", lastName: "Laurent", email: "marie.l@netmar.com", role: "Opérateur", department: "Support client", post: "Opératrice Réseau", avatarColor: "bg-emerald-600" },
  { id: 4, name: "Dr. Jean Robert", firstName: "Jean", lastName: "Robert", email: "jean.r@netmar.com", role: "Opérateur médical", department: "Urgences médicales", post: "Médecin Coordinateur", avatarColor: "bg-red-600" }
];

function App() {
  const getRoleName = (role) => {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && role.name) return role.name;
    return '';
  };

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(() => {
    return parseInt(localStorage.getItem('sessionDuration') || '600');
  });

  // Profile & Settings Dropdown / Modals states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // App Settings States
  const [sessionDuration, setSessionDuration] = useState(() => {
    return parseInt(localStorage.getItem('sessionDuration') || '600');
  });
  const [enableNotifications, setEnableNotifications] = useState(() => {
    return localStorage.getItem('enableNotifications') !== 'false';
  });
  const [notificationSound, setNotificationSound] = useState(() => {
    return localStorage.getItem('notificationSound') !== 'false';
  });
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('maintenanceMode') === 'true';
  });

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    post: '',
    department: '',
    avatarColor: 'bg-blue-600'
  });

  // App Settings Form State
  const [appSettingsForm, setAppSettingsForm] = useState({
    sessionDuration: '600',
    enableNotifications: true,
    notificationSound: true,
    maintenanceMode: false
  });

  // Navigation
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'incidents', 'workflows', 'users'
  const [selectedIncidentCode, setSelectedIncidentCode] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedIncidentWorkflow, setSelectedIncidentWorkflow] = useState(null);
  
  // Dropdowns & UI toggles
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nouvel incident médical assigné automatiquement.", time: "Il y a 5 min" },
    { id: 2, text: "Sophie Martin a mis à jour l'incident INC-2026-002.", time: "Il y a 15 min" },
    { id: 3, text: "Base de données initialisée avec succès.", time: "Il y a 1 h" }
  ]);
  
  // Data States
  const [incidents, setIncidents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Incident Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [priorityFilter, setPriorityFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 5;
  
  // Modals & Forms for Incidents
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    category: 'Réseau',
    priority: 'Medium',
    assignedToId: '',
    tags: ''
  });
  const [newIncidentFile, setNewIncidentFile] = useState(null);
  
  const [newComment, setNewComment] = useState('');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [targetTransition, setTargetTransition] = useState(null);
  const [transitionComment, setTransitionComment] = useState('');

  // Modals & Forms for Users
  const [showUserCreateModal, setShowUserCreateModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telephone: '',
    department: '',
    post: '',
    roleId: '3', // Opérateur default
    active: true
  });

  // Workflow Editor parameters
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [newStateId, setNewStateId] = useState('');
  const [newStateLabel, setNewStateLabel] = useState('');
  const [newStateColor, setNewStateColor] = useState('bg-blue-50 text-blue-600 border-blue-200');
  const [newTransFrom, setNewTransFrom] = useState('');
  const [newTransTo, setNewTransTo] = useState('');
  const [newTransRole, setNewTransRole] = useState('');
  const [newTransRequiresComment, setNewTransRequiresComment] = useState(false);

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

  // Session timer auto-logout (US-AUTH-001)
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

  // Close profile dropdown & notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.user-profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
      if (showNotifications && !event.target.closest('.notif-bell-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown, showNotifications]);

  // Open Edit Profile modal and set form fields
  const handleOpenEditProfile = () => {
    setProfileForm({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      post: currentUser.post || '',
      department: currentUser.department || '',
      avatarColor: currentUser.avatarColor || 'bg-blue-600'
    });
    setShowEditProfileModal(true);
    setShowProfileDropdown(false);
  };

  // Open App Settings modal and set form fields
  const handleOpenAppSettings = () => {
    setAppSettingsForm({
      sessionDuration: sessionDuration.toString(),
      enableNotifications: enableNotifications,
      notificationSound: notificationSound,
      maintenanceMode: maintenanceMode
    });
    setShowAppSettingsModal(true);
    setShowProfileDropdown(false);
  };

  // Save profile changes
  const handleEditProfileSubmit = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      name: `${profileForm.firstName} ${profileForm.lastName}`,
      email: profileForm.email,
      post: profileForm.post,
      department: profileForm.department,
      avatarColor: profileForm.avatarColor
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setShowEditProfileModal(false);
    setSuccessMessage("Profil mis à jour avec succès !");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Save app settings changes
  const handleAppSettingsSubmit = (e) => {
    e.preventDefault();
    const newDur = parseInt(appSettingsForm.sessionDuration);
    setSessionDuration(newDur);
    setSessionTimeLeft(newDur);
    setEnableNotifications(appSettingsForm.enableNotifications);
    setNotificationSound(appSettingsForm.notificationSound);
    setMaintenanceMode(appSettingsForm.maintenanceMode);

    localStorage.setItem('sessionDuration', appSettingsForm.sessionDuration);
    localStorage.setItem('enableNotifications', appSettingsForm.enableNotifications.toString());
    localStorage.setItem('notificationSound', appSettingsForm.notificationSound.toString());
    localStorage.setItem('maintenanceMode', appSettingsForm.maintenanceMode.toString());

    setShowAppSettingsModal(false);
    setSuccessMessage("Paramètres mis à jour avec succès !");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Headers helper with simulated JWT & simulated user identity
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Mock-User': currentUser.email
    };
  };

  // Fetch all incidents with active filters
  const fetchIncidents = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      let url = `${API_BASE}/incidents?`;
      if (statusFilter !== 'Tous') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (categoryFilter !== 'Tous') url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (priorityFilter !== 'Tous') url += `priority=${encodeURIComponent(priorityFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error("Erreur de chargement des incidents.");
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch workflows configurations
  const fetchWorkflows = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_BASE}/workflows`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        if (data.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(data[0].id);
          setActiveWorkflow(data[0]);
        }
      }
    } catch (err) {
      console.error("Impossible de charger les workflows:", err);
    }
  };

  // Fetch user list & roles
  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
      
      const rolesRes = await fetch(`${API_BASE}/roles`, { headers: getHeaders() });
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRolesList(rolesData);
      }
    } catch (err) {
      console.error("Impossible de charger les utilisateurs:", err);
    }
  };

  // Reload when filters change or authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchIncidents();
    }
  }, [statusFilter, categoryFilter, priorityFilter, sortBy, currentUser, isAuthenticated]);

  // Initial load on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkflows();
      fetchUsers();
    }
  }, [isAuthenticated]);

  // Handle Workflow Selection change
  useEffect(() => {
    if (selectedWorkflowId && workflows.length > 0) {
      const found = workflows.find(w => w.id === parseInt(selectedWorkflowId));
      if (found) {
        setActiveWorkflow(found);
      }
    }
  }, [selectedWorkflowId, workflows]);

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
      setSuccessMessage("Connexion réussie !");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setLoginError(err.message);
    }
  };

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
      setCurrentView('dashboard');
      setSelectedIncidentCode(null);
    }
  };

  // Quick click login buttons for testing (Wireframe-like)
  const triggerQuickLogin = (email) => {
    setLoginEmail(email);
    setLoginPassword('password');
  };

  // Create new user (US-USER-001)
  const handleUserCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const selectedRole = rolesList.find(r => r.id === parseInt(newUserForm.roleId));
    
    const payload = {
      firstName: newUserForm.firstName,
      lastName: newUserForm.lastName,
      name: `${newUserForm.firstName} ${newUserForm.lastName}`,
      email: newUserForm.email,
      telephone: newUserForm.telephone,
      department: newUserForm.department,
      post: newUserForm.post,
      role: selectedRole,
      active: true,
      avatarColor: ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-red-600", "bg-indigo-600"][Math.floor(Math.random() * 5)]
    };

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Impossible de créer l'utilisateur. Vérifiez l'email unique.");
      }

      setNewUserForm({
        firstName: '',
        lastName: '',
        email: '',
        telephone: '',
        department: '',
        post: '',
        roleId: '3',
        active: true
      });
      setShowUserCreateModal(false);
      fetchUsers();
      
      // Update notifications list
      setNotifications(prev => [
        { id: Date.now(), text: `Nouvel utilisateur créé : ${payload.name}`, time: "À l'instant" },
        ...prev
      ]);
      setSuccessMessage("Utilisateur créé avec succès !");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Edit user submission
  const handleUserEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const selectedRole = rolesList.find(r => r.id === parseInt(editingUser.roleId));

    const payload = {
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      name: `${editingUser.firstName} ${editingUser.lastName}`,
      email: editingUser.email,
      telephone: editingUser.telephone,
      department: editingUser.department,
      post: editingUser.post,
      role: selectedRole,
      active: editingUser.active
    };

    try {
      const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Impossible de mettre à jour le compte.");

      setShowUserEditModal(false);
      setEditingUser(null);
      fetchUsers();
      setSuccessMessage("Profil utilisateur mis à jour !");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Delete User
  const handleUserDelete = async (id, name) => {
    if (!window.confirm(`Êtes-vous certain de vouloir supprimer définitivement l'utilisateur ${name} ?`)) return;
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) throw new Error("Erreur de suppression.");

      fetchUsers();
      setSuccessMessage("Compte utilisateur supprimé.");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Create new incident (US-INC-001)
  const handleCreateIncidentSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const payload = {
      title: newIncident.title,
      description: newIncident.description,
      category: newIncident.category,
      priority: newIncident.priority
    };
    
    if (newIncident.assignedToId) {
      payload.assignedTo = { id: parseInt(newIncident.assignedToId) };
    }
    
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur de création de l'incident.");
      }
      
      const createdInc = await res.json();

      if (newIncidentFile) {
        const formData = new FormData();
        formData.append('file', newIncidentFile);
        
        const uploadRes = await fetch(`${API_BASE}/incidents/${createdInc.incidentCode}/attachments`, {
          method: 'POST',
          headers: {
            'X-Mock-User': currentUser.email
          },
          body: formData
        });

        if (!uploadRes.ok) {
          console.error("Le téléversement de la pièce jointe a échoué.");
        }
      }
      
      setNewIncident({
        title: '',
        description: '',
        category: 'Réseau',
        priority: 'Medium',
        assignedToId: '',
        tags: ''
      });
      setNewIncidentFile(null);
      setShowCreateModal(false);
      fetchIncidents();
      setSuccessMessage("Incident déclaré avec succès !");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Save the entire active workflow parameters globally
  const handleSaveWorkflowGlobally = async () => {
    if (!activeWorkflow) return;
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE}/workflows/${activeWorkflow.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(activeWorkflow)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la sauvegarde du workflow.");
      }

      fetchWorkflows();
      setSuccessMessage("Workflow configuré enregistré avec succès !");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Add state to active workflow (US-WF-002)
  const handleAddStateToWorkflow = (e) => {
    e.preventDefault();
    if (!newStateId || !newStateLabel || !activeWorkflow) return;

    // Check unique state ID
    const exists = activeWorkflow.states.some(s => s.name.toLowerCase() === newStateId.toLowerCase());
    if (exists) {
      alert("Cet état technique ID existe déjà.");
      return;
    }

    const stateObj = {
      name: newStateId.trim(),
      label: newStateLabel.trim(),
      colorClass: newStateColor,
      active: true
    };

    const updatedStates = [...activeWorkflow.states, stateObj];
    const updatedWf = { ...activeWorkflow, states: updatedStates };
    
    // Update local state copy
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));

    // Reset inputs
    setNewStateId('');
    setNewStateLabel('');
  };

  // Remove state from workflow
  const handleDeleteStateFromWorkflow = (stateName) => {
    if (["Nouveau", "Clôturé"].includes(stateName)) {
      alert("Impossible de supprimer les états systèmes initiaux/finaux.");
      return;
    }

    const updatedStates = activeWorkflow.states.filter(s => s.name !== stateName);
    // Also remove any transitions referencing this state
    const updatedTrans = activeWorkflow.transitions.filter(t => t.fromState !== stateName && t.toState !== stateName);

    const updatedWf = { ...activeWorkflow, states: updatedStates, transitions: updatedTrans };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  // Update State Color dynamically
  const handleUpdateStateColor = (stateName, colorClass) => {
    const updatedStates = activeWorkflow.states.map(s => s.name === stateName ? { ...s, colorClass } : s);
    const updatedWf = { ...activeWorkflow, states: updatedStates };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  // Toggle State Active
  const handleToggleStateActive = (stateName) => {
    const updatedStates = activeWorkflow.states.map(s => s.name === stateName ? { ...s, active: !s.active } : s);
    const updatedWf = { ...activeWorkflow, states: updatedStates };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  // Update workflow active state
  const handleToggleWorkflowActive = () => {
    const updatedWf = { ...activeWorkflow, active: !activeWorkflow.active };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  // Add transition to active workflow (US-WF-003)
  const handleAddTransitionToWorkflow = (e) => {
    e.preventDefault();
    if (!newTransFrom || !newTransTo || !activeWorkflow) return;

    if (newTransFrom === newTransTo) {
      alert("L'état origine et destination ne peuvent pas être identiques.");
      return;
    }

    // Check duplicate
    const exists = activeWorkflow.transitions.some(t => t.fromState === newTransFrom && t.toState === newTransTo);
    if (exists) {
      alert("Cette transition existe déjà.");
      return;
    }

    const transObj = {
      fromState: newTransFrom,
      toState: newTransTo,
      roleRequired: newTransRole || null,
      requiresComment: newTransRequiresComment
    };

    const updatedTrans = [...activeWorkflow.transitions, transObj];
    const updatedWf = { ...activeWorkflow, transitions: updatedTrans };

    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));

    // Reset inputs
    setNewTransFrom('');
    setNewTransTo('');
    setNewTransRole('');
    setNewTransRequiresComment(false);
  };

  // Delete transition
  const handleDeleteTransitionFromWorkflow = (fromState, toState) => {
    const updatedTrans = activeWorkflow.transitions.filter(t => !(t.fromState === fromState && t.toState === toState));
    const updatedWf = { ...activeWorkflow, transitions: updatedTrans };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  // CSV/Excel Export (Feature 2.2)
  const handleExportCSV = () => {
    let url = `${API_BASE}/incidents/export/csv?`;
    if (statusFilter !== 'Tous') url += `status=${encodeURIComponent(statusFilter)}&`;
    if (categoryFilter !== 'Tous') url += `category=${encodeURIComponent(categoryFilter)}&`;
    if (priorityFilter !== 'Tous') url += `priority=${encodeURIComponent(priorityFilter)}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    window.open(url, '_blank');
  };

  // PDF Export
  const handleExportPDF = () => {
    let url = `${API_BASE}/incidents/export/pdf?`;
    if (statusFilter !== 'Tous') url += `status=${encodeURIComponent(statusFilter)}&`;
    if (categoryFilter !== 'Tous') url += `category=${encodeURIComponent(categoryFilter)}&`;
    if (priorityFilter !== 'Tous') url += `priority=${encodeURIComponent(priorityFilter)}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    window.open(url, '_blank');
  };

  // Fetch detailed incident view
  const loadIncidentDetail = async (code, userContext = currentUser) => {
    try {
      setErrorMessage('');
      const res = await fetch(`${API_BASE}/incidents/${code}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-User': userContext.email
        }
      });
      if (!res.ok) throw new Error("Impossible de charger le détail de l'incident.");
      const data = await res.json();
      setSelectedIncident(data);
      
      const wfRes = await fetch(`${API_BASE}/workflows/category/${encodeURIComponent(data.category)}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-User': userContext.email
        }
      });
      if (wfRes.ok) {
        const wfData = await wfRes.json();
        setSelectedIncidentWorkflow(wfData);
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleSelectIncident = (code) => {
    setSelectedIncidentCode(code);
    loadIncidentDetail(code);
  };

  // Create workflow transition (US-INC-005)
  const handleTransitionClick = (transition) => {
    setTargetTransition(transition);
    setTransitionComment('');
    
    if (transition.requiresComment) {
      setShowTransitionModal(true);
    } else {
      executeTransition(transition.toState, '');
    }
  };

  const executeTransition = async (toState, comment) => {
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/incidents/${selectedIncident.incidentCode}/transition`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ toState, comment })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "La transition a échoué.");
      }
      
      setShowTransitionModal(false);
      setTargetTransition(null);
      setTransitionComment('');
      
      loadIncidentDetail(selectedIncident.incidentCode);
      fetchIncidents();
      
      setNotifications(prev => [
        { id: Date.now(), text: `Incident ${selectedIncident.incidentCode} passé à l'état ${toState}`, time: "À l'instant" },
        ...prev
      ]);
    } catch (err) {
      setErrorMessage(err.message);
      setShowTransitionModal(false);
    }
  };

  // Submit comment (US-INC-006)
  const handleAddCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setErrorMessage('');
    
    try {
      const res = await fetch(`${API_BASE}/incidents/${selectedIncident.incidentCode}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: newComment })
      });
      
      if (!res.ok) throw new Error("Impossible d'ajouter le commentaire.");
      
      setNewComment('');
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Upload file attachment (US-INC-007)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/incidents/${selectedIncident.incidentCode}/attachments`, {
        method: 'POST',
        headers: {
          'X-Mock-User': currentUser.email
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Le téléversement a échoué.");
      }
      
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Category Icon helper
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Réseau': return <Globe size={16} />;
      case 'Sécurité': return <Shield size={16} />;
      case 'Système': return <Cpu size={16} />;
      case 'Médical': return <Stethoscope size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Priority color helper
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Medium': return '#ca8a04';
      case 'Low': return '#16a34a';
      default: return 'var(--text-muted)';
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render SLA Badge helper
  const renderSlaBadge = (inc) => {
    if (!inc.slaDueAt) return null;
    
    if (inc.status === 'Résolu' || inc.status === 'Clôturé') {
      return (
        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#86efac', fontWeight: 'bold' }}>
          ✓ SLA Respecté
        </span>
      );
    }

    const dueTime = new Date(inc.slaDueAt).getTime();
    const now = new Date().getTime();
    const diffMs = dueTime - now;

    if (diffMs < 0) {
      const overdueMins = Math.abs(Math.round(diffMs / 60000));
      const hours = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
      return (
        <span className="badge pulse-active-glow" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', fontWeight: 'bold' }} title={`Dépassé de ${timeStr}`}>
          ⚠ SLA Dépassé (-{timeStr})
        </span>
      );
    }

    const remainingMins = Math.round(diffMs / 60000);
    const hours = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    if (remainingMins <= 30) {
      return (
        <span className="badge pulse-active-glow" style={{ backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fdba74', fontWeight: 'bold' }}>
          ⏱ Échéance ({timeStr})
        </span>
      );
    }

    return (
      <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 'bold' }}>
        ⏱ {timeStr} restants
      </span>
    );
  };

  // SVG Donut Path helper
  const getDonutSegmentPath = (cx, cy, r, startAngle, endAngle) => {
    const startRad = (startAngle - 90) * Math.PI / 180.0;
    const endRad = (endAngle - 90) * Math.PI / 180.0;
    
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Render SVG Donut Chart for Priorities (US-INC-009 / Epic 5)
  const renderPriorityDonut = () => {
    const criticalCount = incidents.filter(i => i.priority === 'Critical').length;
    const highCount = incidents.filter(i => i.priority === 'High').length;
    const mediumCount = incidents.filter(i => i.priority === 'Medium').length;
    const lowCount = incidents.filter(i => i.priority === 'Low').length;
    const total = criticalCount + highCount + mediumCount + lowCount;

    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '40px 0' }}>
          Aucune donnée disponible.
        </div>
      );
    }

    const segments = [
      { count: criticalCount, color: "#dc2626", label: "Critique" },
      { count: highCount, color: "#ea580c", label: "Élevée" },
      { count: mediumCount, color: "#ca8a04", label: "Moyenne" },
      { count: lowCount, color: "#16a34a", label: "Faible" }
    ].filter(s => s.count > 0);

    let accumulatedAngle = 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', width: '100%' }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
          {segments.map((seg, idx) => {
            const percentage = seg.count / total;
            const angle = percentage * 360;
            let path = "";
            if (percentage === 1) {
              return (
                <circle key={idx} cx="70" cy="70" r="50" fill="transparent" stroke={seg.color} strokeWidth="12" />
              );
            } else {
              path = getDonutSegmentPath(70, 70, 50, accumulatedAngle, accumulatedAngle + angle);
              accumulatedAngle += angle;
              return (
                <path key={idx} d={path} fill="transparent" stroke={seg.color} strokeWidth="12" strokeLinecap="round" />
              );
            }
          })}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {segments.map((seg, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }}></span>
              <span style={{ fontWeight: '600' }}>{seg.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>({seg.count})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render HTML Histogram by Category
  const renderCategoryHistogram = () => {
    const categories = ['Réseau', 'Sécurité', 'Système', 'Médical'];
    const counts = categories.map(cat => incidents.filter(i => i.category === cat).length);
    const maxVal = Math.max(...counts, 1);

    return (
      <div className="chart-bars-area" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '120px', padding: '10px 0' }}>
        {categories.map((cat, idx) => {
          const heightPct = (counts[idx] / maxVal) * 100;
          return (
            <div key={cat} className="chart-bar-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
              <div className="chart-tooltip" style={{ fontSize: '10px', fontWeight: 'bold' }}>{counts[idx]}</div>
              <div 
                className="bar-pillar" 
                style={{ 
                  height: `${heightPct}px`, 
                  width: '12px', 
                  backgroundColor: 'var(--primary-500)', 
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease'
                }} 
              />
              <span style={{ fontSize: '9px', fontWeight: '700', marginTop: '6px', color: 'var(--text-muted)' }}>{cat}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Sort incidents
  const getSortedIncidents = () => {
    const listCopy = [...incidents];
    return listCopy.sort((a, b) => {
      if (sortBy === 'createdAt_asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'createdAt_desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'priority_desc') {
        const priorities = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
      }
      return 0;
    });
  };

  // Pagination logic
  const sortedIncidents = getSortedIncidents();
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = sortedIncidents.slice(indexOfFirstIncident, indexOfLastIncident);
  const totalPages = Math.ceil(sortedIncidents.length / incidentsPerPage);

  // Authenticate wrapper
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top, #1e293b, #0f172a)', padding: '20px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', borderRadius: '16px', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div className="brand-icon" style={{ width: '48px', height: '48px', marginBottom: '16px' }}>
              <Activity className="text-white" size={24} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '4px' }}>IncidentFlow</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Plateforme Dynamique de Gestion d'Incidents</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#94a3b8' }}>Nom d'utilisateur ou Email</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="Ex: anas@netmar.com" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.5)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#94a3b8' }}>Mot de passe</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.5)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: '700', marginTop: '8px' }}>
              Se connecter (OIDC Keycloak)
            </button>
          </form>

          {/* Quick-select test accounts */}
          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '10px', textAlign: 'center', fontWeight: '700' }}>
              COMPTES DE TEST (SIMULATION)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {USERS.map(u => (
                <button 
                  key={u.id}
                  type="button" 
                  onClick={() => triggerQuickLogin(u.email)}
                  className="btn btn-secondary"
                  style={{ fontSize: '10.5px', padding: '6px', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', color: 'white', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  {u.firstName} ({getRoleName(u.role)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 1. SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <div className="brand-title">IncidentFlow</div>
            <div className="brand-subtitle">Gestion de Workflows</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${currentView === 'dashboard' && !selectedIncidentCode ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); setSelectedIncidentCode(null); }}
          >
            <span className="nav-label">
              <Activity size={18} />
              Dashboard
            </span>
          </button>
          
          <button 
            className={`nav-btn ${currentView === 'incidents' ? 'active' : ''}`}
            onClick={() => { setCurrentView('incidents'); setSelectedIncidentCode(null); }}
          >
            <span className="nav-label">
              <FileText size={18} />
              Gestion des Incidents
            </span>
          </button>
          
          <button 
            className={`nav-btn ${currentView === 'workflows' ? 'active' : ''}`}
            onClick={() => { setCurrentView('workflows'); setSelectedIncidentCode(null); }}
          >
            <span className="nav-label">
              <Layers size={18} />
              Paramètres Workflows
            </span>
          </button>

          {getRoleName(currentUser.role) === 'Administrateur' && (
            <button 
              className={`nav-btn ${currentView === 'users' ? 'active' : ''}`}
              onClick={() => { setCurrentView('users'); setSelectedIncidentCode(null); }}
            >
              <span className="nav-label">
                <Users size={18} />
                Gestion Utilisateurs
              </span>
            </button>
          )}
        </nav>

        {/* Priority KPI widgets */}
        <div className="sidebar-widget">
          <div className="widget-title">Sévérité Critique</div>
          <div className="widget-row">
            <span className="widget-label">
              <span className="widget-dot" style={{ backgroundColor: 'var(--critical-dot)' }}></span>
              Critique
            </span>
            <span className="widget-value">{incidents.filter(i => i.priority === 'Critical').length}</span>
          </div>
          <div className="widget-row">
            <span className="widget-label">
              <span className="widget-dot" style={{ backgroundColor: 'var(--high-dot)' }}></span>
              Élevée
            </span>
            <span className="widget-value">{incidents.filter(i => i.priority === 'High').length}</span>
          </div>
        </div>

        {/* Session Time Out banner */}
        <div style={{ padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: '#94a3b8' }}>
          <span>Session expire dans: <strong>{Math.floor(sessionTimeLeft / 60)}m {sessionTimeLeft % 60}s</strong></span>
        </div>

        <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{currentUser.name}</div>
            <div className="role-badge-pill" style={{ marginTop: '2px' }}>{getRoleName(currentUser.role)}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="icon-btn btn-secondary" 
            style={{ width: '28px', height: '28px', color: '#fca5a5', border: 'none' }}
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <main className="main-viewport">
        {/* TOPBAR HEADER */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-search-box">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher par titre/code..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
              />
            </div>
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); fetchIncidents(); }} className="btn btn-secondary btn-small">
                Effacer
              </button>
            )}
          </div>

          <div className="topbar-right">
            {/* Notification Bell */}
            <div className="notif-bell-container">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                <span className="bell-badge">{notifications.length}</span>
              </button>
              
              {showNotifications && (
                <div className="card" style={{ position: 'absolute', right: 0, top: '44px', width: '280px', zIndex: 60, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    Notifications Récentes
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      • {n.text} <span style={{ fontSize: '9px', opacity: 0.6 }}>({n.time})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User display with Dropdown */}
            <div className="user-profile-dropdown-container">
              <button 
                className="user-profile-menu"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className={`avatar-circle ${currentUser.avatarColor}`}>
                  {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{currentUser.name}</span>
                  <span className="profile-role">{getRoleName(currentUser.role)}</span>
                </div>
                <ChevronDown size={14} className="dropdown-arrow" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }} />
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <span className="user-name">{currentUser.name}</span>
                    <span className="user-email">{currentUser.email}</span>
                  </div>
                  
                  <button className="profile-dropdown-item" onClick={handleOpenEditProfile}>
                    <User size={14} />
                    <span>Modifier le profil</span>
                  </button>
                  
                  <button className="profile-dropdown-item" onClick={handleOpenAppSettings}>
                    <Settings size={14} />
                    <span>Paramètres</span>
                  </button>

                  <button className="profile-dropdown-item" onClick={() => { setShowHelpModal(true); setShowProfileDropdown(false); }}>
                    <HelpCircle size={14} />
                    <span>Aide & Support</span>
                  </button>

                  <div className="profile-dropdown-divider"></div>

                  <button className="profile-dropdown-item logout" onClick={() => { handleLogout(); setShowProfileDropdown(false); }}>
                    <LogOut size={14} />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="content-area">
          <div className="content-max-width">
            
            {/* Alert Messages Banner */}
            {errorMessage && (
              <div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} />
                  <span><strong>Erreur : </strong>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage("")} style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            {successMessage && (
              <div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac', color: '#166534', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} />
                  <span>{successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage("")} style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            {/* VIEW A: INCIDENT DETAIL */}
            {selectedIncidentCode && selectedIncident ? (
              <div className="animate-fade-in">
                <div className="page-header" style={{ border: 'none', marginBottom: '16px' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedIncidentCode(null)}>
                    <ArrowLeft size={16} />
                    Retour à la liste
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className={`badge badge-${selectedIncident.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedIncident.status}
                    </span>
                    <span className={`badge badge-category badge-${selectedIncident.category.toLowerCase()}`}>
                      {getCategoryIcon(selectedIncident.category)}
                      {selectedIncident.category}
                    </span>
                  </div>
                </div>

                {/* SLA Warning Banner */}
                {selectedIncident.status !== 'Résolu' && selectedIncident.status !== 'Clôturé' && selectedIncident.slaDueAt && (() => {
                  const dueTime = new Date(selectedIncident.slaDueAt).getTime();
                  const diffMs = dueTime - new Date().getTime();
                  if (diffMs < 0) {
                    return (
                      <div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700' }}>
                        <AlertTriangle size={16} />
                        <span>Attention : Le délai de résolution SLA pour cet incident a été dépassé. Action immédiate requise.</span>
                      </div>
                    );
                  } else if (diffMs <= 30 * 60 * 1000) {
                    return (
                      <div className="card" style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74', color: '#c2410c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700' }}>
                        <Clock size={16} className="pulse-active-glow" style={{ borderRadius: '50%' }} />
                        <span>Échéance proche : Cet incident doit être résolu rapidement. Il reste moins de 30 minutes.</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="detail-layout">
                  {/* Left Column: Details & Actions */}
                  <div className="card detail-card">
                    <div className="detail-header">
                      <div>
                        <div className="detail-code">{selectedIncident.incidentCode}</div>
                        <h1 className="detail-title">{selectedIncident.title}</h1>
                      </div>
                    </div>

                    <div className="detail-meta-grid">
                      <div className="meta-item">
                        <span className="meta-label">Auteur</span>
                        <span className="meta-val">
                          <User size={14} className="text-slate-400" />
                          {selectedIncident.author.name}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Assigné à</span>
                        <span className="meta-val">
                          <User size={14} className="text-slate-400" />
                          {selectedIncident.assignedTo ? selectedIncident.assignedTo.name : 'Non assigné'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Priorité</span>
                        <span className="meta-val">
                          <span className="widget-dot" style={{ backgroundColor: getPriorityColor(selectedIncident.priority) }} />
                          {selectedIncident.priority}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Dernière mise à jour</span>
                        <span className="meta-val">
                          {formatDate(selectedIncident.updatedAt)}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">SLA / Échéance</span>
                        <span className="meta-val">
                          {renderSlaBadge(selectedIncident)}
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <div className="detail-desc-block">{selectedIncident.description}</div>
                    </div>

                    {/* Workflow Transitions Panel */}
                    {selectedIncidentWorkflow && (
                      <div className="workflow-actions-panel">
                        <h3 className="widget-title" style={{ color: 'var(--text-main)', fontSize: '11px', marginBottom: '8px' }}>
                          Moteur de Workflow : Actions Disponibles
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Transitions autorisées pour l'état <strong>{selectedIncident.status}</strong> :
                        </p>
                        
                        <div className="actions-buttons-container">
                          {selectedIncidentWorkflow.transitions
                            .filter(t => t.fromState.toLowerCase() === selectedIncident.status.toLowerCase())
                            .map((t, idx) => {
                              const hasRole = !t.roleRequired || getRoleName(currentUser.role).toLowerCase() === t.roleRequired.toLowerCase();
                              return (
                                <button
                                  key={idx}
                                  className="btn btn-primary btn-small"
                                  style={{
                                    background: hasRole ? 'linear-gradient(135deg, #1d4ed8, #1e40af)' : '#e2e8f0',
                                    color: hasRole ? '#ffffff' : '#94a3b8',
                                    border: hasRole ? 'none' : '1px solid #cbd5e1',
                                    cursor: hasRole ? 'pointer' : 'not-allowed'
                                  }}
                                  onClick={() => handleTransitionClick(t)}
                                  disabled={!hasRole}
                                  title={t.roleRequired ? `Requis: ${t.roleRequired}` : ''}
                                >
                                  Passer à: {t.toState}
                                  {t.roleRequired && <span style={{ fontSize: '9px', opacity: 0.8 }}> ({t.roleRequired})</span>}
                                </button>
                              );
                            })
                          }

                          {selectedIncidentWorkflow.transitions.filter(t => t.fromState.toLowerCase() === selectedIncident.status.toLowerCase()).length === 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Aucune transition disponible depuis cet état. L'incident est à son étape finale.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Collaborative Pane (History, Comments, Attachments) */}
                  <div className="collaborative-pane">
                    
                    {/* Timeline History */}
                    <div className="card" style={{ padding: '20px' }}>
                      <h3 className="widget-title">Journal d'historique</h3>
                      <div className="timeline-list">
                        {selectedIncident.history.map((log, idx) => (
                          <div className="timeline-item" key={idx}>
                            <div className="timeline-dot" />
                            <div className="timeline-action">{log.action}</div>
                            <div className="timeline-meta">Par {log.username} • {formatDate(log.date)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comments section */}
                    <div className="card" style={{ padding: '20px' }}>
                      <h3 className="widget-title">Commentaires ({selectedIncident.comments.length})</h3>
                      <div className="comments-section">
                        {selectedIncident.comments.map((comment, idx) => (
                          <div className="comment-card" key={idx}>
                            <div className="comment-header">
                              <span className="comment-author">
                                <span className={`avatar-circle ${comment.author.avatarColor}`} style={{ width: '18px', height: '18px', fontSize: '8px' }}>
                                  {comment.author.name.split(' ').map(n => n[0]).join('')}
                                </span>
                                {comment.author.name}
                              </span>
                              <span className="comment-date">{formatDate(comment.date)}</span>
                            </div>
                            <div className="comment-body">{comment.content}</div>
                          </div>
                        ))}
                        
                        {selectedIncident.comments.length === 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                            Aucun commentaire pour le moment.
                          </div>
                        )}
                      </div>

                      <form className="comment-input-box" onSubmit={handleAddCommentSubmit}>
                        <textarea 
                          placeholder="Écrire un commentaire collaboratif..."
                          className="comment-textarea"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>
                          <Send size={12} />
                          Envoyer
                        </button>
                      </form>
                    </div>

                    {/* Attachments Section */}
                    <div className="card" style={{ padding: '20px' }}>
                      <h3 className="widget-title">Pièces Jointes ({selectedIncident.attachments.length})</h3>
                      
                      <div className="attachments-list">
                        {selectedIncident.attachments.map((file, idx) => (
                          <div className="attachment-item" key={idx}>
                            <div className="attachment-info-box">
                              <Paperclip size={14} className="file-icon" />
                              <div>
                                <a 
                                  href={`${API_BASE}/incidents/attachments/${file.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="file-name"
                                >
                                  {file.filename}
                                </a>
                                <div className="file-size">{file.fileSize}</div>
                              </div>
                            </div>
                            <a 
                              href={`${API_BASE}/incidents/attachments/${file.id}`}
                              className="icon-btn btn-small"
                              title="Télécharger"
                              download
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ))}

                        {selectedIncident.attachments.length === 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                            Aucune pièce jointe.
                          </div>
                        )}
                      </div>

                      <label className="upload-zone" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Paperclip size={14} />
                        <span>Cliquer pour téléverser un fichier log/pièce</span>
                        <input 
                          type="file" 
                          style={{ display: 'none' }} 
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'dashboard' ? (
              // VIEW B: DASHBOARD
              <div className="animate-fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Tableau de bord</h1>
                    <p className="page-subtitle">Suivi en temps réel et résolution des incidents par catégorie.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} />
                    Déclarer un incident
                  </button>
                </div>

                {/* KPI Grid */}
                <div className="kpi-grid">
                  <div className="kpi-card" onClick={() => { setCurrentView('incidents'); setStatusFilter('Tous'); }}>
                    <div className="kpi-title">Incidents Totaux</div>
                    <div className="kpi-value">{incidents.length}</div>
                    <span className="badge badge-normal" style={{ marginTop: '8px' }}>Global</span>
                  </div>
                  <div className="kpi-card" onClick={() => { setCurrentView('incidents'); setStatusFilter('Nouveau'); }}>
                    <div className="kpi-title">Nouveaux</div>
                    <div className="kpi-value">{incidents.filter(i => i.status === 'Nouveau').length}</div>
                    <span className="badge badge-normal" style={{ marginTop: '8px', backgroundColor: 'var(--critical-bg)', color: 'var(--critical-text)' }}>À traiter</span>
                  </div>
                  <div className="kpi-card" onClick={() => { setCurrentView('incidents'); setStatusFilter('En cours'); }}>
                    <div className="kpi-title">En cours</div>
                    <div className="kpi-value">{incidents.filter(i => i.status === 'En cours').length}</div>
                    <span className="badge badge-normal" style={{ marginTop: '8px', backgroundColor: '#e0effe', color: 'var(--primary-700)' }}>Résolution</span>
                  </div>
                  <div className="kpi-card" onClick={() => { setCurrentView('incidents'); setStatusFilter('Résolu'); }}>
                    <div className="kpi-title">Résolus</div>
                    <div className="kpi-value">{incidents.filter(i => i.status === 'Résolu').length}</div>
                    <span className="badge badge-normal" style={{ marginTop: '8px', backgroundColor: '#f0fdf4', color: '#166534' }}>Succès</span>
                  </div>
                </div>

                {/* Graphs / Statistics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', marginTop: '24px' }}>
                  {/* Donut chart by Priorities */}
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="widget-title" style={{ fontSize: '13px', color: 'var(--text-main)' }}>Breakdown des Priorités</h3>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                      {renderPriorityDonut()}
                    </div>
                  </div>

                  {/* Histogram chart by Categories */}
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="widget-title" style={{ fontSize: '13px', color: 'var(--text-main)' }}>Incidents par Catégorie</h3>
                    <div style={{ flexGrow: 1 }}>
                      {renderCategoryHistogram()}
                    </div>
                  </div>
                </div>

                {/* Recent Incidents Table */}
                <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="widget-title" style={{ fontSize: '13px', color: 'var(--text-main)' }}>Incidents Récents</h3>
                    <button className="btn btn-secondary btn-small" onClick={() => setCurrentView('incidents')}>
                      Voir tous les incidents
                    </button>
                  </div>
                  <div className="datagrid-container">
                    <table className="datagrid">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Titre</th>
                          <th>Catégorie</th>
                          <th>Priorité</th>
                          <th>Statut</th>
                          <th>SLA / Échéance</th>
                          <th>Auteur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.slice(0, 3).map(inc => (
                          <tr key={inc.id} onClick={() => handleSelectIncident(inc.incidentCode)} style={{ cursor: 'pointer' }}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{inc.incidentCode}</td>
                            <td style={{ fontWeight: '700' }}>{inc.title}</td>
                            <td>
                              <span className="badge badge-normal" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                {getCategoryIcon(inc.category)}
                                {inc.category}
                              </span>
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                                <span className="widget-dot" style={{ backgroundColor: getPriorityColor(inc.priority) }} />
                                {inc.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${inc.status.toLowerCase().replace(' ', '-')}`}>
                                {inc.status}
                              </span>
                            </td>
                            <td>
                              {renderSlaBadge(inc)}
                            </td>
                            <td>{inc.author.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : currentView === 'incidents' ? (
              // VIEW C: INCIDENTS INDEPENDENT LIST PAGE
              <div className="animate-fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Gestion des Incidents</h1>
                    <p className="page-subtitle">Recherchez, filtrez et exportez les rapports d'incidents déclarés.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={handleExportCSV} title="Exporter au format CSV pour Excel">
                      Exporter Excel (CSV)
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportPDF} title="Générer un rapport textuel des incidents">
                      Générer Rapport PDF
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                      <Plus size={16} />
                      Déclarer un incident
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="filter-panel" style={{ backgroundColor: '#e8f1fa', borderRadius: '12px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div className="filter-item" style={{ minWidth: '120px' }}>
                    <label>Catégorie</label>
                    <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="Tous">Tous</option>
                      <option value="Réseau">Réseau</option>
                      <option value="Sécurité">Sécurité</option>
                      <option value="Système">Système</option>
                      <option value="Médical">Médical</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '120px' }}>
                    <label>Priorité</label>
                    <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                      <option value="Tous">Tous</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '120px' }}>
                    <label>Statut</label>
                    <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="Tous">Tous</option>
                      <option value="Nouveau">Nouveau</option>
                      <option value="Assigné">Assigné</option>
                      <option value="En cours">En cours</option>
                      <option value="Résolu">Résolu</option>
                      <option value="Clôturé">Clôturé</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '150px' }}>
                    <label>Trier par</label>
                    <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="createdAt_desc">Date (Récent)</option>
                      <option value="createdAt_asc">Date (Ancien)</option>
                      <option value="priority_desc">Sévérité</option>
                    </select>
                  </div>
                </div>

                {/* Incidents Table list */}
                <div className="card" style={{ padding: '20px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Chargement en cours...</div>
                  ) : (
                    <>
                      <div className="datagrid-container">
                        <table className="datagrid">
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Titre</th>
                              <th>Catégorie</th>
                              <th>Priorité</th>
                              <th>Statut</th>
                              <th>SLA / Échéance</th>
                              <th>Auteur</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentIncidents.map(inc => (
                              <tr key={inc.id} onClick={() => handleSelectIncident(inc.incidentCode)} style={{ cursor: 'pointer' }}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{inc.incidentCode}</td>
                                <td style={{ fontWeight: '700' }}>
                                  {inc.title}
                                  {inc.attachments && inc.attachments.length > 0 && (
                                    <Paperclip size={12} className="text-slate-400" style={{ marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle' }} title={`${inc.attachments.length} pièce(s) jointe(s)`} />
                                  )}
                                </td>
                                <td>
                                  <span className="badge badge-normal" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                    {getCategoryIcon(inc.category)}
                                    {inc.category}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                                    <span className="widget-dot" style={{ backgroundColor: getPriorityColor(inc.priority) }} />
                                    {inc.priority}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge badge-${inc.status.toLowerCase().replace(' ', '-')}`}>
                                    {inc.status}
                                  </span>
                                </td>
                                <td>
                                  {renderSlaBadge(inc)}
                                </td>
                                <td>{inc.author.name}</td>
                                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(inc.createdAt)}</td>
                              </tr>
                            ))}
                            {currentIncidents.length === 0 && (
                              <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Aucun incident trouvé.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                          <button 
                            className="btn btn-secondary btn-small" 
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Précédent
                          </button>
                          <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', padding: '0 8px' }}>
                            Page {currentPage} sur {totalPages}
                          </span>
                          <button 
                            className="btn btn-secondary btn-small" 
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Suivant
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : currentView === 'workflows' ? (
              // VIEW D: WORKFLOW CONFIGURATION & CUSTOMIZATION (Epic 3)
              <div className="animate-fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers className="text-primary-600" />
                      Gestion des Workflows Dynamiques
                    </h1>
                    <p className="page-subtitle">Configurez et personnalisez les états de cycle de vie et les transitions par catégorie d'incidents.</p>
                  </div>
                  <button onClick={handleSaveWorkflowGlobally} className="btn btn-primary">
                    Enregistrer les Modifications
                  </button>
                </div>

                {/* Category Selection Tabs */}
                <div className="wf-category-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  {workflows.map(wf => (
                    <button 
                      key={wf.id}
                      onClick={() => setSelectedWorkflowId(wf.id)}
                      className={`wf-tab ${wf.id === selectedWorkflowId ? 'active' : ''}`}
                      style={{
                        padding: '10px 16px',
                        background: wf.id === selectedWorkflowId ? 'var(--primary-50)' : 'transparent',
                        color: wf.id === selectedWorkflowId ? 'var(--primary-700)' : 'var(--text-muted)',
                        border: 'none',
                        borderBottom: wf.id === selectedWorkflowId ? '2px solid var(--primary-500)' : 'none',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}
                    >
                      {wf.category} ({wf.active ? 'Actif' : 'Inactif'})
                    </button>
                  ))}
                </div>

                {activeWorkflow && (
                  <div className="workflow-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left Column: General & States Edit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* General Parameters */}
                      <div className="card" style={{ padding: '24px' }}>
                        <h3 className="widget-title" style={{ marginBottom: '16px' }}>Paramètres du Workflow</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                          <div style={{ flexGrow: 1 }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nom du processus</label>
                            <input 
                              type="text" 
                              className="form-control"
                              value={activeWorkflow.name}
                              onChange={(e) => {
                                const updated = { ...activeWorkflow, name: e.target.value };
                                setActiveWorkflow(updated);
                                setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
                              }}
                            />
                          </div>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ height: '38px', marginTop: '14px', fontWeight: 'bold' }}
                            onClick={handleToggleWorkflowActive}
                          >
                            Statut : {activeWorkflow.active ? 'Actif' : 'Inactif'}
                          </button>
                        </div>
                      </div>

                      {/* States Manager */}
                      <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <h3 className="widget-title">Workspace des États</h3>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{activeWorkflow.states.length} étapes</span>
                        </div>

                        {/* States lists */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {activeWorkflow.states.map(state => {
                            const isSystem = ["Nouveau", "Clôturé"].includes(state.name);
                            return (
                              <div key={state.id || state.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div>
                                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID : {state.name} {isSystem && '(Système)'}</span>
                                  <input 
                                    type="text" 
                                    value={state.label}
                                    onChange={(e) => {
                                      const updatedStates = activeWorkflow.states.map(s => s.name === state.name ? { ...s, label: e.target.value } : s);
                                      const updatedWf = { ...activeWorkflow, states: updatedStates };
                                      setActiveWorkflow(updatedWf);
                                      setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
                                    }}
                                    style={{ border: 'none', borderBottom: '1px dashed #cbd5e1', outline: 'none', fontWeight: 'bold', fontSize: '13px', display: 'block', backgroundColor: 'transparent', marginTop: '4px' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {/* Color picker presets */}
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <span onClick={() => handleUpdateStateColor(state.name, 'bg-red-50 text-red-600 border-red-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fca5a5' }} />
                                    <span onClick={() => handleUpdateStateColor(state.name, 'bg-amber-50 text-amber-600 border-amber-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fde047' }} />
                                    <span onClick={() => handleUpdateStateColor(state.name, 'bg-blue-50 text-blue-600 border-blue-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#93c5fd' }} />
                                    <span onClick={() => handleUpdateStateColor(state.name, 'bg-emerald-50 text-emerald-600 border-emerald-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#86efac' }} />
                                    <span onClick={() => handleUpdateStateColor(state.name, 'bg-slate-50 text-slate-600 border-slate-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-secondary btn-small"
                                    onClick={() => handleToggleStateActive(state.name)}
                                  >
                                    {state.active ? 'Actif' : 'Inactif'}
                                  </button>
                                  <button 
                                    type="button"
                                    className="icon-btn btn-secondary"
                                    onClick={() => handleDeleteStateFromWorkflow(state.name)}
                                    style={{ color: '#ef4444', border: 'none' }}
                                    disabled={isSystem}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add state inline form */}
                        <form onSubmit={handleAddStateToWorkflow} style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Ajouter un État</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '9px' }}>Clé technique ID</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ex: Attente"
                                value={newStateId}
                                onChange={(e) => setNewStateId(e.target.value)}
                                required 
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '9px' }}>Libellé Affichage</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ex: En attente"
                                value={newStateLabel}
                                onChange={(e) => setNewStateLabel(e.target.value)}
                                required 
                              />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Ajouter l'état</button>
                        </form>
                      </div>
                    </div>

                    {/* Right Column: Transitions Edit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Transitions Rules list */}
                      <div className="card" style={{ padding: '24px' }}>
                        <h3 className="widget-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Transitions Autorisées</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeWorkflow.transitions.map((t, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                                  <span>{t.fromState}</span>
                                  <span>➔</span>
                                  <span style={{ color: 'var(--primary-600)' }}>{t.toState}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {t.roleRequired ? `🔑 Rôle requis : ${t.roleRequired}` : '🔓 Ouvert à tous'}
                                  {t.requiresComment && ' • 💬 Commentaire obligatoire'}
                                </div>
                              </div>
                              <button 
                                type="button"
                                className="icon-btn btn-secondary"
                                onClick={() => handleDeleteTransitionFromWorkflow(t.fromState, t.toState)}
                                style={{ color: '#ef4444', border: 'none' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          {activeWorkflow.transitions.length === 0 && (
                            <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '12px', padding: '20px', color: 'var(--text-muted)' }}>
                              Aucune transition configurée.
                            </div>
                          )}
                        </div>

                        {/* Add transition inline form */}
                        <form onSubmit={handleAddTransitionToWorkflow} style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Définir une Transition</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '9px' }}>État Origine</label>
                              <select className="form-control" value={newTransFrom} onChange={(e) => setNewTransFrom(e.target.value)} required style={{ background: 'white' }}>
                                <option value="">Choisir...</option>
                                {activeWorkflow.states.filter(s => s.active).map(s => (
                                  <option key={s.name} value={s.name}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '9px' }}>État Destination</label>
                              <select className="form-control" value={newTransTo} onChange={(e) => setNewTransTo(e.target.value)} required style={{ background: 'white' }}>
                                <option value="">Choisir...</option>
                                {activeWorkflow.states.filter(s => s.active).map(s => (
                                  <option key={s.name} value={s.name}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '9px' }}>Rôle Autorisé</label>
                            <select className="form-control" value={newTransRole} onChange={(e) => setNewTransRole(e.target.value)} style={{ background: 'white' }}>
                              <option value="">Tous les utilisateurs</option>
                              <option value="Administrateur">Administrateur</option>
                              <option value="Responsable">Responsable</option>
                              <option value="Opérateur">Opérateur</option>
                              <option value="Opérateur médical">Opérateur médical</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                            <input 
                              type="checkbox" 
                              id="check-requires-comment" 
                              checked={newTransRequiresComment}
                              onChange={(e) => setNewTransRequiresComment(e.target.checked)}
                              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                            />
                            <label htmlFor="check-requires-comment" style={{ marginBottom: 0, fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>Exiger un commentaire obligatoire</label>
                          </div>
                          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end', width: '100%', justifyContent: 'center' }}>Autoriser la Transition</button>
                        </form>
                      </div>

                      {/* Graphic Visualizer help */}
                      <div className="card" style={{ padding: '24px' }}>
                        <h3 className="widget-title" style={{ marginBottom: '10px' }}>Aperçu Visuel du Processus</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {activeWorkflow.states.filter(s => s.active).map(state => {
                            const destinations = activeWorkflow.transitions.filter(t => t.fromState === state.name).map(t => t.toState);
                            return (
                              <div key={state.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', fontSize: '11.5px' }}>
                                <span className={`badge ${state.colorClass}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{state.label}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                  {destinations.length === 0 ? '🏁 État final' : `➔ ${destinations.join(', ')}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : currentView === 'users' ? (
              // VIEW E: USER MANAGEMENT PAGE (Epic 1.2)
              <div className="animate-fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Gestion des Utilisateurs</h1>
                    <p className="page-subtitle">Gérez les comptes, attribuez des rôles et administrez les accès.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowUserCreateModal(true)}>
                    <Plus size={16} />
                    Nouvel Utilisateur
                  </button>
                </div>

                {/* Filters / Users list */}
                <div className="card" style={{ padding: '20px' }}>
                  <div className="datagrid-container">
                    <table className="datagrid">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>Téléphone</th>
                          <th>Département</th>
                          <th>Poste</th>
                          <th>Rôle</th>
                          <th>Statut (Keycloak)</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className={`avatar-circle ${u.avatarColor}`} style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                                  {u.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span style={{ fontWeight: '700' }}>{u.name}</span>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>{u.telephone || '-'}</td>
                            <td>{u.department || '-'}</td>
                            <td>{u.post || '-'}</td>
                            <td><span className="role-badge-pill">{u.role ? u.role.name : 'Aucun'}</span></td>
                            <td>
                              <span className={`badge ${u.active ? 'badge-resolu' : 'badge-normal'}`}>
                                {u.active ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button 
                                  className="icon-btn btn-secondary" 
                                  onClick={() => {
                                    setEditingUser({
                                      id: u.id,
                                      firstName: u.firstName || u.name.split(' ')[0] || '',
                                      lastName: u.lastName || u.name.split(' ')[1] || '',
                                      email: u.email,
                                      telephone: u.telephone || '',
                                      department: u.department || '',
                                      post: u.post || '',
                                      roleId: u.role ? String(u.role.id) : '3',
                                      active: u.active
                                    });
                                    setShowUserEditModal(true);
                                  }}
                                  style={{ width: '28px', height: '28px', border: 'none' }}
                                  title="Modifier"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  className="icon-btn btn-secondary" 
                                  onClick={() => handleUserDelete(u.id, u.name)}
                                  style={{ width: '28px', height: '28px', color: '#ef4444', border: 'none' }}
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </main>

      {/* ==========================================
          MODALS & DIALOGS PORTALS
          ========================================== */}
      
      {/* Modal 1: Create Incident Modal (US-INC-001) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Déclarer un nouvel incident</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateIncidentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Titre de l'incident *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Ex: Panne de commutateur réseau local"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <select 
                      className="form-control" 
                      value={newIncident.category}
                      onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                      style={{ background: 'white' }}
                    >
                      <option value="Réseau">Réseau</option>
                      <option value="Sécurité">Sécurité</option>
                      <option value="Système">Système</option>
                      <option value="Médical">Médical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priorité *</label>
                    <select 
                      className="form-control" 
                      value={newIncident.priority}
                      onChange={(e) => setNewIncident({ ...newIncident, priority: e.target.value })}
                      style={{ background: 'white' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Assigner à (Optionnel)</label>
                  <select 
                    className="form-control" 
                    value={newIncident.assignedToId}
                    onChange={(e) => setNewIncident({ ...newIncident, assignedToId: e.target.value })}
                    style={{ background: 'white' }}
                  >
                    <option value="">Affectation automatique par le système</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role ? u.role.name : ''})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags ou mots-clés (Séparés par des virgules)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: switch, hardware, zone-a"
                    value={newIncident.tags}
                    onChange={(e) => setNewIncident({ ...newIncident, tags: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description détaillée *</label>
                  <textarea 
                    className="form-control" 
                    required 
                    rows="4" 
                    placeholder="Veuillez décrire le problème rencontré..."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Pièce jointe (facultatif)</label>
                  <label className="upload-zone" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <Paperclip size={20} style={{ marginBottom: '8px', color: 'var(--primary-500)' }} />
                    <span style={{ fontWeight: 'bold' }}>{newIncidentFile ? `Fichier sélectionné : ${newIncidentFile.name}` : "Glisser-déposer ou cliquer pour téléverser"}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Fichiers logs, captures d'écran (.txt, .log, .png, .jpg)</span>
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setNewIncidentFile(e.target.files[0])}
                    />
                  </label>
                  {newIncidentFile && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-small" 
                      onClick={() => setNewIncidentFile(null)} 
                      style={{ marginTop: '8px', color: '#ef4444', width: 'fit-content' }}
                    >
                      Supprimer la pièce jointe
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Déclarer l'incident</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Comment Required Modal for Transitions (US-INC-005) */}
      {showTransitionModal && targetTransition && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Justificatif de transition</h3>
              <button className="modal-close-btn" onClick={() => setShowTransitionModal(false)}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); executeTransition(targetTransition.toState, transitionComment); }}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    La transition de <strong>{selectedIncident.status}</strong> vers <strong>{targetTransition.toState}</strong> requiert obligatoirement un motif.
                  </span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Commentaire d'audit *</label>
                  <textarea 
                    className="form-control" 
                    required 
                    rows="3" 
                    placeholder="Saisissez le motif de cette transition..."
                    value={transitionComment}
                    onChange={(e) => setTransitionComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransitionModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Valider la transition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create User Modal (US-USER-001) */}
      {showUserCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Créer un profil utilisateur</h3>
              <button className="modal-close-btn" onClick={() => setShowUserCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUserCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Prénom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="Sophie"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="Martin"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    placeholder="sophie.martin@netmar.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Téléphone de garde</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="+33 6 12 34 56 78"
                    value={newUserForm.telephone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, telephone: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Département</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Sécurité"
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Poste / Fonction</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ingénieur Sécurité"
                      value={newUserForm.post}
                      onChange={(e) => setNewUserForm({ ...newUserForm, post: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Rôle (Habilitations)</label>
                  <select 
                    className="form-control" 
                    value={newUserForm.roleId} 
                    onChange={(e) => setNewUserForm({ ...newUserForm, roleId: e.target.value })}
                    style={{ background: 'white' }}
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Edit User Modal */}
      {showUserEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Modifier le profil utilisateur</h3>
              <button className="modal-close-btn" onClick={() => { setShowUserEditModal(false); setEditingUser(null); }}>✕</button>
            </div>
            <form onSubmit={handleUserEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Prénom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={editingUser.lastName}
                      onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Téléphone de garde</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editingUser.telephone}
                    onChange={(e) => setEditingUser({ ...editingUser, telephone: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Département</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUser.department}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Poste / Fonction</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUser.post}
                      onChange={(e) => setEditingUser({ ...editingUser, post: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Rôle</label>
                  <select 
                    className="form-control" 
                    value={editingUser.roleId} 
                    onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                    style={{ background: 'white' }}
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                  <input 
                    type="checkbox" 
                    id="edit-user-active"
                    checked={editingUser.active}
                    onChange={(e) => setEditingUser({ ...editingUser, active: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="edit-user-active" style={{ marginBottom: 0, fontWeight: 'bold', cursor: 'pointer' }}>Compte actif (Autoriser connexion Keycloak)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUserEditModal(false); setEditingUser(null); }}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Profile */}
      {showEditProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <span className="modal-title">Modifier le profil</span>
              <button className="modal-close-btn" onClick={() => setShowEditProfileModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditProfileSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Adresse e-mail *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Poste occupé</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profileForm.post}
                      onChange={(e) => setProfileForm({ ...profileForm, post: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Département</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px' }}>Couleur de l'avatar</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {[
                      { key: 'bg-blue-600', color: '#2563eb', label: 'Bleu' },
                      { key: 'bg-purple-600', color: '#9333ea', label: 'Violet' },
                      { key: 'bg-emerald-600', color: '#059669', label: 'Vert' },
                      { key: 'bg-red-600', color: '#dc2626', label: 'Rouge' },
                      { key: 'bg-indigo-600', color: '#4f46e5', label: 'Indigo' }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatarColor: item.key })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          border: profileForm.avatarColor === item.key ? '3px solid #000000' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          transition: 'transform 0.1s',
                          transform: profileForm.avatarColor === item.key ? 'scale(1.1)' : 'none'
                        }}
                        title={item.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Application Settings */}
      {showAppSettingsModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title">Paramètres de l'application</span>
              <button className="modal-close-btn" onClick={() => setShowAppSettingsModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAppSettingsSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Durée de la session *</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: 'white' }}
                    value={appSettingsForm.sessionDuration}
                    onChange={(e) => setAppSettingsForm({ ...appSettingsForm, sessionDuration: e.target.value })}
                  >
                    <option value="300">5 minutes</option>
                    <option value="600">10 minutes (Par défaut)</option>
                    <option value="1800">30 minutes</option>
                    <option value="3600">1 heure</option>
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                    Le temps après lequel l'utilisateur est déconnecté automatiquement en cas d'inactivité.
                  </small>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: '600' }}>Notifications</label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="setting-notif-enable"
                      checked={appSettingsForm.enableNotifications}
                      onChange={(e) => setAppSettingsForm({ ...appSettingsForm, enableNotifications: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="setting-notif-enable" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '12px' }}>
                      Activer les notifications du système
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="setting-notif-sound"
                      checked={appSettingsForm.notificationSound}
                      onChange={(e) => setAppSettingsForm({ ...appSettingsForm, notificationSound: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="setting-notif-sound" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '12px' }}>
                      Émettre un son lors d'une notification
                    </label>
                  </div>
                </div>

                <div className="profile-dropdown-divider" style={{ margin: '8px 0' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="setting-maintenance"
                    checked={appSettingsForm.maintenanceMode}
                    onChange={(e) => setAppSettingsForm({ ...appSettingsForm, maintenanceMode: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="setting-maintenance" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '12px', color: '#b91c1c', fontWeight: 'bold' }}>
                    Mode Maintenance (Simulation)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAppSettingsModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Help & Support */}
      {showHelpModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title">Aide & Support - IncidentFlow</span>
              <button className="modal-close-btn" onClick={() => setShowHelpModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.5' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  marginBottom: '10px'
                }}>
                  <Shield size={24} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--primary-900)' }}>IncidentFlow Pro v1.0.0</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Système de Gestion d'Incidents avec Keycloak</p>
              </div>

              <div>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Rôles et Habilitations</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', margin: 0 }}>
                  Chaque utilisateur dispose de droits spécifiques selon son rôle (Administrateur, Responsable, Opérateur). Certaines transitions de tickets ou accès aux utilisateurs nécessitent des droits d'administration.
                </p>
              </div>

              <div>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Mode Hors-Ligne & Keycloak</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', margin: 0 }}>
                  Ce frontend se connecte à Keycloak pour la gestion d'identité et gère une session utilisateur sécurisée. Pour toute réclamation technique, contactez le support informatique.
                </p>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
                <strong>Support technique :</strong> support@incidentflow.netmar.com<br />
                <strong>Documentation :</strong> wiki.incidentflow.internal
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setShowHelpModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
