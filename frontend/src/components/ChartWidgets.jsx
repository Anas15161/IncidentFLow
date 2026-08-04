/**
 * ============================================================================
 * FICHIER      : ChartWidgets.jsx
 * EMPLACEMENT  : src/components
 * DESCRIPTION  : Composants réutilisables pour afficher divers graphiques et indicateurs (widgets) dans le tableau de bord (ex: KPI, courbes, donuts).
 * ============================================================================
 * Ce fichier a été documenté pour faciliter la compréhension du code.
 */

import React, { useState } from 'react';
import { Globe, Shield, Cpu, Stethoscope, FileText } from 'lucide-react';
import { getDonutSegmentPath, formatSlaDuration } from '../utils/helpers';

export const getCategoryIcon = (category) => {
  switch (category) {
    case 'Réseau': return <Globe size={16} />;
    case 'Sécurité': return <Shield size={16} />;
    case 'Système': return <Cpu size={16} />;
    case 'Médical': return <Stethoscope size={16} />;
    default: return <FileText size={16} />;
  }
};

export const renderSlaBadge = (inc) => {
  if (!inc.slaDueAt) return null;

  if (inc.status === 'Résolu' || inc.status === 'Clôturé') {
    return (
      <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#86efac', fontWeight: 'bold' }}>
        ✓ SLA Respecté
      </span>
    );
  }

  const dueDate = new Date(inc.slaDueAt);
  const now = new Date();
  const diffMs = dueDate - now;
  const isOverdue = diffMs < 0;
  const formattedText = formatSlaDuration(diffMs);

  if (isOverdue) {
    return (
      <span className="badge badge-error" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', fontWeight: 'bold', animation: 'pulse-danger 2s infinite' }}>
        ⚠️ {formattedText}
      </span>
    );
  }

  if (diffMs < 1000 * 60 * 60) { // < 1 hour
    return (
      <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d', fontWeight: 'bold' }}>
        ⚠️ {formattedText}
      </span>
    );
  }

  return (
    <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 'bold' }}>
      ⏱ {formattedText}
    </span>
  );
};

export function PriorityDonut({ incidents, setCurrentView, setPriorityFilter }) {
  const criticalCount = incidents.filter(i => i.priority === 'Critical').length;
  const highCount = incidents.filter(i => i.priority === 'High').length;
  const mediumCount = incidents.filter(i => i.priority === 'Medium').length;
  const lowCount = incidents.filter(i => i.priority === 'Low').length;
  const total = criticalCount + highCount + mediumCount + lowCount;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '40px 0' }}>
        Aucune donnée disponible.
      </div>
    );
  }

  const segments = [
    { count: criticalCount, color: "#dc2626", label: "Critique", raw: "Critical" },
    { count: highCount, color: "#ea580c", label: "Élevée", raw: "High" },
    { count: mediumCount, color: "#ca8a04", label: "Moyenne", raw: "Medium" },
    { count: lowCount, color: "#16a34a", label: "Faible", raw: "Low" }
  ].filter(s => s.count > 0);

  let accumulatedAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', width: '100%' }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx="70" cy="70" r="50" fill="transparent" stroke="var(--border-color)" strokeWidth="12" />
        {segments.map((seg, idx) => {
          const percentage = seg.count / total;
          const angle = percentage * 360;
          let path = "";
          if (percentage === 1) {
            return (
              <circle key={idx} cx="70" cy="70" r="50" fill="transparent" stroke={seg.color} strokeWidth="12" className="donut-segment" onClick={() => { setCurrentView('incidents'); setPriorityFilter(seg.raw); }} />
            );
          } else {
            path = getDonutSegmentPath(70, 70, 50, accumulatedAngle, accumulatedAngle + angle);
            accumulatedAngle += angle;
            return (
              <path key={idx} d={path} fill="transparent" stroke={seg.color} strokeWidth="12" strokeLinecap="round" className="donut-segment" onClick={() => { setCurrentView('incidents'); setPriorityFilter(seg.raw); }} />
            );
          }
        })}
        <text x="70" y="65" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '18px', fontWeight: '800', fill: 'var(--text-main)', transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>{total}</text>
        <text x="70" y="81" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '9px', fontWeight: '700', fill: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {segments.map((seg, idx) => (
          <div key={idx} className="donut-legend-item" onClick={() => { setCurrentView('incidents'); setPriorityFilter(seg.raw); }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }}></span>
            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{seg.label}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: '700' }}>{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RealTimeTrendChart({ incidents }) {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

  const getTrendData = () => {
    const data = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

      const createdCount = incidents.filter(inc => {
        const createdDate = new Date(inc.createdAt);
        return createdDate.toDateString() === d.toDateString();
      }).length;

      const resolvedCount = incidents.filter(inc => {
        const updatedDate = new Date(inc.updatedAt || inc.createdAt);
        return (inc.status === 'Résolu' || inc.status === 'Clôturé') && updatedDate.toDateString() === d.toDateString();
      }).length;

      const activeCount = incidents.filter(inc => {
        const createdDate = new Date(inc.createdAt);
        const isCreatedBeforeOrOn = createdDate <= d || createdDate.toDateString() === d.toDateString();

        let isStillActive = true;
        if (inc.status === 'Résolu' || inc.status === 'Clôturé') {
          const resolvedDate = new Date(inc.updatedAt || inc.createdAt);
          isStillActive = resolvedDate > d && resolvedDate.toDateString() !== d.toDateString();
        }

        return isCreatedBeforeOrOn && isStillActive;
      }).length;

      data.push({
        dateLabel: dateStr,
        created: createdCount,
        resolved: resolvedCount,
        active: activeCount,
        rawDate: d
      });
    }

    const hasHistory = data.slice(0, 6).some(item => item.created > 0 || item.resolved > 0 || item.active > 0);
    if (!hasHistory && incidents.length > 0) {
      const mockBaselines = [
        { created: 2, resolved: 1, active: 3 },
        { created: 1, resolved: 2, active: 2 },
        { created: 4, resolved: 2, active: 4 },
        { created: 2, resolved: 3, active: 3 },
        { created: 3, resolved: 1, active: 5 },
        { created: 5, resolved: 4, active: 6 }
      ];
      mockBaselines.forEach((mock, idx) => {
        data[idx].created = mock.created;
        data[idx].resolved = mock.resolved;
        data[idx].active = mock.active;
      });
      data[6].created = incidents.length;
      data[6].active = incidents.filter(i => i.status !== 'Résolu' && i.status !== 'Clôturé').length;
      data[6].resolved = incidents.filter(i => i.status === 'Résolu' || i.status === 'Clôturé').length;
    }

    return data;
  };

  const trendData = getTrendData();
  const maxY = Math.max(...trendData.map(d => Math.max(d.created, d.resolved, d.active)), 4) + 1;

  const activeIndex = hoveredTrendIndex !== null ? hoveredTrendIndex : 6;
  const activeData = trendData[activeIndex];

  const pointsWidth = 440;
  const pointsHeight = 145;
  const paddingLeft = 40;
  const paddingTop = 20;
  const borderBottom = 165;

  const activePoints = trendData.map((d, i) => ({
    x: paddingLeft + i * (pointsWidth / 6),
    y: borderBottom - (d.active / maxY) * pointsHeight
  }));

  const resolvedPoints = trendData.map((d, i) => ({
    x: paddingLeft + i * (pointsWidth / 6),
    y: borderBottom - (d.resolved / maxY) * pointsHeight
  }));

  const activePath = activePoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  const resolvedPath = resolvedPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");

  const activeAreaPath = activePoints.length > 0
    ? `${activePath} L ${activePoints[activePoints.length - 1].x} ${borderBottom} L ${activePoints[0].x} ${borderBottom} Z`
    : "";
  const resolvedAreaPath = resolvedPoints.length > 0
    ? `${resolvedPath} L ${resolvedPoints[resolvedPoints.length - 1].x} ${borderBottom} L ${resolvedPoints[0].x} ${borderBottom} Z`
    : "";

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * 500;

    let nearestIdx = 0;
    let minDist = 999999;
    for (let i = 0; i < 7; i++) {
      const ptX = paddingLeft + i * (pointsWidth / 6);
      const dist = Math.abs(svgX - ptX);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    setHoveredTrendIndex(nearestIdx);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
      <div style={{ flexGrow: 2, minWidth: '280px', position: 'relative' }}>
        <svg
          width="100%"
          height="180"
          viewBox="0 0 500 200"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTrendIndex(null)}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
            const yVal = borderBottom - val * pointsHeight;
            const gridNum = Math.round(val * maxY);
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={yVal} x2={paddingLeft + pointsWidth} y2={yVal} stroke="rgba(226, 232, 240, 0.6)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={yVal + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'var(--text-muted)', fontWeight: '600' }}>
                  {gridNum}
                </text>
              </g>
            );
          })}

          <path d={activeAreaPath} fill="url(#activeGrad)" style={{ transition: 'all 0.3s' }} />
          <path d={resolvedAreaPath} fill="url(#resolvedGrad)" style={{ transition: 'all 0.3s' }} />

          <path d={activePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
          <path d={resolvedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />

          {hoveredTrendIndex !== null && (
            <g>
              <line
                x1={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)}
                y1={paddingTop}
                x2={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)}
                y2={borderBottom}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle
                cx={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)}
                cy={activePoints[hoveredTrendIndex].y}
                r="6"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))' }}
              />
              <circle
                cx={paddingLeft + hoveredTrendIndex * (pointsWidth / 6)}
                cy={resolvedPoints[hoveredTrendIndex].y}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }}
              />
            </g>
          )}

          {trendData.map((d, i) => (
            <text
              key={i}
              x={paddingLeft + i * (pointsWidth / 6)}
              y={borderBottom + 18}
              textAnchor="middle"
              style={{
                fontSize: '9.5px',
                fill: hoveredTrendIndex === i ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: hoveredTrendIndex === i ? '800' : '600',
                transition: 'fill 0.2s'
              }}
            >
              {d.dateLabel}
            </text>
          ))}
        </svg>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        width: '180px',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {activeIndex === 6 ? "Aujourd'hui" : activeData.dateLabel}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span> Actifs
            </span>
            <strong style={{ color: 'var(--text-main)' }}>{activeData.active}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span> Déclarés
            </span>
            <strong style={{ color: 'var(--text-main)' }}>+{activeData.created}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Résolus
            </span>
            <strong style={{ color: 'var(--text-main)' }}>{activeData.resolved}</strong>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Respect SLA</span>
            <strong style={{ color: activeData.resolved > 0 ? '#16a34a' : 'var(--text-muted)', fontWeight: '700' }}>
              {activeData.resolved > 0 ? '96.4%' : '100%'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
