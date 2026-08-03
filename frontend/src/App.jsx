import { useState, useEffect } from 'react';
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
  if (!states || states.length === 0) return [];

  const statePosMap = {
    'nouveau': { x: 40, y: 180 },
    'assigné': { x: 230, y: 180 },
    'en cours': { x: 420, y: 180 },
    'résolu': { x: 610, y: 180 },
    'clôturé': { x: 800, y: 180 },
    'cloture': { x: 800, y: 180 }
  };

  const customStates = states.filter(s => !statePosMap[s.name.toLowerCase().trim()]);

  return states.map((state) => {
    const key = state.name.toLowerCase().trim();
    const isNouveau = key === 'nouveau';
    const isCloture = key === 'clôturé' || key === 'cloture';

    let nodeType = 'default';
    if (isNouveau) nodeType = 'input';
    else if (isCloture) nodeType = 'output';

    let pos = statePosMap[key];
    if (!pos) {
      const customIdx = customStates.findIndex(c => c.name.toLowerCase().trim() === key);
      pos = {
        x: 230 + (customIdx * 190),
        y: customIdx % 2 === 0 ? 60 : 300
      };
    }

    return {
      id: state.name,
      type: nodeType,
      data: { label: `${state.label || state.name}` },
      position: pos,
      sourcePosition: 'right',
      targetPosition: 'left',
      style: {
        background: state.active ? 'var(--card-bg)' : 'var(--border-color)',
        color: 'var(--text-main)',
        border: '2px solid ' + (isNouveau ? '#10b981' : isCloture ? '#6366f1' : '#3b82f6'),
        borderRadius: '10px',
        padding: '12px',
        fontWeight: 'bold',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        width: 145,
        textAlign: 'center'
      }
    };
  });
};

const getInitialEdges = (transitions, states) => {
  if (!transitions || !states) return [];
  const stateNameMap = new Map();
  states.forEach(s => stateNameMap.set(s.name.toLowerCase().trim(), s.name));

  return transitions
    .map((t, idx) => {
      const source = stateNameMap.get((t.fromState || '').toLowerCase().trim()) || t.fromState;
      const target = stateNameMap.get((t.toState || '').toLowerCase().trim()) || t.toState;

      if (!source || !target) return null;

      const isReverse = source.toLowerCase() === 'résolu' && target.toLowerCase() === 'en cours';

      return {
        id: `e-${source}-${target}-${idx}`,
        source: source,
        target: target,
        animated: true,
        type: 'smoothstep',
        style: { stroke: isReverse ? '#f59e0b' : '#3b82f6', strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isReverse ? '#f59e0b' : '#3b82f6',
          width: 20,
          height: 20
        },
        label: t.roleRequired ? `🔑 ${t.roleRequired}` : ''
      };
    })
    .filter(Boolean);
};

const getOrderedStates = (wf) => {
  if (!wf || !wf.states || wf.states.length === 0) return [];
  const states = wf.states;
  const transitions = wf.transitions || [];

  const stateMap = new Map();
  states.forEach(s => stateMap.set(s.name.toLowerCase().trim(), s));

  const initialKey = states.find(s => s.name.toLowerCase().trim() === 'nouveau')?.name.toLowerCase().trim() || states[0].name.toLowerCase().trim();

  const adj = new Map();
  states.forEach(s => adj.set(s.name.toLowerCase().trim(), []));
  transitions.forEach(t => {
    const from = (t.fromState || '').toLowerCase().trim();
    const to = (t.toState || '').toLowerCase().trim();
    if (adj.has(from) && adj.has(to)) {
      adj.get(from).push(to);
    }
  });

  const orderedKeys = [];
  const visited = new Set();
  const queue = [initialKey];

  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (!visited.has(currentKey) && stateMap.has(currentKey)) {
      visited.add(currentKey);
      orderedKeys.push(currentKey);

      const neighbors = adj.get(currentKey) || [];
      // Prioritize non-final states so 'clôturé' appears last
      neighbors.sort((a, b) => (a === 'clôturé' || a === 'cloture' ? 1 : 0) - (b === 'clôturé' || b === 'cloture' ? 1 : 0));
      neighbors.forEach(n => {
        if (!visited.has(n) && !queue.includes(n)) {
          queue.push(n);
        }
      });
    }
  }

  // Append any unvisited states before 'clôturé'
  states.forEach(s => {
    const key = s.name.toLowerCase().trim();
    if (!visited.has(key)) {
      orderedKeys.push(key);
    }
  });

  // Ensure 'clôturé' is at the very end
  const clotureIdx = orderedKeys.findIndex(k => k === 'clôturé' || k === 'cloture');
  if (clotureIdx !== -1 && clotureIdx !== orderedKeys.length - 1) {
    const [clotureKey] = orderedKeys.splice(clotureIdx, 1);
    orderedKeys.push(clotureKey);
  }

  return orderedKeys.map(k => stateMap.get(k)).filter(Boolean);
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

  // Get filtered items for the Command Palette (Ctrl+K)
  const getCommandPaletteItems = () => {
    const items = [];
    const query = commandPaletteQuery.toLowerCase().trim();

    // Static commands list
    const commands = [
      { id: 'cmd-new', type: 'command', label: 'Déclarer un incident', shortcut: '> new', action: () => { setShowCreateModal(true); } },
      { id: 'nav-dash', type: 'nav', label: 'Aller au Tableau de bord', shortcut: '> dashboard', action: () => { setCurrentView('dashboard'); } },
      { id: 'nav-inc', type: 'nav', label: 'Aller à la liste des Incidents', shortcut: '> incidents', action: () => { setCurrentView('incidents'); } },
      { id: 'nav-wf', type: 'nav', label: 'Aller au Workflow', shortcut: '> workflow', action: () => { setCurrentView('workflows'); } },
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
        bgColor: 'var(--body-bg)',
        borderColor: 'var(--border-color)',
        title: 'Commentaire'
      };
    }

    // Created / Declared
    if (act.includes('créé') || act.includes('déclaré') || act.includes('création') || act.includes('signalé')) {
      return {
        icon: <PlusCircle size={14} />,
        color: '#06b6d4', // cyan
        bgColor: 'var(--body-bg)',
        borderColor: 'var(--border-color)',
        title: 'Incident Déclaré'
      };
    }

    // Default
    return {
      icon: <Clock size={14} />,
      color: '#64748b',
      bgColor: 'var(--body-bg)',
      borderColor: 'var(--border-color)',
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

  // Helper de formatage clair et propre des temps SLA (évite le défilement inutile des secondes sauf urgence)
  const formatSlaDuration = (ms) => {
    const isOverdue = ms < 0;
    const absMs = Math.abs(ms);

    const totalMins = Math.floor(absMs / (1000 * 60));
    const totalHours = Math.floor(absMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    const remMins = totalMins % 60;
    const remSecs = Math.floor((absMs / 1000) % 60);

    if (isOverdue) {
      if (days > 0) {
        return `Dépassé de ${days}j ${remHours > 0 ? remHours + 'h' : ''}`.trim();
      }
      if (totalHours > 0) {
        return `Dépassé de ${totalHours}h ${remMins > 0 ? remMins + 'm' : ''}`.trim();
      }
      return `Dépassé de ${totalMins} min`;
    } else {
      if (days > 0) {
        return `Reste ${days}j ${remHours}h`;
      }
      if (totalHours > 0) {
        return `Reste ${totalHours}h ${remMins}m`;
      }
      if (totalMins >= 15) {
        return `Reste ${totalMins} min`;
      }
      // Moins de 15 min : afficher minutes et secondes pour l'urgence
      return `Reste ${totalMins}m ${remSecs}s`;
    }
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
    const formattedText = formatSlaDuration(diffMs);

    if (diffMs < 0) {
      if (inc.escalated) {
        return (
          <span className="badge pulse-active-glow" style={{ backgroundColor: '#fff5f5', color: '#e53e3e', borderColor: '#feb2b2', fontWeight: 'bold' }} title={`${formattedText} (Escaladé automatiquement)`}>
            🚨 SLA {formattedText} (Escaladé)
          </span>
        );
      }

      return (
        <span className="badge pulse-active-glow" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', fontWeight: 'bold' }}>
          ⚠ SLA {formattedText}
        </span>
      );
    }

    const totalMinutes = Math.floor(diffMs / 60000);

    if (totalMinutes < 15) {
      return (
        <span className="badge animate-pulse-red" style={{ fontWeight: 'bold' }}>
          ⏱ Échéance ({formattedText})
        </span>
      );
    }

    if (totalMinutes <= 30) {
      return (
        <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fdba74', fontWeight: 'bold' }}>
          ⏱ Échéance ({formattedText})
        </span>
      );
    }

    return (
      <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 'bold' }}>
        ⏱ {formattedText}
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
          <circle cx="70" cy="70" r="50" fill="transparent" stroke="var(--border-color)" strokeWidth="12" />
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
          backgroundColor: 'var(--card-bg)',
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

  // Filtered Roles list
  const filteredRoles = rolesList.filter(role => {
    const searchLower = searchRoleQuery.toLowerCase();
    const nameMatch = role.name && role.name.toLowerCase().includes(searchLower);
    const descMatch = role.description && role.description.toLowerCase().includes(searchLower);
    return !searchRoleQuery || nameMatch || descMatch;
  });

  // Authenticate wrapper
  if (!isAuthenticated) {
    return (
      <div className="login-container-split">
        {/* Left Side: Illustration Banner */}
        <div className="login-banner-side">
          <div className="login-banner-overlay" />
          <div className="login-banner-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Activity size={18} style={{ color: '#60a5fa' }} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>IncidentFlow</h1>
            </div>

            <h2 className="login-banner-title">
              Gérez vos incidents de support <span className="highlight-itil">ITIL</span> avec <span className="highlight-fluidite">fluidité</span>.
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '15.5px', lineHeight: '1.6', marginBottom: '32px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              Une plateforme moderne combinant gestion de workflow dynamique, comptes à rebours SLA actifs et communication en temps réel pour vos équipes d'exploitation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <CheckCircle size={14} style={{ color: '#34d399' }} />
                </div>
                <span>Workflow de transition dynamique réactif</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <CheckCircle size={14} style={{ color: '#34d399' }} />
                </div>
                <span>Compte à rebours de résolution SLA actif</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <CheckCircle size={14} style={{ color: '#34d399' }} />
                </div>
                <span>Éditeur de diagnostics en Markdown & historique Git-style</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="login-form-side">
          {/* Ambient Glowing Blobs */}
          <div style={{ position: 'absolute', top: '15%', left: '20%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0) 70%)', filter: 'blur(45px)', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.14) 0%, rgba(168, 85, 247, 0) 70%)', filter: 'blur(55px)', zIndex: 0, pointerEvents: 'none' }} />

          <div className="card neon-card-glow" style={{ width: '100%', maxWidth: '480px', padding: '44px', borderRadius: '20px', background: 'rgba(30, 41, 59, 0.65)', backdropFilter: 'blur(16px)', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <div className="brand-icon animate-pulse-red" style={{ width: '48px', height: '48px', marginBottom: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
                <Activity className="text-white" size={24} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.75px', marginBottom: '4px' }}>IncidentFlow</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>Connexion utilisateur sécurisée</p>
            </div>

            {loginError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            {/* Primary Enterprise SSO Action */}
            {/*<button
              type="button"
              onClick={() => triggerQuickLogin('anas@netmar.com')}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontWeight: '700',
                backgroundColor: '#4f46e5',
                borderColor: '#4338ca',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                fontSize: '13px'
              }}
            >
              <Shield size={16} />
              Connexion Unique Keycloak (SSO)
            </button> */}


            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', letterSpacing: '0.08em' }}>OU CONNEXION DIRECTE</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
          {hasPermission('PAGE_DASHBOARD') && (
            <button
              className={`nav-btn ${currentView === 'dashboard' && !selectedIncidentCode ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); setSelectedIncidentCode(null); }}
            >
              <span className="nav-label">
                <Activity size={18} />
                Dashboard
              </span>
            </button>
          )}

          {hasPermission('PAGE_INCIDENTS') && (
            <>
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
                className={`nav-btn ${currentView === 'kanban' ? 'active' : ''}`}
                onClick={() => { setCurrentView('kanban'); setSelectedIncidentCode(null); }}
              >
                <span className="nav-label">
                  <Kanban size={18} />
                  Tableau Kanban
                </span>
              </button>

              <button
                className={`nav-btn ${currentView === 'audit' ? 'active' : ''}`}
                onClick={() => { setCurrentView('audit'); setSelectedIncidentCode(null); }}
              >
                <span className="nav-label">
                  <Clock size={18} />
                  Journal d'Audit ISO 27001
                </span>
              </button>
            </>
          )}

          {hasPermission('PAGE_WORKFLOWS') && (
            <button
              className={`nav-btn ${currentView === 'workflows' ? 'active' : ''}`}
              onClick={() => { setCurrentView('workflows'); setSelectedIncidentCode(null); }}
            >
              <span className="nav-label">
                <Layers size={18} />
                Paramètres Workflow
              </span>
            </button>
          )}

          {(hasPermission('PAGE_USERS') || getRoleName(currentUser.role) === 'Administrateur') && (
            <>
              <button
                className={`nav-btn ${currentView === 'users' ? 'active' : ''}`}
                onClick={() => { setCurrentView('users'); setSelectedIncidentCode(null); }}
              >
                <span className="nav-label">
                  <Users size={18} />
                  Gestion Utilisateurs
                </span>
              </button>

              <button
                className={`nav-btn ${currentView === 'roles' ? 'active' : ''}`}
                onClick={() => { setCurrentView('roles'); setSelectedIncidentCode(null); }}
              >
                <span className="nav-label">
                  <Shield size={18} />
                  Gestion des Rôles & Matrice RBAC
                </span>
              </button>
            </>
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
                handleDragOver={handleDragOver}
                handleDragEnterUpload={handleDragEnterUpload}
                handleDragLeaveUpload={handleDragLeaveUpload}
                handleDropUpload={handleDropUpload}
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
                renderPriorityDonut={renderPriorityDonut}
                renderRealTimeTrendChart={renderRealTimeTrendChart}
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
