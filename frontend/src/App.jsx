import { useState, useEffect } from 'react';
import { 
  Shield, Activity, FileText, AlertTriangle, CheckCircle, Clock, 
  Search, User, Plus, X, Bell, Paperclip, Download, Send, 
  Globe, Cpu, Stethoscope, ArrowLeft, Eye, EyeOff, RefreshCw, Layers,
  Lock, LogOut, Users, Trash2, Edit3, Settings, AlertCircle,
  ChevronDown, HelpCircle, MessageSquare, PlusCircle, UserPlus, FileUp
} from 'lucide-react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

const USERS = [
  { id: 1, name: "Anas Haddou", firstName: "Anas", lastName: "Haddou", email: "anas@netmar.com", role: "Administrateur", department: "Informatique", post: "Administrateur Système", avatarColor: "bg-blue-600" },
  { id: 2, name: "Sophie Martin", firstName: "Sophie", lastName: "Martin", email: "sophie.m@netmar.com", role: "Responsable", department: "Sécurité", post: "Responsable SSI", avatarColor: "bg-purple-600" },
  { id: 3, name: "Marie Laurent", firstName: "Marie", lastName: "Laurent", email: "marie.l@netmar.com", role: "Opérateur", department: "Support client", post: "Opératrice Réseau", avatarColor: "bg-emerald-600" },
  { id: 4, name: "Dr. Jean Robert", firstName: "Jean", lastName: "Robert", email: "jean.r@netmar.com", role: "Opérateur médical", department: "Urgences médicales", post: "Médecin Coordinateur", avatarColor: "bg-red-600" }
];

const getInitialNodes = (states) => {
  if (!states) return [];
  return states.map((state, index) => {
    const isNouveau = state.name.toLowerCase() === 'nouveau';
    const isCloture = state.name.toLowerCase() === 'clôturé' || state.name.toLowerCase() === 'cloture';
    
    let nodeType = 'default';
    if (isNouveau) nodeType = 'input';
    else if (isCloture) nodeType = 'output';

    let x = 250;
    let y = 150;
    if (isNouveau) {
      x = 50;
      y = 150;
    } else if (isCloture) {
      x = 580;
      y = 150;
    } else {
      const others = states.filter(s => {
        const name = s.name.toLowerCase();
        return name !== 'nouveau' && name !== 'clôturé' && name !== 'cloture';
      });
      const idx = others.findIndex(o => o.name === state.name);
      x = 220 + (idx * 160);
      y = 60 + (idx % 2 * 160);
    }
    
    return {
      id: state.name,
      type: nodeType,
      data: { label: `${state.label} (${state.name})` },
      position: { x, y },
      style: {
        background: state.active ? '#f8fafc' : '#e2e8f0',
        color: '#0f172a',
        border: '2px solid ' + (isNouveau ? '#10b981' : isCloture ? '#6366f1' : '#3b82f6'),
        borderRadius: '8px',
        padding: '10px',
        fontWeight: 'bold',
        fontSize: '11px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        width: 140
      }
    };
  });
};

const getInitialEdges = (transitions) => {
  if (!transitions) return [];
  return transitions.map((t, idx) => ({
    id: `e-${t.fromState}-${t.toState}`,
    source: t.fromState,
    target: t.toState,
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#3b82f6'
    },
    label: t.roleRequired ? `🔑 ${t.roleRequired}` : ''
  }));
};

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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
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
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    return parseInt(localStorage.getItem('itemsPerPage') || '5');
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    return parseInt(localStorage.getItem('autoRefreshInterval') || '0');
  });
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
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
    maintenanceMode: false,
    itemsPerPage: '5',
    autoRefreshInterval: '0',
    themeMode: 'light'
  });

  // Navigation
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'incidents', 'workflows', 'users'
  const [selectedIncidentCode, setSelectedIncidentCode] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedIncidentWorkflow, setSelectedIncidentWorkflow] = useState(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isDraggingCreate, setIsDraggingCreate] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [editingAttachmentId, setEditingAttachmentId] = useState(null);
  const [editingAttachmentName, setEditingAttachmentName] = useState("");
  const [commentTab, setCommentTab] = useState('write');
  const [tickerTime, setTickerTime] = useState(Date.now());
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState("");
  const [commandPaletteSelectedIndex, setCommandPaletteSelectedIndex] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [editingCommentTab, setEditingCommentTab] = useState('write');
  
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
  const incidentsPerPage = itemsPerPage;
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);
  
  // User Filtering & Search
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [roleUserFilter, setRoleUserFilter] = useState('Tous');
  
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIncidentForm, setEditIncidentForm] = useState({
    title: '',
    description: '',
    category: 'Réseau',
    priority: 'Medium',
    assignedToId: ''
  });
  
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
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'textual'

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Apply theme class to document element
  useEffect(() => {
    document.documentElement.className = '';
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else if (themeMode === 'glass') {
      document.documentElement.classList.add('glass-theme');
    }
  }, [themeMode]);

  // Periodic auto-refresh for incidents
  useEffect(() => {
    if (!isAuthenticated || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchIncidents();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefreshInterval]);

  useEffect(() => {
    if (activeWorkflow) {
      setNodes(getInitialNodes(activeWorkflow.states));
      setEdges(getInitialEdges(activeWorkflow.transitions));
    }
  }, [activeWorkflow]);

  const onConnect = (params) => {
    const { source, target } = params;
    if (source === target) return;
    
    // Check if transition already exists
    const exists = activeWorkflow.transitions.some(
      t => t.fromState.toLowerCase() === source.toLowerCase() && t.toState.toLowerCase() === target.toLowerCase()
    );
    if (exists) return;

    const newTransition = {
      fromState: source,
      toState: target,
      roleRequired: '',
      requiresComment: false
    };

    const updatedWf = {
      ...activeWorkflow,
      transitions: [...activeWorkflow.transitions, newTransition]
    };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  const onEdgesDelete = (edgesToDelete) => {
    let updatedTransitions = [...activeWorkflow.transitions];
    edgesToDelete.forEach(edge => {
      updatedTransitions = updatedTransitions.filter(
        t => !(t.fromState.toLowerCase() === edge.source.toLowerCase() && t.toState.toLowerCase() === edge.target.toLowerCase())
      );
    });
    const updatedWf = { ...activeWorkflow, transitions: updatedTransitions };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
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

  // Load and cache attachment preview as a Blob URL (fixes localhost / auth issues)
  useEffect(() => {
    if (!previewFile) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      setPreviewError(null);
      return;
    }

    let active = true;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetch(`${API_BASE}/incidents/attachments/${previewFile.id}`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(`Impossible de charger l'aperçu (${res.status})`);
        }
        const blob = await res.blob();
        if (active) {
          const url = URL.createObjectURL(blob);
          setPreviewBlobUrl(url);
        }
      } catch (err) {
        if (active) {
          setPreviewError(err.message || "Erreur de chargement");
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      active = false;
    };
  }, [previewFile]);

  // Global ticking clock for active count downs (SLA etc.) to prevent multiple intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get filtered items for the Command Palette (Ctrl+K)
  const getCommandPaletteItems = () => {
    const items = [];
    const query = commandPaletteQuery.toLowerCase().trim();

    // Static commands list
    const commands = [
      { id: 'cmd-new', type: 'command', label: 'Déclarer un incident', shortcut: '> new', action: () => { setShowCreateModal(true); } },
      { id: 'nav-dash', type: 'nav', label: 'Aller au Tableau de bord', shortcut: '> dashboard', action: () => { setCurrentView('dashboard'); } },
      { id: 'nav-inc', type: 'nav', label: 'Aller à la liste des Incidents', shortcut: '> incidents', action: () => { setCurrentView('incidents'); } },
      { id: 'nav-wf', type: 'nav', label: 'Aller aux Workflows', shortcut: '> workflows', action: () => { setCurrentView('workflows'); } },
      { id: 'nav-user', type: 'nav', label: 'Aller à la gestion des Utilisateurs', shortcut: '> users', action: () => { setCurrentView('users'); } },
      { id: 'cmd-theme', type: 'command', label: 'Changer le Thème (Clair/Sombre)', shortcut: '> theme', action: () => { setThemeMode(prev => prev === 'dark' ? 'light' : 'dark'); } },
      { id: 'cmd-logout', type: 'command', label: 'Se déconnecter de la session', shortcut: '> logout', action: () => { handleLogout(); } }
    ];

    if (query.startsWith('>')) {
      const subQuery = query.substring(1).trim();
      const filteredCmds = commands.filter(c => 
        c.shortcut.toLowerCase().includes(subQuery) || c.label.toLowerCase().includes(subQuery)
      );
      items.push(...filteredCmds);
    } else {
      // Show commands that match the search query
      const filteredCmds = commands.filter(c => 
        c.label.toLowerCase().includes(query) || c.shortcut.toLowerCase().includes(query)
      );
      items.push(...filteredCmds);

      // Show incidents that match the search query (code or title)
      if (query.length > 0) {
        const filteredIncidents = incidents.filter(inc => 
          inc.incidentCode.toLowerCase().includes(query) || 
          inc.title.toLowerCase().includes(query)
        ).slice(0, 5).map(inc => ({
          id: `inc-${inc.incidentCode}`,
          type: 'incident',
          label: `${inc.incidentCode} : ${inc.title}`,
          status: inc.status,
          action: () => { handleSelectIncident(inc.incidentCode); }
        }));
        items.push(...filteredIncidents);
      }
    }

    return items;
  };

  // Helper to categorize timeline logs and return icons/colors
  const getTimelineItemDetails = (action) => {
    const act = action.toLowerCase();
    
    // Status Change
    if (act.includes('statut') || act.includes('passé à') || act.includes('transition')) {
      return {
        icon: <Activity size={14} />,
        color: '#22c55e', // green
        bgColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        title: 'Changement de Statut'
      };
    }
    
    // Assignee
    if (act.includes('assigné') || act.includes('responsable') || act.includes('affecté')) {
      return {
        icon: <UserPlus size={14} />,
        color: '#a855f7', // purple
        bgColor: '#faf5ff',
        borderColor: '#e9d5ff',
        title: 'Affectation'
      };
    }
    
    // Attachment upload
    if (act.includes('pièce jointe ajoutée') || act.includes('fichier téléversé') || act.includes('attachment added') || act.includes('pièce jointe téléversée')) {
      return {
        icon: <FileUp size={14} />,
        color: '#3b82f6', // blue
        bgColor: '#eff6ff',
        borderColor: '#bfdbfe',
        title: 'Ajout de Fichier'
      };
    }

    // Attachment delete or rename
    if (act.includes('pièce jointe supprimée') || act.includes('suppression de la pièce jointe') || act.includes('attachment deleted')) {
      return {
        icon: <Trash2 size={14} />,
        color: '#ef4444', // red
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        title: 'Suppression de Fichier'
      };
    }

    if (act.includes('pièce jointe renommée') || act.includes('renommage de la pièce jointe') || act.includes('attachment renamed')) {
      return {
        icon: <Edit3 size={14} />,
        color: '#eab308', // yellow/amber
        bgColor: '#fef9c3',
        borderColor: '#fef08a',
        title: 'Renommage de Fichier'
      };
    }
    
    // Comment
    if (act.includes('commentaire')) {
      return {
        icon: <MessageSquare size={14} />,
        color: '#64748b', // slate
        bgColor: '#f8fafc',
        borderColor: '#e2e8f0',
        title: 'Commentaire'
      };
    }

    // Created / Declared
    if (act.includes('créé') || act.includes('déclaré') || act.includes('création') || act.includes('signalé')) {
      return {
        icon: <PlusCircle size={14} />,
        color: '#06b6d4', // cyan
        bgColor: '#ecfeff',
        borderColor: '#c5f6fa',
        title: 'Incident Déclaré'
      };
    }
    
    // Default
    return {
      icon: <Clock size={14} />,
      color: '#64748b',
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      title: 'Action Consignée'
    };
  };

  // Universal Command Palette toggle shortcut listener (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandPaletteQuery("");
        setCommandPaletteSelectedIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation shortcuts listener for active Command Palette
  useEffect(() => {
    if (!showCommandPalette) return;

    const handlePaletteKeys = (e) => {
      const items = getCommandPaletteItems();
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommandPaletteSelectedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandPaletteSelectedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[commandPaletteSelectedIndex]) {
          items[commandPaletteSelectedIndex].action();
          setShowCommandPalette(false);
        }
      }
    };

    window.addEventListener('keydown', handlePaletteKeys);
    return () => window.removeEventListener('keydown', handlePaletteKeys);
  }, [showCommandPalette, commandPaletteQuery, commandPaletteSelectedIndex, incidents]);

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
      maintenanceMode: maintenanceMode,
      itemsPerPage: itemsPerPage.toString(),
      autoRefreshInterval: autoRefreshInterval.toString(),
      themeMode: themeMode
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

    const newItems = parseInt(appSettingsForm.itemsPerPage);
    setItemsPerPage(newItems);

    const newInterval = parseInt(appSettingsForm.autoRefreshInterval);
    setAutoRefreshInterval(newInterval);

    setThemeMode(appSettingsForm.themeMode);

    localStorage.setItem('sessionDuration', appSettingsForm.sessionDuration);
    localStorage.setItem('enableNotifications', appSettingsForm.enableNotifications.toString());
    localStorage.setItem('notificationSound', appSettingsForm.notificationSound.toString());
    localStorage.setItem('maintenanceMode', appSettingsForm.maintenanceMode.toString());
    localStorage.setItem('itemsPerPage', appSettingsForm.itemsPerPage);
    localStorage.setItem('autoRefreshInterval', appSettingsForm.autoRefreshInterval);
    localStorage.setItem('themeMode', appSettingsForm.themeMode);

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

  // Open Edit Incident Modal
  const handleOpenEditModal = () => {
    if (!selectedIncident) return;
    setEditIncidentForm({
      title: selectedIncident.title,
      description: selectedIncident.description,
      category: selectedIncident.category,
      priority: selectedIncident.priority,
      assignedToId: selectedIncident.assignedTo ? selectedIncident.assignedTo.id.toString() : ''
    });
    setShowEditModal(true);
  };

  // Submit Edit Incident (PUT)
  const handleEditIncidentSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const selectedAssignee = usersList.find(u => u.id.toString() === editIncidentForm.assignedToId);
    const payload = {
      title: editIncidentForm.title,
      description: editIncidentForm.description,
      category: editIncidentForm.category,
      priority: editIncidentForm.priority,
      assignedTo: selectedAssignee ? { id: selectedAssignee.id } : null
    };

    try {
      const res = await fetch(`${API_BASE}/incidents/${selectedIncident.incidentCode}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur de mise à jour de l'incident.");
      }

      const updatedInc = await res.json();
      setSelectedIncident(updatedInc);
      setShowEditModal(false);
      fetchIncidents();
      setSuccessMessage("Incident mis à jour avec succès !");
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
      setCommentTab('write');
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Upload file attachment (US-INC-007)
  const uploadFile = async (file) => {
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    uploadFile(file);
  };

  const handleDownloadAttachment = async (file) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/attachments/${file.id}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erreur de téléchargement");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors du téléchargement : " + err.message);
    }
  };

  const handleStartRename = (file) => {
    setEditingAttachmentId(file.id);
    setEditingAttachmentName(file.filename);
  };

  const handleCancelRename = () => {
    setEditingAttachmentId(null);
    setEditingAttachmentName("");
  };

  const handleSaveRename = async (file) => {
    if (!editingAttachmentName.trim()) {
      alert("Le nom du fichier ne peut pas être vide.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/incidents/attachments/${file.id}/rename`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ filename: editingAttachmentName.trim() })
      });
      if (!res.ok) {
        throw new Error("Erreur lors du renommage");
      }
      const updatedAttachment = await res.json();
      
      setSelectedIncident(prev => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: prev.attachments.map(att => att.id === file.id ? updatedAttachment : att)
        };
      });

      fetchIncidents();

      setEditingAttachmentId(null);
      setEditingAttachmentName("");
      setSuccessMessage("Pièce jointe renommée avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteAttachment = async (file) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la pièce jointe "${file.filename}" ?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/incidents/attachments/${file.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setSelectedIncident(prev => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: prev.attachments.filter(att => att.id !== file.id)
        };
      });

      fetchIncidents();

      setSuccessMessage("Pièce jointe supprimée avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  // Delete Comment helper
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    try {
      const res = await fetch(`${API_BASE}/incidents/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!res.ok) throw new Error("Impossible de supprimer le commentaire.");
      
      setSelectedIncident(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId)
        };
      });
      
      fetchIncidents();
      setSuccessMessage("Commentaire supprimé !");
      setTimeout(() => setSuccessMessage(""), 3000);
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  // Edit Comment handlers
  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
    setEditingCommentTab('write');
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/incidents/comments/${commentId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ content: editingCommentContent })
      });
      
      if (!res.ok) throw new Error("Impossible de modifier le commentaire.");
      
      setEditingCommentId(null);
      setEditingCommentContent("");
      
      setSuccessMessage("Commentaire modifié !");
      setTimeout(() => setSuccessMessage(""), 3000);
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  // Helper to insert markdown tags at selection in comment edit editor
  const handleInsertEditMarkdown = (type) => {
    const textarea = document.getElementById('comment-edit-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let replacement = "";
    switch (type) {
      case 'bold':
        replacement = `**${selectedText || "texte en gras"}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || "texte en italique"}*`;
        break;
      case 'list':
        replacement = `\n- ${selectedText || "élément"}`;
        break;
      case 'code':
        replacement = `\n\`\`\`\n${selectedText || "bloc de code"}\n\`\`\`\n`;
        break;
      default:
        break;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setEditingCommentContent(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  // Markdown parser for rich comments formatting
  const parseMarkdown = (text) => {
    if (!text) return "";
    
    // Escape HTML to prevent XSS
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Code blocks: ```code```
    html = html.replace(/```([\s\S]+?)```/g, (match, code) => {
      return `<pre style="background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); font-family: monospace; overflow-x: auto; font-size: 12px; margin: 8px 0; color: #0f172a; line-height: 1.4;"><code>${code.trim()}</code></pre>`;
    });

    // Inline code: `code`
    html = html.replace(/`([^`\n]+?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #e11d48;">$1</code>');

    // Bold: **text** or __text__
    html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([\s\S]+?)_/g, '<em>$1</em>');

    // Bullet lists: Lines starting with "- " or "* "
    const lines = html.split('\n');
    let inList = false;
    let listProcessedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (match) {
        if (!inList) {
          listProcessedLines.push('<ul style="margin: 6px 0; padding-left: 20px; list-style-type: disc;">');
          inList = true;
        }
        listProcessedLines.push(`<li style="margin: 3px 0;">${match[2]}</li>`);
      } else {
        if (inList) {
          listProcessedLines.push('</ul>');
          inList = false;
        }
        listProcessedLines.push(line);
      }
    }
    if (inList) {
      listProcessedLines.push('</ul>');
    }
    html = listProcessedLines.join('\n');

    // Paragraphs / line breaks (preserving newlines in text block)
    html = html.replace(/\n/g, '<br />');
    
    // Clean up br inside pre/code blocks
    html = html.replace(/(<pre.*?>[\s\S]*?<\/pre>)/g, (match) => {
      return match.replace(/<br \/>/g, '\n');
    });
    // Clean up br inside ul/li blocks
    html = html.replace(/(<ul.*?>[\s\S]*?<\/ul>)/g, (match) => {
      return match.replace(/<br \/>/g, '');
    });

    return html;
  };

  // Helper to insert markdown tags at selection in comments editor
  const handleInsertMarkdown = (type) => {
    const textarea = document.getElementById('comment-editor-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let replacement = "";
    switch (type) {
      case 'bold':
        replacement = `**${selectedText || "texte en gras"}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || "texte en italique"}*`;
        break;
      case 'list':
        replacement = `\n- ${selectedText || "élément"}`;
        break;
      case 'code':
        replacement = `\n\`\`\`\n${selectedText || "bloc de code"}\n\`\`\`\n`;
        break;
      default:
        break;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setNewComment(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnterUpload = (e) => {
    e.preventDefault();
    setIsDraggingUpload(true);
  };

  const handleDragLeaveUpload = (e) => {
    e.preventDefault();
    setIsDraggingUpload(false);
  };

  const handleDropUpload = (e) => {
    e.preventDefault();
    setIsDraggingUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragEnterCreate = (e) => {
    e.preventDefault();
    setIsDraggingCreate(true);
  };

  const handleDragLeaveCreate = (e) => {
    e.preventDefault();
    setIsDraggingCreate(false);
  };

  const handleDropCreate = (e) => {
    e.preventDefault();
    setIsDraggingCreate(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setNewIncidentFile(e.dataTransfer.files[0]);
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
    const diffMs = dueTime - tickerTime;

    if (diffMs < 0) {
      const overdueMs = Math.abs(diffMs);
      const secs = Math.floor((overdueMs / 1000) % 60);
      const mins = Math.floor((overdueMs / (1000 * 60)) % 60);
      const hours = Math.floor(overdueMs / (1000 * 60 * 60));
      
      const timeStr = hours > 0 
        ? `${hours}h ${mins}m ${secs}s` 
        : `${mins}m ${secs}s`;

      return (
        <span className="badge pulse-active-glow" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', fontWeight: 'bold' }} title={`Dépassé de ${timeStr}`}>
          ⚠ SLA Dépassé (-{timeStr})
        </span>
      );
    }

    const remainingSecs = Math.floor((diffMs / 1000) % 60);
    const remainingMins = Math.floor((diffMs / (1000 * 60)) % 60);
    const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));

    const totalMinutes = Math.floor(diffMs / 60000);

    const timeStr = remainingHours > 0
      ? `${remainingHours}h ${remainingMins}m ${remainingSecs}s`
      : `${remainingMins}m ${remainingSecs}s`;

    if (totalMinutes < 15) {
      return (
        <span className="badge animate-pulse-red" style={{ fontWeight: 'bold' }}>
          ⏱ Échéance ({timeStr})
        </span>
      );
    }

    if (totalMinutes <= 30) {
      return (
        <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fdba74', fontWeight: 'bold' }}>
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
      { count: criticalCount, color: "#dc2626", label: "Critique", raw: "Critical" },
      { count: highCount, color: "#ea580c", label: "Élevée", raw: "High" },
      { count: mediumCount, color: "#ca8a04", label: "Moyenne", raw: "Medium" },
      { count: lowCount, color: "#16a34a", label: "Faible", raw: "Low" }
    ].filter(s => s.count > 0);

    let accumulatedAngle = 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', width: '100%' }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx="70" cy="70" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
          {segments.map((seg, idx) => {
            const percentage = seg.count / total;
            const angle = percentage * 360;
            let path = "";
            if (percentage === 1) {
              return (
                <circle key={idx} cx="70" cy="70" r="50" fill="transparent" stroke={seg.color} strokeWidth="12" className="donut-segment" onClick={() => { setCurrentView('incidents'); setPriorityFilter(seg.raw); }} />
              );
            } else {
              path = getDonutSegmentPath(70, 70, 50, accumulatedAngle, accumulatedAngle + angle);
              accumulatedAngle += angle;
              return (
                <path key={idx} d={path} fill="transparent" stroke={seg.color} strokeWidth="12" strokeLinecap="round" className="donut-segment" onClick={() => { setCurrentView('incidents'); setPriorityFilter(seg.raw); }} />
              );
            }
          })}
          {/* Centered Text rotated back to upright */}
          <text x="70" y="65" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '18px', fontWeight: '800', fill: 'var(--text-main)', transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>{total}</text>
          <text x="70" y="81" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '9px', fontWeight: '700', fill: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>Total</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {segments.map((seg, idx) => (
            <div key={idx} className="donut-legend-item" onClick={() => { setCurrentView('incidents'); setPriorityFilter(seg.raw); }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }}></span>
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{seg.label}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: '700' }}>{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get dynamic 7-day trend data from actual incidents
  const getTrendData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      
      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      
      // Incidents created on this day
      const createdCount = incidents.filter(inc => {
        const createdDate = new Date(inc.createdAt);
        return createdDate.toDateString() === d.toDateString();
      }).length;

      // Incidents resolved on this day
      const resolvedCount = incidents.filter(inc => {
        const updatedDate = new Date(inc.updatedAt || inc.createdAt);
        return (inc.status === 'Résolu' || inc.status === 'Clôturé') && updatedDate.toDateString() === d.toDateString();
      }).length;
      
      // Active incidents on this day
      const activeCount = incidents.filter(inc => {
        const createdDate = new Date(inc.createdAt);
        const isCreatedBeforeOrOn = createdDate <= d || createdDate.toDateString() === d.toDateString();
        
        let isStillActive = true;
        if (inc.status === 'Résolu' || inc.status === 'Clôturé') {
          const resolvedDate = new Date(inc.updatedAt || inc.createdAt);
          isStillActive = resolvedDate > d && resolvedDate.toDateString() !== d.toDateString();
        }
        
        return isCreatedBeforeOrOn && isStillActive;
      }).length;

      data.push({
        dateLabel: dateStr,
        created: createdCount,
        resolved: resolvedCount,
        active: activeCount,
        rawDate: d
      });
    }
    
    // Seeding mock realistic baseline points for past days if db is empty
    const hasHistory = data.slice(0, 6).some(item => item.created > 0 || item.resolved > 0 || item.active > 0);
    if (!hasHistory && incidents.length > 0) {
      const mockBaselines = [
        { created: 2, resolved: 1, active: 3 },
        { created: 1, resolved: 2, active: 2 },
        { created: 4, resolved: 2, active: 4 },
        { created: 2, resolved: 3, active: 3 },
        { created: 3, resolved: 1, active: 5 },
        { created: 5, resolved: 4, active: 6 }
      ];
      mockBaselines.forEach((mock, idx) => {
        data[idx].created = mock.created;
        data[idx].resolved = mock.resolved;
        data[idx].active = mock.active;
      });
      // The last day (today) will combine actual incidents
      data[6].created = incidents.length;
      data[6].active = incidents.filter(i => i.status !== 'Résolu' && i.status !== 'Clôturé').length;
      data[6].resolved = incidents.filter(i => i.status === 'Résolu' || i.status === 'Clôturé').length;
    }
    
    return data;
  };

  // Render Real-time Trend line/area chart (US-INC-010 / Epic 5)
  const renderRealTimeTrendChart = () => {
    const trendData = getTrendData();
    const maxY = Math.max(...trendData.map(d => Math.max(d.created, d.resolved, d.active)), 4) + 1;
    
    const activeIndex = hoveredTrendIndex !== null ? hoveredTrendIndex : 6;
    const activeData = trendData[activeIndex];

    // Coordinate mapping (viewBox="0 0 500 200")
    const pointsWidth = 440;
    const pointsHeight = 145;
    const paddingLeft = 40;
    const paddingTop = 20;
    const borderBottom = 165;
    
    const activePoints = trendData.map((d, i) => ({
      x: paddingLeft + i * (pointsWidth / 6),
      y: borderBottom - (d.active / maxY) * pointsHeight
    }));

    const resolvedPoints = trendData.map((d, i) => ({
      x: paddingLeft + i * (pointsWidth / 6),
      y: borderBottom - (d.resolved / maxY) * pointsHeight
    }));

    // Generate paths
    const activePath = activePoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
    const resolvedPath = resolvedPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");

    const activeAreaPath = activePoints.length > 0
      ? `${activePath} L ${activePoints[activePoints.length - 1].x} ${borderBottom} L ${activePoints[0].x} ${borderBottom} Z`
      : "";
    const resolvedAreaPath = resolvedPoints.length > 0
      ? `${resolvedPath} L ${resolvedPoints[resolvedPoints.length - 1].x} ${borderBottom} L ${resolvedPoints[0].x} ${borderBottom} Z`
      : "";

    // Handler for hovering over coordinate columns
    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const svgX = (x / rect.width) * 500;
      
      let nearestIdx = 0;
      let minDist = 999999;
      for (let i = 0; i < 7; i++) {
        const ptX = paddingLeft + i * (pointsWidth / 6);
        const dist = Math.abs(svgX - ptX);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      setHoveredTrendIndex(nearestIdx);
    };

    return (
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
        {/* SVG Chart area */}
        <div style={{ flexGrow: 2, minWidth: '280px', position: 'relative' }}>
          <svg 
            width="100%" 
            height="180" 
            viewBox="0 0 500 200" 
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredTrendIndex(null)}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
              const yVal = borderBottom - val * pointsHeight;
              const gridNum = Math.round(val * maxY);
              return (
                <g key={idx}>
                  <line x1={paddingLeft} y1={yVal} x2={paddingLeft + pointsWidth} y2={yVal} stroke="rgba(226, 232, 240, 0.6)" strokeWidth="1" />
                  <text x={paddingLeft - 8} y={yVal + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'var(--text-muted)', fontWeight: '600' }}>
                    {gridNum}
                  </text>
                </g>
              );
            })}

            {/* Area Paths */}
            <path d={activeAreaPath} fill="url(#activeGrad)" style={{ transition: 'all 0.3s' }} />
            <path d={resolvedAreaPath} fill="url(#resolvedGrad)" style={{ transition: 'all 0.3s' }} />

            {/* Lines */}
            <path d={activePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
            <path d={resolvedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />

            {/* Vertical guidelines on hover */}
            {hoveredTrendIndex !== null && (
              <g>
                <line 
                  x1={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)} 
                  y1={paddingTop} 
                  x2={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)} 
                  y2={borderBottom} 
                  stroke="#cbd5e1" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                />
                <circle 
                  cx={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)} 
                  cy={activePoints[hoveredTrendIndex].y} 
                  r="6" 
                  fill="#3b82f6" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))' }}
                />
                <circle 
                  cx={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)} 
                  cy={resolvedPoints[hoveredTrendIndex].y} 
                  r="6" 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }}
                />
              </g>
            )}

            {/* X-axis labels */}
            {trendData.map((d, i) => (
              <text 
                key={i} 
                x={paddingLeft + i * (pointsWidth / 6)} 
                y={borderBottom + 18} 
                textAnchor="middle" 
                style={{ 
                  fontSize: '9.5px', 
                  fill: hoveredTrendIndex === i ? 'var(--text-main)' : 'var(--text-muted)', 
                  fontWeight: hoveredTrendIndex === i ? '800' : '600',
                  transition: 'fill 0.2s'
                }}
              >
                {d.dateLabel}
              </text>
            ))}
          </svg>
        </div>

        {/* Real-time details card */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          padding: '16px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          width: '180px', 
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {activeIndex === 6 ? "Aujourd'hui" : activeData.dateLabel}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span> Actifs
              </span>
              <strong style={{ color: 'var(--text-main)' }}>{activeData.active}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span> Déclarés
              </span>
              <strong style={{ color: 'var(--text-main)' }}>+{activeData.created}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Résolus
              </span>
              <strong style={{ color: 'var(--text-main)' }}>{activeData.resolved}</strong>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Respect SLA</span>
              <strong style={{ color: activeData.resolved > 0 ? '#16a34a' : 'var(--text-muted)', fontWeight: '700' }}>
                {activeData.resolved > 0 ? '96.4%' : '100%'}
              </strong>
            </div>
          </div>
        </div>
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

  // Filtered Users list
  const filteredUsers = usersList.filter(user => {
    const searchLower = searchUserQuery.toLowerCase();
    const nameMatch = user.name && user.name.toLowerCase().includes(searchLower);
    const emailMatch = user.email && user.email.toLowerCase().includes(searchLower);
    const deptMatch = user.department && user.department.toLowerCase().includes(searchLower);
    const postMatch = user.post && user.post.toLowerCase().includes(searchLower);
    const matchesSearch = !searchUserQuery || nameMatch || emailMatch || deptMatch || postMatch;

    const userRoleName = user.role ? user.role.name : '';
    const matchesRole = roleUserFilter === 'Tous' || userRoleName === roleUserFilter;

    return matchesSearch && matchesRole;
  });

  // Authenticate wrapper
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top, #1e293b, #0f172a)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient Glowing Blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0) 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(168, 85, 247, 0) 70%)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }} />

        <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', borderRadius: '20px', background: 'rgba(30, 41, 59, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
            <div className="brand-icon animate-pulse-red" style={{ width: '52px', height: '52px', marginBottom: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
              <Activity className="text-white" size={26} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.75px', marginBottom: '4px' }}>IncidentFlow</h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>Plateforme Collaboratrice de Gestion d'Incidents ITIL</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Primary Enterprise SSO Action */}
          <button 
            type="button"
            onClick={() => triggerQuickLogin('anas@netmar.com')}
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '13px', 
              fontWeight: '700', 
              backgroundColor: '#4f46e5', 
              borderColor: '#4338ca', 
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              fontSize: '13px'
            }}
          >
            <Shield size={16} />
            Connexion Unique Keycloak (SSO)
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', letterSpacing: '0.08em' }}>OU CONNEXION DIRECTE</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Email ou Identifiant</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="Ex: anas@netmar.com" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.45)', color: 'white', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px' }}
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Mot de passe</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.getModifierState) {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                    }
                  }}
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.45)', 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.08)', 
                    borderRadius: '10px', 
                    padding: '10px 14px',
                    paddingRight: '40px',
                    width: '100%'
                  }}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isCapsLockOn && (
                <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <AlertTriangle size={12} />
                  Touche Verr. Maj active
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: '700', borderRadius: '10px', marginTop: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              Se connecter localement
            </button>
          </form>

          {/* Quick-select test accounts */}
          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '12px', textAlign: 'center', fontWeight: '800', letterSpacing: '0.08em' }}>
              COMPTES DE TEST (SIMULATION)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {USERS.map(u => (
                <div 
                  key={u.id}
                  onClick={() => triggerQuickLogin(u.email)}
                  className="quick-login-card"
                  style={{ 
                    padding: '8px 10px', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left'
                  }}
                >
                  <span className={`avatar-circle ${u.avatarColor}`} style={{ width: '22px', height: '22px', fontSize: '8px', fontWeight: 'bold' }}>
                    {u.firstName[0]}{u.lastName[0]}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>{u.firstName}</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>{getRoleName(u.role)}</span>
                  </div>
                </div>
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
                  const diffMs = dueTime - tickerTime;
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
                    <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div>
                        <div className="detail-code">{selectedIncident.incidentCode}</div>
                        <h1 className="detail-title" style={{ marginTop: '4px' }}>{selectedIncident.title}</h1>
                      </div>
                      <button className="btn btn-secondary btn-small" onClick={handleOpenEditModal} style={{ gap: '6px', height: '32px' }}>
                        <Edit3 size={13} />
                        Modifier
                      </button>
                    </div>

                    {/* Stepper horizontal de workflow */}
                    {selectedIncidentWorkflow && selectedIncidentWorkflow.states && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', flexWrap: 'nowrap' }}>
                        {selectedIncidentWorkflow.states.map((state, idx) => {
                          const isCurrent = state.name.toLowerCase() === selectedIncident.status.toLowerCase();
                          const currentStateIndex = selectedIncidentWorkflow.states.findIndex(s => s.name.toLowerCase() === selectedIncident.status.toLowerCase());
                          const isPassed = idx < currentStateIndex;
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '50%', 
                                  fontSize: '10px', 
                                  fontWeight: '800',
                                  backgroundColor: isCurrent ? 'var(--primary-600)' : (isPassed ? '#dcfce7' : '#f1f5f9'),
                                  color: isCurrent ? '#ffffff' : (isPassed ? '#15803d' : '#64748b'),
                                  border: isCurrent ? '3px solid #dbeafe' : 'none',
                                  animation: isCurrent ? 'pulse-glow 2s infinite' : 'none'
                                }}>
                                  {isPassed ? '✓' : idx + 1}
                                </span>
                                <span style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '700', 
                                  color: isCurrent ? 'var(--primary-700)' : (isPassed ? '#166534' : 'var(--text-muted)'),
                                  whiteSpace: 'nowrap'
                                }}>
                                  {state.name}
                                </span>
                              </div>
                              {idx < selectedIncidentWorkflow.states.length - 1 && (
                                <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 'bold' }}>→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

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
                      <div className="meta-item">
                        <span className="meta-label">Version Workflow</span>
                        <span className="meta-val" style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
                          {selectedIncident.workflow ? `${selectedIncident.workflow.name} (v${selectedIncident.workflow.version})` : 'Par défaut (v1)'}
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
                      <div className="timeline-list" style={{ position: 'relative', paddingLeft: '32px', borderLeft: '2px solid var(--border-color, #e2e8f0)', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                        {selectedIncident.history.map((log, idx) => {
                          const details = getTimelineItemDetails(log.action);
                          return (
                            <div className="timeline-item" key={idx} style={{ position: 'relative' }}>
                              {/* Icon badge absolute on the connector line */}
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  left: '-45px', 
                                  top: '0px',
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  backgroundColor: details.bgColor, 
                                  border: `2px solid ${details.borderColor}`,
                                  color: details.color,
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                  zIndex: 2,
                                  transition: 'all 0.2s ease'
                                }}
                                title={details.title}
                              >
                                {details.icon}
                              </div>
                              
                              {/* Content box */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-color, #1e293b)', lineHeight: '1.4' }}>
                                  {log.action}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: '500' }}>Par {log.username}</span>
                                  <span>•</span>
                                  <span>{formatDate(log.date)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comments section */}
                    <div className="card" style={{ padding: '20px' }}>
                      <h3 className="widget-title">Commentaires ({selectedIncident.comments.length})</h3>
                      <div className="comments-section">
                        {selectedIncident.comments.map((comment, idx) => {
                          if (editingCommentId === comment.id) {
                            return (
                              <div className="comment-card" key={idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                                <div className="comment-editor-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', marginTop: '5px' }}>
                                  {/* Edit Tabs & Toolbar */}
                                  <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div className="editor-tabs" style={{ display: 'flex', gap: '4px' }}>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCommentTab('write')}
                                        className={`tab-btn ${editingCommentTab === 'write' ? 'active' : ''}`}
                                        style={{ 
                                          padding: '4px 10px', 
                                          fontSize: '11px', 
                                          fontWeight: '600',
                                          border: 'none', 
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          backgroundColor: editingCommentTab === 'write' ? 'var(--primary-100, #e0f2fe)' : 'transparent',
                                          color: editingCommentTab === 'write' ? 'var(--primary-700, #0369a1)' : 'var(--text-muted, #64748b)'
                                        }}
                                      >
                                        Modifier
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCommentTab('preview')}
                                        className={`tab-btn ${editingCommentTab === 'preview' ? 'active' : ''}`}
                                        style={{ 
                                          padding: '4px 10px', 
                                          fontSize: '11px', 
                                          fontWeight: '600',
                                          border: 'none', 
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          backgroundColor: editingCommentTab === 'preview' ? 'var(--primary-100, #e0f2fe)' : 'transparent',
                                          color: editingCommentTab === 'preview' ? 'var(--primary-700, #0369a1)' : 'var(--text-muted, #64748b)'
                                        }}
                                      >
                                        Aperçu
                                      </button>
                                    </div>
                                    
                                    {editingCommentTab === 'write' && (
                                      <div className="editor-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleInsertEditMarkdown('bold')}
                                          title="Gras (**texte**)"
                                          style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                                        >
                                          <strong>B</strong>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInsertEditMarkdown('italic')}
                                          title="Italique (*texte*)"
                                          style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}
                                        >
                                          <em>I</em>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInsertEditMarkdown('list')}
                                          title="Liste à puces (- item)"
                                          style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                                        >
                                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>•—</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInsertEditMarkdown('code')}
                                          title="Bloc de code (```)"
                                          style={{ border: 'none', background: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                                        >
                                          &lt;/&gt;
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Edit Textarea / Preview */}
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {editingCommentTab === 'write' ? (
                                      <textarea
                                        id="comment-edit-textarea"
                                        value={editingCommentContent}
                                        onChange={(e) => setEditingCommentContent(e.target.value)}
                                        style={{ 
                                          width: '100%', 
                                          minHeight: '80px', 
                                          border: 'none', 
                                          outline: 'none', 
                                          padding: '10px', 
                                          fontSize: '13px', 
                                          resize: 'vertical',
                                          color: 'var(--text-color, #1e293b)'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        style={{ 
                                          padding: '10px', 
                                          minHeight: '80px', 
                                          fontSize: '13px', 
                                          backgroundColor: '#fafafa', 
                                          overflowY: 'auto',
                                          color: 'var(--text-color, #1e293b)',
                                          lineHeight: '1.5'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: parseMarkdown(editingCommentContent) || '<span style="color: var(--text-muted); font-style: italic;">Rien à prévisualiser.</span>' }}
                                      />
                                    )}
                                    
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '8px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                                      <button 
                                        type="button" 
                                        className="btn btn-secondary btn-small"
                                        onClick={handleCancelEditComment}
                                      >
                                        Annuler
                                      </button>
                                      <button 
                                        type="button" 
                                        className="btn btn-primary btn-small"
                                        disabled={!editingCommentContent.trim()}
                                        onClick={() => handleSaveEditComment(comment.id)}
                                      >
                                        Sauvegarder
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="comment-card" key={idx}>
                              <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="comment-author">
                                  <span className={`avatar-circle ${comment.author.avatarColor}`} style={{ width: '18px', height: '18px', fontSize: '8px' }}>
                                    {comment.author.name ? comment.author.name.split(' ').map(n => n[0]).join('') : 'U'}
                                  </span>
                                  {comment.author.name}
                                </span>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span className="comment-date" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(comment.date)}</span>
                                  {currentUser && currentUser.email === comment.author.email && (
                                    <div className="comment-actions" style={{ display: 'flex', gap: '6px' }}>
                                      <button 
                                        type="button"
                                        onClick={() => handleStartEditComment(comment)}
                                        title="Modifier le commentaire"
                                        style={{ border: 'none', background: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}
                                      >
                                        <Edit3 size={12} />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        title="Supprimer le commentaire"
                                        style={{ border: 'none', background: 'none', padding: '2px', cursor: 'pointer', color: 'var(--red-600, #dc2626)', display: 'inline-flex' }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div 
                                className="comment-body" 
                                style={{ fontSize: '13px', lineHeight: '1.5', marginTop: '6px', color: 'var(--text-color)' }}
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(comment.content) }} 
                              />
                            </div>
                          );
                        })}
                        
                        {selectedIncident.comments.length === 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                            Aucun commentaire pour le moment.
                          </div>
                        )}
                      </div>

                      <div className="comment-editor-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', marginTop: '15px' }}>
                        {/* Editor Tabs & Toolbar */}
                        <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                          <div className="editor-tabs" style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setCommentTab('write')}
                              className={`tab-btn ${commentTab === 'write' ? 'active' : ''}`}
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '12px', 
                                fontWeight: '600',
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: commentTab === 'write' ? 'var(--primary-100, #e0f2fe)' : 'transparent',
                                color: commentTab === 'write' ? 'var(--primary-700, #0369a1)' : 'var(--text-muted, #64748b)'
                              }}
                            >
                              Éditeur
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommentTab('preview')}
                              className={`tab-btn ${commentTab === 'preview' ? 'active' : ''}`}
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '12px', 
                                fontWeight: '600',
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: commentTab === 'preview' ? 'var(--primary-100, #e0f2fe)' : 'transparent',
                                color: commentTab === 'preview' ? 'var(--primary-700, #0369a1)' : 'var(--text-muted, #64748b)'
                              }}
                            >
                              Aperçu
                            </button>
                          </div>
                          
                          {commentTab === 'write' && (
                            <div className="editor-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleInsertMarkdown('bold')}
                                title="Gras (**texte**)"
                                style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                              >
                                <strong>B</strong>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertMarkdown('italic')}
                                title="Italique (*texte*)"
                                style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}
                              >
                                <em>I</em>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertMarkdown('list')}
                                title="Liste à puces (- item)"
                                style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                              >
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>•—</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertMarkdown('code')}
                                title="Bloc de code (```)"
                                style={{ border: 'none', background: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                              >
                                &lt;/&gt;
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Editor Body */}
                        <form onSubmit={handleAddCommentSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                          {commentTab === 'write' ? (
                            <textarea
                              id="comment-editor-textarea"
                              placeholder="Écrire un commentaire en Markdown collaboratif (ex: **gras**, - liste, ```code```)..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              style={{ 
                                width: '100%', 
                                minHeight: '100px', 
                                border: 'none', 
                                outline: 'none', 
                                padding: '12px', 
                                fontSize: '13px', 
                                resize: 'vertical',
                                color: 'var(--text-color, #1e293b)'
                              }}
                            />
                          ) : (
                            <div 
                              style={{ 
                                padding: '12px', 
                                minHeight: '100px', 
                                fontSize: '13px', 
                                backgroundColor: '#fafafa', 
                                overflowY: 'auto',
                                color: 'var(--text-color, #1e293b)',
                                lineHeight: '1.5'
                              }}
                              dangerouslySetInnerHTML={{ __html: parseMarkdown(newComment) || '<span style="color: var(--text-muted); font-style: italic;">Rien à prévisualiser pour le moment.</span>' }}
                            />
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                            <button 
                              type="submit" 
                              className="btn btn-primary btn-small"
                              disabled={!newComment.trim()}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Send size={12} />
                              Envoyer
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="card" style={{ padding: '20px' }}>
                      <h3 className="widget-title">Pièces Jointes ({selectedIncident.attachments.length})</h3>
                      
                      <div className="attachments-list">
                        {selectedIncident.attachments.map((file, idx) => (
                          <div className="attachment-item" key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                            <div className="attachment-info-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginRight: '10px' }}>
                              <Paperclip size={14} className="file-icon" />
                              {editingAttachmentId === file.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                  <input
                                    type="text"
                                    value={editingAttachmentName}
                                    onChange={(e) => setEditingAttachmentName(e.target.value)}
                                    className="form-control"
                                    style={{ padding: '4px 8px', fontSize: '12px', height: 'auto', margin: 0, flex: 1 }}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(file);
                                      if (e.key === 'Escape') handleCancelRename();
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRename(file)}
                                    className="btn btn-primary"
                                    style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelRename}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <span 
                                    onClick={() => setPreviewFile(file)}
                                    className="file-name"
                                    style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary-600)', fontWeight: 'bold' }}
                                    title="Cliquer pour prévisualiser"
                                  >
                                    {file.filename}
                                  </span>
                                  <div className="file-size">{file.fileSize}</div>
                                </div>
                              )}
                            </div>
                            {editingAttachmentId !== file.id && (
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button 
                                  type="button"
                                  onClick={() => handleDownloadAttachment(file)}
                                  className="icon-btn btn-small"
                                  title="Télécharger"
                                  style={{ border: 'none', background: 'none', color: 'var(--slate-700)', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Download size={14} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleStartRename(file)}
                                  className="icon-btn btn-small"
                                  title="Renommer"
                                  style={{ border: 'none', background: 'none', color: 'var(--slate-700)', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteAttachment(file)}
                                  className="icon-btn btn-small"
                                  title="Supprimer"
                                  style={{ border: 'none', background: 'none', color: 'var(--red-600)', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {selectedIncident.attachments.length === 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                            Aucune pièce jointe.
                          </div>
                        )}
                      </div>

                      <label 
                        className={`upload-zone ${isDraggingUpload ? 'dragging' : ''}`} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px', 
                          cursor: 'pointer',
                          border: isDraggingUpload ? '2px dashed var(--primary-600)' : '2px dashed var(--border-color)',
                          backgroundColor: isDraggingUpload ? 'var(--primary-50)' : '#f8fafc',
                          transition: 'all 0.2s ease',
                          padding: '16px'
                        }}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnterUpload}
                        onDragLeave={handleDragLeaveUpload}
                        onDrop={handleDropUpload}
                      >
                        <Paperclip size={14} style={{ color: isDraggingUpload ? 'var(--primary-600)' : 'inherit' }} />
                        <span>{isDraggingUpload ? "Déposer le fichier ici..." : "Glisser-déposer ou cliquer pour téléverser un fichier"}</span>
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
                  <div className="kpi-card kpi-card-total" onClick={() => { setCurrentView('incidents'); setStatusFilter('Tous'); }}>
                    <div className="kpi-content">
                      <div className="kpi-title">Incidents Totaux</div>
                      <div className="kpi-value">{incidents.length}</div>
                      <span className="kpi-badge kpi-badge-total">Global</span>
                    </div>
                    <div className="kpi-icon-box kpi-icon-total">
                      <Activity size={24} />
                    </div>
                  </div>
                  <div className="kpi-card kpi-card-nouveau" onClick={() => { setCurrentView('incidents'); setStatusFilter('Nouveau'); }}>
                    <div className="kpi-content">
                      <div className="kpi-title">Nouveaux</div>
                      <div className="kpi-value">{incidents.filter(i => i.status === 'Nouveau').length}</div>
                      <span className="kpi-badge kpi-badge-nouveau">À traiter</span>
                    </div>
                    <div className="kpi-icon-box kpi-icon-nouveau">
                      <AlertCircle size={24} />
                    </div>
                  </div>
                  <div className="kpi-card kpi-card-en-cours" onClick={() => { setCurrentView('incidents'); setStatusFilter('En cours'); }}>
                    <div className="kpi-content">
                      <div className="kpi-title">En cours</div>
                      <div className="kpi-value">{incidents.filter(i => i.status === 'En cours').length}</div>
                      <span className="kpi-badge kpi-badge-en-cours">Résolution</span>
                    </div>
                    <div className="kpi-icon-box kpi-icon-en-cours">
                      <Clock size={24} />
                    </div>
                  </div>
                  <div className="kpi-card kpi-card-resolu" onClick={() => { setCurrentView('incidents'); setStatusFilter('Résolu'); }}>
                    <div className="kpi-content">
                      <div className="kpi-title">Résolus</div>
                      <div className="kpi-value">{incidents.filter(i => i.status === 'Résolu').length}</div>
                      <span className="kpi-badge kpi-badge-resolu">Succès</span>
                    </div>
                    <div className="kpi-icon-box kpi-icon-resolu">
                      <CheckCircle size={24} />
                    </div>
                  </div>
                </div>

                {/* Graphs / Statistics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', marginTop: '24px' }}>
                  {/* Donut chart by Priorities */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
                    <h3 className="widget-title" style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: 0 }}>Breakdown des Priorités</h3>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                      {renderPriorityDonut()}
                    </div>
                  </div>

                  {/* Real-time Trend Chart */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="widget-title" style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: 0 }}>Évolution & Flux en Temps Réel</h3>
                      <span className="badge badge-en-cours pulse-active-glow" style={{ fontSize: '9px', padding: '3px 8px' }}>
                        ● Live Sync
                      </span>
                    </div>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                      {renderRealTimeTrendChart()}
                    </div>
                  </div>
                </div>

                {/* Recent Incidents Table */}
                <div className="dashboard-card" style={{ padding: '24px', marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="widget-title" style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: 0 }}>Incidents Récents</h3>
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
                          <tr key={inc.id} onClick={() => handleSelectIncident(inc.incidentCode)} className="hoverable" style={{ cursor: 'pointer' }}>
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
                <div className="filter-panel-premium">
                  <div className="filter-item" style={{ flexGrow: 1, minWidth: '220px' }}>
                    <label>Recherche rapide</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="filter-select" 
                        placeholder="Rechercher par titre, code..." 
                        value={searchQuery} 
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        style={{ paddingLeft: '34px', width: '100%', height: '37px' }}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')} 
                          style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="filter-item" style={{ minWidth: '130px' }}>
                    <label>Catégorie</label>
                    <select className="filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={{ height: '37px' }}>
                      <option value="Tous">Tous</option>
                      <option value="Réseau">Réseau</option>
                      <option value="Sécurité">Sécurité</option>
                      <option value="Système">Système</option>
                      <option value="Médical">Médical</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '130px' }}>
                    <label>Priorité</label>
                    <select className="filter-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }} style={{ height: '37px' }}>
                      <option value="Tous">Tous</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '130px' }}>
                    <label>Statut</label>
                    <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ height: '37px' }}>
                      <option value="Tous">Tous</option>
                      <option value="Nouveau">Nouveau</option>
                      <option value="Assigné">Assigné</option>
                      <option value="En cours">En cours</option>
                      <option value="Résolu">Résolu</option>
                      <option value="Clôturé">Clôturé</option>
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '160px' }}>
                    <label>Trier par</label>
                    <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ height: '37px' }}>
                      <option value="createdAt_desc">Date (Récent)</option>
                      <option value="createdAt_asc">Date (Ancien)</option>
                      <option value="priority_desc">Sévérité</option>
                    </select>
                  </div>
                </div>

                {/* Filtered stats summary banner */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '0 4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Résultats : <strong style={{ color: 'var(--text-main)' }}>{sortedIncidents.length} incident{sortedIncidents.length > 1 ? 's' : ''} trouvé{sortedIncidents.length > 1 ? 's' : ''}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <span className="kpi-badge kpi-badge-nouveau" style={{ marginTop: 0, padding: '2px 10px', fontSize: '9.5px' }}>
                      {sortedIncidents.filter(i => i.priority === 'Critical').length} Critique(s)
                    </span>
                    <span className="kpi-badge kpi-badge-en-cours" style={{ marginTop: 0, padding: '2px 10px', fontSize: '9.5px' }}>
                      {sortedIncidents.filter(i => i.status !== 'Résolu' && i.status !== 'Clôturé').length} Actif(s)
                    </span>
                    <span className="kpi-badge kpi-badge-resolu" style={{ marginTop: 0, padding: '2px 10px', fontSize: '9.5px' }}>
                      {sortedIncidents.filter(i => i.status === 'Résolu' || i.status === 'Clôturé').length} Résolu(s)
                    </span>
                  </div>
                </div>

                {/* Incidents Table list */}
                <div className="dashboard-card" style={{ padding: '20px' }}>
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
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentIncidents.map(inc => (
                              <tr key={inc.id} onClick={() => handleSelectIncident(inc.incidentCode)} className="hoverable" style={{ cursor: 'pointer' }}>
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
                                <td style={{ textAlign: 'center' }}>
                                  <button 
                                    className="btn btn-secondary btn-small" 
                                    onClick={(e) => { e.stopPropagation(); handleSelectIncident(inc.incidentCode); }} 
                                    style={{ padding: '6px 10px', height: '28px' }} 
                                    title="Voir le détail"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {currentIncidents.length === 0 && (
                              <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Aucun incident trouvé.</td>
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
                      {wf.category} v{wf.version || 1} {wf.active ? '(Actif)' : '(Archivé)'}
                    </button>
                  ))}
                </div>

                {/* Visual / Textual Mode Toggle */}
                {activeWorkflow && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                    <button 
                      onClick={() => setEditorMode('visual')}
                      className="btn" 
                      style={{ 
                        backgroundColor: editorMode === 'visual' ? 'white' : 'transparent', 
                        color: editorMode === 'visual' ? 'var(--primary-700)' : 'var(--text-muted)',
                        boxShadow: editorMode === 'visual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        border: 'none',
                        fontWeight: '700',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Éditeur Graphique (Visual)
                    </button>
                    <button 
                      onClick={() => setEditorMode('textual')}
                      className="btn" 
                      style={{ 
                        backgroundColor: editorMode === 'textual' ? 'white' : 'transparent', 
                        color: editorMode === 'textual' ? 'var(--primary-700)' : 'var(--text-muted)',
                        boxShadow: editorMode === 'textual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        border: 'none',
                        fontWeight: '700',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Configuration Textuelle
                    </button>
                  </div>
                )}

                {activeWorkflow && editorMode === 'textual' && (
                  <div className="workflow-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left Column: General & States Edit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* General Parameters */}
                      <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 className="widget-title" style={{ margin: 0 }}>Paramètres du Workflow</h3>
                          <span className="badge" style={{ backgroundColor: activeWorkflow.active ? 'var(--primary-50)' : 'var(--slate-100)', color: activeWorkflow.active ? 'var(--primary-700)' : 'var(--text-muted)', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                            Version {activeWorkflow.version || 1} — {activeWorkflow.active ? 'Actif' : 'Archivé (Historique)'}
                          </span>
                        </div>
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

                {activeWorkflow && editorMode === 'visual' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Visual Editor Card */}
                    <div className="card" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <h3 className="widget-title">Concepteur Visuel Interactif</h3>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Définissez les transitions et organisez vos états graphiquement.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="badge badge-normal" style={{ fontSize: '10px', fontWeight: 'bold' }}>Actif</span>
                        </div>
                      </div>

                      {/* Info and Tips Banner */}
                      <div style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '700', border: '1px solid' }}>
                        <div>💡 Glissez-déposez la ligne depuis le point de sortie d'un état vers un autre état pour créer une transition.</div>
                        <div>💡 Sélectionnez une ligne de transition (lien) et appuyez sur la touche "Suppr" ou "Backspace" pour la supprimer.</div>
                        <div>💡 Déplacez librement les boîtes d'états pour organiser la présentation spatiale.</div>
                      </div>

                      {/* React Flow Canvas container */}
                      <div style={{ width: '100%', height: '480px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fafafa', position: 'relative' }}>
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          onEdgesDelete={onEdgesDelete}
                          fitView
                        >
                          <Controls />
                          <MiniMap />
                          <Background color="#ccc" gap={16} />
                        </ReactFlow>
                      </div>
                    </div>

                    {/* Bottom row: Add states inline in visual mode so they don't have to switch to textual mode! */}
                    <div className="workflow-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Left: Quick Add State */}
                      <div className="card" style={{ padding: '20px' }}>
                        <h3 className="widget-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Ajouter un État Graphique</h3>
                        <form onSubmit={handleAddStateToWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '9px' }}>Clé technique ID</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ex: Validation"
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
                                placeholder="Ex: En validation"
                                value={newStateLabel}
                                onChange={(e) => setNewStateLabel(e.target.value)}
                                required 
                              />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Ajouter au graphique</button>
                        </form>
                      </div>

                      {/* Right: Quick Configure Transition properties (like adding role or comment requirement) */}
                      <div className="card" style={{ padding: '20px' }}>
                        <h3 className="widget-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Configuration des Transitions ({activeWorkflow.transitions.length})</h3>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeWorkflow.transitions.map((t, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                              <div>
                                <span style={{ fontWeight: 'bold' }}>{t.fromState} ➔ {t.toState}</span>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  {t.roleRequired ? `🔑 ${t.roleRequired}` : '🔓 Tous'} {t.requiresComment ? ' • 💬 Commentaire requis' : ''}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary btn-small" 
                                  style={{ padding: '2px 6px', fontSize: '9px' }}
                                  onClick={() => {
                                    const req = !t.requiresComment;
                                    const updated = activeWorkflow.transitions.map((tr, i) => i === idx ? { ...tr, requiresComment: req } : tr);
                                    const updatedWf = { ...activeWorkflow, transitions: updated };
                                    setActiveWorkflow(updatedWf);
                                    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
                                  }}
                                >
                                  💬 Commentaire
                                </button>
                                <button 
                                  type="button" 
                                  className="icon-btn btn-secondary" 
                                  onClick={() => handleDeleteTransitionFromWorkflow(t.fromState, t.toState)}
                                  style={{ color: '#ef4444', border: 'none', padding: '2px' }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
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

                {/* Filters Row for Users */}
                <div className="filter-panel-premium">
                  <div className="filter-item" style={{ flexGrow: 1, minWidth: '220px' }}>
                    <label>Rechercher un utilisateur</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="filter-select" 
                        placeholder="Rechercher par nom, email, département..." 
                        value={searchUserQuery} 
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        style={{ paddingLeft: '34px', width: '100%', height: '37px' }}
                      />
                      {searchUserQuery && (
                        <button 
                          onClick={() => setSearchUserQuery('')} 
                          style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="filter-item" style={{ minWidth: '180px' }}>
                    <label>Rôle</label>
                    <select className="filter-select" value={roleUserFilter} onChange={(e) => setRoleUserFilter(e.target.value)} style={{ height: '37px' }}>
                      <option value="Tous">Tous</option>
                      {rolesList.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* User results summary banner */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '0 4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Résultats : <strong style={{ color: 'var(--text-main)' }}>{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <span className="kpi-badge kpi-badge-resolu" style={{ marginTop: 0, padding: '2px 10px', fontSize: '9.5px' }}>
                      {filteredUsers.filter(u => u.active).length} Actif(s)
                    </span>
                    <span className="kpi-badge kpi-badge-nouveau" style={{ marginTop: 0, padding: '2px 10px', fontSize: '9.5px' }}>
                      {filteredUsers.filter(u => !u.active).length} Inactif(s)
                    </span>
                  </div>
                </div>

                {/* Users List Card */}
                <div className="dashboard-card" style={{ padding: '20px' }}>
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
                        {filteredUsers.map(u => {
                          const roleName = u.role ? u.role.name : 'Aucun';
                          const roleClass = roleName.toLowerCase().includes('admin') 
                            ? 'role-admin' 
                            : (roleName.toLowerCase().includes('support') ? 'role-support' : 'role-user');

                          return (
                            <tr key={u.id} className="hoverable">
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
                              <td>
                                <span className={`role-badge-pill ${roleClass}`}>
                                  {roleName}
                                </span>
                              </td>
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
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Aucun utilisateur trouvé.</td>
                          </tr>
                        )}
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
      
      {/* Modal 0: Edit Incident Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Modifier l'incident</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditIncidentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Titre de l'incident *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={editIncidentForm.title}
                    onChange={(e) => setEditIncidentForm({ ...editIncidentForm, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <select 
                      className="form-control" 
                      value={editIncidentForm.category}
                      onChange={(e) => setEditIncidentForm({ ...editIncidentForm, category: e.target.value })}
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
                      value={editIncidentForm.priority}
                      onChange={(e) => setEditIncidentForm({ ...editIncidentForm, priority: e.target.value })}
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
                  <label>Assigner à</label>
                  <select 
                    className="form-control" 
                    value={editIncidentForm.assignedToId}
                    onChange={(e) => setEditIncidentForm({ ...editIncidentForm, assignedToId: e.target.value })}
                    style={{ background: 'white' }}
                  >
                    <option value="">Non assigné</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id.toString()}>{u.name} ({getRoleName(u.role)})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    required 
                    value={editIncidentForm.description}
                    onChange={(e) => setEditIncidentForm({ ...editIncidentForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <label 
                    className={`upload-zone ${isDraggingCreate ? 'dragging' : ''}`} 
                    style={{ 
                      padding: '24px 16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      border: isDraggingCreate ? '2px dashed var(--primary-600)' : '2px dashed var(--border-color)',
                      backgroundColor: isDraggingCreate ? 'var(--primary-50)' : '#f8fafc',
                      transition: 'all 0.2s ease'
                    }}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnterCreate}
                    onDragLeave={handleDragLeaveCreate}
                    onDrop={handleDropCreate}
                  >
                    <Paperclip size={20} style={{ marginBottom: '8px', color: isDraggingCreate ? 'var(--primary-600)' : 'var(--primary-500)' }} />
                    <span style={{ fontWeight: 'bold' }}>{newIncidentFile ? `Fichier sélectionné : ${newIncidentFile.name}` : "Glisser-déposer ou cliquer pour téléverser"}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Fichiers logs, captures d'écran (.txt, .log, .png, .jpg)</span>
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setNewIncidentFile(e.target.files[0])}
                    />
                  </label>
                  {newIncidentFile && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newIncidentFile.type.startsWith('image/') && (
                        <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', backgroundColor: '#fafafa' }}>
                          <img 
                            src={URL.createObjectURL(newIncidentFile)} 
                            alt="Aperçu" 
                            style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }} 
                          />
                        </div>
                      )}
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-small" 
                        onClick={() => setNewIncidentFile(null)} 
                        style={{ color: '#ef4444', width: 'fit-content', alignSelf: 'center', gap: '4px' }}
                      >
                        <X size={14} />
                        Supprimer la pièce jointe
                      </button>
                    </div>
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
                  <label>Thème visuel *</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: 'white' }}
                    value={appSettingsForm.themeMode}
                    onChange={(e) => setAppSettingsForm({ ...appSettingsForm, themeMode: e.target.value })}
                  >
                    <option value="light">Mode Clair (Par défaut)</option>
                    <option value="dark">Mode Sombre</option>
                    <option value="glass">Glassmorphism Futuriste</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Pagination (Incidents par page) *</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: 'white' }}
                    value={appSettingsForm.itemsPerPage}
                    onChange={(e) => setAppSettingsForm({ ...appSettingsForm, itemsPerPage: e.target.value })}
                  >
                    <option value="5">5 incidents</option>
                    <option value="10">10 incidents</option>
                    <option value="20">20 incidents</option>
                    <option value="50">50 incidents</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Mise à jour en temps réel *</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: 'white' }}
                    value={appSettingsForm.autoRefreshInterval}
                    onChange={(e) => setAppSettingsForm({ ...appSettingsForm, autoRefreshInterval: e.target.value })}
                  >
                    <option value="0">Désactivé</option>
                    <option value="15">Toutes les 15 secondes</option>
                    <option value="30">Toutes les 30 secondes</option>
                    <option value="60">Toutes les minutes</option>
                    <option value="300">Toutes les 5 minutes</option>
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                    Fréquence de rechargement automatique en arrière-plan de la liste des incidents.
                  </small>
                </div>

                <div className="profile-dropdown-divider" style={{ margin: '4px 0' }}></div>

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

                <div className="profile-dropdown-divider" style={{ margin: '4px 0' }}></div>

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

      {/* Lightbox Preview Modal */}
      {previewFile && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%', padding: '0px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={16} style={{ color: 'var(--primary-600)' }} />
                <span className="modal-title" style={{ fontSize: '15px' }}>Prévisualisation : {previewFile.filename}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewFile(null)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', minHeight: '300px', maxHeight: '75vh', overflow: 'auto' }}>
              {previewLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary-600)' }} />
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Chargement de l'aperçu...</p>
                </div>
              ) : previewError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--red-600)', padding: '20px', textAlign: 'center' }}>
                  <AlertCircle size={32} />
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{previewError}</p>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-small" 
                    style={{ marginTop: '10px' }} 
                    onClick={() => {
                      // retry fetching by resetting previewFile
                      const current = previewFile;
                      setPreviewFile(null);
                      setTimeout(() => setPreviewFile(current), 50);
                    }}
                  >
                    Réessayer
                  </button>
                </div>
              ) : previewBlobUrl ? (
                (() => {
                  const isImage = previewFile.contentType && previewFile.contentType.startsWith('image/');
                  const isPdf = previewFile.contentType === 'application/pdf' || previewFile.filename.toLowerCase().endsWith('.pdf');
                  const isText = previewFile.contentType && (previewFile.contentType.startsWith('text/') || previewFile.filename.toLowerCase().endsWith('.log') || previewFile.filename.toLowerCase().endsWith('.txt'));

                  if (isImage) {
                    return (
                      <img 
                        src={previewBlobUrl} 
                        alt={previewFile.filename} 
                        style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                    );
                  } else if (isPdf) {
                    return (
                      <object 
                        data={previewBlobUrl} 
                        type="application/pdf" 
                        style={{ width: '100%', height: '65vh', borderRadius: '4px' }}
                      >
                        <iframe 
                          src={previewBlobUrl} 
                          style={{ width: '100%', height: '65vh', border: 'none' }}
                          title={previewFile.filename}
                        />
                      </object>
                    );
                  } else if (isText) {
                    return (
                      <iframe 
                        src={previewBlobUrl} 
                        style={{ width: '100%', height: '60vh', border: 'none', backgroundColor: '#ffffff', borderRadius: '4px', padding: '10px' }}
                        title={previewFile.filename}
                      />
                    );
                  } else {
                    return (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-color)' }}>Aucun aperçu disponible pour ce type de fichier.</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Format : {previewFile.contentType || 'Inconnu'}</p>
                        <a 
                          href={previewBlobUrl} 
                          className="btn btn-primary" 
                          style={{ marginTop: '16px', display: 'inline-flex' }}
                          download={previewFile.filename}
                        >
                          <Download size={14} style={{ marginRight: '6px' }} />
                          Télécharger le fichier
                        </a>
                      </div>
                    );
                  }
                })()
              ) : null}
            </div>
            
            <div className="modal-footer" style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {previewBlobUrl && (
                <a 
                  href={previewBlobUrl}
                  className="btn btn-secondary" 
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                  download={previewFile.filename}
                >
                  <Download size={14} style={{ marginRight: '6px' }} />
                  Télécharger
                </a>
              )}
              <button type="button" className="btn btn-primary" onClick={() => setPreviewFile(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowCommandPalette(false)}
          style={{ zIndex: 1200, display: 'flex', alignItems: 'flex-start', paddingTop: '10vh' }}
        >
          <div 
            className="modal-content command-palette-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '600px', 
              width: '90%', 
              padding: '0px', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* Input box */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
              <Search size={18} style={{ color: 'var(--text-muted, #64748b)' }} />
              <input 
                type="text" 
                placeholder="Rechercher un incident, naviguer ou taper '>' pour des commandes rapides..." 
                value={commandPaletteQuery}
                onChange={(e) => {
                  setCommandPaletteQuery(e.target.value);
                  setCommandPaletteSelectedIndex(0);
                }}
                style={{ 
                  flex: 1, 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '14px', 
                  background: 'transparent',
                  color: 'var(--text-color, #1e293b)'
                }}
                autoFocus
              />
              <span style={{ fontSize: '10px', backgroundColor: 'var(--slate-100, #f1f5f9)', color: 'var(--text-muted, #64748b)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>ESC</span>
            </div>

            {/* Results list */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
              {(() => {
                const items = getCommandPaletteItems();
                if (items.length === 0) {
                  return (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '13px' }}>
                      Aucun résultat correspondant à votre recherche.
                    </div>
                  );
                }

                const commands = items.filter(i => i.type === 'command' || i.type === 'nav');
                const incidents = items.filter(i => i.type === 'incident');

                let absoluteIndex = 0;

                return (
                  <div>
                    {commands.length > 0 && (
                      <div>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', color: 'var(--primary-600, #0284c7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions & Navigation</div>
                        {commands.map((item) => {
                          const isSelected = absoluteIndex === commandPaletteSelectedIndex;
                          const currentIndex = absoluteIndex;
                          absoluteIndex++;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                item.action();
                                setShowCommandPalette(false);
                              }}
                              onMouseEnter={() => setCommandPaletteSelectedIndex(currentIndex)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                backgroundColor: isSelected ? 'var(--primary-50, #f0f9ff)' : 'transparent',
                                borderLeft: isSelected ? '3px solid var(--primary-600)' : '3px solid transparent'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '14px' }}>{item.type === 'nav' ? '🧭' : '⚡'}</span>
                                <span style={{ fontSize: '13px', fontWeight: isSelected ? '600' : 'normal', color: isSelected ? 'var(--primary-900, #0c4a6e)' : 'var(--text-color, #1e293b)' }}>
                                  {item.label}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', backgroundColor: 'var(--slate-100)', padding: '2px 6px', borderRadius: '4px' }}>
                                {item.shortcut}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {incidents.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', color: 'var(--primary-600, #0284c7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incidents Correspondants</div>
                        {incidents.map((item) => {
                          const isSelected = absoluteIndex === commandPaletteSelectedIndex;
                          const currentIndex = absoluteIndex;
                          absoluteIndex++;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                item.action();
                                setShowCommandPalette(false);
                              }}
                              onMouseEnter={() => setCommandPaletteSelectedIndex(currentIndex)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                backgroundColor: isSelected ? 'var(--primary-50, #f0f9ff)' : 'transparent',
                                borderLeft: isSelected ? '3px solid var(--primary-600)' : '3px solid transparent'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '14px' }}>📋</span>
                                <span style={{ fontSize: '13px', fontWeight: isSelected ? '600' : 'normal', color: isSelected ? 'var(--primary-900, #0c4a6e)' : 'var(--text-color, #1e293b)' }}>
                                  {item.label}
                                </span>
                              </div>
                              <span className={`badge-small status-${item.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                                {item.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer / Shortcuts Info */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '14px', fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>
              <span>↑↓ pour naviguer</span>
              <span>↵ pour valider</span>
              <span>ESC pour fermer</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
