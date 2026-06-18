import { qualityColor, statusColor } from '../utils/colors.js';

export default function Chip({ value, type = 'quality' }) {
  const color = type === 'status' ? statusColor(value) : qualityColor(value);
  return <span className={`chip ${color}`}>{value || '—'}</span>;
}
