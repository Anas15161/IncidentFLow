// ============================================
// hooks/useSettings.js — Paramètres App & Profil
// ============================================
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8080/api';

export function useSettings({ currentUser, setCurrentUser, getHeaders, fetchUsers }) {
  // Profile & Settings Dropdown / Modals states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [enableNotifications, setEnableNotifications] = useState(() => {
    return localStorage.getItem('enableNotifications') !== 'false';
  });
  const [notificationSound, setNotificationSound] = useState(() => {
    return localStorage.getItem('notificationSound') !== 'false';
  });
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('maintenanceMode') === 'true';
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    return parseInt(localStorage.getItem('itemsPerPage') || '5');
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    return parseInt(localStorage.getItem('autoRefreshInterval') || '30');
  });
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });
  const [workflowRuleMode, setWorkflowRuleMode] = useState(() => {
    return localStorage.getItem('workflowRuleMode') || 'strict';
  });

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    post: '',
    department: '',
    avatarColor: 'bg-blue-600'
  });

  // App Settings Form State
  const [appSettingsForm, setAppSettingsForm] = useState({
    sessionDuration: '600',
    enableNotifications: true,
    notificationSound: true,
    maintenanceMode: false,
    itemsPerPage: '5',
    autoRefreshInterval: '0',
    themeMode: 'light'
  });

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nouvel incident médical assigné automatiquement.", time: "Il y a 5 min" },
    { id: 2, text: "Sophie Martin a mis à jour l'incident INC-2026-002.", time: "Il y a 15 min" },
    { id: 3, text: "Base de données initialisée avec succès.", time: "Il y a 1 h" }
  ]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.user-profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
      if (showNotifications && !event.target.closest('.notif-bell-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown, showNotifications]);

  // Open Edit Profile modal
  const handleOpenEditProfile = () => {
    setProfileForm({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      post: currentUser.post || '',
      department: currentUser.department || '',
      avatarColor: currentUser.avatarColor || 'bg-blue-600'
    });
    setShowEditProfileModal(true);
    setShowProfileDropdown(false);
  };

  // Open App Settings modal
  const handleOpenAppSettings = (sessionDuration) => {
    setAppSettingsForm({
      sessionDuration: sessionDuration.toString(),
      enableNotifications: enableNotifications,
      notificationSound: notificationSound,
      maintenanceMode: maintenanceMode,
      itemsPerPage: itemsPerPage.toString(),
      autoRefreshInterval: autoRefreshInterval.toString(),
      themeMode: themeMode
    });
    setShowAppSettingsModal(true);
    setShowProfileDropdown(false);
  };

  // Save profile changes
  const handleEditProfileSubmit = async (e, errorMessageSetter, successMessageSetter) => {
    e.preventDefault();
    errorMessageSetter('');
    const updatedUser = {
      ...currentUser,
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      name: `${profileForm.firstName} ${profileForm.lastName}`,
      email: profileForm.email,
      post: profileForm.post,
      department: profileForm.department,
      avatarColor: profileForm.avatarColor
    };

    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedUser)
      });

      if (!res.ok) throw new Error("Impossible de sauvegarder le profil sur le serveur.");

      const savedUser = await res.json();
      setCurrentUser(savedUser);
      localStorage.setItem('user', JSON.stringify(savedUser));
      setShowEditProfileModal(false);

      if (fetchUsers) fetchUsers();

      successMessageSetter("Profil mis à jour avec succès !");
    } catch (err) {
      errorMessageSetter(err.message);
    }
  };

  // Save app settings changes
  const handleAppSettingsSubmit = (e, setSessionDuration, setSessionTimeLeft, successMessageSetter) => {
    e.preventDefault();
    const newDur = parseInt(appSettingsForm.sessionDuration);
    setSessionDuration(newDur);
    setSessionTimeLeft(newDur);
    setEnableNotifications(appSettingsForm.enableNotifications);
    setNotificationSound(appSettingsForm.notificationSound);
    setMaintenanceMode(appSettingsForm.maintenanceMode);

    const newItems = parseInt(appSettingsForm.itemsPerPage);
    setItemsPerPage(newItems);

    const newInterval = parseInt(appSettingsForm.autoRefreshInterval);
    setAutoRefreshInterval(newInterval);

    setThemeMode(appSettingsForm.themeMode);

    localStorage.setItem('sessionDuration', appSettingsForm.sessionDuration);
    localStorage.setItem('enableNotifications', appSettingsForm.enableNotifications.toString());
    localStorage.setItem('notificationSound', appSettingsForm.notificationSound.toString());
    localStorage.setItem('maintenanceMode', appSettingsForm.maintenanceMode.toString());
    localStorage.setItem('itemsPerPage', appSettingsForm.itemsPerPage);
    localStorage.setItem('autoRefreshInterval', appSettingsForm.autoRefreshInterval);
    localStorage.setItem('themeMode', appSettingsForm.themeMode);

    setShowAppSettingsModal(false);
    successMessageSetter("Paramètres mis à jour avec succès !");
  };

  return {
    showProfileDropdown, setShowProfileDropdown,
    showEditProfileModal, setShowEditProfileModal,
    showAppSettingsModal, setShowAppSettingsModal,
    showHelpModal, setShowHelpModal,
    enableNotifications, notificationSound, maintenanceMode,
    itemsPerPage, setItemsPerPage,
    autoRefreshInterval, themeMode, setThemeMode, workflowRuleMode,
    profileForm, setProfileForm,
    appSettingsForm, setAppSettingsForm,
    showNotifications, setShowNotifications,
    notifications, setNotifications,
    handleOpenEditProfile,
    handleOpenAppSettings,
    handleEditProfileSubmit,
    handleAppSettingsSubmit
  };
}
