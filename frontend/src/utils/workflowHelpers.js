/**
 * ============================================================================
 * FICHIER      : workflowHelpers.js
 * EMPLACEMENT  : src/utils
 * DESCRIPTION  : Fonctions utilitaires spécialisées pour la logique métier des workflows et la manipulation des graphes d'états de React Flow.
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import { MarkerType } from 'reactflow';

export const getInitialNodes = (states) => {
  if (!states || states.length === 0) return [];

  const statePosMap = {
    'nouveau': { x: 40, y: 180 },
    'assigné': { x: 230, y: 180 },
    'en cours': { x: 420, y: 180 },
    'résolu': { x: 610, y: 180 },
    'clôturé': { x: 800, y: 180 },
    'cloture': { x: 800, y: 180 }
  };

  const customStates = states.filter(s => !statePosMap[s.name.toLowerCase().trim()]);

  return states.map((state) => {
    const key = state.name.toLowerCase().trim();
    const isNouveau = key === 'nouveau';
    const isCloture = key === 'clôturé' || key === 'cloture';

    let nodeType = 'default';
    if (isNouveau) nodeType = 'input';
    else if (isCloture) nodeType = 'output';

    let pos = statePosMap[key];
    if (!pos) {
      const customIdx = customStates.findIndex(c => c.name.toLowerCase().trim() === key);
      pos = {
        x: 230 + (customIdx * 190),
        y: customIdx % 2 === 0 ? 60 : 300
      };
    }

    return {
      id: state.name,
      type: nodeType,
      data: { label: `${state.label || state.name}` },
      position: pos,
      sourcePosition: 'right',
      targetPosition: 'left',
      style: {
        background: state.active ? 'var(--card-bg)' : 'var(--border-color)',
        color: 'var(--text-main)',
        border: '2px solid ' + (isNouveau ? '#10b981' : isCloture ? '#6366f1' : '#3b82f6'),
        borderRadius: '10px',
        padding: '12px',
        fontWeight: 'bold',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        width: 145,
        textAlign: 'center'
      }
    };
  });
};

export const getInitialEdges = (transitions, states) => {
  if (!transitions || !states) return [];
  const stateNameMap = new Map();
  states.forEach(s => stateNameMap.set(s.name.toLowerCase().trim(), s.name));

  return transitions
    .map((t, idx) => {
      const source = stateNameMap.get((t.fromState || '').toLowerCase().trim()) || t.fromState;
      const target = stateNameMap.get((t.toState || '').toLowerCase().trim()) || t.toState;

      if (!source || !target) return null;

      const isReverse = source.toLowerCase() === 'résolu' && target.toLowerCase() === 'en cours';

      return {
        id: `e-${source}-${target}-${idx}`,
        source: source,
        target: target,
        animated: true,
        type: 'smoothstep',
        style: { stroke: isReverse ? '#f59e0b' : '#3b82f6', strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isReverse ? '#f59e0b' : '#3b82f6',
          width: 20,
          height: 20
        },
        label: t.roleRequired ? `🔑 ${t.roleRequired}` : ''
      };
    })
    .filter(Boolean);
};

export const getOrderedStates = (wf) => {
  if (!wf || !wf.states || wf.states.length === 0) return [];
  const states = wf.states;
  const transitions = wf.transitions || [];

  const stateMap = new Map();
  states.forEach(s => stateMap.set(s.name.toLowerCase().trim(), s));

  const initialKey = states.find(s => s.name.toLowerCase().trim() === 'nouveau')?.name.toLowerCase().trim() || states[0].name.toLowerCase().trim();

  const adj = new Map();
  states.forEach(s => adj.set(s.name.toLowerCase().trim(), []));
  transitions.forEach(t => {
    const from = (t.fromState || '').toLowerCase().trim();
    const to = (t.toState || '').toLowerCase().trim();
    if (adj.has(from) && adj.has(to)) {
      adj.get(from).push(to);
    }
  });

  const orderedKeys = [];
  const visited = new Set();
  const queue = [initialKey];

  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (!visited.has(currentKey) && stateMap.has(currentKey)) {
      visited.add(currentKey);
      orderedKeys.push(currentKey);

      const neighbors = adj.get(currentKey) || [];
      // Prioritize non-final states so 'clôturé' appears last
      neighbors.sort((a, b) => (a === 'clôturé' || a === 'cloture' ? 1 : 0) - (b === 'clôturé' || b === 'cloture' ? 1 : 0));
      neighbors.forEach(n => {
        if (!visited.has(n) && !queue.includes(n)) {
          queue.push(n);
        }
      });
    }
  }

  // Append any unvisited states before 'clôturé'
  states.forEach(s => {
    const key = s.name.toLowerCase().trim();
    if (!visited.has(key)) {
      orderedKeys.push(key);
    }
  });

  // Ensure 'clôturé' is at the very end
  const clotureIdx = orderedKeys.findIndex(k => k === 'clôturé' || k === 'cloture');
  if (clotureIdx !== -1 && clotureIdx !== orderedKeys.length - 1) {
    const [clotureKey] = orderedKeys.splice(clotureIdx, 1);
    orderedKeys.push(clotureKey);
  }

  return orderedKeys.map(k => stateMap.get(k)).filter(Boolean);
};
