/**
 * ============================================================================
 * FICHIER      : IncidentDetailView.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Interface détaillée pour consulter et gérer un incident spécifique (statut, historique, commentaires, pièces jointes, etc.).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React from 'react';
import {
  ArrowLeft, Edit3, Trash2, User, Clock, AlertTriangle, ChevronDown, CheckCircle,
  Paperclip, Send, Download
} from 'lucide-react';

export function IncidentDetailView({
  selectedIncident,
  setSelectedIncidentCode,
  getCategoryIcon,
  tickerTime,
  hasPermission,
  handleOpenEditModal,
  handleDeleteIncident,
  activeWorkflow,
  workflows = [],
  selectedIncidentWorkflow,
  getOrderedStates,
  getPriorityColor,
  formatDate,
  renderSlaBadge,
  formatSlaDuration,
  getRoleName,
  currentUser,
  handleTransitionClick,
  showAssignSelect,
  setShowAssignSelect,
  usersList = [],
  handleQuickReassignSubmit,
  commentTab = 'write',
  setCommentTab,
  parseMarkdown,
  handleAddCommentSubmit,
  newComment,
  setNewComment,
  editingCommentId,
  editingCommentContent,
  setEditingCommentContent,
  handleStartEditComment,
  handleSaveEditComment,
  handleCancelEditComment,
  handleDeleteComment,
  editingAttachmentId,
  editingAttachmentName,
  setEditingAttachmentName,
  handleSaveRename,
  handleCancelRename,
  setPreviewFile,
  handleDownloadAttachment,
  handleStartRename,
  handleDeleteAttachment,
  isDraggingUpload,
  handleDragOver,
  handleDragEnterUpload,
  handleDragLeaveUpload,
  handleDropUpload,
  handleFileUpload
}) {
  if (!selectedIncident) return null;

  const currentWf = activeWorkflow || (workflows && workflows.length > 0 ? workflows[0] : selectedIncidentWorkflow);
  const orderedStates = getOrderedStates ? getOrderedStates(currentWf) : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ border: 'none', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={() => setSelectedIncidentCode(null)}>
          <ArrowLeft size={16} />
          Retour à la liste
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className={`badge badge-${(selectedIncident.status || '').toLowerCase().replace(' ', '-')}`}>
            {selectedIncident.status}
          </span>
          <span className={`badge badge-category badge-${(selectedIncident.category || '').toLowerCase()}`}>
            {getCategoryIcon && getCategoryIcon(selectedIncident.category)}
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {hasPermission('INCIDENT_EDIT') && (
                <button className="btn btn-secondary btn-small" onClick={handleOpenEditModal} style={{ gap: '6px', height: '32px' }}>
                  <Edit3 size={13} />
                  Modifier
                </button>
              )}
              {hasPermission('INCIDENT_DELETE') && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => handleDeleteIncident(selectedIncident.incidentCode, e)}
                  style={{ gap: '6px', height: '32px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Stepper horizontal de workflow */}
          {orderedStates.length > 0 && (
            <div className="workflow-stepper-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '12px 16px', backgroundColor: 'var(--body-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', flexWrap: 'nowrap' }}>
              {orderedStates.map((state, idx) => {
                const isCurrent = state.name.toLowerCase() === selectedIncident.status.toLowerCase();
                const currentStateIndex = orderedStates.findIndex(s => s.name.toLowerCase() === selectedIncident.status.toLowerCase());
                const isPassed = idx < currentStateIndex;
                const stepStatusClass = isCurrent ? 'current' : (isPassed ? 'passed' : 'upcoming');
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`stepper-circle ${stepStatusClass}`}>
                        {isPassed ? '✓' : idx + 1}
                      </span>
                      <span className={`stepper-label ${stepStatusClass}`}>
                        {state.name}
                      </span>
                    </div>
                    {idx < orderedStates.length - 1 && (
                      <span style={{ color: 'var(--border-color)', fontSize: '11px', fontWeight: 'bold' }}>→</span>
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
                {selectedIncident.author?.name || 'Système'}
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
                <span className="widget-dot" style={{ backgroundColor: getPriorityColor ? getPriorityColor(selectedIncident.priority) : '#3b82f6' }} />
                {selectedIncident.priority}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Sévérité SLA</span>
              <span className="meta-val" style={{ fontWeight: '700', color: (selectedIncident.severity === 'Critique' || (!selectedIncident.severity && selectedIncident.priority === 'Critical')) ? '#dc2626' : (selectedIncident.severity === 'Important' || (!selectedIncident.severity && selectedIncident.priority === 'High')) ? '#ea580c' : '#2563eb' }}>
                {selectedIncident.severity ? `${selectedIncident.severity} (${selectedIncident.severity === 'Critique' ? '< 4h' : selectedIncident.severity === 'Important' ? '< 24h' : '< 3j'})` : (selectedIncident.priority === 'Critical' ? 'Critique (< 4h)' : selectedIncident.priority === 'High' ? 'Important (< 24h)' : 'Mineur (< 3j)')}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Dernière mise à jour</span>
              <span className="meta-val">
                {formatDate ? formatDate(selectedIncident.updatedAt) : selectedIncident.updatedAt}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">SLA / Échéance</span>
              <span className="meta-val">
                {renderSlaBadge && renderSlaBadge(selectedIncident)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Workflow appliqué</span>
              <span className="meta-val" style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
                {selectedIncident.workflow ? selectedIncident.workflow.name : 'Workflow Standard'}
              </span>
            </div>
          </div>

          {/* Jauge Visuelle SLA */}
          {selectedIncident.slaDueAt && selectedIncident.createdAt && selectedIncident.status !== 'Résolu' && selectedIncident.status !== 'Clôturé' && (() => {
            const start = new Date(selectedIncident.createdAt).getTime();
            const due = new Date(selectedIncident.slaDueAt).getTime();
            const total = Math.max(1, due - start);
            const elapsed = tickerTime - start;
            const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
            const diffMs = due - tickerTime;
            const isOverdue = diffMs < 0;
            const barColor = isOverdue ? '#ef4444' : pct > 80 ? '#f97316' : pct > 50 ? '#eab308' : '#22c55e';
            const sev = selectedIncident.severity || (selectedIncident.priority === 'Critical' ? 'Critique' : selectedIncident.priority === 'High' ? 'Important' : 'Mineur');
            const targetText = sev === 'Critique' ? '< 4h (Critique)' : sev === 'Important' ? '< 24h (Important)' : '< 3 jours (Mineur)';

            return (
              <div style={{ marginTop: '16px', marginBottom: '16px', padding: '12px 16px', backgroundColor: 'var(--body-bg)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⏱️ <strong>Objectif SLA :</strong> {targetText}
                  </span>
                  <span style={{ color: isOverdue ? '#dc2626' : '#15803d', fontWeight: '700' }}>
                    {formatSlaDuration ? formatSlaDuration(diffMs) : ''}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--slate-200, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${isOverdue ? 100 : pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.4s ease-in-out' }} />
                </div>
              </div>
            );
          })()}

          <div className="form-group">
            <label>Description</label>
            <div className="detail-desc-block">{selectedIncident.description}</div>
          </div>

          {/* Workflow Transitions Panel */}
          {currentWf && currentWf.transitions && (
            <div className="workflow-actions-panel">
              <h3 className="widget-title" style={{ color: 'var(--text-main)', fontSize: '11px', marginBottom: '8px' }}>
                Moteur de Workflow : Actions Disponibles
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Transitions autorisées pour l'état <strong>{selectedIncident.status}</strong> :
              </p>

              <div className="actions-buttons-container">
                {currentWf.transitions
                  .filter(t => t.fromState.toLowerCase() === selectedIncident.status.toLowerCase())
                  .map((t, idx) => {
                    const hasRole = !t.roleRequired || (getRoleName ? getRoleName(currentUser.role).toLowerCase() === t.roleRequired.toLowerCase() : true);
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
                        onClick={() => handleTransitionClick && handleTransitionClick(t)}
                        disabled={!hasRole}
                        title={t.roleRequired ? `Requis: ${t.roleRequired}` : ''}
                      >
                        Passer à: {t.toState}
                        {t.roleRequired && <span style={{ fontSize: '9px', opacity: 0.8 }}> ({t.roleRequired})</span>}
                      </button>
                    );
                  })
                }

                {currentWf.transitions.filter(t => t.fromState.toLowerCase() === selectedIncident.status.toLowerCase()).length === 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Aucune transition disponible depuis cet état. L'incident est à son étape finale.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Assignment, Comments, Attachments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Assignment Widget */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 className="widget-title">Affectation & Responsabilité</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="avatar-circle avatar-blue" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                {selectedIncident.assignedTo ? selectedIncident.assignedTo.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {selectedIncident.assignedTo ? selectedIncident.assignedTo.name : 'Non assigné'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedIncident.assignedTo ? selectedIncident.assignedTo.email : 'En attente de prise en charge'}
                </div>
              </div>
            </div>

            {hasPermission('INCIDENT_REASSIGN') && (
              !showAssignSelect ? (
                <button
                  className="btn btn-secondary btn-small"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowAssignSelect(true)}
                >
                  <User size={14} />
                  Réassigner l'incident
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-control"
                    style={{ fontSize: '12px', margin: 0 }}
                    onChange={(e) => {
                      if (e.target.value) handleQuickReassignSubmit(e.target.value);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Choisir un membre...</option>
                    <option value="unassign">-- Désassigner --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({getRoleName ? getRoleName(u.role) : ''})</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setShowAssignSelect(false)}
                  >
                    X
                  </button>
                </div>
              )
            )}
          </div>

          {/* Comments Section */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 className="widget-title">Fil de Discussion ({selectedIncident.comments ? selectedIncident.comments.length : 0})</h3>

            <div className="comments-timeline" style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '16px', paddingRight: '6px' }}>
              {selectedIncident.comments && selectedIncident.comments.map(c => (
                <div className="comment-item" key={c.id}>
                  <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="comment-author">{c.author ? c.author.name : 'Utilisateur'}</span>
                      <span className="comment-time">{formatDate ? formatDate(c.createdAt) : c.createdAt}</span>
                    </div>
                    {currentUser && c.author && (currentUser.email === c.author.email || (getRoleName && getRoleName(currentUser.role) === 'Administrateur')) && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {editingCommentId !== c.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEditComment && handleStartEditComment(c)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                            title="Modifier"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteComment && handleDeleteComment(c.id)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <div style={{ marginTop: '8px' }}>
                      <textarea
                        className="form-control"
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        style={{ fontSize: '13px', minHeight: '60px', marginBottom: '6px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveEditComment && handleSaveEditComment(c.id)}
                          className="btn btn-primary btn-small"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditComment}
                          className="btn btn-secondary btn-small"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="comment-body"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown ? parseMarkdown(c.content) : c.content }}
                    />
                  )}
                </div>
              ))}

              {(!selectedIncident.comments || selectedIncident.comments.length === 0) && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>
                  Aucun commentaire pour le moment.
                </div>
              )}
            </div>

            {/* Comment Tabs Form */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--body-bg)' }}>
                <button
                  type="button"
                  onClick={() => setCommentTab && setCommentTab('write')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: 'none',
                    backgroundColor: commentTab === 'write' ? 'var(--card-bg)' : 'transparent',
                    fontWeight: commentTab === 'write' ? 'bold' : 'normal',
                    color: commentTab === 'write' ? 'var(--primary-600)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Écrire (Markdown)
                </button>
                <button
                  type="button"
                  onClick={() => setCommentTab && setCommentTab('preview')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: 'none',
                    backgroundColor: commentTab === 'preview' ? 'var(--card-bg)' : 'transparent',
                    fontWeight: commentTab === 'preview' ? 'bold' : 'normal',
                    color: commentTab === 'preview' ? 'var(--primary-600)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Aperçu
                </button>
              </div>

              <form onSubmit={handleAddCommentSubmit}>
                {commentTab === 'write' ? (
                  <textarea
                    className="form-control"
                    placeholder="Ajouter un commentaire (Markdown pris en charge)..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ border: 'none', borderRadius: 0, minHeight: '80px', fontSize: '13px', margin: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '10px 12px',
                      minHeight: '80px',
                      fontSize: '13px',
                      backgroundColor: 'var(--body-bg)',
                      overflowY: 'auto',
                      color: 'var(--text-color)',
                      lineHeight: '1.5'
                    }}
                    dangerouslySetInnerHTML={{ __html: (parseMarkdown && parseMarkdown(newComment)) || '<span style="color: var(--text-muted); font-style: italic;">Rien à prévisualiser pour le moment.</span>' }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--body-bg)' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-small"
                    disabled={!newComment || !newComment.trim()}
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
            <h3 className="widget-title">Pièces Jointes ({selectedIncident.attachments ? selectedIncident.attachments.length : 0})</h3>

            <div className="attachments-list">
              {selectedIncident.attachments && selectedIncident.attachments.map((file, idx) => (
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
                            if (e.key === 'Enter') handleSaveRename && handleSaveRename(file);
                            if (e.key === 'Escape') handleCancelRename && handleCancelRename();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename && handleSaveRename(file)}
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
                          onClick={() => setPreviewFile && setPreviewFile(file)}
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
                        onClick={() => handleDownloadAttachment && handleDownloadAttachment(file)}
                        className="icon-btn btn-small"
                        title="Télécharger"
                        style={{ border: 'none', background: 'none', color: 'var(--slate-700)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRename && handleStartRename(file)}
                        className="icon-btn btn-small"
                        title="Renommer"
                        style={{ border: 'none', background: 'none', color: 'var(--slate-700)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment && handleDeleteAttachment(file)}
                        className="icon-btn btn-small"
                        title="Supprimer"
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {(!selectedIncident.attachments || selectedIncident.attachments.length === 0) && (
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
                backgroundColor: isDraggingUpload ? 'rgba(59, 130, 246, 0.15)' : 'var(--body-bg)',
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
  );
}
