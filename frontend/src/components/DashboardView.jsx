/**
 * ============================================================================
 * FICHIER      : DashboardView.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Vue principale (Tableau de bord) affichant une vue d'ensemble des statistiques, métriques et widgets de l'application.
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React from 'react';
import {
  Shield, Plus, Activity, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import { AnalyticsKPIWidget } from '../AnalyticsKPIWidget';

import { PriorityDonut, RealTimeTrendChart, renderSlaBadge, getCategoryIcon } from './ChartWidgets';

export function DashboardView({
  incidents = [],
  hasPermission,
  setShowCreateModal,
  setCurrentView,
  setPriorityFilter,
  setStatusFilter,
  handleSelectIncident,
  getPriorityColor,
  formatSlaDuration
}) {
  if (!hasPermission('PAGE_DASHBOARD')) {
    return (
      <div className="dashboard-card text-center" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <Shield size={48} style={{ color: '#ef4444', margin: '0 auto 16px auto', display: 'block', opacity: 0.8 }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-color)' }}>Accès Refusé au Tableau de Bord</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>
          Votre rôle ne dispose pas de la permission <code>PAGE_DASHBOARD</code>. Veuillez contacter votre administrateur.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }} onClick={() => setCurrentView('incidents')}>
          Accéder aux Incidents
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Suivi en temps réel et résolution des incidents par catégorie.</p>
        </div>
        {hasPermission('INCIDENT_CREATE') && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Déclarer un incident
          </button>
        )}
      </div>

      {/* ITIL Analytics & Performance KPI Widget */}
      <AnalyticsKPIWidget incidents={incidents} />

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
            <PriorityDonut incidents={incidents} setCurrentView={setCurrentView} setPriorityFilter={setPriorityFilter} />
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
            <RealTimeTrendChart incidents={incidents} />
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
                <tr key={inc.id || inc.incidentCode} onClick={() => handleSelectIncident(inc.incidentCode)} className="hoverable" style={{ cursor: 'pointer' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{inc.incidentCode}</td>
                  <td style={{ fontWeight: '700' }}>{inc.title}</td>
                  <td>
                    <span className="badge badge-normal" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      {getCategoryIcon && getCategoryIcon(inc.category)}
                      {inc.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                      <span className="widget-dot" style={{ backgroundColor: getPriorityColor ? getPriorityColor(inc.priority) : '#3b82f6' }} />
                      {inc.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${(inc.status || '').toLowerCase().replace(' ', '-')}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td>
                    {renderSlaBadge(inc)}
                  </td>
                  <td>{inc.author?.name || 'Système'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
