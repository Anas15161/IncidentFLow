// ============================================
// utils/helpers.js — Fonctions utilitaires pures
// ============================================

// Format date helper (locale FR)
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Priority color helper
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return '#dc2626';
    case 'High': return '#ea580c';
    case 'Medium': return '#ca8a04';
    case 'Low': return '#16a34a';
    default: return 'var(--text-muted)';
  }
};

// Helper de formatage des temps SLA
export const formatSlaDuration = (ms) => {
  const isOverdue = ms < 0;
  const absMs = Math.abs(ms);

  const totalMins = Math.floor(absMs / (1000 * 60));
  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const remMins = totalMins % 60;
  const remSecs = Math.floor((absMs / 1000) % 60);

  if (isOverdue) {
    if (days > 0) {
      return `Dépassé de ${days}j ${remHours > 0 ? remHours + 'h' : ''}`.trim();
    }
    if (totalHours > 0) {
      return `Dépassé de ${totalHours}h ${remMins > 0 ? remMins + 'm' : ''}`.trim();
    }
    return `Dépassé de ${totalMins} min`;
  } else {
    if (days > 0) {
      return `Reste ${days}j ${remHours}h`;
    }
    if (totalHours > 0) {
      return `Reste ${totalHours}h ${remMins}m`;
    }
    if (totalMins >= 15) {
      return `Reste ${totalMins} min`;
    }
    return `Reste ${totalMins}m ${remSecs}s`;
  }
};

// SVG Donut Path helper
export const getDonutSegmentPath = (cx, cy, r, startAngle, endAngle) => {
  const startRad = (startAngle - 90) * Math.PI / 180.0;
  const endRad = (endAngle - 90) * Math.PI / 180.0;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
};

// Markdown parser for rich comments formatting
export const parseMarkdown = (text) => {
  if (!text) return "";

  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```code```
  html = html.replace(/```([\s\S]+?)```/g, (match, code) => {
    return `<pre style="background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); font-family: monospace; overflow-x: auto; font-size: 12px; margin: 8px 0; color: #0f172a; line-height: 1.4;"><code>${code.trim()}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`\n]+?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #e11d48;">$1</code>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([\s\S]+?)_/g, '<em>$1</em>');

  // Bullet lists
  const lines = html.split('\n');
  let inList = false;
  let listProcessedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (match) {
      if (!inList) {
        listProcessedLines.push('<ul style="margin: 6px 0; padding-left: 20px; list-style-type: disc;">');
        inList = true;
      }
      listProcessedLines.push(`<li style="margin: 3px 0;">${match[2]}</li>`);
    } else {
      if (inList) {
        listProcessedLines.push('</ul>');
        inList = false;
      }
      listProcessedLines.push(line);
    }
  }
  if (inList) {
    listProcessedLines.push('</ul>');
  }
  html = listProcessedLines.join('\n');

  html = html.replace(/\n/g, '<br />');

  // Clean up br inside pre/code blocks
  html = html.replace(/(<pre.*?>[\s\S]*?<\/pre>)/g, (match) => {
    return match.replace(/<br \/>/g, '\n');
  });
  // Clean up br inside ul/li blocks
  html = html.replace(/(<ul.*?>[\s\S]*?<\/ul>)/g, (match) => {
    return match.replace(/<br \/>/g, '');
  });

  return html;
};

// Get role name from role object or string
export const getRoleName = (role) => {
  if (!role) return '';
  if (typeof role === 'string') return role;
  if (typeof role === 'object' && role.name) return role.name;
  return '';
};

// Helper to insert markdown tags at a textarea selection
export const insertMarkdownAtSelection = (textareaId, currentValue, type) => {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return currentValue;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);

  let replacement = "";
  switch (type) {
    case 'bold':
      replacement = `**${selectedText || "texte en gras"}**`;
      break;
    case 'italic':
      replacement = `*${selectedText || "texte en italique"}*`;
      break;
    case 'list':
      replacement = `\n- ${selectedText || "élément"}`;
      break;
    case 'code':
      replacement = `\n\`\`\`\n${selectedText || "bloc de code"}\n\`\`\`\n`;
      break;
    default:
      break;
  }

  const newValue = text.substring(0, start) + replacement + text.substring(end);

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + replacement.length, start + replacement.length);
  }, 50);

  return newValue;
};
