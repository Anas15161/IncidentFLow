/**
 * ============================================================================
 * FICHIER      : ModalsManager.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Gestionnaire centralisé pour toutes les fenêtres modales de l'application (création d'incident, confirmation de suppression, etc.).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React, { useRef, useEffect } from 'react';
import {
  Shield, Edit3, UserPlus, FileText, Search
} from 'lucide-react';

export function ModalsManager({
  // Edit Incident
  showEditModal,
  setShowEditModal,
  handleEditIncidentSubmit,
  editIncidentForm,
  setEditIncidentForm,
  usersList = [],
  getRoleName,
  // Create Incident
  showCreateModal,
  setShowCreateModal,
  handleCreateIncidentSubmit,
  newIncident,
  setNewIncident,
  // Transition Comment Modal
  showTransitionModal,
  setShowTransitionModal,
  targetTransition,
  selectedIncident,
  transitionComment,
  setTransitionComment,
  executeTransition,
  // User Create Modal
  showUserCreateModal,
  setShowUserCreateModal,
  handleUserCreateSubmit,
  newUserForm,
  setNewUserForm,
  rolesList = [],
  // User Edit Modal
  showUserEditModal,
  setShowUserEditModal,
  editingUser,
  setEditingUser,
  handleUserEditSubmit,
  // Edit Profile Modal
  showEditProfileModal,
  setShowEditProfileModal,
  profileForm,
  setProfileForm,
  handleEditProfileSubmit,
  // App Settings Modal
  showAppSettingsModal,
  setShowAppSettingsModal,
  appSettingsForm,
  setAppSettingsForm,
  handleAppSettingsSubmit,
  // Help Modal
  showHelpModal,
  setShowHelpModal,
  // Preview File
  previewFile,
  setPreviewFile,
  previewBlobUrl,
  previewLoading,
  previewError,
  // Command Palette
  showCommandPalette,
  setShowCommandPalette,
  commandPaletteQuery,
  setCommandPaletteQuery,
  commandPaletteInputRef: externalInputRef,
  setCommandPaletteSelectedIndex,
  getCommandPaletteItems,
  commandPaletteSelectedIndex,
  // Role Create
  showRoleCreateModal,
  setShowRoleCreateModal,
  handleRoleCreate,
  newRoleForm,
  setNewRoleForm,
  // Role Edit
  showRoleEditModal,
  setShowRoleEditModal,
  handleRoleUpdate,
  editRoleForm,
  setEditRoleForm
}) {
  const internalInputRef = useRef(null);
  const inputRef = externalInputRef || internalInputRef;

  useEffect(() => {
    if (showCommandPalette && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);
  return (
    <>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <select
                      className="form-control"
                      value={editIncidentForm.category}
                      onChange={(e) => setEditIncidentForm({ ...editIncidentForm, category: e.target.value })}
                      style={{ background: 'var(--card-bg)' }}
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
                      style={{ background: 'var(--card-bg)' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sévérité SLA *</label>
                    <select
                      className="form-control"
                      value={editIncidentForm.severity || 'Mineur'}
                      onChange={(e) => setEditIncidentForm({ ...editIncidentForm, severity: e.target.value })}
                      style={{ background: 'var(--card-bg)', fontWeight: '600', color: 'var(--primary-600)' }}
                    >
                      <option value="Critique">Critique (&lt; 4h)</option>
                      <option value="Important">Important (&lt; 24h)</option>
                      <option value="Mineur">Mineur (&lt; 3 jours)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Assigner à</label>
                  <select
                    className="form-control"
                    value={editIncidentForm.assignedToId}
                    onChange={(e) => setEditIncidentForm({ ...editIncidentForm, assignedToId: e.target.value })}
                    style={{ background: 'var(--card-bg)' }}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <select
                      className="form-control"
                      value={newIncident.category}
                      onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                      style={{ background: 'var(--card-bg)' }}
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
                      style={{ background: 'var(--card-bg)' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sévérité SLA *</label>
                    <select
                      className="form-control"
                      value={newIncident.severity || 'Mineur'}
                      onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                      style={{ background: 'var(--card-bg)', fontWeight: '600', color: 'var(--primary-600)' }}
                    >
                      <option value="Critique">Critique (&lt; 4h)</option>
                      <option value="Important">Important (&lt; 24h)</option>
                      <option value="Mineur">Mineur (&lt; 3 jours)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Assigner à (Optionnel)</label>
                  <select
                    className="form-control"
                    value={newIncident.assignedToId}
                    onChange={(e) => setNewIncident({ ...newIncident, assignedToId: e.target.value })}
                    style={{ background: 'var(--card-bg)' }}
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
                    rows="4"
                    required
                    placeholder="Décrivez les symptômes observés, les équipements impactés et le contexte..."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer l'incident
                </button>
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
                    La transition de <strong>{selectedIncident?.status}</strong> vers <strong>{targetTransition.toState}</strong> requiert obligatoirement un motif.
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
                    style={{ background: 'var(--card-bg)' }}
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
                    style={{ background: 'var(--card-bg)' }}
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
                  <label htmlFor="edit-user-active" style={{ marginBottom: 0, fontWeight: 'bold', cursor: 'pointer' }}>Compte actif</label>
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
                      { key: 'bg-blue-600', value: '#2563eb', label: 'Bleu' },
                      { key: 'bg-purple-600', value: '#9333ea', label: 'Violet' },
                      { key: 'bg-emerald-600', value: '#059669', label: 'Vert' },
                      { key: 'bg-red-600', value: '#dc2626', label: 'Rouge' },
                      { key: 'bg-indigo-600', value: '#4f46e5', label: 'Indigo' }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatarColor: item.key })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: item.value,
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

              <div style={{ backgroundColor: 'var(--body-bg)', padding: '10px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
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

      {/* Modal 4: File Preview Modal */}
      {previewFile && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} className="text-blue-600" />
                Aperçu du fichier : {previewFile.filename}
              </h3>
              <button className="modal-close-btn" onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', backgroundColor: 'var(--body-bg)' }}>
              {previewLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement de l'aperçu...</div>
              ) : previewError ? (
                <div style={{ textAlign: 'center', color: '#ef4444' }}>{previewError}</div>
              ) : previewFile.fileType && previewFile.fileType.startsWith('image/') ? (
                <img src={previewBlobUrl} alt={previewFile.filename} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              ) : previewFile.fileType === 'application/pdf' ? (
                <iframe src={previewBlobUrl} title={previewFile.filename} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Aperçu non disponible pour ce type de fichier ({previewFile.fileType || 'Inconnu'}).</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Veuillez télécharger le fichier pour en consulter le contenu.</p>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Taille : {previewFile.fileSize}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewFile(null)}>Fermer</button>
                {previewBlobUrl && (
                  <a href={previewBlobUrl} download={previewFile.filename} className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Télécharger
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Quick Command Palette */}
      {showCommandPalette && (
        <div
          className="modal-overlay animate-fade-in"
          style={{ zIndex: 9999, alignItems: 'flex-start', paddingTop: '100px', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="modal-card"
            style={{ width: '100%', maxWidth: '640px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Command Search Input Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
              <Search size={18} style={{ color: 'var(--primary-600, #0284c7)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Tapez une commande ou recherchez un incident... (ex: Dashboard, Nouveau, INC-001)"
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
                  color: 'var(--text-main)'
                }}
                autoFocus
              />
              <span style={{ fontSize: '10px', backgroundColor: 'var(--body-bg)', color: 'var(--text-muted, #64748b)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>ESC</span>
            </div>

            {/* Results list */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
              {(() => {
                const items = getCommandPaletteItems ? getCommandPaletteItems() : [];
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
                              onMouseEnter={() => setCommandPaletteSelectedIndex && setCommandPaletteSelectedIndex(currentIndex)}
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
                              onMouseEnter={() => setCommandPaletteSelectedIndex && setCommandPaletteSelectedIndex(currentIndex)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                borderLeft: isSelected ? '3px solid var(--primary-600)' : '3px solid transparent'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '14px' }}>📋</span>
                                <span style={{ fontSize: '13px', fontWeight: isSelected ? '600' : 'normal', color: isSelected ? 'var(--primary-500)' : 'var(--text-main)' }}>
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
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--body-bg)', display: 'flex', justifyContent: 'flex-end', gap: '14px', fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>
              <span>↑↓ pour naviguer</span>
              <span>↵ pour valider</span>
              <span>ESC pour fermer</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nouveau Rôle */}
      {showRoleCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} className="text-blue-600" />
                Créer un nouveau Rôle
              </h3>
              <button className="modal-close-btn" onClick={() => setShowRoleCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRoleCreate}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Nom du rôle <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Auditeur Sécurité, Chef de Projet"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                    required
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Description du rôle</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Description des responsabilités et permissions accordées par ce rôle..."
                    value={newRoleForm.description}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleCreateModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le rôle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Rôle */}
      {showRoleEditModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} className="text-blue-600" />
                Modifier le Rôle
              </h3>
              <button className="modal-close-btn" onClick={() => setShowRoleEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRoleUpdate}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Nom du rôle <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Administrateur, Opérateur"
                    value={editRoleForm.name}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
                    required
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Description du rôle</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Description des privilèges du rôle..."
                    value={editRoleForm.description}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleEditModal(false)}>
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
    </>
  );
}
