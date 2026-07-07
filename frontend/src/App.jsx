import { useState, useEffect } from 'react';
import { 
  Shield, Activity, FileText, AlertTriangle, CheckCircle, Clock, 
  Search, User, Plus, X, Bell, Paperclip, Download, Send, 
  Globe, Cpu, Stethoscope, ArrowLeft, Eye, RefreshCw, Layers
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

const USERS = [
  { id: 1, name: "Anas Haddou", email: "anas@netmar.com", role: "Administrateur", avatarColor: "bg-blue-600" },
  { id: 2, name: "Sophie Martin", email: "sophie.m@netmar.com", role: "Responsable", avatarColor: "bg-purple-600" },
  { id: 3, name: "Marie Laurent", email: "marie.l@netmar.com", role: "Opérateur", avatarColor: "bg-emerald-600" },
  { id: 4, name: "Dr. Jean Robert", email: "jean.r@netmar.com", role: "Opérateur médical", avatarColor: "bg-red-600" }
];

function App() {
  // Navigation & Simulated User
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'workflows'
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Data States
  const [incidents, setIncidents] = useState([]);
  const [usersList, setUsersList] = useState(USERS);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Dashboard Filtering
  const [statusFilter, setStatusFilter] = useState('Tous'); // 'Tous', 'Nouveau', etc.
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [priorityFilter, setPriorityFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Incident Detail View States
  const [selectedIncidentCode, setSelectedIncidentCode] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedIncidentWorkflow, setSelectedIncidentWorkflow] = useState(null);
  
  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
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

  // Headers helper with simulated user identity
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-Mock-User': currentUser.email
    };
  };

  // Fetch all incidents with active filters
  const fetchIncidents = async () => {
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
    try {
      const res = await fetch(`${API_BASE}/workflows`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error("Impossible de charger les workflows:", err);
    }
  };

  // Fetch user list (sync with db users just in case)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Impossible de charger les utilisateurs:", err);
    }
  };

  // Reload when filters change or user switches
  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, categoryFilter, priorityFilter, currentUser]);

  // Initial load
  useEffect(() => {
    fetchWorkflows();
    fetchUsers();
  }, []);

  // Handle user simulation change
  const handleUserChange = (email) => {
    const selected = USERS.find(u => u.email === email);
    if (selected) {
      setCurrentUser(selected);
      setErrorMessage('');
      setShowUserDropdown(false);
      
      // If we are currently looking at an incident, reload it with the new user context
      if (selectedIncidentCode) {
        loadIncidentDetail(selectedIncidentCode, selected);
      }
    }
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
      if (!res.ok) throw new Error("Impossible de charger le detail de l'incident.");
      const data = await res.json();
      setSelectedIncident(data);
      
      // Fetch workflow for this incident's category to check valid transitions
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

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('Tous');
    setCategoryFilter('Tous');
    setPriorityFilter('Tous');
    setSearchQuery('');
  };

  // Create new incident
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
        throw new Error(errorData.message || "Erreur de creation de l'incident.");
      }
      
      // Reset form & reload
      setNewIncident({
        title: '',
        description: '',
        category: 'Réseau',
        priority: 'Medium',
        assignedToId: ''
      });
      setShowCreateModal(false);
      fetchIncidents();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Perform workflow transition
  const handleTransitionClick = (transition) => {
    setTargetTransition(transition);
    setTransitionComment('');
    
    // Check if we need to display the comment modal
    if (transition.requiresComment) {
      setShowTransitionModal(true);
    } else {
      // Execute transition directly
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
        throw new Error(errorData.message || "La transition a echoue.");
      }
      
      // Close comment modal if open
      setShowTransitionModal(false);
      setTargetTransition(null);
      setTransitionComment('');
      
      // Reload details
      loadIncidentDetail(selectedIncident.incidentCode);
      fetchIncidents();
    } catch (err) {
      setErrorMessage(err.message);
      setShowTransitionModal(false);
    }
  };

  // Submit comment
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

  // Upload file attachment
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
        throw new Error(errorData.message || "Le televersement a echoue.");
      }
      
      loadIncidentDetail(selectedIncident.incidentCode);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Get icons according to category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Réseau': return <Globe size={16} />;
      case 'Sécurité': return <Shield size={16} />;
      case 'Système': return <Cpu size={16} />;
      case 'Médical': return <Stethoscope size={16} />;
      default: return <FileText size={16} />;
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

  // KPI calculations
  const getKPICount = (status) => {
    if (status === 'Tous') return incidents.length;
    // Calculate total incidents loaded or match status
    return incidents.filter(i => i.status === status).length;
  };

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
            className={`nav-btn ${currentView === 'workflows' ? 'active' : ''}`}
            onClick={() => { setCurrentView('workflows'); setSelectedIncidentCode(null); }}
          >
            <span className="nav-label">
              <Layers size={18} />
              Paramètres Workflows
            </span>
          </button>
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

        <div className="sidebar-footer">
          <div>Hôte: local</div>
          <div className="role-badge-pill">{currentUser.role}</div>
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
            {/* IAM Simulated Identity Selector */}
            <div className="iam-pill">
              <span>Simuler :</span>
              <select 
                className="iam-select" 
                value={currentUser.email}
                onChange={(e) => handleUserChange(e.target.value)}
              >
                {USERS.map(u => (
                  <option key={u.id} value={u.email}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            {/* Notification Bell */}
            <div className="notif-bell-container">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                <span className="bell-badge">3</span>
              </button>
              
              {showNotifications && (
                <div className="card" style={{ position: 'absolute', right: 0, top: '44px', width: '280px', zIndex: 60, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    Notifications Recentes
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • Nouvel incident medical assigne automatiquement.
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • Sophie Martin a mis a jour l'incident INC-002.
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • Base de donnees initialisee avec succes.
                  </div>
                </div>
              )}
            </div>

            {/* User display */}
            <div className="user-profile-menu">
              <div className={`avatar-circle ${currentUser.avatarColor}`}>
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="profile-info">
                <span className="profile-name">{currentUser.name}</span>
                <span className="profile-role">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="content-area">
          <div className="content-max-width">
            
            {/* Alert Error Banner */}
            {errorMessage && (
              <div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} />
                  <span><strong>Action refusée : </strong>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage("")} style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            {/* VIEW A: INCIDENT DETAIL */}
            {selectedIncidentCode && selectedIncident ? (
              <div className="animate-fade-in">
                <div className="page-header" style={{ border: 'none', marginBottom: '16px' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedIncidentCode(null)}>
                    <ArrowLeft size={16} />
                    Retour au Dashboard
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
                          <span className="widget-dot" style={{ backgroundColor: `var(--${selectedIncident.priority.toLowerCase()}-dot)` }} />
                          {selectedIncident.priority}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Dernière mise à jour</span>
                        <span className="meta-val">
                          {formatDate(selectedIncident.updatedAt)}
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
                          {/* Filter workflow transitions where fromState matches current status */}
                          {selectedIncidentWorkflow.transitions
                            .filter(t => t.fromState.toLowerCase() === selectedIncident.status.toLowerCase())
                            .map((t, idx) => {
                              const hasRole = !t.roleRequired || currentUser.role.toLowerCase() === t.roleRequired.toLowerCase();
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

                      <label className="upload-zone">
                        <Paperclip size={14} style={{ marginBottom: '4px' }} />
                        <div>Cliquer pour téléverser un fichier log/pièce</div>
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
            ) : currentView === 'workflows' ? (
              // VIEW B: WORKFLOWS LIST
              <div className="animate-fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Configuration des Workflows</h1>
                    <p className="page-subtitle">Modèles de transitions et de rôles configurés par catégorie.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {workflows.map((wf) => (
                    <div className="card" key={wf.id} style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`badge badge-category badge-${wf.category.toLowerCase()}`}>
                            {getCategoryIcon(wf.category)}
                            {wf.category}
                          </span>
                          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{wf.name}</h2>
                        </div>
                        <span className="badge badge-resolu" style={{ fontSize: '9px' }}>Actif</span>
                      </div>

                      {/* States badges list */}
                      <div className="form-group">
                        <label>États du workflow</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {wf.states.map((state) => (
                            <span key={state.id} className={`badge badge-${state.name.toLowerCase().replace(' ', '-')}`}>
                              {state.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Transitions grid */}
                      <div className="form-group">
                        <label>Transitions autorisées</label>
                        <div className="datagrid-container" style={{ marginTop: '8px' }}>
                          <table className="datagrid">
                            <thead>
                              <tr>
                                <th>État Source</th>
                                <th>État Cible</th>
                                <th>Habilitation requise</th>
                                <th>Commentaire obligatoire</th>
                              </tr>
                            </thead>
                            <tbody>
                              {wf.transitions.map((t) => (
                                <tr key={t.id}>
                                  <td style={{ fontWeight: '700' }}>{t.fromState}</td>
                                  <td style={{ fontWeight: '700', color: 'var(--primary-600)' }}>{t.toState}</td>
                                  <td>{t.roleRequired ? <span className="role-badge-pill">{t.roleRequired}</span> : 'Tous'}</td>
                                  <td>{t.requiresComment ? <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Oui</span> : 'Non'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // VIEW C: DASHBOARD
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
                  <div className={`kpi-card ${statusFilter === 'Tous' ? 'active' : ''}`} onClick={() => setStatusFilter('Tous')}>
                    <div>
                      <div className="kpi-label">Tous les incidents</div>
                      <div className="kpi-value">{getKPICount('Tous')}</div>
                    </div>
                    <div className="kpi-icon-box" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                      <FileText size={20} />
                    </div>
                  </div>
                  <div className={`kpi-card ${statusFilter === 'Nouveau' ? 'active' : ''}`} onClick={() => setStatusFilter('Nouveau')}>
                    <div>
                      <div className="kpi-label">Nouveaux</div>
                      <div className="kpi-value">{getKPICount('Nouveau')}</div>
                    </div>
                    <div className="kpi-icon-box" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                      <Clock size={20} />
                    </div>
                  </div>
                  <div className={`kpi-card ${statusFilter === 'En cours' ? 'active' : ''}`} onClick={() => setStatusFilter('En cours')}>
                    <div>
                      <div className="kpi-label">En cours</div>
                      <div className="kpi-value">{getKPICount('En cours')}</div>
                    </div>
                    <div className="kpi-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                      <Activity size={20} />
                    </div>
                  </div>
                  <div className={`kpi-card ${statusFilter === 'Résolu' ? 'active' : ''}`} onClick={() => setStatusFilter('Résolu')}>
                    <div>
                      <div className="kpi-label">Résolus</div>
                      <div className="kpi-value">{getKPICount('Résolu')}</div>
                    </div>
                    <div className="kpi-icon-box" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                      <CheckCircle size={20} />
                    </div>
                  </div>
                </div>

                {/* Filters controls bar */}
                <div className="dashboard-filters-row">
                  <div className="filters-left">
                    <select 
                      className="filter-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="Tous">Catégorie: Toutes</option>
                      <option value="Réseau">Réseau</option>
                      <option value="Sécurité">Sécurité</option>
                      <option value="Système">Système</option>
                      <option value="Médical">Médical</option>
                    </select>

                    <select 
                      className="filter-select"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="Tous">Priorité: Toutes</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    {(categoryFilter !== 'Tous' || priorityFilter !== 'Tous' || statusFilter !== 'Tous' || searchQuery) && (
                      <button className="btn btn-secondary btn-small" onClick={handleResetFilters}>
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {loading ? 'Chargement...' : `${incidents.length} incident(s) trouvé(s)`}
                  </div>
                </div>

                {/* Incidents Table DataGrid */}
                <div className="datagrid-container">
                  {incidents.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={40} className="empty-state-icon" />
                      <div>Aucun incident trouvé.</div>
                    </div>
                  ) : (
                    <table className="datagrid">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Titre</th>
                          <th>Catégorie</th>
                          <th>Priorité</th>
                          <th>Statut</th>
                          <th>Assigné à</th>
                          <th>Créé le</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map((incident) => (
                          <tr key={incident.id} className="hoverable" onClick={() => handleSelectIncident(incident.incidentCode)}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{incident.incidentCode}</td>
                            <td style={{ fontWeight: '700' }}>{incident.title}</td>
                            <td>
                              <span className={`badge badge-category badge-${incident.category.toLowerCase()}`}>
                                {getCategoryIcon(incident.category)}
                                &nbsp;{incident.category}
                              </span>
                            </td>
                            <td>
                              <span className="meta-val" style={{ gap: '6px' }}>
                                <span className="widget-dot" style={{ backgroundColor: `var(--${incident.priority.toLowerCase()}-dot)` }} />
                                {incident.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${incident.status.toLowerCase().replace(' ', '-')}`}>
                                {incident.status}
                              </span>
                            </td>
                            <td>{incident.assignedTo ? incident.assignedTo.name : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Non assigné</span>}</td>
                            <td>{formatDate(incident.createdAt)}</td>
                            <td>
                              <button className="btn btn-secondary btn-small" style={{ padding: '4px 8px' }}>
                                <Eye size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* 3. DIALOG MODAL: DECLARER INCIDENT */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Déclarer un nouvel incident</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateIncidentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Titre de l'incident *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Ex: Panne de commutateur de zone"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Description détaillée *</label>
                  <textarea 
                    className="form-control" 
                    required 
                    rows={4}
                    placeholder="Fournir des details techniques..."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <select 
                      className="form-control"
                      value={newIncident.category}
                      onChange={(e) => setNewIncident({...newIncident, category: e.target.value})}
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
                      onChange={(e) => setNewIncident({...newIncident, priority: e.target.value})}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Assigner à (Optionnel)</label>
                  <select 
                    className="form-control"
                    value={newIncident.assignedToId}
                    onChange={(e) => setNewIncident({...newIncident, assignedToId: e.target.value})}
                  >
                    <option value="">-- Non assigné (Règles automatiques applicables) --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Déclarer l'incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DIALOG MODAL: WORKFLOW TRANSITION COMMENT */}
      {showTransitionModal && targetTransition && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Justification requise : Passer à {targetTransition.toState}</h3>
              <button className="modal-close-btn" onClick={() => { setShowTransitionModal(false); setTargetTransition(null); }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Cette transition de workflow requiert obligatoirement de renseigner un commentaire de justification technique.
              </p>
              
              <div className="form-group">
                <label>Commentaire de transition *</label>
                <textarea 
                  className="form-control" 
                  required 
                  rows={3}
                  placeholder="Renseigner le motif ou l'action menée..."
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowTransitionModal(false); setTargetTransition(null); }}>
                Annuler
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => executeTransition(targetTransition.toState, transitionComment)}
                disabled={!transitionComment.trim()}
              >
                Confirmer la transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
