// ערכי האישור במסד: "מיקום מקובל", "בבדיקה", "מיקום לא מקובל" (וגם הנוסח הישן "מקובלת")
export function approvalKind(value) {
  const v = String(value || '');
  if (v.includes('לא מקובל')) return 'rejected';
  if (v.includes('מקובל')) return 'approved';
  if (v.includes('בבדיקה')) return 'pending';
  return 'other';
}

export function qualityColor(value) {
  if (value === 'טוב' || value === 'יש') return 'green';
  if (value === 'לא טוב' || value === 'אין') return 'red';
  return 'gray';
}

export function statusColor(value) {
  if (approvalKind(value) === 'approved') return 'green';
  if (approvalKind(value) === 'pending') return 'orange';
  if (approvalKind(value) === 'rejected') return 'red';
  return 'gray';
}
