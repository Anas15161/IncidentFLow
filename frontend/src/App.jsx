import { useState, useEffect, useRef } from 'react';
import {
  Shield, Activity, FileText, AlertTriangle, CheckCircle, Clock,
  Search, User, Plus, X, Bell, Paperclip, Download, Send,
  Globe, Cpu, Stethoscope, ArrowLeft, Eye, EyeOff, RefreshCw, Layers,
  Lock, LogOut, Users, Trash2, Edit3, Settings, AlertCircle,
  ChevronDown, HelpCircle, MessageSquare, PlusCircle, UserPlus, FileUp, CheckSquare,
  Kanban
} from 'lucide-react';
import { KanbanView } from './KanbanView';
import { AnalyticsKPIWidget } from './AnalyticsKPIWidget';
import { AuditTrailView } from './AuditTrailView';
import { DashboardView } from './components/DashboardView';
import { IncidentListView } from './components/IncidentListView';
import { IncidentDetailView } from './components/IncidentDetailView';
import { UserManagementView } from './components/UserManagementView';
import { RoleManagementView } from './components/RoleManagementView';
import { WorkflowConfigView } from './components/WorkflowConfigView';
import { ModalsManager } from './components/ModalsManager';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { getCategoryIcon, renderSlaBadge } from './components/ChartWidgets';
import {
  formatDate, getPriorityColor, formatSlaDuration,
  getDonutSegmentPath, parseMarkdown, getRoleName,
  insertMarkdownAtSelection, getTimelineItemDetails
} from './utils/helpers';
import { getInitialNodes, getInitialEdges, getOrderedStates } from './utils/workflowHelpers';
import { useCommandPalette } from './hooks/useCommandPalette';
import { useDragAndDrop } from './hooks/useDragAndDrop';
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


function App() {


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

  // States
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
    return parseInt(localStorage.getItem('autoRefreshInterval') || '30');
  });
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });
  const [workflowRuleMode, setWorkflowRuleMode] = useState(() => {
    return localStorage.getItem('workflowRuleMode') || 'strict';
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
  const [previewFile, setPreviewFile] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [editingAttachmentId, setEditingAttachmentId] = useState(null);
  const [editingAttachmentName, setEditingAttachmentName] = useState("");
  const [commentTab, setCommentTab] = useState('write');
  const [tickerTime, setTickerTime] = useState(Date.now());
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [editingCommentTab, setEditingCommentTab] = useState('write');

  // Real-time Audit Trail Log State (ISO 27001 / ITIL)
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 101,
      incidentCode: 'INC-001',
      eventType: 'CREATION_INCIDENT',
      actorName: 'Anas Haddou',
      actorEmail: 'anas@netmar.com',
      actorRole: 'Administrateur',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      details: 'Création initiale de l\'incident: Panne serveur de base de données PostgreSQL.',
      ipAddress: '192.168.1.45',
      checksum: 'a8f93e11b4c'
    },
    {
      id: 102,
      incidentCode: 'INC-001',
      eventType: 'REASSIGNATION',
      actorName: 'Anas Haddou',
      actorEmail: 'anas@netmar.com',
      actorRole: 'Administrateur',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      details: 'Réassignation de l\'incident à Marie Laurent (Opératrice Réseau).',
      ipAddress: '192.168.1.45',
      checksum: 'c4b8109f2d1'
    },
    {
      id: 103,
      incidentCode: 'INC-001',
      eventType: 'TRANSITION_STATUT',
      actorName: 'Marie Laurent',
      actorEmail: 'marie.l@netmar.com',
      actorRole: 'Opérateur',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      details: 'Changement d\'état: [Nouveau] ➔ [En cours]. Motif: Analyse des journaux système et redémarrage du service.',
      ipAddress: '192.168.1.88',
      checksum: 'e71029ab54f'
    }
  ]);

  const addAuditLogEntry = (incidentCode, eventType, details) => {
    const roleStr = typeof currentUser?.role === 'string' ? currentUser.role : (currentUser?.role?.name || 'Utilisateur');
    const now = new Date();
    const localTimeString = now.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      incidentCode: incidentCode || 'GLOBAL',
      eventType: eventType,
      actorName: currentUser?.name || 'Anas Haddou',
      actorEmail: currentUser?.email || 'anas@netmar.com',
      actorRole: roleStr,
      timestamp: localTimeString,
      details: details,
      ipAddress: '127.0.0.1',
      checksum: Math.random().toString(36).substring(2, 11)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

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
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper de vérification granulaire des permissions RBAC
  const hasPermission = (permCode) => {
    if (!currentUser || !currentUser.role) return false;
    const roleName = getRoleName(currentUser.role);
    if (roleName === 'Administrateur' || roleName === 'Admin') return true;

    if (currentUser.role.permissions && Array.isArray(currentUser.role.permissions)) {
      return currentUser.role.permissions.some(p => (typeof p === 'string' ? p : p.code) === permCode);
    }
    if (roleName === 'Responsable') {
      return ['PAGE_DASHBOARD', 'PAGE_INCIDENTS', 'PAGE_WORKFLOWS', 'PAGE_SLA', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_EXPORT_PDF', 'INCIDENT_VIEW_MEDICAL', 'WORKFLOW_EDIT'].includes(permCode);
    }
    if (roleName === 'Opérateur') {
      return ['PAGE_DASHBOARD', 'PAGE_INCIDENTS', 'PAGE_SLA', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_EXPORT_PDF'].includes(permCode);
    }
    if (roleName === 'Opérateur médical') {
      return ['PAGE_DASHBOARD', 'PAGE_INCIDENTS', 'PAGE_SLA', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_EXPORT_PDF', 'INCIDENT_VIEW_MEDICAL'].includes(permCode);
    }
    return ['PAGE_DASHBOARD', 'PAGE_INCIDENTS', 'PAGE_SLA', 'INCIDENT_CREATE'].includes(permCode);
  };

  // Bascule instantanée des cases à cocher dans la matrice RBAC
  const handleTogglePermission = async (roleId, permCode) => {
    const targetRole = rolesList.find(r => r.id === roleId);
    if (!targetRole) return;

    let currentCodes = (targetRole.permissions || []).map(p => typeof p === 'string' ? p : p.code);
    let updatedCodes;
    if (currentCodes.includes(permCode)) {
      updatedCodes = currentCodes.filter(c => c !== permCode);
    } else {
      updatedCodes = [...currentCodes, permCode];
    }

    // Mise à jour locale optimiste
    setRolesList(rolesList.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: updatedCodes.map(code => ({ code }))
        };
      }
      return r;
    }));

    try {
      const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedCodes)
      });
      if (res.ok) {
        const updatedRoleFromBackend = await res.json();
        setRolesList(rolesList.map(r => r.id === roleId ? updatedRoleFromBackend : r));
        if (currentUser && currentUser.role && currentUser.role.id === roleId) {
          setCurrentUser({
            ...currentUser,
            role: updatedRoleFromBackend
          });
        }
        setSuccessMessage("Matrice RBAC mise à jour avec succès !");
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error("Erreur de sauvegarde de la permission RBAC", err);
    }
  };

  // Incident Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [priorityFilter, setPriorityFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = itemsPerPage;


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
    severity: 'Mineur',
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
    severity: 'Mineur',
    assignedToId: ''
  });

  const [newComment, setNewComment] = useState('');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [targetTransition, setTargetTransition] = useState(null);
  const [transitionComment, setTransitionComment] = useState('');
  const [showAssignSelect, setShowAssignSelect] = useState(false);

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

  // Modals & Forms for Roles
  const [showRoleCreateModal, setShowRoleCreateModal] = useState(false);
  const [showRoleEditModal, setShowRoleEditModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '' });
  const [editRoleForm, setEditRoleForm] = useState({ id: null, name: '', description: '' });
  const [searchRoleQuery, setSearchRoleQuery] = useState('');

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

  useEffect(() => {
    if (activeWorkflow) {
      setNodes(getInitialNodes(activeWorkflow.states));
      setEdges(getInitialEdges(activeWorkflow.transitions, activeWorkflow.states));
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
  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
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

    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedUser)
      });

      if (!res.ok) throw new Error("Impossible de sauvegarder le profil sur le serveur.");

      const savedUser = await res.json();
      setCurrentUser(savedUser);
      localStorage.setItem('user', JSON.stringify(savedUser));
      setShowEditProfileModal(false);

      // Refresh the users list to show the changes in the grid too
      fetchUsers();

      setSuccessMessage("Profil mis à jour avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
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

      const normalizedData = (data || []).map((inc, idx) => ({
        ...inc,
        incidentCode: inc.incidentCode || inc.code || `INC-2026-${String(inc.id || idx + 1).padStart(3, '0')}`
      }));

      setIncidents(normalizedData);

      // Dynamically populate audit logs for all real incidents
      const generatedLogs = [];
      normalizedData.forEach((inc, idx) => {
        const code = inc.incidentCode;
        const dateStr = inc.createdAt ? new Date(inc.createdAt).toLocaleString('fr-FR') : new Date(Date.now() - (idx + 1) * 3600000).toLocaleString('fr-FR');
        
        generatedLogs.push({
          id: `log-create-${inc.id || idx}`,
          incidentCode: code,
          eventType: 'CREATION_INCIDENT',
          actorName: inc.reportedBy || inc.reporter || 'Anas Haddou',
          actorEmail: 'anas@netmar.com',
          actorRole: 'Administrateur',
          timestamp: dateStr,
          details: `Déclaration initiale de l'incident: "${inc.title}" (Catégorie: ${inc.category || 'Général'})`,
          ipAddress: `192.168.1.${10 + idx}`,
          checksum: Math.random().toString(36).substring(2, 11)
        });

        if (inc.assignedTo) {
          const assigneeName = typeof inc.assignedTo === 'string' ? inc.assignedTo : inc.assignedTo.name;
          generatedLogs.push({
            id: `log-assign-${inc.id || idx}`,
            incidentCode: code,
            eventType: 'REASSIGNATION',
            actorName: 'Anas Haddou',
            actorEmail: 'anas@netmar.com',
            actorRole: 'Administrateur',
            timestamp: dateStr,
            details: `Incident réassigné à ${assigneeName || 'Intervenant Support'}.`,
            ipAddress: '192.168.1.45',
            checksum: Math.random().toString(36).substring(2, 11)
          });
        }

        if (inc.status && inc.status !== 'Nouveau') {
          generatedLogs.push({
            id: `log-status-${inc.id || idx}`,
            incidentCode: code,
            eventType: 'TRANSITION_STATUT',
            actorName: typeof inc.assignedTo === 'string' ? inc.assignedTo : (inc.assignedTo?.name || 'Marie Laurent'),
            actorEmail: 'marie.l@netmar.com',
            actorRole: 'Opérateur',
            timestamp: dateStr,
            details: `Changement d'état: [Nouveau] ➔ [${inc.status}]. Motif: Traitement et prise en charge de l'incident.`,
            ipAddress: `192.168.1.${50 + idx}`,
            checksum: Math.random().toString(36).substring(2, 11)
          });
        }
      });

      // Preserve any real-time user-logged entries at the top
      setAuditLogs(prev => {
        const userAddedLogs = prev.filter(l => typeof l.id === 'number' && l.id > 1000000000000);
        return [...userAddedLogs, ...generatedLogs];
      });
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
        const singleList = data && data.length > 0 ? [data[0]] : [];
        setWorkflows(singleList);
        if (singleList.length > 0) {
          setSelectedWorkflowId(singleList[0].id);
          setActiveWorkflow(singleList[0]);
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

      const permRes = await fetch(`${API_BASE}/permissions`, { headers: getHeaders() });
      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissionsList(permData);
      }
    } catch (err) {
      console.error("Impossible de charger les utilisateurs ou permissions:", err);
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

  // Create Role
  const handleRoleCreate = async (e) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) return;
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newRoleForm.name.trim(),
          description: newRoleForm.description.trim()
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Erreur lors de la création du rôle.");
      }

      const createdRole = await res.json();
      setRolesList(prev => [...prev, createdRole]);
      setShowRoleCreateModal(false);
      setNewRoleForm({ name: '', description: '' });
      setSuccessMessage(`Rôle "${createdRole.name}" créé avec succès !`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Update Role
  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!editRoleForm.id || !editRoleForm.name.trim()) return;
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/roles/${editRoleForm.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editRoleForm.name.trim(),
          description: editRoleForm.description.trim()
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Erreur lors de la mise à jour du rôle.");
      }

      const updatedRole = await res.json();
      setRolesList(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
      setShowRoleEditModal(false);
      setEditRoleForm({ id: null, name: '', description: '' });
      setSuccessMessage(`Rôle "${updatedRole.name}" mis à jour !`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Delete Role
  const handleRoleDelete = async (roleId, roleName) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le rôle "${roleName}" ?`)) return;
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/roles/${roleId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Impossible de supprimer le rôle.");
      }

      setRolesList(prev => prev.filter(r => r.id !== roleId));
      setSuccessMessage(`Rôle "${roleName}" supprimé.`);
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
      priority: newIncident.priority,
      severity: newIncident.severity || 'Mineur'
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
            'Authorization': `Bearer ${token}`,
            'X-Mock-User': currentUser.email
          },
          body: formData
        });

        if (!uploadRes.ok) {
          console.error("Le téléversement de la pièce jointe a échoué.");
        }
      }

      const incCode = createdInc.incidentCode || createdInc.code || `INC-2026-${createdInc.id || 'NEW'}`;
      addAuditLogEntry(
        incCode,
        'CREATION_INCIDENT',
        `Déclaration initiale de l'incident: "${createdInc.title}" (Priorité: ${createdInc.priority || newIncident.priority})`
      );

      setNewIncident({
        title: '',
        description: '',
        category: 'Réseau',
        priority: 'Medium',
        severity: 'Mineur',
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
      severity: selectedIncident.severity || 'Mineur',
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
      severity: editIncidentForm.severity,
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

  // Delete an incident (Admin only)
  const handleDeleteIncident = async (code, e) => {
    if (e) e.stopPropagation();
    const roleName = getRoleName(currentUser?.role);
    if (roleName !== 'Administrateur' && roleName !== 'Admin' && roleName !== 'Administrateur Système') {
      alert("Seul un Administrateur est autorisé à supprimer un incident.");
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'incident ${code} ?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/incidents/${code}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la suppression de l'incident.");
      }

      if (selectedIncidentCode === code) {
        setSelectedIncidentCode(null);
        setSelectedIncident(null);
      }

      fetchIncidents();
      setSuccessMessage(`L'incident ${code} a été supprimé avec succès.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || "Erreur de suppression de l'incident.");
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

      const updated = await res.json();
      setActiveWorkflow(updated);
      setWorkflows([updated]);
      fetchWorkflows();
      fetchIncidents();
      if (selectedIncidentCode) {
        loadIncidentDetail(selectedIncidentCode);
      }
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

  const handleQuickAddTransition = (fromState, toState, roleRequired = '') => {
    if (!activeWorkflow) return;
    const exists = activeWorkflow.transitions.some(
      t => t.fromState.toLowerCase() === fromState.toLowerCase() && t.toState.toLowerCase() === toState.toLowerCase()
    );
    if (exists) return;

    const transObj = {
      fromState,
      toState,
      roleRequired: roleRequired || null,
      requiresComment: false
    };
    const updatedWf = { ...activeWorkflow, transitions: [...activeWorkflow.transitions, transObj] };
    setActiveWorkflow(updatedWf);
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  // Update authorized role for an existing transition
  const handleUpdateTransitionRole = (fromState, toState, roleRequired) => {
    if (!activeWorkflow) return;
    const updatedTrans = activeWorkflow.transitions.map(t => {
      if (t.fromState === fromState && t.toState === toState) {
        return { ...t, roleRequired: roleRequired || null };
      }
      return t;
    });
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

  const handleQuickReassignSubmit = async (assigneeId) => {
    setErrorMessage('');
    const selectedAssignee = usersList.find(u => u.id.toString() === assigneeId.toString());
    const payload = {
      title: selectedIncident.title,
      description: selectedIncident.description,
      category: selectedIncident.category,
      priority: selectedIncident.priority,
      severity: selectedIncident.severity,
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
        throw new Error(errorData.message || "Erreur de réassignation de l'incident.");
      }

      const updatedIncident = await res.json();
      setIncidents(prev => prev.map(inc => 
        inc.incidentCode === updatedIncident.incidentCode ? updatedIncident : inc
      ));
      setSelectedIncident(updatedIncident);
      setShowAssignSelect(false);
      setSuccessMessage('Incident réassigné avec succès.');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      const newLog = {
        id: Date.now().toString(),
        type: 'UPDATE',
        incidentId: updatedIncident.id || updatedIncident.incidentCode,
        user: currentUser?.name || 'Système',
        action: `Incident réassigné à ${selectedAssignee ? selectedAssignee.name : 'Non assigné'}`,
        date: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);

    } catch (err) {
      setErrorMessage(err.message);
    }
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

  const executeIncidentTransition = async (incidentCode, toState, comment = '') => {
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentCode}/transition`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ toState, comment })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "La transition a échoué.");
      }

      if (selectedIncident && selectedIncident.incidentCode === incidentCode) {
        loadIncidentDetail(incidentCode);
      }
      fetchIncidents();

      setNotifications(prev => [
        { id: Date.now(), text: `Incident ${incidentCode} passé à l'état ${toState}`, time: "À l'instant" },
        ...prev
      ]);

      // Real-time Audit Trail Recording
      addAuditLogEntry(
        incidentCode,
        'TRANSITION_STATUT',
        `Changement d'état vers [${toState}]. Motif: ${comment || 'Aucun commentaire'}`
      );

      return true;
    } catch (err) {
      alert(`Transition impossible : ${err.message}`);
      return false;
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

      addAuditLogEntry(
        selectedIncident.incidentCode,
        'AJOUT_COMMENTAIRE',
        `Ajout d'un commentaire sur l'incident: "${newComment}"`
      );

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
          'Authorization': `Bearer ${token}`,
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

  const handleInsertEditMarkdown = (type) => {
    const newValue = insertMarkdownAtSelection('comment-edit-textarea', editingCommentContent, type);
    setEditingCommentContent(newValue);
  };



  const handleInsertMarkdown = (type) => {
    const newValue = insertMarkdownAtSelection('comment-editor-textarea', newComment, type);
    setNewComment(newValue);
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

  // Filtered Roles list
  const filteredRoles = rolesList.filter(role => {
    const searchLower = searchRoleQuery.toLowerCase();
    const nameMatch = role.name && role.name.toLowerCase().includes(searchLower);
    const descMatch = role.description && role.description.toLowerCase().includes(searchLower);
    return !searchRoleQuery || nameMatch || descMatch;
  });

  const { 
    isDragging: isDraggingUpload, 
    handleDragOver: handleDragOverUpload, 
    handleDragEnter: handleDragEnterUpload, 
    handleDragLeave: handleDragLeaveUpload, 
    handleDrop: handleDropUpload 
  } = useDragAndDrop(uploadFile);

  const { 
    isDragging: isDraggingCreate, 
    handleDragOver: handleDragOverCreate, 
    handleDragEnter: handleDragEnterCreate, 
    handleDragLeave: handleDragLeaveCreate, 
    handleDrop: handleDropCreate 
  } = useDragAndDrop(setNewIncidentFile);

  const {
    showCommandPalette, setShowCommandPalette,
    commandPaletteQuery, setCommandPaletteQuery,
    commandPaletteSelectedIndex, setCommandPaletteSelectedIndex,
    commandPaletteInputRef, getCommandPaletteItems
  } = useCommandPalette(setShowCreateModal, setCurrentView, incidents);

  // Authenticate wrapper
  if (!isAuthenticated) {
    return (
      <LoginPage
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        showLoginPassword={showLoginPassword}
        setShowLoginPassword={setShowLoginPassword}
        isCapsLockOn={isCapsLockOn}
        setIsCapsLockOn={setIsCapsLockOn}
        handleLoginSubmit={handleLoginSubmit}
        triggerQuickLogin={triggerQuickLogin}
      />
    );
  }

  return (
<div className="app-container">
      {/* 1. SIDEBAR */}
      <Sidebar 
        hasPermission={hasPermission}
        currentView={currentView}
        setCurrentView={setCurrentView}
        setSelectedIncidentCode={setSelectedIncidentCode}
        incidents={incidents}
        sessionTimeLeft={sessionTimeLeft}
        currentUser={currentUser}
        getRoleName={getRoleName}
        handleLogout={handleLogout}
      />

      {/* 2. MAIN VIEWPORT */}
      <main className="main-viewport">
        {/* TOPBAR HEADER */}
        <Topbar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fetchIncidents={fetchIncidents}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          showProfileDropdown={showProfileDropdown}
          setShowProfileDropdown={setShowProfileDropdown}
          currentUser={currentUser}
          getRoleName={getRoleName}
          handleOpenEditProfile={handleOpenEditProfile}
          handleOpenAppSettings={handleOpenAppSettings}
          setShowHelpModal={setShowHelpModal}
          handleLogout={handleLogout}
        />

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
              <IncidentDetailView
                selectedIncident={selectedIncident}
                setSelectedIncidentCode={setSelectedIncidentCode}
                getCategoryIcon={getCategoryIcon}
                tickerTime={tickerTime}
                hasPermission={hasPermission}
                handleOpenEditModal={handleOpenEditModal}
                handleDeleteIncident={handleDeleteIncident}
                activeWorkflow={activeWorkflow}
                workflows={workflows}
                selectedIncidentWorkflow={selectedIncidentWorkflow}
                getOrderedStates={getOrderedStates}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                renderSlaBadge={renderSlaBadge}
                formatSlaDuration={formatSlaDuration}
                getRoleName={getRoleName}
                currentUser={currentUser}
                handleTransitionClick={handleTransitionClick}
                showAssignSelect={showAssignSelect}
                setShowAssignSelect={setShowAssignSelect}
                usersList={usersList}
                handleQuickReassignSubmit={handleQuickReassignSubmit}
                commentTab={commentTab}
                setCommentTab={setCommentTab}
                parseMarkdown={parseMarkdown}
                handleAddCommentSubmit={handleAddCommentSubmit}
                newComment={newComment}
                setNewComment={setNewComment}
                editingCommentId={editingCommentId}
                editingCommentContent={editingCommentContent}
                setEditingCommentContent={setEditingCommentContent}
                handleStartEditComment={handleStartEditComment}
                handleSaveEditComment={handleSaveEditComment}
                handleCancelEditComment={handleCancelEditComment}
                handleDeleteComment={handleDeleteComment}
                editingAttachmentId={editingAttachmentId}
                editingAttachmentName={editingAttachmentName}
                setEditingAttachmentName={setEditingAttachmentName}
                handleSaveRename={handleSaveRename}
                handleCancelRename={handleCancelRename}
                setPreviewFile={setPreviewFile}
                handleDownloadAttachment={handleDownloadAttachment}
                handleStartRename={handleStartRename}
                handleDeleteAttachment={handleDeleteAttachment}
                isDraggingUpload={isDraggingUpload}
                handleDragOver={handleDragOverUpload}
                handleDragEnterUpload={handleDragEnterUpload}
                handleDragLeaveUpload={handleDragLeaveUpload}
                handleDropUpload={handleDropUpload}
                handleFileUpload={handleFileUpload}
              />
            ) : currentView === 'dashboard' ? (
              <DashboardView
                incidents={incidents}
                hasPermission={hasPermission}
                setShowCreateModal={setShowCreateModal}
                setCurrentView={setCurrentView}
                setStatusFilter={setStatusFilter}
                handleSelectIncident={handleSelectIncident}
                getCategoryIcon={getCategoryIcon}
                getPriorityColor={getPriorityColor}
                renderSlaBadge={renderSlaBadge}

              />
            ) : currentView === 'incidents' ? (
              <IncidentListView
                handleExportCSV={handleExportCSV}
                handleExportPDF={handleExportPDF}
                hasPermission={hasPermission}
                setShowCreateModal={setShowCreateModal}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setCurrentPage={setCurrentPage}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                activeWorkflow={activeWorkflow}
                workflows={workflows}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortedIncidents={sortedIncidents}
                currentIncidents={currentIncidents}
                loading={loading}
                handleSelectIncident={handleSelectIncident}
                getCategoryIcon={getCategoryIcon}
                getPriorityColor={getPriorityColor}
                renderSlaBadge={renderSlaBadge}
                formatDate={formatDate}
                currentUser={currentUser}
                getRoleName={getRoleName}
                handleDeleteIncident={handleDeleteIncident}
                totalPages={totalPages}
                currentPage={currentPage}
              />
            ) : currentView === 'kanban' ? (
              <KanbanView
                incidents={incidents}
                activeWorkflow={activeWorkflow}
                currentUser={currentUser}
                usersList={usersList}
                hasPermission={hasPermission}
                onSelectIncident={(code) => {
                  setSelectedIncidentCode(code);
                  loadIncidentDetail(code);
                  setCurrentView('incidents');
                }}
                onExecuteTransition={async (incident, targetState, comment) => {
                  return await executeIncidentTransition(incident.incidentCode, targetState, comment);
                }}
                onReassignIncident={async (incidentCode, newUserObj) => {
                  try {
                    const payload = {
                      assignedTo: newUserObj ? { id: newUserObj.id } : null
                    };
                    const res = await fetch(`${API_BASE}/incidents/${incidentCode}`, {
                      method: 'PUT',
                      headers: getHeaders(),
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                      throw new Error("Erreur lors de la réassignation de l'incident.");
                    }
                    fetchIncidents();
                    setSuccessMessage(`Incident ${incidentCode} réassigné à ${newUserObj?.name || 'Personne'}`);
                    setTimeout(() => setSuccessMessage(''), 3000);
                    addAuditLogEntry(incidentCode, 'REASSIGNATION', `Réassignation de l'incident à ${newUserObj?.name || 'Non assigné'}`);
                  } catch (err) {
                    console.error("Erreur réassignation rapide:", err);
                  }
                }}
              />
            ) : currentView === 'audit' ? (
              <AuditTrailView auditLogs={auditLogs} currentUser={currentUser} />
            ) : currentView === 'workflows' ? (
              <WorkflowConfigView
                handleSaveWorkflowGlobally={handleSaveWorkflowGlobally}
                workflows={workflows}
                selectedWorkflowId={selectedWorkflowId}
                setSelectedWorkflowId={setSelectedWorkflowId}
                activeWorkflow={activeWorkflow}
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                setActiveWorkflow={setActiveWorkflow}
                setWorkflows={setWorkflows}
                handleToggleWorkflowActive={handleToggleWorkflowActive}
                handleUpdateStateColor={handleUpdateStateColor}
                handleToggleStateActive={handleToggleStateActive}
                handleDeleteStateFromWorkflow={handleDeleteStateFromWorkflow}
                handleAddStateToWorkflow={handleAddStateToWorkflow}
                newStateId={newStateId}
                setNewStateId={setNewStateId}
                newStateLabel={newStateLabel}
                setNewStateLabel={setNewStateLabel}
                rolesList={rolesList}
                handleUpdateTransitionRole={handleUpdateTransitionRole}
                handleDeleteTransitionFromWorkflow={handleDeleteTransitionFromWorkflow}
                handleQuickAddTransition={handleQuickAddTransition}
                handleAddTransitionToWorkflow={handleAddTransitionToWorkflow}
                newTransFrom={newTransFrom}
                setNewTransFrom={setNewTransFrom}
                newTransTo={newTransTo}
                setNewTransTo={setNewTransTo}
                newTransRole={newTransRole}
                setNewTransRole={setNewTransRole}
                newTransRequiresComment={newTransRequiresComment}
                setNewTransRequiresComment={setNewTransRequiresComment}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgesDelete={onEdgesDelete}
              />
            ) : currentView === 'users' ? (
              <UserManagementView
                setShowUserCreateModal={setShowUserCreateModal}
                currentView={currentView}
                setCurrentView={setCurrentView}
                searchUserQuery={searchUserQuery}
                setSearchUserQuery={setSearchUserQuery}
                roleUserFilter={roleUserFilter}
                setRoleUserFilter={setRoleUserFilter}
                rolesList={rolesList}
                filteredUsers={filteredUsers}
                setEditingUser={setEditingUser}
                setShowUserEditModal={setShowUserEditModal}
                handleUserDelete={handleUserDelete}
              />
            ) : currentView === 'roles' ? (
              <RoleManagementView
                currentUser={currentUser}
                getRoleName={getRoleName}
                setCurrentView={setCurrentView}
                setShowRoleCreateModal={setShowRoleCreateModal}
                currentView={currentView}
                rolesList={rolesList}
                usersList={usersList}
                searchRoleQuery={searchRoleQuery}
                setSearchRoleQuery={setSearchQuery}
                filteredRoles={filteredRoles}
                setEditRoleForm={setEditRoleForm}
                setShowRoleEditModal={setShowRoleEditModal}
                handleRoleDelete={handleRoleDelete}
                permissionsList={permissionsList}
                handleTogglePermission={handleTogglePermission}
              />
            ) : null}

          </div>
        </div>
      </main>

      {/* ==========================================
          MODALS & DIALOGS PORTALS
          ========================================== */}
      <ModalsManager
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        handleEditIncidentSubmit={handleEditIncidentSubmit}
        editIncidentForm={editIncidentForm}
        setEditIncidentForm={setEditIncidentForm}
        usersList={usersList}
        getRoleName={getRoleName}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        handleCreateIncidentSubmit={handleCreateIncidentSubmit}
        newIncident={newIncident}
        setNewIncident={setNewIncident}
        showTransitionModal={showTransitionModal}
        setShowTransitionModal={setShowTransitionModal}
        targetTransition={targetTransition}
        selectedIncident={selectedIncident}
        transitionComment={transitionComment}
        setTransitionComment={setTransitionComment}
        executeTransition={executeTransition}
        showUserCreateModal={showUserCreateModal}
        setShowUserCreateModal={setShowUserCreateModal}
        handleUserCreateSubmit={handleUserCreateSubmit}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        rolesList={rolesList}
        showUserEditModal={showUserEditModal}
        setShowUserEditModal={setShowUserEditModal}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        handleUserEditSubmit={handleUserEditSubmit}
        showEditProfileModal={showEditProfileModal}
        setShowEditProfileModal={setShowEditProfileModal}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        handleEditProfileSubmit={handleEditProfileSubmit}
        showAppSettingsModal={showAppSettingsModal}
        setShowAppSettingsModal={setShowAppSettingsModal}
        appSettingsForm={appSettingsForm}
        setAppSettingsForm={setAppSettingsForm}
        handleAppSettingsSubmit={handleAppSettingsSubmit}
        showHelpModal={showHelpModal}
        setShowHelpModal={setShowHelpModal}
        previewFile={previewFile}
        setPreviewFile={setPreviewFile}
        previewBlobUrl={previewBlobUrl}
        previewLoading={previewLoading}
        previewError={previewError}
        showCommandPalette={showCommandPalette}
        setShowCommandPalette={setShowCommandPalette}
        commandPaletteQuery={commandPaletteQuery}
        setCommandPaletteQuery={setCommandPaletteQuery}
        commandPaletteInputRef={commandPaletteInputRef}
        setCommandPaletteSelectedIndex={setCommandPaletteSelectedIndex}
        getCommandPaletteItems={getCommandPaletteItems}
        commandPaletteSelectedIndex={commandPaletteSelectedIndex}
        showRoleCreateModal={showRoleCreateModal}
        setShowRoleCreateModal={setShowRoleCreateModal}
        handleRoleCreate={handleRoleCreate}
        newRoleForm={newRoleForm}
        setNewRoleForm={setNewRoleForm}
        showRoleEditModal={showRoleEditModal}
        setShowRoleEditModal={setShowRoleEditModal}
        handleRoleUpdate={handleRoleUpdate}
        editRoleForm={editRoleForm}
        setEditRoleForm={setEditRoleForm}
      />

    </div>
  );
}

export default App;
