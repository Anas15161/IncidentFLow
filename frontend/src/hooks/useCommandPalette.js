/**
 * ============================================================================
 * FICHIER      : useCommandPalette.js
 * EMPLACEMENT  : src/hooks
 * DESCRIPTION  : Hook React gérant la logique de la palette de commandes (recherche globale via raccourcis clavier).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import { useState, useRef, useEffect } from 'react';

export function useCommandPalette(
  setShowCreateModal,
  setCurrentView,
  incidents
) {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState("");
  const [commandPaletteSelectedIndex, setCommandPaletteSelectedIndex] = useState(0);
  const commandPaletteInputRef = useRef(null);

  // Get filtered items for the Command Palette (Ctrl+K)
  const getCommandPaletteItems = () => {
    const items = [];
    const query = commandPaletteQuery.toLowerCase().trim();

    // Static commands list
    const commands = [
      { id: 'cmd-new', type: 'command', label: 'Déclarer un incident', shortcut: '> new', action: () => { setShowCreateModal(true); } },
      { id: 'nav-dash', type: 'nav', label: 'Aller au Tableau de bord', shortcut: '> dashboard', action: () => { setCurrentView('dashboard'); } },
      { id: 'nav-inc', type: 'nav', label: 'Aller aux Incidents', shortcut: '> incidents', action: () => { setCurrentView('incidents'); } },
      { id: 'nav-kanban', type: 'nav', label: 'Aller au Kanban', shortcut: '> kanban', action: () => { setCurrentView('kanban'); } },
      { id: 'nav-users', type: 'nav', label: 'Aller aux Utilisateurs', shortcut: '> users', action: () => { setCurrentView('users'); } },
      { id: 'nav-roles', type: 'nav', label: 'Aller aux Rôles', shortcut: '> roles', action: () => { setCurrentView('roles'); } },
      { id: 'nav-wf', type: 'nav', label: 'Aller aux Workflows', shortcut: '> workflows', action: () => { setCurrentView('workflows'); } }
    ];

    // Filter commands by query
    commands.forEach(cmd => {
      if (cmd.label.toLowerCase().includes(query) || cmd.shortcut.toLowerCase().includes(query)) {
        items.push(cmd);
      }
    });

    // Add recent incidents if not starting with command indicator (>)
    if (!query.startsWith('>')) {
      const recentIncidents = [...incidents]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      recentIncidents.forEach(inc => {
        if (inc.title.toLowerCase().includes(query) || inc.incidentCode.toLowerCase().includes(query)) {
          items.push({
            id: `inc-${inc.incidentCode}`,
            type: 'incident',
            label: inc.title,
            sublabel: inc.incidentCode,
            status: inc.state,
            action: () => {
              // Note: you can handle selected incident action here if passed from App
            }
          });
        }
      });
    }

    return items;
  };

  // Universal Command Palette toggle shortcut listener (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandPaletteQuery("");
        setCommandPaletteSelectedIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation shortcuts listener for active Command Palette
  useEffect(() => {
    if (!showCommandPalette) return;

    const handlePaletteKeys = (e) => {
      const items = getCommandPaletteItems();
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommandPaletteSelectedIndex(prev =>
          prev < items.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandPaletteSelectedIndex(prev =>
          prev > 0 ? prev - 1 : items.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[commandPaletteSelectedIndex]) {
          items[commandPaletteSelectedIndex].action();
          setShowCommandPalette(false);
        }
      }
    };

    window.addEventListener('keydown', handlePaletteKeys);
    return () => window.removeEventListener('keydown', handlePaletteKeys);
  }, [showCommandPalette, commandPaletteQuery, commandPaletteSelectedIndex, incidents, setCurrentView, setShowCreateModal]);

  return {
    showCommandPalette,
    setShowCommandPalette,
    commandPaletteQuery,
    setCommandPaletteQuery,
    commandPaletteSelectedIndex,
    setCommandPaletteSelectedIndex,
    commandPaletteInputRef,
    getCommandPaletteItems
  };
}
