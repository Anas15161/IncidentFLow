// ============================================
// components/LoginPage.jsx — Page de Connexion
// ============================================
import React from 'react';
import {
  Activity, AlertCircle, AlertTriangle, CheckCircle,
  Eye, EyeOff, Shield
} from 'lucide-react';
import { getRoleName } from '../utils/helpers';

const USERS = [
  { id: 1, name: "Anas Haddou", firstName: "Anas", lastName: "Haddou", email: "anas@netmar.com", role: "Administrateur", department: "Informatique", post: "Administrateur Système", avatarColor: "bg-blue-600" },
  { id: 2, name: "Sophie Martin", firstName: "Sophie", lastName: "Martin", email: "sophie.m@netmar.com", role: "Responsable", department: "Sécurité", post: "Responsable SSI", avatarColor: "bg-purple-600" },
  { id: 3, name: "Marie Laurent", firstName: "Marie", lastName: "Laurent", email: "marie.l@netmar.com", role: "Opérateur", department: "Support client", post: "Opératrice Réseau", avatarColor: "bg-emerald-600" },
  { id: 4, name: "Dr. Jean Robert", firstName: "Jean", lastName: "Robert", email: "jean.r@netmar.com", role: "Opérateur médical", department: "Urgences médicales", post: "Médecin Coordinateur", avatarColor: "bg-red-600" }
];

export function LoginPage({
  loginEmail, setLoginEmail,
  loginPassword, setLoginPassword,
  loginError,
  showLoginPassword, setShowLoginPassword,
  isCapsLockOn, setIsCapsLockOn,
  handleLoginSubmit,
  triggerQuickLogin
}) {
  return (
    <div className="login-container-split">
      {/* Left Side: Illustration Banner */}
      <div className="login-banner-side">
        <div className="login-banner-overlay" />
        <div className="login-banner-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Activity size={18} style={{ color: '#60a5fa' }} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>IncidentFlow</h1>
          </div>

          <h2 className="login-banner-title">
            Gérez vos incidents de support <span className="highlight-itil">ITIL</span> avec <span className="highlight-fluidite">fluidité</span>.
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '15.5px', lineHeight: '1.6', marginBottom: '32px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            Une plateforme moderne combinant gestion de workflow dynamique, comptes à rebours SLA actifs et communication en temps réel pour vos équipes d'exploitation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <CheckCircle size={14} style={{ color: '#34d399' }} />
              </div>
              <span>Workflow de transition dynamique réactif</span>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <CheckCircle size={14} style={{ color: '#34d399' }} />
              </div>
              <span>Compte à rebours de résolution SLA actif</span>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <CheckCircle size={14} style={{ color: '#34d399' }} />
              </div>
              <span>Éditeur de diagnostics en Markdown & historique Git-style</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form Panel */}
      <div className="login-form-side">
        {/* Ambient Glowing Blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0) 70%)', filter: 'blur(45px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.14) 0%, rgba(168, 85, 247, 0) 70%)', filter: 'blur(55px)', zIndex: 0, pointerEvents: 'none' }} />

        <div className="card neon-card-glow" style={{ width: '100%', maxWidth: '480px', padding: '44px', borderRadius: '20px', background: 'rgba(30, 41, 59, 0.65)', backdropFilter: 'blur(16px)', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div className="brand-icon animate-pulse-red" style={{ width: '48px', height: '48px', marginBottom: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
              <Activity className="text-white" size={24} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.75px', marginBottom: '4px' }}>IncidentFlow</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>Connexion utilisateur sécurisée</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', letterSpacing: '0.08em' }}>OU CONNEXION DIRECTE</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Email ou Identifiant</label>
              <input
                type="email"
                className="form-control"
                placeholder="Ex: anas@netmar.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.45)', color: 'white', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px' }}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Mot de passe</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.getModifierState) {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                    }
                  }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.45)',
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    paddingRight: '40px',
                    width: '100%'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isCapsLockOn && (
                <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <AlertTriangle size={12} />
                  Touche Verr. Maj active
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: '700', borderRadius: '10px', marginTop: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              Se connecter localement
            </button>
          </form>

          {/* Quick-select test accounts */}
          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '12px', textAlign: 'center', fontWeight: '800', letterSpacing: '0.08em' }}>
              COMPTES DE TEST (SIMULATION)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {USERS.map(u => (
                <div
                  key={u.id}
                  onClick={() => triggerQuickLogin(u.email)}
                  className="quick-login-card"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left'
                  }}
                >
                  <span className={`avatar-circle ${u.avatarColor}`} style={{ width: '22px', height: '22px', fontSize: '8px', fontWeight: 'bold' }}>
                    {u.firstName[0]}{u.lastName[0]}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>{u.firstName}</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>{getRoleName(u.role)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
