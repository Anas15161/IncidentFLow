import React from 'react';
import {
  Plus, Search, X, Paperclip, Eye, Trash2
} from 'lucide-react';

export function IncidentListView({
  handleExportCSV,
  handleExportPDF,
  hasPermission,
  setShowCreateModal,
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  categoryFilter,
  setCategoryFilter,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  activeWorkflow,
  workflows = [],
  sortBy,
  setSortBy,
  sortedIncidents = [],
  currentIncidents = [],
  loading,
  handleSelectIncident,
  getCategoryIcon,
  getPriorityColor,
  renderSlaBadge,
  formatDate,
  currentUser,
  getRoleName,
  handleDeleteIncident,
  totalPages,
  currentPage
}) {
  return (
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
          {hasPermission('INCIDENT_EXPORT_PDF') && (
            <button className="btn btn-secondary" onClick={handleExportPDF} title="Générer un rapport textuel des incidents">
              Générer Rapport PDF
            </button>
          )}
          {hasPermission('INCIDENT_CREATE') && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Déclarer un incident
            </button>
          )}
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
            {(activeWorkflow?.states || workflows[0]?.states) ? (
              (activeWorkflow?.states || workflows[0]?.states).map(s => (
                <option key={s.id || s.name} value={s.name}>{s.label || s.name}</option>
              ))
            ) : (
              <>
                <option value="Nouveau">Nouveau</option>
                <option value="Assigné">Assigné</option>
                <option value="En cours">En cours</option>
                <option value="Résolu">Résolu</option>
                <option value="Clôturé">Clôturé</option>
              </>
            )}
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
                    <tr key={inc.id || inc.incidentCode} onClick={() => handleSelectIncident(inc.incidentCode)} className="hoverable" style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{inc.incidentCode}</td>
                      <td style={{ fontWeight: '700' }}>
                        {inc.title}
                        {inc.attachments && inc.attachments.length > 0 && (
                          <Paperclip size={12} className="text-slate-400" style={{ marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle' }} title={`${inc.attachments.length} pièce(s) jointe(s)`} />
                        )}
                      </td>
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
                        {renderSlaBadge && renderSlaBadge(inc)}
                      </td>
                      <td>{inc.author?.name || 'Système'}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate ? formatDate(inc.createdAt) : inc.createdAt}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={(e) => { e.stopPropagation(); handleSelectIncident(inc.incidentCode); }}
                            style={{ padding: '6px 10px', height: '28px' }}
                            title="Voir le détail"
                          >
                            <Eye size={13} />
                          </button>
                          {getRoleName && getRoleName(currentUser?.role) === 'Administrateur' && (
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={(e) => handleDeleteIncident(inc.incidentCode, e)}
                              style={{ padding: '6px 10px', height: '28px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                              title="Supprimer l'incident"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
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
  );
}
