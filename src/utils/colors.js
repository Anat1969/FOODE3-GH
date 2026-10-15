export const APPROVAL_OPTIONS = ['מיקום מקובל', 'בבדיקה', 'מיקום לא מקובל'];
export const BUILDING_OPTIONS = ['אין מבנה', 'יש מבנה', 'מבנה לא מקובל', 'מבנה מקובל'];
export const ENV_OPTIONS = ['שמורה', 'טעון שיפור', 'אזהרה'];
export const HARMONICA_OPTIONS = ['לא הוגשה', 'הוגשה', 'נדרש תיקון', 'מאושרת'];

// Keeps a legacy value selectable so a select never silently shows a different option.
export function withCurrent(options, value) {
  return value && !options.includes(value) ? [value, ...options] : options;
}

export function qualityTone(value) {
  if (['טוב', 'יש', 'מבנה מקובל', 'שמורה', 'מקובל'].includes(value)) return 'green';
  if (['יש מבנה', 'טעון שיפור'].includes(value)) return 'orange';
  if (['לא טוב', 'אין', 'מבנה לא מקובל', 'אזהרה'].includes(value)) return 'red';
  return 'gray';
}

export function approvalTone(value) {
  if (value === 'מיקום מקובל') return 'green';
  if (value === 'בבדיקה') return 'orange';
  if (value === 'מיקום לא מקובל') return 'red';
  return 'gray';
}

export function harmonicaTone(value) {
  if (value === 'מאושרת') return 'green';
  if (value === 'הוגשה') return 'blue';
  if (value === 'נדרש תיקון') return 'orange';
  return 'gray';
}

// Backwards-compatible names used by older components
export const qualityColor = qualityTone;
export const statusColor = approvalTone;
