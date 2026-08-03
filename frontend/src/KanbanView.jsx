import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Clock, Search, Kanban, X, Filter, AlertTriangle, ShieldAlert,
  CheckCircle, User, Tag, Sparkles, RefreshCw, UserCheck, ChevronRight,
  Eye, UserPlus, FileText, Calendar, Lock, Crown, Settings, ShieldCheck,
  ChevronDown, Check, Printer, Download, BarChart2, Activity
} from 'lucide-react';
import { AnalyticsKPIWidget } from './AnalyticsKPIWidget';

const DEFAULT_COLUMNS = [
  { name: 'Nouveau', color: '#3b82f6', badgeBg: 'rgba(59, 130, 246, 0.12)', badgeText: '#2563eb', wipLimit: 10 },
  { name: 'En cours', color: '#f59e0b', badgeBg: 'rgba(245, 158, 11, 0.12)', badgeText: '#d97706', wipLimit: 5 },
  { name: 'Résolu', color: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.12)', badgeText: '#059669', wipLimit: 15 },
  { name: 'Clôturé', color: '#6b7280', badgeBg: 'rgba(107, 114, 128, 0.12)', badgeText: '#4b5563', wipLimit: 999 }
];

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #ec4899, #be185d)'
];

const normalizePriority = (p) => {
  const val = (p || '').toLowerCase().trim();
  if (val === 'critical' || val === 'critique') return 'critical';
  if (val === 'high' || val === 'haute' || val === 'important') return 'high';
  if (val === 'medium' || val === 'moyenne' || val === 'mineur') return 'medium';
  if (val === 'low' || val === 'basse') return 'low';
  return val;
};

const getPriorityLabel = (priority) => {
  const norm = normalizePriority(priority);
  if (norm === 'critical') return 'Critique';
  if (norm === 'high') return 'Haute';
  if (norm === 'medium') return 'Moyenne';
  if (norm === 'low') return 'Basse';
  return priority || 'Normale';
};

const getAssigneeInitial = (assignedTo) => {
  if (typeof assignedTo === 'string' && assignedTo.trim().length > 0) {
    return assignedTo.trim().charAt(0).toUpperCase();
  }
  if (assignedTo && typeof assignedTo === 'object' && assignedTo.name) {
    return String(assignedTo.name).trim().charAt(0).toUpperCase();
  }
  return '?';
};

const getAssigneeName = (assignedTo) => {
  if (!assignedTo) return 'Non assigné';
  if (typeof assignedTo === 'string') return assignedTo.trim() || 'Non assigné';
  if (typeof assignedTo === 'object' && assignedTo.name) return assignedTo.name;
  return String(assignedTo);
};

const isUserAdmin = (user) => {
  if (!user || !user.role) return false;
  const roleName = typeof user.role === 'string' ? user.role : (user.role.name || '');
  const normRole = roleName.toLowerCase().trim();
  return normRole.includes('admin') || normRole.includes('gestionnaire');
};

const isAssignedToCurrentUser = (incident, currentUser) => {
  if (!incident || !currentUser) return false;
  const assigned = incident.assignedTo;
  if (!assigned) return false;

  const currentName = (currentUser.name || '').toLowerCase().trim();
  const currentEmail = (currentUser.email || '').toLowerCase().trim();

  if (typeof assigned === 'string') {
    const normAssigned = assigned.toLowerCase().trim();
    if (!normAssigned) return false;
    if (normAssigned === currentName || normAssigned === currentEmail) return true;
    if (currentName && normAssigned.includes(currentName)) return true;
    if (currentEmail && normAssigned.includes(currentEmail.split('@')[0])) return true;
  } else if (typeof assigned === 'object') {
    const name = (assigned.name || '').toLowerCase().trim();
    const email = (assigned.email || '').toLowerCase().trim();
    if (name && currentName && name === currentName) return true;
    if (email && currentEmail && email === currentEmail) return true;
  }
  return false;
};

// Option B: Strict Security & Visibility check
const canUserSeeIncident = (inc, currentUser) => {
  if (!inc || !currentUser) return false;
  if (isUserAdmin(currentUser)) return true;

  if (isAssignedToCurrentUser(inc, currentUser)) return true;

  const userEmail = (currentUser.email || '').toLowerCase().trim();
  const userName = (currentUser.name || '').toLowerCase().trim();

  const reporter = (inc.reportedBy || inc.reporter || inc.createdBy || '').toLowerCase().trim();
  if (reporter && (reporter === userEmail || reporter === userName)) return true;

  return false;
};

const getAvatarGradient = (name) => {
  const code = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

// Topological ordering helper based on workflow transition graph
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
      neighbors.sort((a, b) => (a === 'clôturé' || a === 'cloture' ? 1 : 0) - (b === 'clôturé' || b === 'cloture' ? 1 : 0));
      neighbors.forEach(n => {
        if (!visited.has(n) && !queue.includes(n)) {
          queue.push(n);
        }
      });
    }
  }

  states.forEach(s => {
    const key = s.name.toLowerCase().trim();
    if (!visited.has(key)) {
      orderedKeys.push(key);
    }
  });

  const clotureIdx = orderedKeys.findIndex(k => k === 'clôturé' || k === 'cloture');
  if (clotureIdx !== -1 && clotureIdx !== orderedKeys.length - 1) {
    const [clotureKey] = orderedKeys.splice(clotureIdx, 1);
    orderedKeys.push(clotureKey);
  }

  return orderedKeys.map(k => stateMap.get(k)).filter(Boolean);
};

// Executive Professional Priority Dropdown
const PriorityFilterDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const options = [
    { value: 'Tous', label: 'Toutes les priorités', color: '#64748b', desc: 'Afficher tous les niveaux de priorité' },
    { value: 'Critical', label: 'Critique', color: '#ef4444', desc: 'Intervention urgente (< 4h)' },
    { value: 'High', label: 'Haute', color: '#f59e0b', desc: 'Traitement prioritaire (< 24h)' },
    { value: 'Medium', label: 'Moyenne', color: '#3b82f6', desc: 'Priorité normale d\'exploitation' },
    { value: 'Low', label: 'Basse', color: '#10b981', desc: 'Demande ou amélioration mineure' }
  ];

  const selectedOpt = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" ref={containerRef}>
      <button
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="dropdown-dot" style={{ backgroundColor: selectedOpt.color }} />
        <span className="dropdown-label">{selectedOpt.label}</span>
        <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu animate-pop-in">
          <div className="dropdown-menu-header">Niveau de Priorité</div>
          {options.map(opt => (
            <div
              key={opt.value}
              className={`dropdown-option-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span className="dropdown-dot" style={{ backgroundColor: opt.color }} />
              <div className="option-text-group">
                <span className="option-title">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
              </div>
              {value === opt.value && <Check size={14} className="option-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Executive Professional Category Dropdown
const CategoryFilterDropdown = ({ value, categories = [], incidents = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryCount = (catName) => {
    if (catName === 'Tous') return incidents.length;
    return incidents.filter(i => i.category === catName).length;
  };

  return (
    <div className="custom-dropdown-container" ref={containerRef}>
      <button
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Tag size={13} style={{ color: '#2563eb' }} />
        <span className="dropdown-label">
          {value === 'Tous' ? 'Toutes les catégories' : value}
        </span>
        <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu animate-pop-in" style={{ minWidth: '260px', right: 0, left: 'auto' }}>
          <div className="dropdown-menu-header">Catégorie Métier</div>
          <div
            className={`dropdown-option-item ${value === 'Tous' ? 'selected' : ''}`}
            onClick={() => {
              onChange('Tous');
              setIsOpen(false);
            }}
          >
            <Tag size={13} style={{ color: '#64748b' }} />
            <div className="option-text-group">
              <span className="option-title">Toutes les catégories</span>
            </div>
            <span className="option-count-pill">{incidents.length}</span>
            {value === 'Tous' && <Check size={14} className="option-check" />}
          </div>
          {categories.map(cat => {
            const count = getCategoryCount(cat);
            return (
              <div
                key={cat}
                className={`dropdown-option-item ${value === cat ? 'selected' : ''}`}
                onClick={() => {
                  onChange(cat);
                  setIsOpen(false);
                }}
              >
                <Tag size={13} style={{ color: '#2563eb' }} />
                <div className="option-text-group">
                  <span className="option-title">{cat}</span>
                </div>
                <span className="option-count-pill">{count}</span>
                {value === cat && <Check size={14} className="option-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Component Memoized Kanban Card with zero-JS CSS hover action buttons
const KanbanCard = React.memo(({
  incident,
  isDragging,
  onDragStart,
  onSelectIncident,
  onQuickPreview,
  onQuickReassign
}) => {
  const isOverdue = useMemo(() => {
    if (!incident.slaDueAt || incident.status === 'Résolu' || incident.status === 'Clôturé') return null;
    return new Date(incident.slaDueAt) < new Date();
  }, [incident.slaDueAt, incident.status]);

  const assigneeInitial = useMemo(() => getAssigneeInitial(incident.assignedTo), [incident.assignedTo]);
  const assigneeName = useMemo(() => getAssigneeName(incident.assignedTo), [incident.assignedTo]);
  const avatarGradient = useMemo(() => getAvatarGradient(assigneeName), [assigneeName]);

  const priorityNorm = useMemo(() => normalizePriority(incident.priority), [incident.priority]);
  const priorityLabel = useMemo(() => getPriorityLabel(incident.priority), [incident.priority]);

  return (
    <div
      className={`kanban-card-item priority-border-${priorityNorm} ${isDragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, incident)}
      onClick={() => onSelectIncident(incident.incidentCode)}
    >
      {/* Zero-JS pure CSS hover quick action buttons */}
      <div className="kanban-card-quick-actions">
        <button
          className="quick-act-btn"
          title="Aperçu rapide"
          onClick={(e) => {
            e.stopPropagation();
            onQuickPreview(incident);
          }}
        >
          <Eye size={13} />
        </button>
        <button
          className="quick-act-btn"
          title="Réassigner rapidement"
          onClick={(e) => {
            e.stopPropagation();
            onQuickReassign(incident);
          }}
        >
          <UserPlus size={13} />
        </button>
      </div>

      <div className="kanban-card-top" style={{ paddingRight: '56px' }}>
        <span className="card-code-pill">{incident.incidentCode}</span>
        <span className={`badge badge-${priorityNorm}`}>
          {priorityLabel}
        </span>
      </div>

      <h4 className="kanban-card-title">{incident.title}</h4>

      {incident.category && (
        <div className="kanban-card-meta">
          <span className="kanban-category-tag">
            <Tag size={11} style={{ marginRight: '4px' }} />
            {incident.category}
          </span>
        </div>
      )}

      <div className="kanban-card-bottom">
        <div className="kanban-assignee" title={`Assigné à: ${assigneeName}`}>
          <div className="mini-avatar" style={{ background: avatarGradient }}>
            {assigneeInitial}
          </div>
          <span className="assignee-name">{assigneeName}</span>
        </div>

        {isOverdue !== null && (
          <span className={`sla-badge ${isOverdue ? 'overdue' : 'ok'}`}>
            <Clock size={11} />
            {isOverdue ? 'SLA Dépassé' : 'SLA Respecté'}
          </span>
        )}
      </div>
    </div>
  );
});

export function KanbanView({
  incidents = [],
  activeWorkflow,
  currentUser,
  usersList = [],
  onSelectIncident,
  onExecuteTransition,
  onReassignIncident
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Tous');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all', 'my_incidents', 'high_priority', 'overdue'
  const [draggedIncident, setDraggedIncident] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Custom WIP Limits state (editable by Admins)
  const [columnWipLimits, setColumnWipLimits] = useState({
    'nouveau': 10,
    'en cours': 5,
    'résolu': 15,
    'clôturé': 999
  });
  const [editingWipCol, setEditingWipCol] = useState(null);
  const [newWipValue, setNewWipValue] = useState(5);

  // Transition confirmation modal state
  const [pendingTransitionModal, setPendingTransitionModal] = useState(null);
  const [transitionComment, setTransitionComment] = useState('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  // Quick Action Modals state
  const [quickPreviewIncident, setQuickPreviewIncident] = useState(null);
  const [quickReassignIncident, setQuickReassignIncident] = useState(null);
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);

  const isAdmin = useMemo(() => isUserAdmin(currentUser), [currentUser]);

  // Option B: Enforce strict role-based visibility filter first
  const visibleIncidents = useMemo(() => {
    return (incidents || []).filter(inc => canUserSeeIncident(inc, currentUser));
  }, [incidents, currentUser]);

  // Dynamically order workflow columns topologically
  const columns = useMemo(() => {
    const orderedStates = getOrderedStates(activeWorkflow);
    if (orderedStates && orderedStates.length > 0) {
      const colorPalette = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#6b7280'];
      return orderedStates.map((st, idx) => {
        const colKey = st.name.toLowerCase().trim();
        return {
          name: st.name,
          color: colorPalette[idx % colorPalette.length],
          badgeBg: `${colorPalette[idx % colorPalette.length]}18`,
          badgeText: colorPalette[idx % colorPalette.length],
          wipLimit: columnWipLimits[colKey] !== undefined ? columnWipLimits[colKey] : 8
        };
      });
    }
    return DEFAULT_COLUMNS.map(c => ({
      ...c,
      wipLimit: columnWipLimits[c.name.toLowerCase()] !== undefined ? columnWipLimits[c.name.toLowerCase()] : c.wipLimit
    }));
  }, [activeWorkflow, columnWipLimits]);

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(visibleIncidents.map(i => i?.category).filter(Boolean)));
  }, [visibleIncidents]);

  // Filtered incidents list (from visibleIncidents base)
  const filteredIncidents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const targetNormPriority = normalizePriority(priorityFilter);

    return visibleIncidents.filter(inc => {
      if (!inc) return false;
      const title = (inc.title || '').toLowerCase();
      const code = (inc.incidentCode || '').toLowerCase();
      const assignee = getAssigneeName(inc.assignedTo).toLowerCase();

      const matchesSearch = !term || title.includes(term) || code.includes(term) || assignee.includes(term);
      const incNormPriority = normalizePriority(inc.priority);
      const matchesPriority = priorityFilter === 'Tous' || incNormPriority === targetNormPriority;
      const matchesCategory = categoryFilter === 'Tous' || inc.category === categoryFilter;

      let matchesQuick = true;
      if (quickFilter === 'my_incidents') {
        matchesQuick = isAssignedToCurrentUser(inc, currentUser);
      } else if (quickFilter === 'high_priority') {
        matchesQuick = incNormPriority === 'critical' || incNormPriority === 'high';
      } else if (quickFilter === 'overdue') {
        matchesQuick = inc.slaDueAt && inc.status !== 'Résolu' && inc.status !== 'Clôturé' && new Date(inc.slaDueAt) < new Date();
      }

      return matchesSearch && matchesPriority && matchesCategory && matchesQuick;
    });
  }, [visibleIncidents, searchTerm, priorityFilter, categoryFilter, quickFilter, currentUser]);

  // Incidents grouped by column
  const incidentsByColumn = useMemo(() => {
    const map = {};
    columns.forEach(col => {
      map[col.name.toLowerCase()] = [];
    });
    filteredIncidents.forEach(inc => {
      const statusKey = (inc.status || '').toLowerCase();
      if (map[statusKey]) {
        map[statusKey].push(inc);
      } else {
        if (!map['autres']) map['autres'] = [];
        map['autres'].push(inc);
      }
    });
    return map;
  }, [columns, filteredIncidents]);

  // Stats KPIs (computed on visibleIncidents)
  const stats = useMemo(() => {
    const total = visibleIncidents.length;
    const active = visibleIncidents.filter(i => i.status !== 'Résolu' && i.status !== 'Clôturé').length;
    const myIncidents = visibleIncidents.filter(i => isAssignedToCurrentUser(i, currentUser)).length;
    const critical = visibleIncidents.filter(i => {
      const p = normalizePriority(i.priority);
      return (p === 'critical' || p === 'high') && i.status !== 'Résolu' && i.status !== 'Clôturé';
    }).length;
    const overdue = visibleIncidents.filter(i => i.slaDueAt && i.status !== 'Résolu' && i.status !== 'Clôturé' && new Date(i.slaDueAt) < new Date()).length;
    return { total, active, myIncidents, critical, overdue };
  }, [visibleIncidents, currentUser]);

  // Drag callbacks
  const handleDragStart = useCallback((e, incident) => {
    setDraggedIncident(incident);
    e.dataTransfer.setData('text/plain', incident.incidentCode || '');
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, colName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(prev => (prev === colName ? prev : colName));
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedIncident) return;
    const currentStatus = (draggedIncident.status || '').toLowerCase();
    if (currentStatus === targetStatus.toLowerCase()) {
      setDraggedIncident(null);
      return;
    }

    // Workflow transition rule validation
    if (activeWorkflow && activeWorkflow.transitions && activeWorkflow.transitions.length > 0) {
      const allowedTransitions = activeWorkflow.transitions.filter(
        t => (t.fromState || '').toLowerCase() === currentStatus
      );
      const matchedRule = allowedTransitions.find(
        t => (t.toState || '').toLowerCase() === targetStatus.toLowerCase()
      );

      if (!matchedRule) {
        const validNextStates = allowedTransitions.map(t => t.toState).join(', ');
        setPendingTransitionModal({
          incident: draggedIncident,
          targetStatus,
          isForbidden: true,
          forbiddenReason: `Depuis "${draggedIncident.status}", les seuls états autorisés par le workflow sont : ${validNextStates || 'Aucun (Étape finale)'}`
        });
        setDraggedIncident(null);
        return;
      }

      setPendingTransitionModal({
        incident: draggedIncident,
        targetStatus,
        transitionRule: matchedRule,
        isForbidden: false
      });
      setTransitionComment(`Transition vers "${targetStatus}" via le tableau Kanban`);
      setDraggedIncident(null);
      return;
    }

    setPendingTransitionModal({
      incident: draggedIncident,
      targetStatus,
      isForbidden: false
    });
    setTransitionComment(`Transition vers "${targetStatus}" via le tableau Kanban`);
    setDraggedIncident(null);
  }, [draggedIncident, activeWorkflow]);

  // Execute transition from modal confirmation button
  const confirmModalTransition = async () => {
    if (!pendingTransitionModal || pendingTransitionModal.isForbidden) return;
    setIsSubmittingTransition(true);

    try {
      await onExecuteTransition(
        pendingTransitionModal.incident,
        pendingTransitionModal.targetStatus,
        transitionComment || `Transition vers "${pendingTransitionModal.targetStatus}" via le tableau Kanban`
      );
      setPendingTransitionModal(null);
      setTransitionComment('');
    } catch (err) {
      console.error("Erreur confirmation transition Kanban:", err);
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  // Quick Reassign Handler
  const handleQuickReassignSubmit = async () => {
    if (!quickReassignIncident || !onReassignIncident) return;
    setIsReassigning(true);

    try {
      const targetUser = (usersList || []).find(u => u.id.toString() === selectedNewAssigneeId.toString());
      await onReassignIncident(quickReassignIncident.incidentCode, targetUser || null);
      setQuickReassignIncident(null);
      setSelectedNewAssigneeId('');
    } catch (err) {
      console.error("Erreur réassignation rapide:", err);
    } finally {
      setIsReassigning(false);
    }
  };

  // Save WIP Limit setting
  const saveWipLimit = (colName) => {
    const key = colName.toLowerCase().trim();
    const parsed = parseInt(newWipValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setColumnWipLimits(prev => ({
        ...prev,
        [key]: parsed
      }));
    }
    setEditingWipCol(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPriorityFilter('Tous');
    setCategoryFilter('Tous');
    setQuickFilter('all');
  };

  return (
    <div className="kanban-view-wrapper animate-fade-in">
      {/* Executive Printable/Export Header with App Logo & Official Metadata (Visible on Print/Export) */}
      <div className="kanban-print-header">
        <div className="print-header-left">
          <div className="print-app-logo">
            <div className="print-logo-icon">
              <Kanban size={24} color="#ffffff" />
            </div>
            <div className="print-logo-text">
              Incident<span style={{ color: '#3b82f6' }}>Flow</span>
            </div>
          </div>
          <div className="print-subtitle">Plateforme d'Orchestration et de Gestion des Incidents IT</div>
        </div>

        <div className="print-header-right">
          <div className="print-report-title">RAPPORT OFFICIEL -- TABLEAU DES INCIDENTS</div>
          <div className="print-meta-grid">
            <span><strong>Date d'export :</strong> {new Date().toLocaleString('fr-FR')}</span>
            <span><strong>Exporté par :</strong> {currentUser?.name || 'Administrateur'} ({currentUser?.email || ''})</span>
            <span><strong>Incidents affichés :</strong> {filteredIncidents.length} / {visibleIncidents.length}</span>
            <span><strong>Statut Sécurité :</strong> Option B (Isolation Active)</span>
          </div>
        </div>
      </div>

      {/* Executive Printable Table of Incidents (Visible on Print/Export) */}
      <div className="kanban-print-table-wrapper">
        <table className="kanban-print-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Code</th>
              <th>Titre & Description</th>
              <th style={{ width: '100px' }}>Statut</th>
              <th style={{ width: '90px' }}>Priorité</th>
              <th style={{ width: '110px' }}>Catégorie</th>
              <th style={{ width: '130px' }}>Assigné à</th>
              <th style={{ width: '120px' }}>Échéance SLA</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                  Aucun incident ne correspond aux critères filtrés.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => {
                const priorityNorm = normalizePriority(inc.priority);
                const priorityLabel = getPriorityLabel(inc.priority);
                const assigneeName = getAssigneeName(inc.assignedTo);
                const isOverdue = inc.slaDueAt && inc.status !== 'Résolu' && inc.status !== 'Clôturé' && new Date(inc.slaDueAt) < new Date();

                return (
                  <tr key={inc.incidentCode || inc.id || inc.title}>
                    <td>
                      <strong className="print-code-text">{inc.incidentCode}</strong>
                    </td>
                    <td>
                      <div className="print-inc-title">{inc.title}</div>
                      {inc.description && (
                        <div className="print-inc-desc">{inc.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="print-badge print-badge-status">{inc.status}</span>
                    </td>
                    <td>
                      <span className={`print-badge print-badge-${priorityNorm}`}>
                        {priorityLabel}
                      </span>
                    </td>
                    <td>
                      {inc.category || 'Non catégorisé'}
                    </td>
                    <td>
                      {assigneeName}
                    </td>
                    <td>
                      {inc.slaDueAt ? (
                        <span className={isOverdue ? 'print-sla-overdue' : ''}>
                          {new Date(inc.slaDueAt).toLocaleDateString('fr-FR')} {isOverdue && '⚠️'}
                        </span>
                      ) : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Security & Access Rights Notice Banner (Option B Enforced) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        background: isAdmin ? 'rgba(59, 130, 246, 0.08)' : 'rgba(139, 92, 246, 0.08)',
        border: `1px solid ${isAdmin ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`,
        color: isAdmin ? '#1d4ed8' : '#6d28d9',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdmin ? <Crown size={15} /> : <Lock size={15} />}
          <span>
            {isAdmin
              ? `👑 Mode Vue Globale (Administrateur) : Affichage des ${incidents.length} incidents de l'organisation.`
              : `🔒 Mode Isolation Strict (Technicien/Demandeur) : Seuls vos incidents assignés ou créés (${visibleIncidents.length}) vous sont visibles.`
            }
          </span>
        </div>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>
          Option B Sécurité Active
        </span>
      </div>

      {/* Top Header */}
      <div className="kanban-header-bar">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="kanban-icon-badge">
              <Kanban size={22} className="text-white" />
            </div>
            Tableau Kanban / Roadmap Jira
          </h1>
          <p className="page-subtitle">
            Suivi visuel interactif et pilotage des flux de résolution d'incidents.
          </p>
        </div>

        {/* Action & Stats Row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Top Summary Stats Cards */}
          <div className="kanban-stats-row">
            <div className="kanban-stat-pill">
              <span className="stat-num">{stats.total}</span>
              <span className="stat-label">Total Visibles</span>
            </div>
            <div className="kanban-stat-pill active-pill">
              <span className="stat-num">{stats.active}</span>
              <span className="stat-label">En Cours</span>
            </div>
            {stats.myIncidents > 0 && (
              <div className="kanban-stat-pill my-pill" title="Incidents assignés à vous">
                <UserCheck size={14} style={{ marginRight: '4px' }} />
                <span className="stat-num">{stats.myIncidents}</span>
                <span className="stat-label">Mes Incidents</span>
              </div>
            )}
            {stats.critical > 0 && (
              <div className="kanban-stat-pill critical-pill">
                <ShieldAlert size={14} style={{ marginRight: '4px' }} />
                <span className="stat-num">{stats.critical}</span>
                <span className="stat-label">Priorité Haute</span>
              </div>
            )}
            {stats.overdue > 0 && (
              <div className="kanban-stat-pill overdue-pill">
                <Clock size={14} style={{ marginRight: '4px' }} />
                <span className="stat-num">{stats.overdue}</span>
                <span className="stat-label">SLA Dépassé</span>
              </div>
            )}
          </div>

          {/* Analytics ITIL Toggle Button */}
          <button
            className={`btn ${showAnalyticsPanel ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
            title="Afficher/Masquer le tableau de bord des métriques MTTR, MTTA et SLA"
          >
            <BarChart2 size={15} />
            <span>Analytics ITIL</span>
          </button>

          {/* Executive Export Button */}
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
            title="Exporter le Kanban avec En-tête Officiel & Logo en PDF"
          >
            <Printer size={15} className="text-primary-600" />
            <span>Exporter le Kanban</span>
          </button>
        </div>
      </div>

      {/* Expandable ITIL Analytics & Performance KPI Panel */}
      {showAnalyticsPanel && (
        <div style={{ marginBottom: '16px' }}>
          <AnalyticsKPIWidget incidents={visibleIncidents} />
        </div>
      )}

      {/* Control & Filters Toolbar */}
      <div className="kanban-toolbar">
        {/* Search Bar */}
        <div className="kanban-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher par code, titre ou assigné..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="kanban-quick-filters">
          <button
            className={`quick-chip ${quickFilter === 'all' ? 'active' : ''}`}
            onClick={() => setQuickFilter('all')}
          >
            Tous ({visibleIncidents.length})
          </button>
          <button
            className={`quick-chip ${quickFilter === 'my_incidents' ? 'active' : ''}`}
            onClick={() => setQuickFilter('my_incidents')}
          >
            👤 Mes incidents ({stats.myIncidents})
          </button>
          <button
            className={`quick-chip ${quickFilter === 'high_priority' ? 'active' : ''}`}
            onClick={() => setQuickFilter('high_priority')}
          >
            🔥 Urgent / Critique ({stats.critical})
          </button>
          <button
            className={`quick-chip ${quickFilter === 'overdue' ? 'active' : ''}`}
            onClick={() => setQuickFilter('overdue')}
          >
            ⚠️ SLA Dépassé ({stats.overdue})
          </button>
        </div>

        {/* Executive Custom Popover Dropdowns */}
        <div className="kanban-dropdowns-group">
          <PriorityFilterDropdown
            value={priorityFilter}
            onChange={setPriorityFilter}
          />

          <CategoryFilterDropdown
            value={categoryFilter}
            categories={categories}
            incidents={visibleIncidents}
            onChange={setCategoryFilter}
          />

          {(searchTerm || priorityFilter !== 'Tous' || categoryFilter !== 'Tous' || quickFilter !== 'all') && (
            <button className="btn-reset-filters" onClick={resetFilters} title="Réinitialiser tous les filtres">
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Count Bar */}
      <div className="kanban-sub-bar">
        <span className="results-count">
          Affichage de <strong>{filteredIncidents.length}</strong> incident(s) sur {visibleIncidents.length} autorisés
        </span>
        <span className="drag-hint">
          💡 Astuce: Glissez et déposez une carte vers une colonne pour faire évoluer son statut.
        </span>
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board-grid">
        {columns.map(col => {
          const colIncidents = incidentsByColumn[col.name.toLowerCase()] || [];
          const isOver = dragOverColumn === col.name;
          const isOverWip = colIncidents.length > col.wipLimit;

          return (
            <div
              key={col.name}
              className={`kanban-col ${isOver ? 'kanban-col-over' : ''} ${isOverWip ? 'wip-overload' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.name)}
            >
              {/* Column Header */}
              <div
                className={`kanban-col-header ${isOverWip ? 'header-wip-overload' : ''}`}
                style={{ borderTopColor: isOverWip ? '#ef4444' : col.color }}
              >
                <div className="col-header-left">
                  <span className="col-dot" style={{ backgroundColor: isOverWip ? '#ef4444' : col.color }} />
                  <span className="col-title">{col.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* WIP Capacity Badge */}
                  <span
                    className={`col-count-badge ${isOverWip ? 'badge-wip-danger' : ''}`}
                    style={{
                      backgroundColor: isOverWip ? 'rgba(239, 68, 68, 0.15)' : col.badgeBg,
                      color: isOverWip ? '#dc2626' : col.badgeText,
                      border: isOverWip ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                    title={isOverWip ? `Capacité recommandée dépassée ! (${colIncidents.length}/${col.wipLimit})` : `Capacité : ${colIncidents.length} / ${col.wipLimit === 999 ? '∞' : col.wipLimit}`}
                  >
                    {isOverWip && '⚠️ '}
                    {colIncidents.length} {col.wipLimit !== 999 && `/ ${col.wipLimit}`}
                  </span>

                  {/* Admin WIP limit configuration trigger */}
                  {isAdmin && (
                    <button
                      className="wip-settings-btn"
                      title="Ajuster la limite WIP (Admin)"
                      onClick={() => {
                        setEditingWipCol(col.name);
                        setNewWipValue(col.wipLimit === 999 ? 10 : col.wipLimit);
                      }}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                    >
                      <Settings size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="kanban-cards-container">
                {colIncidents.length === 0 ? (
                  <div className="kanban-empty-state">
                    <span>Aucun incident dans cet état</span>
                  </div>
                ) : (
                  colIncidents.map(inc => (
                    <KanbanCard
                      key={inc.incidentCode || inc.id || inc.title}
                      incident={inc}
                      isDragging={draggedIncident && draggedIncident.incidentCode === inc.incidentCode}
                      onDragStart={handleDragStart}
                      onSelectIncident={onSelectIncident}
                      onQuickPreview={setQuickPreviewIncident}
                      onQuickReassign={(incident) => {
                        setQuickReassignIncident(incident);
                        setSelectedNewAssigneeId(incident.assignedTo ? (incident.assignedTo.id ? incident.assignedTo.id.toString() : '') : '');
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin WIP Limit Config Modal */}
      {editingWipCol && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setEditingWipCol(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} className="text-primary-600" />
                <h3 className="modal-title">Limite WIP : Colonne "{editingWipCol}"</h3>
              </div>
              <button className="close-btn" onClick={() => setEditingWipCol(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Définissez le nombre maximum d'incidents simultanés recommandés dans cette colonne pour détecter les goulots d'étranglement :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>Capacité maximale (WIP Limit) :</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="search-input"
                  value={newWipValue}
                  onChange={(e) => setNewWipValue(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setEditingWipCol(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={() => saveWipLimit(editingWipCol)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Quick Preview Modal */}
      {quickPreviewIncident && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setQuickPreviewIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} className="text-primary-600" />
                <h3 className="modal-title">Aperçu Rapide - {quickPreviewIncident.incidentCode}</h3>
              </div>
              <button className="close-btn" onClick={() => setQuickPreviewIncident(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {quickPreviewIncident.title}
              </h3>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{quickPreviewIncident.status}</span>
                <span className={`badge badge-${normalizePriority(quickPreviewIncident.priority)}`}>
                  {getPriorityLabel(quickPreviewIncident.priority)}
                </span>
                {quickPreviewIncident.category && (
                  <span className="badge badge-secondary">{quickPreviewIncident.category}</span>
                )}
              </div>

              <div style={{ background: 'var(--bg-hover)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  DESCRIPTION DE L'INCIDENT :
                </div>
                {quickPreviewIncident.description || 'Aucune description fournie.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Assigné à :</span>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                    {getAssigneeName(quickPreviewIncident.assignedTo)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Échéance SLA :</span>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                    {quickPreviewIncident.slaDueAt ? new Date(quickPreviewIncident.slaDueAt).toLocaleString() : 'Non définie'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const code = quickPreviewIncident.incidentCode;
                  setQuickPreviewIncident(null);
                  onSelectIncident(code);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={14} />
                Ouvrir la fiche complète
              </button>
              <button className="btn btn-primary" onClick={() => setQuickPreviewIncident(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quick Reassign Modal */}
      {quickReassignIncident && (
        <div className="modal-backdrop animate-fade-in" onClick={() => !isReassigning && setQuickReassignIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} className="text-primary-600" />
                <h3 className="modal-title">Réassigner l'Incident {quickReassignIncident.incidentCode}</h3>
              </div>
              <button className="close-btn" onClick={() => setQuickReassignIncident(null)} disabled={isReassigning}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                {quickReassignIncident.title}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Assigné actuellement : <strong>{getAssigneeName(quickReassignIncident.assignedTo)}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                  Sélectionner le nouvel intervenant :
                </label>
                <select
                  className="filter-select"
                  value={selectedNewAssigneeId}
                  onChange={(e) => setSelectedNewAssigneeId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
                  disabled={isReassigning}
                >
                  <option value="">-- Non assigné --</option>
                  {(usersList || []).map(u => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setQuickReassignIncident(null)}
                disabled={isReassigning}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleQuickReassignSubmit}
                disabled={isReassigning}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isReassigning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Réassignation...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Confirmer la réassignation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modern Transition Confirmation Modal */}
      {pendingTransitionModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => !isSubmittingTransition && setPendingTransitionModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {pendingTransitionModal.isForbidden ? (
                  <AlertTriangle size={20} className="text-red-500" />
                ) : (
                  <Sparkles size={20} className="text-primary-600" />
                )}
                <h3 className="modal-title">
                  {pendingTransitionModal.isForbidden ? 'Transition Non Autorisée' : 'Confirmer la Transition d\'État'}
                </h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setPendingTransitionModal(null)}
                disabled={isSubmittingTransition}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Incident summary card */}
              <div style={{ background: 'var(--bg-hover, #f8fafc)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', marginBottom: '4px' }}>
                  {pendingTransitionModal.incident.incidentCode}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main, #0f172a)' }}>
                  {pendingTransitionModal.incident.title}
                </div>
              </div>

              {/* Transition path visual */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <span className="badge badge-secondary" style={{ fontSize: '13px', padding: '4px 10px' }}>
                  {pendingTransitionModal.incident.status}
                </span>
                <ChevronRight size={18} style={{ color: '#2563eb' }} />
                <span className="badge badge-primary" style={{ fontSize: '13px', padding: '4px 10px', background: '#2563eb', color: '#ffffff' }}>
                  {pendingTransitionModal.targetStatus}
                </span>
              </div>

              {/* Forbidden Warning or Comment Form */}
              {pendingTransitionModal.isForbidden ? (
                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px', lineHeight: '1.5' }}>
                  {pendingTransitionModal.forbiddenReason}
                </div>
              ) : (
                <>
                  {pendingTransitionModal.transitionRule?.roleRequired && (
                    <div style={{ fontSize: '12px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#b45309', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} />
                      Rôle requis pour cette étape : <strong>{pendingTransitionModal.transitionRule.roleRequired}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #0f172a)' }}>
                      Commentaire explicatif <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(facultatif)</span> :
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Saisissez un motif ou une observation pour cette transition..."
                      value={transitionComment}
                      onChange={(e) => setTransitionComment(e.target.value)}
                      disabled={isSubmittingTransition}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {pendingTransitionModal.isForbidden ? (
                <button className="btn btn-secondary" onClick={() => setPendingTransitionModal(null)}>
                  Fermer
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPendingTransitionModal(null)}
                    disabled={isSubmittingTransition}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={confirmModalTransition}
                    disabled={isSubmittingTransition}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isSubmittingTransition ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Application...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Confirmer la transition
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
