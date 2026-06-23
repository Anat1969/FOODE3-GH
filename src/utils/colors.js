export function qualityColor(value) {
  if (value === 'טוב' || value === 'יש') return 'green';
  if (value === 'לא טוב' || value === 'אין') return 'red';
  if (value === 'מבנה מקובל' || value === 'שמורה') return 'green';
  if (value === 'יש מבנה' || value === 'טעון שיפור') return 'orange';
  if (value === 'מבנה לא מקובל' || value === 'אזהרה') return 'red';
  if (value === 'אין מבנה') return 'gray';
  return 'gray';
}

export function statusColor(value) {
  if (value === 'מיקום מקובל') return 'green';
  if (value === 'בבדיקה') return 'orange';
  if (value === 'מיקום לא מקובל') return 'red';
  return 'gray';
}
