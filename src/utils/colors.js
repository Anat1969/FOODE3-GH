export function qualityColor(value) {
  if (value === 'טוב' || value === 'יש') return 'green';
  if (value === 'לא טוב' || value === 'אין') return 'red';
  return 'gray';
}

export function statusColor(value) {
  if (value === 'מקובלת') return 'green';
  if (value === 'בבדיקה') return 'orange';
  if (value === 'לא מקובלת') return 'red';
  return 'gray';
}
