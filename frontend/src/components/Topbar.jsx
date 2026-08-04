/**
 * ============================================================================
 * FICHIER      : Topbar.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Barre de navigation supérieure (en-tête), affichant le profil utilisateur, les notifications et les actions globales.
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React from 'react';
import { Search, Bell, ChevronDown, User, Settings, HelpCircle, LogOut } from 'lucide-react';

export function Topbar({
  searchQuery,
  setSearchQuery,
  fetchIncidents,
  showNotifications,
  setShowNotifications,
  notifications,
  showProfileDropdown,
  setShowProfileDropdown,
  currentUser,
  getRoleName,
  handleOpenEditProfile,
  handleOpenAppSettings,
  setShowHelpModal,
  handleLogout
}) {
  return (
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
        {/* Notification Bell */}
        <div className="notif-bell-container">
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={18} />
            <span className="bell-badge">{notifications.length}</span>
          </button>

          {showNotifications && (
            <div className="card" style={{ position: 'absolute', right: 0, top: '44px', width: '280px', zIndex: 60, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Notifications Récentes
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  • {n.text} <span style={{ fontSize: '9px', opacity: 0.6 }}>({n.time})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User display with Dropdown */}
        <div className="user-profile-dropdown-container">
          <button
            className="user-profile-menu"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className={`avatar-circle ${currentUser.avatarColor}`}>
              {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-role">{getRoleName(currentUser.role)}</span>
            </div>
            <ChevronDown size={14} className="dropdown-arrow" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }} />
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-header">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-email">{currentUser.email}</span>
              </div>

              <button className="profile-dropdown-item" onClick={handleOpenEditProfile}>
                <User size={14} />
                <span>Modifier le profil</span>
              </button>

              <button className="profile-dropdown-item" onClick={handleOpenAppSettings}>
                <Settings size={14} />
                <span>Paramètres</span>
              </button>

              <button className="profile-dropdown-item" onClick={() => { setShowHelpModal(true); setShowProfileDropdown(false); }}>
                <HelpCircle size={14} />
                <span>Aide & Support</span>
              </button>

              <div className="profile-dropdown-divider"></div>

              <button className="profile-dropdown-item logout" onClick={() => { handleLogout(); setShowProfileDropdown(false); }}>
                <LogOut size={14} />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
