import { Project } from '../types';

export function mapProjectFromBackend(raw: any): Project {
  const fabricatorIds = Array.isArray(raw.fabricator_ids)
    ? raw.fabricator_ids
    : typeof raw.fabricator_ids === 'string'
      ? safeParseJsonArray(raw.fabricator_ids)
      : Array.isArray(raw.fabricatorIds)
        ? raw.fabricatorIds
        : [];

  const start = raw.start_date || raw.startDate || null;
  const end = raw.end_date || raw.due_date || raw.endDate || null;

  return {
    id: raw.id,
    name: raw.name || raw.title || '',
    description: raw.description || '',
    status: raw.status || 'planning',
    priority: raw.priority || 'medium',
    startDate: normalizeDateString(start),
    endDate: normalizeDateString(end),
    progress: Number.isFinite(raw.progress) ? raw.progress : 0,
    supervisorId: raw.supervisor_id || raw.supervisorId || '',
    fabricatorIds,
    budget: toNumberOrZero(raw.budget),
    spent: toNumberOrZero(raw.spent),
    revenue: toNumberOrZero(raw.revenue),
    clientName: raw.client_name || raw.clientName || '',
    documentationUrl: raw.documentation_url || raw.documentationUrl || undefined,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : undefined,
    fabricatorBudgets: Array.isArray(raw.fabricatorBudgets) ? raw.fabricatorBudgets : undefined,
    createdBy: raw.created_by || raw.createdBy || '',
    createdAt: normalizeDateString(raw.created_at || raw.createdAt || new Date().toISOString()),
    pendingAssignments: Array.isArray(raw.pendingAssignments) ? raw.pendingAssignments : undefined,
  } as Project;
}

export function mapProjectsFromBackend(rows: any[]): Project[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapProjectFromBackend);
}

function safeParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toNumberOrZero(value: any): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? Number(n) : 0;
}

function normalizeDateString(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];
  // If it's already YYYY-MM-DD or ISO, keep as date-only string for consistency
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}


