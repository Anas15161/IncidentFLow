const handleQuickReassignSubmit = async (assigneeId) => {
    setErrorMessage('');
    const selectedAssignee = usersList.find(u => u.id.toString() === assigneeId.toString());
    const payload = {
      title: selectedIncident.title,
      description: selectedIncident.description,
      category: selectedIncident.category,
      priority: selectedIncident.priority,
      severity: selectedIncident.severity,
      assignedTo: selectedAssignee ? { id: selectedAssignee.id } : null
    };

    try {
      const res = await fetch(`${API_BASE}/incidents/${selectedIncident.incidentCode}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur de réassignation de l'incident.");
      }

      const updatedIncident = await res.json();
      setIncidents(prev => prev.map(inc => 
        inc.incidentCode === updatedIncident.incidentCode ? updatedIncident : inc
      ));
      setSelectedIncident(updatedIncident);
      setShowAssignSelect(false);
      setSuccessMessage('Incident réassigné avec succès.');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      const newLog = {
        id: Date.now().toString(),
        type: 'UPDATE',
        incidentId: updatedIncident.id || updatedIncident.incidentCode,
        user: currentUser?.name || 'Système',
        action: `Incident réassigné à ${selectedAssignee ? selectedAssignee.name : 'Non assigné'}`,
        date: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);

    } catch (err) {
      setErrorMessage(err.message);
    }
  };
