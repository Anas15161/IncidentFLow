/**
 * ============================================================================
 * FICHIER      : Sidebar.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Composant de la barre de navigation latérale (menu principal de l'application).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React from 'react';
import {
  Activity, FileText, Kanban, Clock, Layers, Users, Shield, LogOut
} from 'lucide-react';

export function Sidebar({
  hasPermission,
  currentView,
  setCurrentView,
  setSelectedIncidentCode,
  incidents,
  sessionTimeLeft,
  currentUser,
  getRoleName,
  handleLogout
}) {
  return (
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
            className={`nav-btn ${currentView === 'dashboard' && !setSelectedIncidentCode ? 'active' : ''}`}
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
  );
}
