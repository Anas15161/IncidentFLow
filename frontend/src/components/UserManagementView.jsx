/**
 * ============================================================================
 * FICHIER      : UserManagementView.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Interface d'administration pour la gestion des comptes utilisateurs (création, modification, désactivation).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React from 'react';
import {
  Plus, Search, X, Users, Shield, Edit3, Trash2
} from 'lucide-react';

export function UserManagementView({
  setShowUserCreateModal,
  currentView,
  setCurrentView,
  searchUserQuery,
  setSearchUserQuery,
  roleUserFilter,
  setRoleUserFilter,
  rolesList = [],
  filteredUsers = [],
  setEditingUser,
  setShowUserEditModal,
  handleUserDelete
}) {
  return (
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

      {/* Navigation sub-tabs */}
      <div className="admin-tab-bar">
        <button
          className={`admin-tab-btn ${currentView === 'users' ? 'active' : ''}`}
          onClick={() => setCurrentView('users')}
        >
          <Users size={16} />
          Gestion Utilisateurs
        </button>
        <button
          className={`admin-tab-btn ${currentView === 'roles' ? 'active' : ''}`}
          onClick={() => setCurrentView('roles')}
        >
          <Shield size={16} />
          Rôles & Habilitations
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
                <th>Statut</th>
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
                          {u.name ? u.name.split(' ').map(n => n[0]).join('') : 'U'}
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
                              firstName: u.firstName || (u.name ? u.name.split(' ')[0] : '') || '',
                              lastName: u.lastName || (u.name ? u.name.split(' ')[1] : '') || '',
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
  );
}
