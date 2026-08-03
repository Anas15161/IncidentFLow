import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, History, Search, Filter, Clock, User, FileText,
  AlertCircle, Download, CheckCircle, RefreshCw, Layers, Lock, Shield
} from 'lucide-react';

const MOCK_AUDIT_LOGS = [
  {
    id: 101,
    incidentCode: 'INC-001',
    eventType: 'CREATION_INCIDENT',
    actorName: 'Anas Haddou',
    actorEmail: 'anas@netmar.com',
    actorRole: 'Administrateur',
    timestamp: '2026-08-03T10:15:00Z',
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
    timestamp: '2026-08-03T10:20:30Z',
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
    timestamp: '2026-08-03T10:35:12Z',
    details: 'Changement d\'état: [Nouveau] ➔ [En cours]. Motif: Analyse des journaux système et redémarrage du service.',
    ipAddress: '192.168.1.88',
    checksum: 'e71029ab54f'
  },
  {
    id: 104,
    incidentCode: 'INC-002',
    eventType: 'TRANSITION_STATUT',
    actorName: 'Sophie Martin',
    actorEmail: 'sophie.m@netmar.com',
    actorRole: 'Responsable',
    timestamp: '2026-08-03T11:50:00Z',
    details: 'Changement d\'état: [En cours] ➔ [Résolu]. Motif: Correctif de sécurité appliqué sur le pare-feu.',
    ipAddress: '192.168.1.12',
    checksum: 'f912c488e1a'
  },
  {
    id: 105,
    incidentCode: 'INC-003',
    eventType: 'MODIFICATION_PRIORITE',
    actorName: 'Dr. Jean Robert',
    actorEmail: 'jean.r@netmar.com',
    actorRole: 'Opérateur médical',
    timestamp: '2026-08-03T14:10:00Z',
    details: 'Priorité réévaluée de [Moyenne] ➔ [Critique]. Motif: Impact direct sur la prise en charge des patients.',
    ipAddress: '192.168.1.102',
    checksum: 'b1259c4021e'
  }
];

export function AuditTrailView({ auditLogs = MOCK_AUDIT_LOGS, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('Tous');

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return (auditLogs || []).filter(log => {
      const matchesSearch = !term ||
        log.incidentCode?.toLowerCase().includes(term) ||
        log.actorName?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term) ||
        log.actorRole?.toLowerCase().includes(term);

      const matchesType = eventTypeFilter === 'Tous' || log.eventType === eventTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [auditLogs, searchTerm, eventTypeFilter]);

  const exportAuditLogsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_trail_iso27001_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="audit-trail-container animate-fade-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner ISO 27001 / ITIL */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={24} className="text-primary-400" />
            Journal d'Audit & Traçabilité Inaltérable (Audit Trail)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            Conformité ISO 27001 / ITIL v4 -- Registre d'audit certifié des évènements, transitions et accès.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} />
            Certifié ISO 27001
          </span>

          <button
            className="btn btn-primary"
            onClick={exportAuditLogsJSON}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}
          >
            <Download size={14} />
            Exporter le Registre JSON
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher par incident, utilisateur, rôle ou action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', height: '38px', borderRadius: '8px', fontSize: '13px' }}
          />
        </div>

        <select
          className="filter-select"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
        >
          <option value="Tous">Tous les types d'évènements</option>
          <option value="CREATION_INCIDENT">Création d'Incident</option>
          <option value="TRANSITION_STATUT">Transition d'État / Statut</option>
          <option value="REASSIGNATION">Réassignation d'Intervenant</option>
          <option value="MODIFICATION_PRIORITE">Changement de Priorité</option>
        </select>
      </div>

      {/* Audit Log Timeline Table */}
      <div style={{ background: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)', textAlign: 'left', color: 'var(--text-muted, #64748b)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px', width: '170px' }}>Horodatage ISO</th>
              <th style={{ padding: '12px 16px', width: '110px' }}>Code</th>
              <th style={{ padding: '12px 16px', width: '160px' }}>Évènement</th>
              <th style={{ padding: '12px 16px', width: '180px' }}>Opérateur / Rôle</th>
              <th style={{ padding: '12px 16px' }}>Détails de l'Action</th>
              <th style={{ padding: '12px 16px', width: '120px' }}>Empreinte Hash</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucune entrée d'audit ne correspond à vos filtres.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} style={{ color: '#3b82f6' }} />
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '800', color: '#2563eb' }}>
                    {log.incidentCode}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '11px', fontWeight: '700' }}>
                      {log.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{log.actorName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.actorRole} ({log.ipAddress})</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    {log.details}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                    <code>#{log.checksum}</code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
