/**
 * ============================================================================
 * FICHIER      : WorkflowConfigView.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Interface de configuration visuelle des workflows (définition des états, des transitions et des processus d'incidents).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React from 'react';
import {
  Layers, Plus, Trash2, X
} from 'lucide-react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';

export function WorkflowConfigView({
  handleSaveWorkflowGlobally,
  workflows = [],
  selectedWorkflowId,
  setSelectedWorkflowId,
  activeWorkflow,
  editorMode,
  setEditorMode,
  setActiveWorkflow,
  setWorkflows,
  handleToggleWorkflowActive,
  handleUpdateStateColor,
  handleToggleStateActive,
  handleDeleteStateFromWorkflow,
  handleAddStateToWorkflow,
  newStateId,
  setNewStateId,
  newStateLabel,
  setNewStateLabel,
  rolesList = [],
  handleUpdateTransitionRole,
  handleDeleteTransitionFromWorkflow,
  handleQuickAddTransition,
  handleAddTransitionToWorkflow,
  newTransFrom,
  setNewTransFrom,
  newTransTo,
  setNewTransTo,
  newTransRole,
  setNewTransRole,
  newTransRequiresComment,
  setNewTransRequiresComment,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgesDelete
}) {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers className="text-primary-600" />
            Gestion du Workflow Dynamique
          </h1>
          <p className="page-subtitle">Configurez et personnalisez les états de cycle de vie et les transitions de l'incident.</p>
        </div>
        <button onClick={handleSaveWorkflowGlobally} className="btn btn-primary">
          Enregistrer les Modifications
        </button>
      </div>

      {/* Category Selection Tabs */}
      {workflows.length > 1 && (
        <div className="wf-category-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflowId(wf.id)}
              className={`wf-tab ${wf.id === selectedWorkflowId ? 'active' : ''}`}
              style={{
                padding: '10px 16px',
                background: wf.id === selectedWorkflowId ? 'var(--primary-50)' : 'transparent',
                color: wf.id === selectedWorkflowId ? 'var(--primary-700)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: wf.id === selectedWorkflowId ? '2px solid var(--primary-500)' : 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px'
              }}
            >
              {wf.name || wf.category || 'Workflow Standard'}
            </button>
          ))}
        </div>
      )}

      {/* Visual / Textual Mode Toggle */}
      {activeWorkflow && (
        <div className="editor-mode-toggle-container">
          <button
            onClick={() => setEditorMode('visual')}
            className={`btn editor-mode-toggle-btn ${editorMode === 'visual' ? 'active' : ''}`}
          >
            Éditeur Graphique (Visual)
          </button>
          <button
            onClick={() => setEditorMode('textual')}
            className={`btn editor-mode-toggle-btn ${editorMode === 'textual' ? 'active' : ''}`}
          >
            Configuration Textuelle
          </button>
        </div>
      )}

      {activeWorkflow && editorMode === 'textual' && (
        <div className="workflow-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column: General & States Edit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* General Parameters */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="widget-title" style={{ margin: 0 }}>Paramètres du Workflow</h3>
                <span className="badge" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                  Workflow Standard — Actif
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ flexGrow: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nom du processus</label>
                  <input
                    type="text"
                    className="form-control"
                    value={activeWorkflow.name}
                    onChange={(e) => {
                      const updated = { ...activeWorkflow, name: e.target.value };
                      setActiveWorkflow(updated);
                      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ height: '38px', marginTop: '14px', fontWeight: 'bold' }}
                  onClick={handleToggleWorkflowActive}
                >
                  Statut : {activeWorkflow.active ? 'Actif' : 'Inactif'}
                </button>
              </div>
            </div>

            {/* States Manager */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 className="widget-title">Workspace des États</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{activeWorkflow.states.length} étapes</span>
              </div>

              {/* States lists */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeWorkflow.states.map(state => {
                  const isSystem = ["Nouveau", "Clôturé"].includes(state.name);
                  return (
                    <div key={state.id || state.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--body-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID : {state.name} {isSystem && '(Système)'}</span>
                        <input
                          type="text"
                          value={state.label}
                          onChange={(e) => {
                            const updatedStates = activeWorkflow.states.map(s => s.name === state.name ? { ...s, label: e.target.value } : s);
                            const updatedWf = { ...activeWorkflow, states: updatedStates };
                            setActiveWorkflow(updatedWf);
                            setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
                          }}
                          style={{ border: 'none', borderBottom: '1px dashed var(--border-color)', outline: 'none', fontWeight: 'bold', fontSize: '13px', display: 'block', backgroundColor: 'transparent', marginTop: '4px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Color picker presets */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span onClick={() => handleUpdateStateColor(state.name, 'bg-red-50 text-red-600 border-red-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fca5a5' }} />
                          <span onClick={() => handleUpdateStateColor(state.name, 'bg-amber-50 text-amber-600 border-amber-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fde047' }} />
                          <span onClick={() => handleUpdateStateColor(state.name, 'bg-blue-50 text-blue-600 border-blue-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#93c5fd' }} />
                          <span onClick={() => handleUpdateStateColor(state.name, 'bg-emerald-50 text-emerald-600 border-emerald-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#86efac' }} />
                          <span onClick={() => handleUpdateStateColor(state.name, 'bg-slate-50 text-slate-600 border-slate-200')} style={{ cursor: 'pointer', display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleToggleStateActive(state.name)}
                        >
                          {state.active ? 'Actif' : 'Inactif'}
                        </button>
                        <button
                          type="button"
                          className="icon-btn btn-secondary"
                          onClick={() => handleDeleteStateFromWorkflow(state.name)}
                          style={{ color: '#ef4444', border: 'none' }}
                          disabled={isSystem}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add state inline form */}
              <form onSubmit={handleAddStateToWorkflow} style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--body-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Ajouter un État</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '9px' }}>Clé technique ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Attente"
                      value={newStateId}
                      onChange={(e) => setNewStateId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '9px' }}>Libellé Affichage</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: En attente"
                      value={newStateLabel}
                      onChange={(e) => setNewStateLabel(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Ajouter l'état</button>
              </form>
            </div>
          </div>

          {/* Right Column: Transitions Edit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Transitions Rules list */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="widget-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Transitions Autorisées</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeWorkflow.transitions.map((t, idx) => {
                  const defaultRoles = ["Administrateur", "Responsable", "Opérateur", "Opérateur médical"];
                  const currentRoleOptions = Array.from(new Set([
                    ...defaultRoles,
                    ...(rolesList || []).map(r => r.name).filter(Boolean),
                    ...(t.roleRequired ? [t.roleRequired] : [])
                  ]));
                  const isMain = (t.fromState === 'Nouveau' && t.toState === 'Assigné') ||
                    (t.fromState === 'Assigné' && t.toState === 'En cours') ||
                    (t.fromState === 'En cours' && t.toState === 'Résolu') ||
                    (t.fromState === 'Résolu' && t.toState === 'Clôturé');

                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--body-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                          <span className="badge" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: isMain ? '#e0f2fe' : '#fef3c7', color: isMain ? '#0369a1' : '#b45309', border: 'none' }}>
                            {isMain ? '⏩ Principale' : '🔄 Secondaire'}
                          </span>
                          <span>{t.fromState}</span>
                          <span>➔</span>
                          <span style={{ color: 'var(--primary-600)' }}>{t.toState}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {t.requiresComment ? '💬 Commentaire obligatoire' : '💬 Commentaire optionnel'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <label style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: 0 }}>Rôle Autorisé</label>
                          <select
                            className="form-control"
                            style={{ fontSize: '11px', padding: '4px 8px', width: 'auto', minWidth: '150px', background: 'var(--card-bg)' }}
                            value={t.roleRequired || ''}
                            onChange={(e) => handleUpdateTransitionRole(t.fromState, t.toState, e.target.value)}
                            title="Modifier le rôle autorisé pour cette transition"
                          >
                            <option value="">🔓 Tous les utilisateurs</option>
                            {currentRoleOptions.map(r => (
                              <option key={r} value={r}>🔑 {r}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="icon-btn btn-secondary"
                          onClick={() => handleDeleteTransitionFromWorkflow(t.fromState, t.toState)}
                          style={{ color: '#ef4444', border: 'none', alignSelf: 'flex-end', marginBottom: '2px' }}
                          title="Supprimer la transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {activeWorkflow.transitions.length === 0 && (
                  <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '12px', padding: '20px', color: 'var(--text-muted)' }}>
                    Aucune transition configurée.
                  </div>
                )}
              </div>

              {/* Modèles Prédéfinis de Transitions Secondaires */}
              <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'var(--body-bg)', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔄 Modèles Prédéfinis de Transitions Secondaires :</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { from: 'Nouveau', to: 'En cours', label: '+ Nouveau ➔ En cours (Autoprise en charge)' },
                    { from: 'Assigné', to: 'Nouveau', label: '+ Assigné ➔ Nouveau (Remise en file)' },
                    { from: 'En cours', to: 'Assigné', label: '+ En cours ➔ Assigné (Réassignation)' },
                    { from: 'Résolu', to: 'En cours', label: '+ Résolu ➔ En cours (Réouverture)' }
                  ].map((sec, i) => {
                    const exists = activeWorkflow.transitions.some(t => t.fromState === sec.from && t.toState === sec.to);
                    return (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-secondary btn-small"
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: exists ? '#f1f5f9' : 'var(--card-bg)',
                          color: exists ? '#94a3b8' : 'var(--primary-600)',
                          borderColor: exists ? '#e2e8f0' : 'var(--border-color)',
                          cursor: exists ? 'default' : 'pointer'
                        }}
                        onClick={() => !exists && handleQuickAddTransition(sec.from, sec.to)}
                        disabled={exists}
                      >
                        {exists ? `✓ ${sec.from} ➔ ${sec.to}` : sec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add transition inline form */}
              <form onSubmit={handleAddTransitionToWorkflow} style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--body-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Définir une Transition Personnalisée</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '9px' }}>État Origine</label>
                    <select className="form-control" value={newTransFrom} onChange={(e) => setNewTransFrom(e.target.value)} required style={{ background: 'var(--card-bg)' }}>
                      <option value="">Choisir...</option>
                      {activeWorkflow.states.filter(s => s.active).map(s => (
                        <option key={s.name} value={s.name}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '9px' }}>État Destination</label>
                    <select className="form-control" value={newTransTo} onChange={(e) => setNewTransTo(e.target.value)} required style={{ background: 'var(--card-bg)' }}>
                      <option value="">Choisir...</option>
                      {activeWorkflow.states.filter(s => s.active).map(s => (
                        <option key={s.name} value={s.name}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>Rôle Autorisé</label>
                  <select className="form-control" value={newTransRole} onChange={(e) => setNewTransRole(e.target.value)} style={{ background: 'var(--card-bg)' }}>
                    <option value="">Tous les utilisateurs</option>
                    <option value="Administrateur">Administrateur</option>
                    <option value="Responsable">Responsable</option>
                    <option value="Opérateur">Opérateur</option>
                    <option value="Opérateur médical">Opérateur médical</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <input
                    type="checkbox"
                    id="check-requires-comment"
                    checked={newTransRequiresComment}
                    onChange={(e) => setNewTransRequiresComment(e.target.checked)}
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  <label htmlFor="check-requires-comment" style={{ marginBottom: 0, fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>Exiger un commentaire obligatoire</label>
                </div>
                <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end', width: '100%', justifyContent: 'center' }}>Autoriser la Transition</button>
              </form>
            </div>

            {/* Graphic Visualizer help */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="widget-title" style={{ marginBottom: '10px' }}>Aperçu Visuel du Processus</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--body-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {activeWorkflow.states.filter(s => s.active).map(state => {
                  const destinations = activeWorkflow.transitions.filter(t => t.fromState === state.name).map(t => t.toState);
                  return (
                    <div key={state.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontSize: '11.5px' }}>
                      <span className={`badge ${state.colorClass}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{state.label}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                        {destinations.length === 0 ? '🏁 État final' : `➔ ${destinations.join(', ')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeWorkflow && editorMode === 'visual' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Visual Editor Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="widget-title" style={{ margin: 0 }}>Graphe Relationnel d'États</h3>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>Moteur de routage interactif React Flow</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-normal" style={{ fontSize: '10px', fontWeight: 'bold' }}>Actif</span>
              </div>
            </div>

            {/* Info and Tips Banner */}
            <div style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '700', border: '1px solid' }}>
              <div>💡 Glissez-déposez la ligne depuis le point de sortie d'un état vers un autre état pour créer une transition.</div>
              <div>💡 Sélectionnez une ligne de transition (lien) et appuyez sur la touche "Suppr" ou "Backspace" pour la supprimer.</div>
              <div>💡 Déplacez librement les boîtes d'états pour organiser la présentation spatiale.</div>
            </div>

            {/* React Flow Canvas container */}
            <div style={{ width: '100%', height: '480px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--body-bg)', position: 'relative' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgesDelete={onEdgesDelete}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background color="#ccc" gap={16} />
              </ReactFlow>
            </div>
          </div>

          {/* Bottom row: Add states inline in visual mode so they don't have to switch to textual mode! */}
          <div className="workflow-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left: Quick Add State */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="widget-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Ajouter un État Graphique</h3>
              <form onSubmit={handleAddStateToWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '9px' }}>Clé technique ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Validation"
                      value={newStateId}
                      onChange={(e) => setNewStateId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '9px' }}>Libellé Affichage</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: En validation"
                      value={newStateLabel}
                      onChange={(e) => setNewStateLabel(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Ajouter au graphique</button>
              </form>
            </div>

            {/* Right: Quick Configure Transition properties (like adding role or comment requirement) */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="widget-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Configuration des Transitions ({activeWorkflow.transitions.length})</h3>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeWorkflow.transitions.map((t, idx) => {
                  const defaultRoles = ["Administrateur", "Responsable", "Opérateur", "Opérateur médical"];
                  const currentRoleOptions = Array.from(new Set([
                    ...defaultRoles,
                    ...(rolesList || []).map(r => r.name).filter(Boolean),
                    ...(t.roleRequired ? [t.roleRequired] : [])
                  ]));
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--body-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontWeight: 'bold' }}>{t.fromState} ➔ {t.toState}</span>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {t.requiresComment ? '💬 Commentaire requis' : '💬 Optionnel'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                          className="form-control"
                          style={{ fontSize: '10px', padding: '2px 6px', height: '26px', width: 'auto', minWidth: '120px', background: 'var(--card-bg)' }}
                          value={t.roleRequired || ''}
                          onChange={(e) => handleUpdateTransitionRole(t.fromState, t.toState, e.target.value)}
                          title="Modifier le rôle autorisé pour cette transition"
                        >
                          <option value="">🔓 Tous</option>
                          {currentRoleOptions.map(r => (
                            <option key={r} value={r}>🔑 {r}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          style={{ padding: '2px 6px', fontSize: '9px', height: '26px' }}
                          onClick={() => {
                            const req = !t.requiresComment;
                            const updated = activeWorkflow.transitions.map((tr, i) => i === idx ? { ...tr, requiresComment: req } : tr);
                            const updatedWf = { ...activeWorkflow, transitions: updated };
                            setActiveWorkflow(updatedWf);
                            setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
                          }}
                          title="Activer/Désactiver le commentaire obligatoire"
                        >
                          💬 Commentaire
                        </button>
                        <button
                          type="button"
                          className="icon-btn btn-secondary"
                          onClick={() => handleDeleteTransitionFromWorkflow(t.fromState, t.toState)}
                          style={{ color: '#ef4444', border: 'none', padding: '2px' }}
                          title="Supprimer la transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
