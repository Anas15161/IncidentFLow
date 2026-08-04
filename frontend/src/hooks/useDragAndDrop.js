/**
 * ============================================================================
 * FICHIER      : useDragAndDrop.js
 * EMPLACEMENT  : src/hooks
 * DESCRIPTION  : Hook React fournissant la logique pour les événements de glisser-déposer (ex: upload de fichiers ou déplacement d'éléments).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import { useState } from 'react';

export function useDragAndDrop(onDropCallback) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (onDropCallback) {
        onDropCallback(e.dataTransfer.files[0]);
      }
    }
  };

  return {
    isDragging,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
}
